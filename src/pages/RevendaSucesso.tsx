import { useLocation, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, Ticket, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";

export default function RevendaSucesso() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    ticketId?: string;
    total?: number;
    eventTitle?: string;
    tierName?: string;
    eventSlug?: string;
  } | null;

  const hasData = !!state?.ticketId;

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
                Seu ingresso foi transferido com sucesso. Um novo QR Code exclusivo foi gerado para você.
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

            <div className="flex flex-col gap-3">
              <Button className="w-full gap-2" asChild>
                <Link to="/meus-ingressos">
                  Ver meus ingressos <ArrowRight className="h-4 w-4" />
                </Link>
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
