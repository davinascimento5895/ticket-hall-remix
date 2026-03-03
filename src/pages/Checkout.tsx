import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, CreditCard, QrCode, FileText } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { getCheckoutQuestions } from "@/lib/api-checkout";
import { toast } from "@/hooks/use-toast";

const steps = ["Dados", "Pagamento", "Confirmação"];

export default function Checkout() {
  const [step, setStep] = useState(0);
  const { items, subtotal, platformFee, total, expiresAt, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [attendeeData, setAttendeeData] = useState<Record<string, { name: string; email: string; cpf: string }>>({});
  const [paymentMethod, setPaymentMethod] = useState<string>("pix");
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});

  // Get unique event IDs from cart
  const eventIds = [...new Set(items.map((i) => i.eventId))];

  // Fetch checkout questions for all events in cart
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

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  if (items.length === 0 && step < 2) {
    navigate("/carrinho");
    return null;
  }

  const handleConfirm = () => {
    // PAYMENT_INTEGRATION_POINT — create order via API, process payment, save checkout answers
    toast({ title: "Pedido confirmado!", description: "Seus ingressos foram gerados com sucesso." });
    clearCart();
    setStep(2);
  };

  const renderQuestionField = (q: any, key: string) => {
    const value = questionAnswers[key] || "";
    const onChange = (val: string) => setQuestionAnswers((prev) => ({ ...prev, [key]: val }));

    switch (q.field_type) {
      case "textarea":
        return <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder="Sua resposta..." rows={2} maxLength={1000} />;
      case "select":
        return (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {(q.options || []).map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
            </SelectContent>
          </Select>
        );
      case "radio":
        return (
          <div className="space-y-1">
            {(q.options || []).map((opt: string) => (
              <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name={key} value={opt} checked={value === opt} onChange={() => onChange(opt)} className="accent-primary" />
                <span className="text-foreground">{opt}</span>
              </label>
            ))}
          </div>
        );
      case "checkbox":
        return (
          <div className="space-y-1">
            {(q.options || []).map((opt: string) => {
              const selected = value ? value.split(",") : [];
              const checked = selected.includes(opt);
              return (
                <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={checked} onCheckedChange={(c) => {
                    const newSel = c ? [...selected, opt] : selected.filter((s) => s !== opt);
                    onChange(newSel.join(","));
                  }} />
                  <span className="text-foreground">{opt}</span>
                </label>
              );
            })}
          </div>
        );
      case "date":
        return <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} />;
      default:
        return <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Sua resposta..." maxLength={500} />;
    }
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

        {/* Step 0: Attendee Data + Custom Questions */}
        {step === 0 && (
          <div className="space-y-6">
            <h2 className="font-display text-xl font-bold">Dados dos participantes</h2>

            {/* Order-level custom questions */}
            {orderQuestions.length > 0 && (
              <div className="p-4 rounded-lg border border-border bg-card space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Informações do pedido</p>
                {orderQuestions.map((q: any) => (
                  <div key={q.id}>
                    <Label className="text-xs">{q.question}{q.is_required ? " *" : ""}</Label>
                    {renderQuestionField(q, `order-${q.id}`)}
                  </div>
                ))}
              </div>
            )}

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
                        <Input value={data.name} onChange={(e) => setAttendeeData((p) => ({ ...p, [key]: { ...data, name: e.target.value } }))} placeholder="Nome do participante" />
                      </div>
                      <div>
                        <Label className="text-xs">E-mail</Label>
                        <Input type="email" value={data.email} onChange={(e) => setAttendeeData((p) => ({ ...p, [key]: { ...data, email: e.target.value } }))} placeholder="email@exemplo.com" />
                      </div>
                      <div>
                        <Label className="text-xs">CPF (opcional)</Label>
                        <Input value={data.cpf} onChange={(e) => setAttendeeData((p) => ({ ...p, [key]: { ...data, cpf: e.target.value } }))} placeholder="000.000.000-00" />
                      </div>
                    </div>

                    {/* Attendee-level custom questions */}
                    {attendeeQuestions.length > 0 && (
                      <div className="space-y-3 pt-2 border-t border-border">
                        {attendeeQuestions.map((q: any) => (
                          <div key={q.id}>
                            <Label className="text-xs">{q.question}{q.is_required ? " *" : ""}</Label>
                            {renderQuestionField(q, `attendee-${key}-${q.id}`)}
                          </div>
                        ))}
                      </div>
                    )}
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
                <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-colors ${paymentMethod === m.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/30"}`}>
                  <m.icon className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {paymentMethod === "pix" && (
              <div className="p-6 rounded-lg border border-border bg-card text-center space-y-3">
                <div className="w-40 h-40 mx-auto bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground border border-dashed border-border">QR Code PIX</div>
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
            <p className="text-muted-foreground max-w-md mx-auto">Seus ingressos foram gerados com sucesso. Você pode acessá-los na seção "Meus Ingressos".</p>
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
