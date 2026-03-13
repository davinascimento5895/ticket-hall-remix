import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { formatCPF } from "@/lib/validators";
import { BookingDateStep } from "@/components/booking/BookingDateStep";
import { BookingTicketStep } from "@/components/booking/BookingTicketStep";
import { BookingSummaryStep } from "@/components/booking/BookingSummaryStep";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";
import { supabase } from "@/integrations/supabase/client";
import { createPayment, type CreditCardData } from "@/lib/api-payment";
import { getEventBySlug, getEventTiers } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";

type Step = "date" | "tickets" | "summary" | "confirmation";

export default function EventBooking() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const { data: event, isLoading: loadingEvent } = useQuery({
    queryKey: ["event", slug],
    queryFn: () => getEventBySlug(slug!),
    enabled: !!slug,
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ["event-tiers", event?.id],
    queryFn: () => getEventTiers(event!.id),
    enabled: !!event?.id,
  });

  const isMultiDay = event
    ? event.is_multi_day || new Date(event.start_date).toDateString() !== new Date(event.end_date).toDateString()
    : false;

  const [step, setStep] = useState<Step | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [payerCpf, setPayerCpf] = useState("");

  // Auto-fill CPF from profile
  useEffect(() => {
    if (profile?.cpf && !payerCpf) {
      setPayerCpf(formatCPF(profile.cpf));
    }
  }, [profile]);

  // Initialize step once event loads
  if (event && step === null) {
    setStep(isMultiDay ? "date" : "tickets");
    setSelectedDate(new Date(event.start_date));
  }

  const unitPrice = selectedTier?.price ?? 0;
  const subtotal = unitPrice * quantity;
  const feePercent = event?.platform_fee_percent ?? 7;
  const platformFee = discount >= subtotal ? 0 : Math.round(subtotal * feePercent / 100 * 100) / 100;
  const total = Math.max(0, subtotal + platformFee - discount);

  const stepOrder: Step[] = [...(isMultiDay ? ["date" as Step] : []), "tickets", "summary", "confirmation"];
  const currentStepIndex = step ? stepOrder.indexOf(step) : 0;

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setStep(stepOrder[currentStepIndex - 1]);
    } else {
      navigate(`/eventos/${slug}`);
    }
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setStep("tickets");
  };

  const handleSelectTier = (tier: any, qty: number) => {
    setSelectedTier(tier);
    setQuantity(qty);
    setStep("summary");
  };

  const handleConfirmPayment = useCallback(async (method: string, cardData?: CreditCardData, installments?: number) => {
    if (!user) {
      toast({ title: "Faça login", description: "Você precisa estar logado para comprar.", variant: "destructive" });
      return;
    }
    if (!selectedTier) return;

    setIsProcessing(true);
    try {
      const { data: rpcResult, error: rpcErr } = await supabase.rpc("create_order_validated", {
        p_tier_ids: [selectedTier.id],
        p_quantities: [quantity],
        p_buyer_id: user.id,
        p_coupon_code: couponCode?.trim() || null,
      });

      if (rpcErr) throw rpcErr;
      const result = rpcResult as any;
      if (result?.error) {
        toast({ title: "Erro ao criar pedido", description: result.error, variant: "destructive" });
        setIsProcessing(false);
        return;
      }

      const newOrderId = result.order_id;
      const isFree = result.is_free;

      if (!isFree) {
        await supabase.from("orders").update({ payment_method: method }).eq("id", newOrderId);
      }

      const { data: reserved, error: reserveErr } = await supabase.rpc("reserve_tickets", {
        p_tier_id: selectedTier.id,
        p_quantity: quantity,
        p_order_id: newOrderId,
      });
      if (reserveErr) throw reserveErr;
      if (!reserved) {
        await supabase.from("orders").update({ status: "cancelled" }).eq("id", newOrderId);
        toast({ title: "Ingressos esgotados", description: "Não há ingressos suficientes.", variant: "destructive" });
        setIsProcessing(false);
        return;
      }

      setOrderId(newOrderId);

      if (isFree) {
        const { data: confirmed, error: confirmErr } = await supabase.rpc("confirm_order_payment", {
          p_order_id: newOrderId,
          p_asaas_payment: "free",
          p_net_value: 0,
        });
        if (confirmErr) {
          console.error("confirm_order_payment error:", confirmErr);
        } else if (confirmed === false) {
          toast({ title: "Erro", description: "Pedido já foi processado anteriormente.", variant: "destructive" });
          setIsProcessing(false);
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

        toast({ title: "Inscrição confirmada!", description: "Seus ingressos foram gerados." });
        setStep("confirmation");
      } else {
        // Save CPF to profile
        if (payerCpf) {
          await supabase.from("profiles").update({ cpf: payerCpf }).eq("id", user.id);
        }
        const payResult = await createPayment(newOrderId, method as "pix" | "credit_card" | "boleto", cardData, installments, payerCpf);

        if (!payResult.success) {
          toast({ title: "Erro no pagamento", description: payResult.error || "Tente novamente.", variant: "destructive" });
          setIsProcessing(false);
          return;
        }

        if (payResult.immediateConfirmation || payResult.stub) {
          toast({ title: "Pagamento confirmado!", description: "Seus ingressos foram gerados." });
          setStep("confirmation");
        } else {
          toast({ title: "Pedido criado!", description: "Complete o pagamento para receber seus ingressos." });
          navigate(`/pedido/${newOrderId}`);
        }
      }
    } catch (error: any) {
      console.error("Booking error:", error);
      toast({ title: "Erro", description: error.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  }, [user, selectedTier, quantity, couponCode, payerCpf, navigate]);

  const handleGoToTickets = () => {
    navigate("/meus-ingressos");
  };

  const stepLabels: Record<Step, string> = {
    date: "Data",
    tickets: "Ingressos",
    summary: "Resumo",
    confirmation: "Confirmação",
  };

  if (loadingEvent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-lg space-y-4 p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground">Evento não encontrado.</p>
        <Button variant="outline" asChild>
          <Link to="/eventos">Ver eventos</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`Comprar ingressos — ${event.title}`}
        description={`Adquira seus ingressos para ${event.title}`}
      />

      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        {step !== "confirmation" && (
          <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
            <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
              <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="font-semibold text-sm truncate max-w-[60%]">
                {step ? stepLabels[step] : ""} — {event.title}
              </h1>
              <div className="w-8" />
            </div>

            {/* Progress indicators */}
            <div className="flex justify-center gap-1.5 pb-2">
              {stepOrder.filter(s => s !== "confirmation").map((s, i) => (
                <div
                  key={s}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    s === step ? "w-6 bg-primary" : i < currentStepIndex ? "w-1.5 bg-primary/50" : "w-1.5 bg-muted"
                  )}
                />
              ))}
            </div>
          </header>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-lg mx-auto px-4 py-6">
            {step === "date" && selectedDate && (
              <BookingDateStep
                event={event}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
              />
            )}
            {step === "tickets" && selectedDate && (
              <BookingTicketStep
                tiers={tiers}
                selectedDate={selectedDate}
                onSelectTier={handleSelectTier}
                seatMapConfig={event.seat_map_config as any}
                hasSeatMap={!!event.has_seat_map}
              />
            )}
            {step === "summary" && selectedDate && (
              <BookingSummaryStep
                isFree={total === 0}
                event={event}
                selectedDate={selectedDate}
                selectedTier={selectedTier}
                quantity={quantity}
                selectedSeat={null}
                subtotal={subtotal}
                platformFee={platformFee}
                discount={discount}
                total={total}
                couponCode={couponCode}
                onCouponChange={setCouponCode}
                onApplyCoupon={async () => {
                  if (!couponCode.trim()) return;
                  try {
                    const { validateCoupon } = await import("@/lib/api");
                    const coupon = await validateCoupon(event.id, couponCode);
                    if (coupon) {
                      const discountAmount =
                        coupon.discount_type === "percentage"
                          ? subtotal * (coupon.discount_value / 100)
                          : coupon.discount_value;
                      setDiscount(Math.min(discountAmount, subtotal));
                      toast({ title: "Cupom aplicado!", description: `Desconto de R$ ${discountAmount.toFixed(2).replace(".", ",")}` });
                    }
                  } catch {
                    toast({ title: "Cupom inválido", description: "Verifique o código e tente novamente.", variant: "destructive" });
                    setDiscount(0);
                  }
                }}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                onConfirm={(cardData, installments) => handleConfirmPayment(paymentMethod, cardData, installments)}
                isProcessing={isProcessing}
                payerCpf={payerCpf}
                onPayerCpfChange={setPayerCpf}
              />
            )}
            {step === "confirmation" && (
              <BookingConfirmation
                orderId={orderId}
                eventTitle={event.title}
                onGoToTickets={handleGoToTickets}
                onClose={() => navigate(`/eventos/${slug}`)}
              />
            )}
          </div>
        </main>
      </div>
    </>
  );
}
