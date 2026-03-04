import { useState } from "react";
import { CreditCard, QrCode, FileText, Copy, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCardData, getInstallmentOptions } from "@/lib/api-payment";
import { formatCPF } from "@/lib/validators";
import { formatCEP } from "@/lib/cep";
import { toast } from "@/hooks/use-toast";

interface CheckoutStepPaymentProps {
  subtotal: number;
  platformFee: number;
  total: number;
  onBack: () => void;
  onConfirm: (method: string, cardData?: CreditCardData, installments?: number) => void;
  isProcessing: boolean;
  // Payment result data
  pixQrCode?: string | null;
  pixQrCodeImage?: string | null;
  boletoUrl?: string | null;
  boletoBarcode?: string | null;
  paymentCreated: boolean;
  awaitingPayment: boolean;
}

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

export function CheckoutStepPayment({
  subtotal,
  platformFee,
  total,
  onBack,
  onConfirm,
  isProcessing,
  pixQrCode,
  pixQrCodeImage,
  boletoUrl,
  boletoBarcode,
  paymentCreated,
  awaitingPayment,
}: CheckoutStepPaymentProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>("pix");
  const [installments, setInstallments] = useState<number>(1);
  const [cardData, setCardData] = useState<CreditCardData>({
    holderName: "",
    number: "",
    expiryMonth: "",
    expiryYear: "",
    ccv: "",
    postalCode: "",
    addressNumber: "",
  });

  const installmentOptions = getInstallmentOptions(total);

  const handleCopyPix = () => {
    if (pixQrCode) {
      navigator.clipboard.writeText(pixQrCode);
      toast({ title: "Código PIX copiado!" });
    }
  };

  const handleConfirm = () => {
    if (paymentMethod === "credit_card") {
      if (!cardData.holderName || !cardData.number || !cardData.expiryMonth || !cardData.expiryYear || !cardData.ccv) {
        toast({ title: "Preencha todos os dados do cartão", variant: "destructive" });
        return;
      }
      onConfirm(paymentMethod, cardData, installments);
    } else {
      onConfirm(paymentMethod);
    }
  };

  // If payment was created and we're awaiting — show status
  if (paymentCreated && awaitingPayment) {
    if (paymentMethod === "pix") {
      return (
        <div className="space-y-6">
          <h2 className="font-display text-xl font-bold">Pagamento via PIX</h2>
          <div className="p-6 rounded-lg border border-border bg-card text-center space-y-4">
            {pixQrCodeImage ? (
              <img
                src={`data:image/png;base64,${pixQrCodeImage}`}
                alt="QR Code PIX"
                className="w-48 h-48 mx-auto rounded-lg"
              />
            ) : (
              <div className="w-48 h-48 mx-auto bg-muted rounded-lg flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Escaneie o QR Code ou copie o código abaixo
            </p>
            {pixQrCode && (
              <div className="flex items-center gap-2 max-w-md mx-auto">
                <Input
                  value={pixQrCode}
                  readOnly
                  className="text-xs font-mono"
                />
                <Button variant="outline" size="icon" onClick={handleCopyPix}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Aguardando confirmação do pagamento...</span>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-border bg-card space-y-2 text-sm">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>
          </div>
        </div>
      );
    }

    if (paymentMethod === "boleto") {
      return (
        <div className="space-y-6">
          <h2 className="font-display text-xl font-bold">Boleto Bancário</h2>
          <div className="p-6 rounded-lg border border-border bg-card space-y-4">
            <div className="text-center space-y-3">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">Boleto gerado com sucesso!</p>
              <p className="text-xs text-muted-foreground">
                Seus ingressos serão enviados após a confirmação do pagamento (até 3 dias úteis).
              </p>
            </div>

            {boletoUrl && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(boletoUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir boleto (PDF)
              </Button>
            )}

            {boletoBarcode && (
              <div className="space-y-2">
                <Label className="text-xs">Código de barras</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={boletoBarcode}
                    readOnly
                    className="text-xs font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(boletoBarcode);
                      toast({ title: "Código copiado!" });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Aguardando confirmação do pagamento...</span>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold">Pagamento</h2>

      <div className="space-y-2">
        {[
          {
            id: "pix",
            label: "PIX",
            icon: QrCode,
            desc: "Pagamento instantâneo",
          },
          {
            id: "credit_card",
            label: "Cartão de Crédito",
            icon: CreditCard,
            desc: "Até 12x",
          },
          {
            id: "boleto",
            label: "Boleto Bancário",
            icon: FileText,
            desc: "Compensação em até 3 dias úteis",
          },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setPaymentMethod(m.id)}
            disabled={isProcessing}
            className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-colors ${
              paymentMethod === m.id
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-muted-foreground/30"
            }`}
          >
            <m.icon className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">{m.label}</p>
              <p className="text-xs text-muted-foreground">{m.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Credit card form */}
      {paymentMethod === "credit_card" && (
        <div className="p-4 rounded-lg border border-border bg-card space-y-3">
          <div>
            <Label className="text-xs">Número do cartão</Label>
            <Input
              placeholder="0000 0000 0000 0000"
              value={cardData.number}
              onChange={(e) =>
                setCardData((p) => ({ ...p, number: e.target.value }))
              }
              maxLength={19}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Mês</Label>
              <Input
                placeholder="MM"
                value={cardData.expiryMonth}
                onChange={(e) =>
                  setCardData((p) => ({ ...p, expiryMonth: e.target.value }))
                }
                maxLength={2}
              />
            </div>
            <div>
              <Label className="text-xs">Ano</Label>
              <Input
                placeholder="AAAA"
                value={cardData.expiryYear}
                onChange={(e) =>
                  setCardData((p) => ({ ...p, expiryYear: e.target.value }))
                }
                maxLength={4}
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">CVV</Label>
            <Input
              placeholder="000"
              value={cardData.ccv}
              onChange={(e) =>
                setCardData((p) => ({ ...p, ccv: e.target.value }))
              }
              maxLength={4}
            />
          </div>
          <div>
            <Label className="text-xs">Nome no cartão</Label>
            <Input
              placeholder="Como impresso no cartão"
              value={cardData.holderName}
              onChange={(e) =>
                setCardData((p) => ({ ...p, holderName: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">CEP</Label>
              <Input
                placeholder="00000-000"
                value={cardData.postalCode || ""}
                onChange={(e) =>
                  setCardData((p) => ({
                    ...p,
                    postalCode: formatCEP(e.target.value),
                  }))
                }
                maxLength={9}
              />
            </div>
            <div>
              <Label className="text-xs">Número do endereço</Label>
              <Input
                placeholder="123"
                value={cardData.addressNumber || ""}
                onChange={(e) =>
                  setCardData((p) => ({
                    ...p,
                    addressNumber: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* Installments */}
          <div>
            <Label className="text-xs">Parcelamento</Label>
            <Select
              value={String(installments)}
              onValueChange={(v) => setInstallments(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {installmentOptions.map((opt) => (
                  <SelectItem key={opt.n} value={String(opt.n)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Order summary */}
      <div className="p-4 rounded-lg border border-border bg-card space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{fmt(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Taxa (7%)</span>
          <span>{fmt(platformFee)}</span>
        </div>
        {paymentMethod === "credit_card" && installments > 3 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Juros</span>
            <span>
              {fmt(
                installmentOptions.find((o) => o.n === installments)?.total! -
                  total
              )}
            </span>
          </div>
        )}
        <div className="flex justify-between font-semibold border-t border-border pt-2">
          <span>Total</span>
          <span>
            {fmt(
              paymentMethod === "credit_card" && installments > 3
                ? installmentOptions.find((o) => o.n === installments)?.total ||
                    total
                : total
            )}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1"
          disabled={isProcessing}
        >
          Voltar
        </Button>
        <Button
          onClick={handleConfirm}
          className="flex-1"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            "Confirmar pagamento"
          )}
        </Button>
      </div>
    </div>
  );
}
