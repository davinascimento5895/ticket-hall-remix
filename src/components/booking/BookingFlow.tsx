import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { BookingDateStep } from "./BookingDateStep";
import { BookingTicketStep } from "./BookingTicketStep";
import { BookingSeatMap } from "./BookingSeatMap";
import { BookingSummaryStep } from "./BookingSummaryStep";
import { BookingConfirmation } from "./BookingConfirmation";
import { supabase } from "@/integrations/supabase/client";
import { createPayment, type CreditCardData } from "@/lib/api-payment";
import { validateCoupon } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface BookingFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    id: string;
    title: string;
    slug: string;
    start_date: string;
    end_date: string;
    is_multi_day: boolean | null;
    has_seat_map: boolean | null;
    seat_map_config: any;
    cover_image_url: string | null;
    venue_name: string | null;
    venue_city: string | null;
    platform_fee_percent: number | null;
  };
  tiers: any[];
}

type Step = "date" | "tickets" | "summary" | "confirmation";

export function BookingFlow({ open, onOpenChange, event, tiers }: BookingFlowProps) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isMultiDay = event.is_multi_day || new Date(event.start_date).toDateString() !== new Date(event.end_date).toDateString();
  const [step, setStep] = useState<Step>(isMultiDay ? "date" : "tickets");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(event.start_date));
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const unitPrice = selectedTier?.price ?? 0;
  const subtotal = unitPrice * quantity;
  const feePercent = event.platform_fee_percent ?? 7;
  const platformFee = Math.round(subtotal * feePercent) / 100;
  const total = Math.max(0, subtotal + platformFee - discount);

  const stepOrder: Step[] = [...(isMultiDay ? ["date" as Step] : []), "tickets", "summary", "confirmation"];
  const currentStepIndex = stepOrder.indexOf(step);

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setStep(stepOrder[currentStepIndex - 1]);
    } else {
      onOpenChange(false);
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
    const isFree = total === 0;
    if (!user) {
      toast({ title: "Faça login", description: "Você precisa estar logado para comprar.", variant: "destructive" });
      return;
    }
    if (!selectedTier) return;

    setIsProcessing(true);
    try {
      // Create order
      const { data: order, error: orderErr } = await supabase.from("orders").insert({
        buyer_id: user.id,
        event_id: event.id,
        subtotal,
        platform_fee: isFree ? 0 : platformFee,
        total: isFree ? 0 : total,
        discount_amount: discount,
        status: isFree ? "paid" : "pending",
        payment_status: isFree ? "paid" : "pending",
        payment_method: isFree ? "free" : method,
        expires_at: isFree ? null : new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      }).select().single();

      if (orderErr) throw orderErr;

      // Reserve tickets
      const { data: reserved, error: reserveErr } = await supabase.rpc("reserve_tickets", {
        p_tier_id: selectedTier.id,
        p_quantity: quantity,
        p_order_id: order.id,
      });
      if (reserveErr) throw reserveErr;
      if (!reserved) {
        await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
        toast({ title: "Ingressos esgotados", description: "Não há ingressos suficientes.", variant: "destructive" });
        setIsProcessing(false);
        return;
      }

      setOrderId(order.id);

      // Free order: confirm immediately via RPC
      if (isFree) {
        const { data: confirmed, error: confirmErr } = await supabase.rpc("confirm_order_payment", {
          p_order_id: order.id,
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

        // Generate signed JWT QR codes for free tickets
        const { data: activeTickets } = await supabase
          .from("tickets")
          .select("id")
          .eq("order_id", order.id)
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
        // Process payment
        const result = await createPayment(order.id, method as "pix" | "credit_card" | "boleto", cardData, installments);

        if (!result.success) {
          toast({ title: "Erro no pagamento", description: result.error || "Tente novamente.", variant: "destructive" });
          setIsProcessing(false);
          return;
        }

        if (result.immediateConfirmation || result.stub) {
          toast({ title: "Pagamento confirmado!", description: "Seus ingressos foram gerados." });
          setStep("confirmation");
        } else {
          toast({ title: "Aguardando pagamento", description: "Complete o pagamento para receber seus ingressos." });
          setStep("confirmation");
        }
      }
    } catch (error: any) {
      console.error("Booking error:", error);
      toast({ title: "Erro", description: error.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  }, [user, selectedTier, quantity, event, subtotal, platformFee, total, discount]);

  const handleGoToTickets = () => {
    onOpenChange(false);
    navigate("/meus-ingressos");
  };

  const stepLabels: Record<Step, string> = {
    date: "Data",
    tickets: "Ingressos",
    summary: "Resumo",
    confirmation: "Confirmação",
  };

  const content = (
    <div className="flex flex-col h-full max-h-[85vh] md:max-h-[90vh]">
      {/* Header */}
      {step !== "confirmation" && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-semibold text-sm">{stepLabels[step]}</h2>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Progress dots */}
      {step !== "confirmation" && (
        <div className="flex justify-center gap-1.5 py-2 shrink-0">
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
      )}

      {/* Step content */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4">
          {step === "date" && (
            <BookingDateStep
              event={event}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />
          )}
          {step === "tickets" && (
            <BookingTicketStep
              tiers={tiers}
              selectedDate={selectedDate}
              onSelectTier={handleSelectTier}
              seatMapConfig={event.seat_map_config}
              hasSeatMap={!!event.has_seat_map}
            />
          )}
          {step === "summary" && (
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
            />
          )}
          {step === "confirmation" && (
            <BookingConfirmation
              orderId={orderId}
              eventTitle={event.title}
              onGoToTickets={handleGoToTickets}
              onClose={() => onOpenChange(false)}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden" aria-describedby={undefined}>
        {content}
      </DialogContent>
    </Dialog>
  );
}
