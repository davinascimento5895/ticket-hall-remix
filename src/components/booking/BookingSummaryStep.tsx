import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreditCard, QrCode, Barcode, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn, formatBRL } from "@/lib/utils";
import { type CreditCardData, getInstallmentOptions } from "@/lib/api-payment";
import { toast } from "@/hooks/use-toast";
import { DocumentInput } from "@/components/DocumentInput";
import { validateDocument } from "@/utils/document";

interface Props {
  event: {
    title: string;
    venue_name: string | null;
    venue_city: string | null;
  };
  selectedDate: Date;
  selectedTier: any;
  quantity: number;
  selectedSeat: string | null;
  subtotal: number;
  platformFee: number;
  discount: number;
  total: number;
  couponCode: string;
  onCouponChange: (v: string) => void;
  onApplyCoupon: () => void;
  paymentMethod: string;
  onPaymentMethodChange: (v: string) => void;
  onConfirm: (cardData?: CreditCardData, installments?: number) => void;
  isProcessing: boolean;
  isFree?: boolean;
  payerCpf: string;
  onPayerCpfChange: (cpf: string) => void;
}

const paymentMethods = [
  { id: "pix", label: "PIX", icon: QrCode, desc: "Aprovação instantânea" },
  { id: "credit_card", label: "Cartão de crédito", icon: CreditCard, desc: "Em até 12x" },
  { id: "boleto", label: "Boleto bancário", icon: Barcode, desc: "Até 3 dias úteis" },
];

export function BookingSummaryStep({
  event, selectedDate, selectedTier, quantity, selectedSeat,
  subtotal, platformFee, discount, total,
  couponCode, onCouponChange, onApplyCoupon,
  paymentMethod, onPaymentMethodChange,
  onConfirm, isProcessing, isFree,
  payerCpf, onPayerCpfChange,
}: Props) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [installments, setInstallments] = useState(1);

  const handleConfirm = () => {
    if (isFree) {
      onConfirm();
      return;
    }

    const documentValidation = validateDocument(payerCpf);
    if (!documentValidation.valid || !documentValidation.type) {
      toast({ title: documentValidation.error || "Documento inválido", description: "Preencha um documento válido para prosseguir com o pagamento.", variant: "destructive" });
      return;
    }

    if (paymentMethod === "credit_card") {
      onConfirm({
        holderName: cardName,
        number: cardNumber.replace(/\s/g, ""),
        expiryMonth: cardExpiry.split("/")[0] || "",
        expiryYear: cardExpiry.split("/")[1] || "",
        ccv: cardCvv,
      }, installments);
    } else {
      onConfirm();
    }
  };

  const formatCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  return (
    <div className="space-y-5">
      {/* Order summary */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Resumo do pedido</h3>
        <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-1.5">
          <p className="text-sm font-medium">{event.title}</p>
          <p className="text-xs text-muted-foreground">
            {format(selectedDate, "dd 'de' MMMM 'de' yyyy, EEEE", { locale: ptBR })}
          </p>
          {event.venue_name && (
            <p className="text-xs text-muted-foreground">{event.venue_name}{event.venue_city ? `, ${event.venue_city}` : ""}</p>
          )}
          <Separator className="my-1.5" />
          <div className="flex justify-between text-sm">
            <span>{quantity}x {selectedTier?.name}</span>
            <span className="font-medium">{formatBRL(subtotal)}</span>
          </div>
          {selectedSeat && (
            <p className="text-xs text-muted-foreground">
              Fileira {selectedSeat.charAt(0)}, Assento {selectedSeat.slice(1)}
            </p>
          )}
          {platformFee > 0 && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Taxa de serviço</span>
              <span>{formatBRL(platformFee)}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-xs text-primary">
              <span>Desconto</span>
              <span>-{formatBRL(discount)}</span>
            </div>
          )}
          <Separator className="my-1.5" />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatBRL(total)}</span>
          </div>
        </div>
      </div>

      {/* Coupon */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Cupom de desconto</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Código do cupom"
              value={couponCode}
              onChange={(e) => onCouponChange(e.target.value.toUpperCase())}
              className="pl-9 text-sm"
            />
          </div>
          <Button variant="outline" size="sm" onClick={onApplyCoupon} disabled={!couponCode.trim()}>
            Aplicar
          </Button>
        </div>
      </div>

      {/* Documento do pagador - only for paid events */}
      {!isFree && (
        <div className="space-y-2">
          <DocumentInput
            label="CPF ou CNPJ do pagador"
            value={payerCpf}
            onChange={onPayerCpfChange}
          />
          <p className="text-xs text-muted-foreground">
            Caso queira pagar em nome de outra pessoa, altere o documento acima.
          </p>
        </div>
      )}

      {/* Payment method - only for paid events */}
      {!isFree && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Método de pagamento</Label>
          <div className="space-y-2">
            {paymentMethods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onPaymentMethodChange(m.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                  paymentMethod === m.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/30"
                )}
              >
                <m.icon className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                  paymentMethod === m.id ? "border-primary" : "border-muted-foreground/30"
                )}>
                  {paymentMethod === m.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Credit card fields */}
      {!isFree && paymentMethod === "credit_card" && (
        <div className="space-y-3 p-3 rounded-xl border border-border bg-muted/20">
          <div>
            <Label className="text-xs">Número do cartão</Label>
            <Input
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              maxLength={19}
              className="text-sm mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Nome no cartão</Label>
            <Input
              placeholder="Nome como no cartão"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              className="text-sm mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Validade</Label>
              <Input
                placeholder="MM/AA"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                maxLength={5}
                className="text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">CVV</Label>
              <Input
                placeholder="123"
                type="password"
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                maxLength={4}
                className="text-sm mt-1"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Parcelas</Label>
            <select
              value={installments}
              onChange={(e) => setInstallments(Number(e.target.value))}
              className="w-full mt-1 h-9 rounded-md border border-border bg-background px-3 text-sm"
            >
              {getInstallmentOptions(total).map((opt) => (
                <option key={opt.n} value={opt.n}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Confirm button */}
      <Button className="w-full" size="lg" onClick={handleConfirm} disabled={isProcessing}>
        {isProcessing ? "Processando..." : isFree ? "Confirmar inscrição" : `Pagar ${formatBRL(total)}`}
      </Button>
    </div>
  );
}
