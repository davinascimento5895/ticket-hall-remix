import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Check, CreditCard, QrCode, FileText } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const steps = ["Dados", "Pagamento", "Confirmação"];

export default function Checkout() {
  const [step, setStep] = useState(0);
  const { items, subtotal, platformFee, total, expiresAt, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [attendeeData, setAttendeeData] = useState<Record<string, { name: string; email: string; cpf: string }>>({});
  const [paymentMethod, setPaymentMethod] = useState<string>("pix");

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  if (items.length === 0 && step < 2) {
    navigate("/carrinho");
    return null;
  }

  const handleConfirm = () => {
    // PAYMENT_INTEGRATION_POINT — create order via API, process payment
    toast({ title: "Pedido confirmado!", description: "Seus ingressos foram gerados com sucesso." });
    clearCart();
    setStep(2);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16 max-w-2xl">
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

        {/* Step 0: Attendee Data */}
        {step === 0 && (
          <div className="space-y-6">
            <h2 className="font-display text-xl font-bold">Dados dos participantes</h2>
            {items.map((item, idx) =>
              Array.from({ length: item.quantity }).map((_, qi) => {
                const key = `${item.tierId}-${qi}`;
                const data = attendeeData[key] || { name: "", email: "", cpf: "" };
                return (
                  <div key={key} className="p-4 rounded-lg border border-border bg-card space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      {item.eventTitle} — {item.tierName} (Ingresso {qi + 1})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Nome completo</Label>
                        <Input
                          value={data.name}
                          onChange={(e) => setAttendeeData((p) => ({ ...p, [key]: { ...data, name: e.target.value } }))}
                          placeholder="Nome do participante"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">E-mail</Label>
                        <Input
                          type="email"
                          value={data.email}
                          onChange={(e) => setAttendeeData((p) => ({ ...p, [key]: { ...data, email: e.target.value } }))}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">CPF (opcional)</Label>
                        <Input
                          value={data.cpf}
                          onChange={(e) => setAttendeeData((p) => ({ ...p, [key]: { ...data, cpf: e.target.value } }))}
                          placeholder="000.000.000-00"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <Button className="w-full" onClick={() => setStep(1)}>Continuar para pagamento</Button>
          </div>
        )}

        {/* Step 1: Payment */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="font-display text-xl font-bold">Pagamento</h2>

            <div className="space-y-2">
              {[
                { id: "pix", label: "PIX", icon: QrCode, desc: "Pagamento instantâneo" },
                { id: "credit_card", label: "Cartão de Crédito", icon: CreditCard, desc: "Até 12x sem juros" },
                { id: "boleto", label: "Boleto Bancário", icon: FileText, desc: "Compensação em até 3 dias úteis" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-colors ${paymentMethod === m.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/30"}`}
                >
                  <m.icon className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* PAYMENT_INTEGRATION_POINT — show PIX QR, credit card form, or boleto */}
            {paymentMethod === "pix" && (
              <div className="p-6 rounded-lg border border-border bg-card text-center space-y-3">
                <div className="w-40 h-40 mx-auto bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground border border-dashed border-border">
                  QR Code PIX
                </div>
                <p className="text-xs text-muted-foreground">Escaneie o QR Code ou copie o código PIX</p>
              </div>
            )}

            {paymentMethod === "credit_card" && (
              <div className="p-4 rounded-lg border border-border bg-card space-y-3">
                <div><Label className="text-xs">Número do cartão</Label><Input placeholder="0000 0000 0000 0000" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Validade</Label><Input placeholder="MM/AA" /></div>
                  <div><Label className="text-xs">CVV</Label><Input placeholder="000" /></div>
                </div>
                <div><Label className="text-xs">Nome no cartão</Label><Input placeholder="Como no cartão" /></div>
              </div>
            )}

            <div className="p-4 rounded-lg border border-border bg-card space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Taxa (7%)</span><span>{fmt(platformFee)}</span></div>
              <div className="flex justify-between font-semibold border-t border-border pt-2"><span>Total</span><span>{fmt(total)}</span></div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1">Voltar</Button>
              <Button onClick={handleConfirm} className="flex-1">Confirmar pagamento</Button>
            </div>
          </div>
        )}

        {/* Step 2: Confirmation */}
        {step === 2 && (
          <div className="text-center space-y-6 py-8">
            <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-success" />
            </div>
            <h2 className="font-display text-2xl font-bold">Pedido confirmado!</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Seus ingressos foram gerados com sucesso. Você pode acessá-los na seção "Meus Ingressos".
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild><Link to="/meus-ingressos">Ver meus ingressos</Link></Button>
              <Button variant="outline" asChild><Link to="/eventos">Explorar mais eventos</Link></Button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
