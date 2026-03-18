import { useLocation, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, Ticket, ArrowRight, Clock3, Copy, QrCode, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function RevendaSucesso() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const state = location.state as {
    ticketId?: string;
    total?: number;
    eventTitle?: string;
    tierName?: string;
    eventSlug?: string;
    immediateConfirmation?: boolean;
    paymentMethod?: "pix" | "boleto" | "credit_card";
    pixQrCode?: string;
    pixQrCodeImage?: string;
    boletoUrl?: string;
    boletoBarcode?: string;
    dueDate?: string;
  } | null;

  const hasData = !!state?.eventTitle;
  const isImmediate = !!state?.immediateConfirmation;
  const isPixPending = !isImmediate && state?.paymentMethod === "pix";
  const isBoletoPending = !isImmediate && state?.paymentMethod === "boleto";

  return (
    <>
      <SEOHead title="Compra confirmada — TicketHall" />
      <div className="container pt-4 lg:pt-24 pb-16 max-w-lg">
        {!hasData ? (
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Nenhuma compra encontrada.</p>
            <Button onClick={() => navigate("/meus-ingressos")}>Ir para Meus Ingressos</Button>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>

            <div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">Ingresso adquirido!</h1>
              <p className="text-muted-foreground">
                {isImmediate
                  ? "Seu ingresso foi transferido com sucesso. Um novo QR Code exclusivo foi gerado para você."
                  : "Seu checkout de revenda foi criado. Assim que o pagamento confirmar, o ingresso será transferido automaticamente."}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card text-left space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Ticket className="h-4 w-4 text-primary shrink-0" />
                <span className="font-medium text-foreground">{state!.eventTitle}</span>
              </div>
              {state!.tierName && (
                <p className="text-sm text-muted-foreground ml-6">{state!.tierName}</p>
              )}
              {state!.total != null && (
                <p className="text-sm text-muted-foreground ml-6">
                  Total pago: <span className="font-semibold text-foreground">R$ {Number(state!.total).toFixed(2)}</span>
                </p>
              )}
            </div>

            {isPixPending && (
              <div className="p-4 rounded-xl border border-border bg-card text-left space-y-3">
                <p className="text-sm font-medium text-foreground inline-flex items-center gap-1"><QrCode className="h-4 w-4 text-primary" /> Pagamento PIX pendente</p>
                {state?.pixQrCodeImage && (
                  <img
                    src={`data:image/png;base64,${state.pixQrCodeImage}`}
                    alt="QR Code PIX"
                    className="w-44 h-44 mx-auto rounded-md border"
                  />
                )}
                {state?.pixQrCode && (
                  <div className="flex gap-2">
                    <Input value={state.pixQrCode} readOnly className="text-xs font-mono" />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(state.pixQrCode || "");
                        toast({ title: "Código copiado" });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {isBoletoPending && (
              <div className="p-4 rounded-xl border border-border bg-card text-left space-y-3">
                <p className="text-sm font-medium text-foreground inline-flex items-center gap-1"><Clock3 className="h-4 w-4 text-primary" /> Boleto gerado</p>
                {state?.dueDate && <p className="text-xs text-muted-foreground">Vencimento: {new Date(state.dueDate).toLocaleDateString("pt-BR")}</p>}
                {state?.boletoBarcode && <Input value={state.boletoBarcode} readOnly className="text-xs font-mono" />}
                {state?.boletoUrl && (
                  <Button variant="outline" className="w-full" onClick={() => window.open(state.boletoUrl, "_blank")}>Abrir boleto</Button>
                )}
              </div>
            )}

            {!isImmediate && state?.paymentMethod === "credit_card" && (
              <div className="p-4 rounded-xl border border-border bg-card text-left">
                <p className="text-sm inline-flex items-center gap-1 text-muted-foreground"><CreditCard className="h-4 w-4" /> Aguardando confirmação da operadora do cartão.</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button className="w-full gap-2" asChild>
                <Link to="/meus-ingressos">
                  Ver meus ingressos <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/minha-carteira">Ver carteira</Link>
              </Button>
              {state!.eventSlug && (
                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/eventos/${state!.eventSlug}`}>Ver evento</Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
