import { useState, useEffect, useCallback } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check } from "lucide-react";
import { CountdownTimer } from "@/components/CountdownTimer";
import { CheckoutStepData } from "@/components/checkout/CheckoutStepData";
import { CheckoutStepPayment } from "@/components/checkout/CheckoutStepPayment";
import { CheckoutStepConfirmation } from "@/components/checkout/CheckoutStepConfirmation";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getCheckoutQuestions, saveOrderProducts } from "@/lib/api-checkout";
import { createPayment, CreditCardData } from "@/lib/api-payment";
import { toast } from "@/hooks/use-toast";

const steps = ["Dados", "Pagamento", "Confirmação"];

export default function Checkout() {
  const [step, setStep] = useState(0);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderExpiresAt, setOrderExpiresAt] = useState<string | null>(null);
  const [paymentCreated, setPaymentCreated] = useState(false);
  const [awaitingPayment, setAwaitingPayment] = useState(false);
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [pixQrCodeImage, setPixQrCodeImage] = useState<string | null>(null);
  const [boletoUrl, setBoletoUrl] = useState<string | null>(null);
  const [boletoBarcode, setBoletoBarcode] = useState<string | null>(null);

  const { items, subtotal, platformFee, total, expiresAt, clearCart, discount, appliedCouponId, finalTotal, trackingCode, couponCode } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [attendeeData, setAttendeeData] = useState<Record<string, { name: string; email: string; cpf: string }>>({});
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});

  const eventIds = [...new Set(items.map((i) => i.eventId))];

  const { data: allQuestions = [] } = useQuery({
    queryKey: ["checkout-questions-all", eventIds],
    queryFn: async () => {
      const results = await Promise.all(eventIds.map((eid) => getCheckoutQuestions(eid)));
      return results.flat();
    },
    enabled: eventIds.length > 0,
  });

  const orderQuestions = allQuestions.filter((q: any) => q.applies_to === "order");
  const attendeeQuestions = allQuestions.filter((q: any) => q.applies_to === "attendee");

  // Realtime subscription for payment confirmation
  useEffect(() => {
    if (!orderId || !awaitingPayment) return;

    const channel = supabase
      .channel(`order-${orderId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        const newStatus = (payload.new as any)?.status;
        if (newStatus === "paid") {
          toast({ title: "Pagamento confirmado!", description: "Seus ingressos foram gerados com sucesso." });
          clearCart();
          setStep(2);
          setAwaitingPayment(false);
        } else if (newStatus === "cancelled" || newStatus === "expired") {
          toast({ title: "Pagamento não aprovado", description: "Tente novamente.", variant: "destructive" });
          setAwaitingPayment(false);
          setPaymentCreated(false);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId, awaitingPayment, clearCart]);

  // C02: Create order using server-side RPC for price validation
  const handleCreateOrder = useCallback(async () => {
    if (!user) {
      toast({ title: "Faça login", description: "Você precisa estar logado para finalizar a compra.", variant: "destructive" });
      return;
    }
    if (orderId) {
      setStep(1);
      return;
    }
    setIsCreatingOrder(true);
    try {
      const eventId = items[0]?.eventId;
      if (!eventId) throw new Error("No event in cart");

      // Resolve promoter_event_id from tracking code
      let promoterEventId: string | null = null;
      if (trackingCode) {
        const { data: pe } = await supabase
          .from("promoter_events")
          .select("id")
          .eq("tracking_code", trackingCode)
          .eq("event_id", eventId)
          .eq("is_active", true)
          .maybeSingle();
        if (pe) promoterEventId = pe.id;
      }

      // Get ticket tier IDs and quantities (exclude products)
      const ticketItems = items.filter((i) => !i.tierId.startsWith("product-"));
      const tierIds = ticketItems.map((i) => i.tierId);
      const quantities = ticketItems.map((i) => i.quantity);

      // Create order via server-side RPC (validates prices, applies coupon atomically)
      const { data: rpcResult, error: rpcErr } = await supabase.rpc("create_order_validated", {
        p_tier_ids: tierIds,
        p_quantities: quantities,
        p_buyer_id: user.id,
        p_coupon_code: couponCode?.trim() || null,
        p_promoter_event_id: promoterEventId,
      });

      if (rpcErr) throw rpcErr;
      const result = rpcResult as any;
      if (result?.error) {
        toast({ title: "Erro ao criar pedido", description: result.error, variant: "destructive" });
        setIsCreatingOrder(false);
        return;
      }

      const newOrderId = result.order_id;
      const isFreeOrder = result.is_free;
      setOrderId(newOrderId);
      setOrderExpiresAt(isFreeOrder ? null : new Date(Date.now() + 15 * 60 * 1000).toISOString());

      // Reserve tickets
      for (const item of ticketItems) {
        const { data: reserved, error: reserveErr } = await supabase.rpc("reserve_tickets", {
          p_tier_id: item.tierId, p_quantity: item.quantity, p_order_id: newOrderId,
        });
        if (reserveErr) throw reserveErr;
        if (!reserved) {
          await supabase.from("orders").update({ status: "cancelled" }).eq("id", newOrderId);
          toast({ title: "Ingressos esgotados", description: `Não há ingressos suficientes para "${item.tierName}".`, variant: "destructive" });
          setIsCreatingOrder(false);
          return;
        }
      }

      // Save attendee data on tickets
      const { data: tickets } = await supabase.from("tickets").select("id, tier_id").eq("order_id", newOrderId).order("created_at");
      if (tickets) {
        const tierIdx: Record<string, number> = {};
        for (const ticket of tickets) {
          const idx = tierIdx[ticket.tier_id] || 0;
          tierIdx[ticket.tier_id] = idx + 1;
          const key = `${ticket.tier_id}-${idx}`;
          const data = attendeeData[key];
          if (data) {
            await supabase.from("tickets").update({
              attendee_name: data.name, attendee_email: data.email, attendee_cpf: data.cpf || null,
            }).eq("id", ticket.id);
          }
        }
      }

      // Save order products
      const productItems = items.filter((i) => i.tierId.startsWith("product-"));
      if (productItems.length > 0) {
        await saveOrderProducts(
          productItems.map((i) => ({
            order_id: newOrderId,
            product_id: i.tierId.replace("product-", ""),
            quantity: i.quantity,
            unit_price: i.price,
          }))
        );
      }

      // A01: Save checkout answers (both order-level AND attendee-level)
      const answersToSave: { order_id: string; question_id: string; answer: string; ticket_id?: string }[] = [];
      for (const [key, answer] of Object.entries(questionAnswers)) {
        if (!answer?.trim()) continue;
        if (key.startsWith("order-")) {
          answersToSave.push({ order_id: newOrderId, question_id: key.replace("order-", ""), answer });
        }
      }

      // Save attendee-level answers with ticket_id
      if (tickets && tickets.length > 0) {
        const tierIdx2: Record<string, number> = {};
        for (const ticket of tickets) {
          const idx = tierIdx2[ticket.tier_id] || 0;
          tierIdx2[ticket.tier_id] = idx + 1;
          const keyPrefix = `attendee-${ticket.tier_id}-${idx}`;
          for (const [key, answer] of Object.entries(questionAnswers)) {
            if (!answer?.trim()) continue;
            if (key.startsWith(keyPrefix + "-")) {
              const questionId = key.replace(keyPrefix + "-", "");
              answersToSave.push({ order_id: newOrderId, question_id: questionId, answer, ticket_id: ticket.id });
            }
          }
        }
      }

      if (answersToSave.length > 0) {
        await supabase.from("checkout_answers").insert(answersToSave);
      }

      // Free order: confirm immediately
      if (isFreeOrder) {
        const { data: confirmed, error: confirmErr } = await supabase.rpc("confirm_order_payment", {
          p_order_id: newOrderId,
          p_asaas_payment: "free",
          p_net_value: 0,
        });
        if (confirmErr) {
          console.error("confirm_order_payment error:", confirmErr);
          await supabase.from("tickets").update({ status: "active" }).eq("order_id", newOrderId).eq("status", "reserved");
        } else if (confirmed === false) {
          toast({ title: "Erro", description: "Pedido já foi processado anteriormente.", variant: "destructive" });
          setIsCreatingOrder(false);
          return;
        }

        const { data: activeTickets } = await supabase
          .from("tickets")
          .select("id")
          .eq("order_id", newOrderId)
          .eq("status", "active");
        if (activeTickets?.length) {
          await Promise.all(
            activeTickets.map((t) =>
              supabase.functions.invoke("generate-qr-code", { body: { ticketId: t.id } })
            )
          );
        }

        toast({ title: "Inscrição confirmada!", description: "Seus ingressos foram gerados com sucesso." });
        clearCart();
        setStep(2);
      } else {
        setStep(1);
      }
    } catch (error: any) {
      console.error("Order creation error:", error);
      toast({ title: "Erro ao criar pedido", description: error.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsCreatingOrder(false);
    }
  }, [user, items, attendeeData, questionAnswers, clearCart, orderId, couponCode, trackingCode]);

  // Process payment
  const handleConfirmPayment = useCallback(async (method: string, cardData?: CreditCardData, installments?: number) => {
    if (!orderId) return;
    setIsProcessingPayment(true);
    try {
      const result = await createPayment(orderId, method as "pix" | "credit_card" | "boleto", cardData, installments);
      if (!result.success) {
        toast({ title: "Erro no pagamento", description: result.error || "Tente novamente.", variant: "destructive" });
        setIsProcessingPayment(false);
        return;
      }
      setPaymentCreated(true);
      if (result.immediateConfirmation) {
        toast({ title: "Pagamento confirmado!", description: "Seus ingressos foram gerados com sucesso." });
        clearCart();
        setStep(2);
      } else {
        setPixQrCode(result.pixQrCode || null);
        setPixQrCodeImage(result.pixQrCodeImage || null);
        setBoletoUrl(result.boletoUrl || null);
        setBoletoBarcode(result.boletoBarcode || null);
        setAwaitingPayment(true);
      }
      if (result.stub) {
        toast({ title: "Modo de teste", description: "Gateway de pagamento não configurado. Pagamento simulado." });
        if (method === "credit_card") { clearCart(); setStep(2); }
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({ title: "Erro no pagamento", description: error.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsProcessingPayment(false);
    }
  }, [orderId, clearCart]);

  if (items.length === 0 && step < 2) {
    return <Navigate to="/carrinho" replace />;
  }

  return (
    <>
      <SEOHead title="Checkout" description="Finalize sua compra de ingressos no TicketHall." />
      <div className="container pt-4 lg:pt-24 pb-16 max-w-2xl">
        <Link to="/carrinho" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar ao carrinho
        </Link>

        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border ${i <= step ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm hidden sm:inline ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
              {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
          {expiresAt && step < 2 && (
            <div className="ml-auto">
              <CountdownTimer expiresAt={expiresAt} onExpire={() => { clearCart(); navigate("/carrinho"); }} />
            </div>
          )}
        </div>

        {step === 0 && (
          <CheckoutStepData
            items={items} orderQuestions={orderQuestions} attendeeQuestions={attendeeQuestions}
            attendeeData={attendeeData} setAttendeeData={setAttendeeData}
            questionAnswers={questionAnswers} setQuestionAnswers={setQuestionAnswers}
            onNext={handleCreateOrder} isLoading={isCreatingOrder}
          />
        )}

        {step === 1 && (
          <CheckoutStepPayment
            subtotal={subtotal} platformFee={platformFee} total={finalTotal}
            onBack={() => setStep(0)} onConfirm={handleConfirmPayment} isProcessing={isProcessingPayment}
            pixQrCode={pixQrCode} pixQrCodeImage={pixQrCodeImage}
            boletoUrl={boletoUrl} boletoBarcode={boletoBarcode}
            paymentCreated={paymentCreated} awaitingPayment={awaitingPayment}
            expiresAt={orderExpiresAt}
          />
        )}

        {step === 2 && <CheckoutStepConfirmation orderId={orderId} />}
      </div>
    </>
  );
}
