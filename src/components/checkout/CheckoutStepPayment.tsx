import { useState, useEffect } from "react";
import { CreditCard, QrCode, FileText, Copy, ExternalLink, Loader2, AlertTriangle } from "lucide-react";
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
  pixQrCode?: string | null;
  pixQrCodeImage?: string | null;
  boletoUrl?: string | null;
  boletoBarcode?: string | null;
  paymentCreated: boolean;
  awaitingPayment: boolean;
  expiresAt?: string | null;
  payerCpf: string;
  onPayerCpfChange: (cpf: string) => void;
}

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

// M09: Luhn algorithm for card validation
function luhnCheck(num: string): boolean {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

function validateCardExpiry(month: string, year: string): boolean {
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (isNaN(m) || isNaN(y) || m < 1 || m > 12) return false;
  const now = new Date();
  const expiry = new Date(y, m); // first day of next month
  return expiry > now;
}

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
  expiresAt,
  payerCpf,
  onPayerCpfChange,
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

  // M12: Countdown timer for PIX/boleto expiration
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!awaitingPayment || !expiresAt) return;
    const expiryTime = new Date(expiresAt).getTime();

    const tick = () => {
      const remaining = Math.max(0, expiryTime - Date.now());
      setTimeLeft(Math.floor(remaining / 1000));
      if (remaining <= 0) {
        setIsExpired(true);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [awaitingPayment, expiresAt]);

  const formatTimeLeft = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

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
      // M09: Validate card number with Luhn
      if (!luhnCheck(cardData.number)) {
        toast({ title: "Número de cartão inválido", description: "Verifique o número do cartão.", variant: "destructive" });
        return;
      }
      // M09: Validate expiry date
      if (!validateCardExpiry(cardData.expiryMonth, cardData.expiryYear)) {
        toast({ title: "Data de validade inválida", description: "O cartão pode estar vencido.", variant: "destructive" });
        return;
      }
      // M09: Validate CVV
      const cvvClean = cardData.ccv.replace(/\D/g, "");
      if (cvvClean.length < 3 || cvvClean.length > 4) {
        toast({ title: "CVV inválido", description: "O CVV deve ter 3 ou 4 dígitos.", variant: "destructive" });
        return;
      }
      onConfirm(paymentMethod, cardData, installments);
    } else {
      onConfirm(paymentMethod);
    }
  };

  // If payment was created and we're awaiting — show status
  if (paymentCreated && awaitingPayment) {
    const expirationWarning = isExpired ? (
      <div className="flex items-center justify-center gap-2 text-sm text-destructive">
        <AlertTriangle className="h-4 w-4" />
        <span>Tempo de pagamento expirado. Crie um novo pedido.</span>
      </div>
    ) : timeLeft !== null ? (
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Aguardando pagamento... ({formatTimeLeft(timeLeft)})</span>
      </div>
    ) : (
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Aguardando confirmação do pagamento...</span>
      </div>
    );

    if (paymentMethod === "pix") {
      return (
        <div className="space-y-6">
          <h2 className="font-display text-xl font-bold">Pagamento via PIX</h2>
          <div className="p-6 rounded-lg border border-border bg-card text-center space-y-4">
            {pixQrCodeImage ? (
              <img src={`data:image/png;base64,${pixQrCodeImage}`} alt="QR Code PIX" className="w-48 h-48 mx-auto rounded-lg" />
            ) : (
              <div className="w-48 h-48 mx-auto bg-muted rounded-lg flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            <p className="text-sm text-muted-foreground">Escaneie o QR Code ou copie o código abaixo</p>
            {pixQrCode && (
              <div className="flex items-center gap-2 max-w-md mx-auto">
                <Input value={pixQrCode} readOnly className="text-xs font-mono" />
                <Button variant="outline" size="icon" onClick={handleCopyPix}><Copy className="h-4 w-4" /></Button>
              </div>
            )}
            {expirationWarning}
          </div>
          <div className="p-4 rounded-lg border border-border bg-card space-y-2 text-sm">
            <div className="flex justify-between font-semibold"><span>Total</span><span>{fmt(total)}</span></div>
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
              <p className="text-xs text-muted-foreground">Seus ingressos serão enviados após a confirmação do pagamento (até 3 dias úteis).</p>
            </div>
            {boletoUrl && (
              <Button variant="outline" className="w-full" onClick={() => window.open(boletoUrl, "_blank")}>
                <ExternalLink className="h-4 w-4 mr-2" />Abrir boleto (PDF)
              </Button>
            )}
            {boletoBarcode && (
              <div className="space-y-2">
                <Label className="text-xs">Código de barras</Label>
                <div className="flex items-center gap-2">
                  <Input value={boletoBarcode} readOnly className="text-xs font-mono" />
                  <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(boletoBarcode); toast({ title: "Código copiado!" }); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {expirationWarning}
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
          { id: "pix", label: "PIX", icon: QrCode, desc: "Pagamento instantâneo" },
          { id: "credit_card", label: "Cartão de Crédito", icon: CreditCard, desc: "Até 12x" },
          { id: "boleto", label: "Boleto Bancário", icon: FileText, desc: "Compensação em até 3 dias úteis" },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setPaymentMethod(m.id)}
            disabled={isProcessing}
            className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-colors ${
              paymentMethod === m.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/30"
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

      {paymentMethod === "credit_card" && (
        <div className="p-4 rounded-lg border border-border bg-card space-y-3">
          <div>
            <Label className="text-xs">Número do cartão</Label>
            <Input placeholder="0000 0000 0000 0000" value={cardData.number} onChange={(e) => setCardData((p) => ({ ...p, number: e.target.value }))} maxLength={19} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Mês</Label>
              <Input placeholder="MM" value={cardData.expiryMonth} onChange={(e) => setCardData((p) => ({ ...p, expiryMonth: e.target.value }))} maxLength={2} />
            </div>
            <div>
              <Label className="text-xs">Ano</Label>
              <Input placeholder="AAAA" value={cardData.expiryYear} onChange={(e) => setCardData((p) => ({ ...p, expiryYear: e.target.value }))} maxLength={4} />
            </div>
          </div>
          <div>
            <Label className="text-xs">CVV</Label>
            <Input placeholder="000" value={cardData.ccv} onChange={(e) => setCardData((p) => ({ ...p, ccv: e.target.value }))} maxLength={4} />
          </div>
          <div>
            <Label className="text-xs">Nome no cartão</Label>
            <Input placeholder="Como impresso no cartão" value={cardData.holderName} onChange={(e) => setCardData((p) => ({ ...p, holderName: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">CEP</Label>
              <Input placeholder="00000-000" value={cardData.postalCode || ""} onChange={(e) => setCardData((p) => ({ ...p, postalCode: formatCEP(e.target.value) }))} maxLength={9} />
            </div>
            <div>
              <Label className="text-xs">Número do endereço</Label>
              <Input placeholder="123" value={cardData.addressNumber || ""} onChange={(e) => setCardData((p) => ({ ...p, addressNumber: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Parcelamento</Label>
            <Select value={String(installments)} onValueChange={(v) => setInstallments(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {installmentOptions.map((opt) => (
                  <SelectItem key={opt.n} value={String(opt.n)}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="p-4 rounded-lg border border-border bg-card space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(subtotal)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Taxa (7%)</span><span>{fmt(platformFee)}</span></div>
        {paymentMethod === "credit_card" && installments > 3 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Juros</span>
            <span>{fmt(installmentOptions.find((o) => o.n === installments)?.total! - total)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold border-t border-border pt-2">
          <span>Total</span>
          <span>{fmt(paymentMethod === "credit_card" && installments > 3 ? installmentOptions.find((o) => o.n === installments)?.total || total : total)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1" disabled={isProcessing}>Voltar</Button>
        <Button onClick={handleConfirm} className="flex-1" disabled={isProcessing}>
          {isProcessing ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processando...</>) : "Confirmar pagamento"}
        </Button>
      </div>
    </div>
  );
}
