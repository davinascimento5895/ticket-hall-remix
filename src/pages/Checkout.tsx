import { useState, useEffect, useCallback } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check } from "lucide-react";
import { CountdownTimer } from "@/components/CountdownTimer";
import { CheckoutStepBuyer, BuyerData } from "@/components/checkout/CheckoutStepBuyer";
import { CheckoutStepData } from "@/components/checkout/CheckoutStepData";
import { CheckoutStepPayment } from "@/components/checkout/CheckoutStepPayment";
import { CheckoutStepConfirmation } from "@/components/checkout/CheckoutStepConfirmation";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getCheckoutQuestions, saveOrderProducts } from "@/lib/api-checkout";
import { createPayment, CreditCardData } from "@/lib/api-payment";
import { toast } from "@/hooks/use-toast";

const steps = ["Comprador", "Participantes", "Pagamento", "Confirmação"];

export default function Checkout() {
  const [step, setStep] = useState(() => {
    // If we have a stored orderId, resume at confirmation
    return sessionStorage.getItem("checkout_order_id") ? 3 : 0;
  });
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(() => {
    // Recover orderId from sessionStorage on refresh
    return sessionStorage.getItem("checkout_order_id");
  });
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

  const [buyerData, setBuyerData] = useState<BuyerData>({
    fullName: "",
    email: "",
    birthDate: "",
    cpf: "",
    phone: "",
    cep: "",
    street: "",
    addressNumber: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

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

  // Determine if this is a free order (skip payment step)
  const isFreeCart = finalTotal === 0;

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
          setStep(3);
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

  // Create order using server-side RPC for price validation
  const handleCreateOrder = useCallback(async () => {
    if (!user) {
      toast({ title: "Faça login", description: "Você precisa estar logado para finalizar a compra.", variant: "destructive" });
      return;
    }
    if (orderId) {
      // Already created, skip to payment or confirmation
      if (isFreeCart) {
        setStep(3);
      } else {
        setStep(2);
      }
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

      // Build billing address string
      const billingAddress = [buyerData.street, buyerData.addressNumber, buyerData.complement, buyerData.neighborhood, buyerData.city, buyerData.state, buyerData.cep].filter(Boolean).join(", ");

      // Create order via server-side RPC (includes billing_address for free orders)
      const { data: rpcResult, error: rpcErr } = await supabase.rpc("create_order_validated", {
        p_tier_ids: tierIds,
        p_quantities: quantities,
        p_buyer_id: user.id,
        p_coupon_code: couponCode?.trim() || null,
        p_promoter_event_id: promoterEventId,
        p_billing_address: billingAddress,
      });

      if (rpcErr) throw rpcErr;
      const result = rpcResult as any;
      if (result?.error) {
        toast({ title: "Erro ao criar pedido", description: result.error, variant: "destructive" });
        setIsCreatingOrder(false);
        return;
      }

      const newOrderId = result.order_id;
      const isServerFree = result.is_free;
      setOrderId(newOrderId);
      sessionStorage.setItem("checkout_order_id", newOrderId);
      setOrderExpiresAt(isServerFree ? null : new Date(Date.now() + 15 * 60 * 1000).toISOString());

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

      // Save checkout answers (both order-level AND attendee-level)
      const answersToSave: { order_id: string; question_id: string; answer: string; ticket_id?: string }[] = [];
      for (const [key, answer] of Object.entries(questionAnswers)) {
        if (!answer?.trim()) continue;
        if (key.startsWith("order-")) {
          answersToSave.push({ order_id: newOrderId, question_id: key.replace("order-", ""), answer });
        }
      }

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

      // Free order: confirm immediately, skip payment
      if (isServerFree) {
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
        setStep(3); // Go to confirmation first
        clearCart(); // Then clear cart (React 18 batches these)
      } else {
        setStep(2); // Go to payment
      }
    } catch (error: any) {
      console.error("Order creation error:", error);
      toast({ title: "Erro ao criar pedido", description: error.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsCreatingOrder(false);
    }
  }, [user, items, attendeeData, questionAnswers, clearCart, orderId, couponCode, trackingCode, buyerData, isFreeCart]);

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
        setStep(3);
      } else {
        setPixQrCode(result.pixQrCode || null);
        setPixQrCodeImage(result.pixQrCodeImage || null);
        setBoletoUrl(result.boletoUrl || null);
        setBoletoBarcode(result.boletoBarcode || null);
        setAwaitingPayment(true);
      }
      if (result.stub) {
        toast({ title: "Modo de teste", description: "Gateway de pagamento não configurado. Pagamento simulado." });
        if (method === "credit_card") { clearCart(); setStep(3); }
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({ title: "Erro no pagamento", description: error.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsProcessingPayment(false);
    }
  }, [orderId, clearCart]);

  if (items.length === 0 && step < 3) {
    return <Navigate to="/carrinho" replace />;
  }

  // Build summary sidebar info
  const eventTitle = items[0]?.eventTitle || "";
  const coverImage = items[0]?.coverImageUrl;
  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  return (
    <>
      <SEOHead title="Checkout" description="Finalize sua compra de ingressos no TicketHall." />
      <div className="container pt-4 lg:pt-24 pb-16">
        <Link to="/carrinho" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar ao carrinho
        </Link>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="flex-1 max-w-2xl">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-8">
              {steps.map((s, i) => {
                // For free orders, skip the "Pagamento" step visually
                if (isFreeCart && i === 2) return null;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border transition-colors ${
                      i < step ? "bg-primary text-primary-foreground border-primary" :
                      i === step ? "bg-primary text-primary-foreground border-primary" :
                      "border-border text-muted-foreground"
                    }`}>
                      {i < step ? <Check className="h-4 w-4" /> : (isFreeCart && i > 2 ? i : i + 1)}
                    </div>
                    <span className={`text-sm hidden sm:inline ${i <= step ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s}</span>
                    {i < steps.length - 1 && !(isFreeCart && i === 1) && <div className="w-8 h-px bg-border" />}
                  </div>
                );
              })}
              {expiresAt && step < 3 && (
                <div className="ml-auto">
                  <CountdownTimer expiresAt={expiresAt} onExpire={() => { clearCart(); navigate("/carrinho"); }} />
                </div>
              )}
            </div>

            {/* Steps content */}
            {step === 0 && (
              <CheckoutStepBuyer
                buyerData={buyerData}
                setBuyerData={setBuyerData}
                onNext={() => setStep(1)}
              />
            )}

            {step === 1 && (
              <CheckoutStepData
                items={items}
                orderQuestions={orderQuestions}
                attendeeQuestions={attendeeQuestions}
                attendeeData={attendeeData}
                setAttendeeData={setAttendeeData}
                questionAnswers={questionAnswers}
                setQuestionAnswers={setQuestionAnswers}
                onNext={handleCreateOrder}
                isLoading={isCreatingOrder}
                buyerData={buyerData}
              />
            )}

            {step === 2 && (
              <CheckoutStepPayment
                subtotal={subtotal}
                platformFee={platformFee}
                total={finalTotal}
                onBack={() => setStep(1)}
                onConfirm={handleConfirmPayment}
                isProcessing={isProcessingPayment}
                pixQrCode={pixQrCode}
                pixQrCodeImage={pixQrCodeImage}
                boletoUrl={boletoUrl}
                boletoBarcode={boletoBarcode}
                paymentCreated={paymentCreated}
                awaitingPayment={awaitingPayment}
                expiresAt={orderExpiresAt}
              />
            )}

            {step === 3 && <CheckoutStepConfirmation orderId={orderId} />}
          </div>

          {/* Order summary sidebar */}
          {step < 3 && (
            <div className="w-full lg:w-80 shrink-0">
              {/* Event card */}
              {coverImage && (
                <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card mb-4">
                  <img src={coverImage} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-sm text-foreground line-clamp-2">{eventTitle}</p>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="p-4 rounded-lg border border-border bg-card space-y-3 sticky top-24">
                <h3 className="font-display font-semibold text-foreground">Resumo do Pedido</h3>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ingressos</p>
                  {items.map((item) => (
                    <div key={item.tierId} className="flex items-start justify-between text-sm">
                      <span className="text-foreground flex-1 mr-2">
                        <span className="font-medium">{item.quantity}</span> {item.tierName}
                      </span>
                      <span className="text-foreground font-medium shrink-0">
                        {item.price === 0 ? "Grátis" : fmt(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-3 space-y-1 text-sm">
                  {subtotal > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{fmt(subtotal)}</span>
                      </div>
                      {platformFee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Taxa</span>
                          <span>{fmt(platformFee)}</span>
                        </div>
                      )}
                      {discount > 0 && (
                        <div className="flex justify-between text-success">
                          <span>Desconto</span>
                          <span>-{fmt(discount)}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex justify-between font-semibold border-t border-border pt-2">
                    <div>
                      <span>Total</span>
                      <p className="text-xs text-muted-foreground font-normal">({items.reduce((s, i) => s + i.quantity, 0)} {items.reduce((s, i) => s + i.quantity, 0) === 1 ? "item" : "itens"})</p>
                    </div>
                    <div className="text-right">
                      <span>{fmt(finalTotal)}</span>
                      {finalTotal === 0 && <p className="text-xs text-muted-foreground font-normal">Evento gratuito</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
