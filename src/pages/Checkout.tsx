import { useState, useEffect, useCallback } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useNavigate, Link } from "react-router-dom";
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
  const [paymentCreated, setPaymentCreated] = useState(false);
  const [awaitingPayment, setAwaitingPayment] = useState(false);
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [pixQrCodeImage, setPixQrCodeImage] = useState<string | null>(null);
  const [boletoUrl, setBoletoUrl] = useState<string | null>(null);
  const [boletoBarcode, setBoletoBarcode] = useState<string | null>(null);

  const { items, subtotal, platformFee, total, expiresAt, clearCart, discount, appliedCouponId, finalTotal, trackingCode } = useCart();
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

  // Create order when advancing from Step 0 to Step 1 (or directly to confirmation if free)
  const handleCreateOrder = useCallback(async () => {
    if (!user) {
      toast({ title: "Faça login", description: "Você precisa estar logado para finalizar a compra.", variant: "destructive" });
      return;
    }
    // If order already created (user went back and forward), skip re-creation
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

      const isFreeOrder = finalTotal === 0;

      const { data: order, error: orderErr } = await supabase.from("orders").insert({
        buyer_id: user.id, event_id: eventId, subtotal, platform_fee: isFreeOrder ? 0 : platformFee, total: isFreeOrder ? 0 : finalTotal,
        discount_amount: discount > 0 ? discount : 0,
        coupon_id: appliedCouponId || null,
        promoter_event_id: promoterEventId,
        status: isFreeOrder ? "paid" : "pending",
        payment_status: isFreeOrder ? "paid" : "pending",
        payment_method: isFreeOrder ? "free" : null,
        expires_at: isFreeOrder ? null : new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      }).select().single();
      if (orderErr) throw orderErr;
      setOrderId(order.id);

      // Apply coupon: increment uses_count and enforce max_uses
      if (appliedCouponId) {
        const { data: couponApplied, error: couponErr } = await supabase.rpc("apply_coupon", {
          p_coupon_id: appliedCouponId,
          p_order_id: order.id,
        });
        if (couponErr) {
          console.error("apply_coupon error:", couponErr);
        } else if (!couponApplied) {
          // Coupon has exceeded max_uses or is invalid — cancel and warn
          toast({ title: "Cupom expirado", description: "O cupom atingiu o limite de usos.", variant: "destructive" });
          await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
          setIsCreatingOrder(false);
          return;
        }
      }

      // Reserve tickets (only for actual ticket tiers, not products)
      const ticketItems = items.filter((i) => !i.tierId.startsWith("product-"));
      for (const item of ticketItems) {
        const { data: reserved, error: reserveErr } = await supabase.rpc("reserve_tickets", {
          p_tier_id: item.tierId, p_quantity: item.quantity, p_order_id: order.id,
        });
        if (reserveErr) throw reserveErr;
        if (!reserved) {
          await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
          toast({ title: "Ingressos esgotados", description: `Não há ingressos suficientes para "${item.tierName}".`, variant: "destructive" });
          setIsCreatingOrder(false);
          return;
        }
      }

      // Save attendee data on tickets
      const { data: tickets } = await supabase.from("tickets").select("id, tier_id").eq("order_id", order.id).order("created_at");
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

      // Save order products (items with tierId starting with "product-")
      const productItems = items.filter((i) => i.tierId.startsWith("product-"));
      if (productItems.length > 0) {
        await saveOrderProducts(
          productItems.map((i) => ({
            order_id: order.id,
            product_id: i.tierId.replace("product-", ""),
            quantity: i.quantity,
            unit_price: i.price,
          }))
        );
      }

      // Save checkout answers
      const answersToSave: { order_id: string; question_id: string; answer: string }[] = [];
      for (const [key, answer] of Object.entries(questionAnswers)) {
        if (!answer?.trim()) continue;
        if (key.startsWith("order-")) {
          answersToSave.push({ order_id: order.id, question_id: key.replace("order-", ""), answer });
        }
      }
      if (answersToSave.length > 0) {
        await supabase.from("checkout_answers").insert(answersToSave);
      }

      // Free order: use confirm_order_payment RPC to properly handle sold counts
      if (isFreeOrder) {
        const { data: confirmed, error: confirmErr } = await supabase.rpc("confirm_order_payment", {
          p_order_id: order.id,
          p_asaas_payment: "free",
          p_net_value: 0,
        });
        if (confirmErr) {
          console.error("confirm_order_payment error:", confirmErr);
          // Fallback: manually activate tickets
          await supabase.from("tickets").update({ status: "active" }).eq("order_id", order.id).eq("status", "reserved");
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
  }, [user, items, subtotal, platformFee, total, finalTotal, discount, appliedCouponId, attendeeData, questionAnswers, clearCart, orderId]);

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

  // Redirect if cart empty (after all hooks)
  if (items.length === 0 && step < 2) {
    navigate("/carrinho");
    return null;
  }

  return (
    <>

      <div className="container pt-4 lg:pt-24 pb-16 max-w-2xl">
        <Link to="/carrinho" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar ao carrinho
        </Link>

        {/* Progress */}
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
          />
        )}

        {step === 2 && <CheckoutStepConfirmation orderId={orderId} />}
      </div>
    </>
  );
}
