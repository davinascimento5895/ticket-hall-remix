import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, ChevronRight, Clock, LayoutGrid, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isPast, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EmptyState } from "@/components/EmptyState";
import { StaffPortalHeader } from "@/components/staff/StaffPortalHeader";
import { cn } from "@/lib/utils";

interface StaffEvent {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  venue_name: string | null;
  venue_city: string | null;
  cover_image_url: string | null;
  status: string | null;
}

function getEventBadge(start: string, end: string) {
  const now = new Date();
  const s = new Date(start);
  const e = new Date(end);
  if (isPast(e)) return { label: "ENCERRADO", variant: "secondary" as const };
  if (isWithinInterval(now, { start: s, end: e })) return { label: "EM ANDAMENTO", variant: "default" as const };
  return { label: "EM BREVE", variant: "outline" as const };
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  producer: "Produtor",
  staff: "Equipe",
  buyer: "Comprador",
};

export default function StaffEventList() {
  const { user, role, loading, signOut, profile, allRoles, switchRole } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<StaffEvent[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/?login=true", { replace: true });
      return;
    }

    setFetching(true);

    (async () => {
      let evts: StaffEvent[] = [];

      if (role === "admin") {
        // Admin sees all published/draft events
        const { data } = await supabase
          .from("events")
          .select("id, title, start_date, end_date, venue_name, venue_city, cover_image_url, status")
          .in("status", ["published", "draft"])
          .order("start_date", { ascending: false })
          .limit(50);
        evts = data || [];
      } else if (role === "producer") {
        // Producer sees their own events
        const { data } = await supabase
          .from("events")
          .select("id, title, start_date, end_date, venue_name, venue_city, cover_image_url, status")
          .eq("producer_id", user.id)
          .order("start_date", { ascending: false });
        evts = data || [];
      } else {
        // Staff sees only assigned events via event_staff
        const { data: assignments } = await supabase
          .from("event_staff")
          .select("event_id")
          .eq("user_id", user.id);

        if (assignments?.length) {
          const eventIds = assignments.map((a) => a.event_id);
          const { data } = await supabase
            .from("events")
            .select("id, title, start_date, end_date, venue_name, venue_city, cover_image_url, status")
            .in("id", eventIds)
            .order("start_date", { ascending: false });
          evts = data || [];
        }
      }

      setEvents(evts);
      setFetching(false);
    })();
  }, [user, role, loading, navigate]);

  const canSwitchToBuyer = allRoles.includes("buyer");
  const accountName = profile?.full_name || user?.email || "Usuário";
  const accountEmail = user?.email || profile?.full_name || null;
  const activeRoleLabel = role ? roleLabels[role] || role : "Equipe";

  const handleSwitchToBuyer = () => {
    if (!canSwitchToBuyer) return;
    switchRole("buyer");
    navigate("/meus-ingressos");
  };

  const metrics = [
    {
      label: "Eventos atribuídos",
      value: String(events.length),
      helper: events.length === 1 ? "1 evento disponível para check-in" : "Toque em um cartão para entrar",
    },
    {
      label: "Conta ativa",
      value: activeRoleLabel,
      helper: canSwitchToBuyer ? "Troca para comprador no card de conta do cabeçalho" : "Apenas operação de equipe disponível",
    },
  ];

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <StaffPortalHeader
        breadcrumb={[
          { label: "Portal da equipe", href: "/staff" },
          { label: "Eventos atribuídos" },
        ]}
        eyebrow="Operação da equipe"
        title={role === "admin" ? "Todos os eventos" : role === "producer" ? "Seus eventos" : "Eventos atribuídos"}
        description="Acesso rápido ao check-in, com contexto da conta ativa e troca para comprador sempre visível no cabeçalho."
        accountName={accountName}
        accountEmail={accountEmail}
        accountAvatarUrl={profile?.avatar_url}
        activeRoleLabel={activeRoleLabel}
        canSwitchToBuyer={canSwitchToBuyer}
        onSwitchToBuyer={handleSwitchToBuyer}
        onSignOut={signOut}
        metrics={metrics}
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <section className="space-y-4">
            <Card className="border-border/80 bg-card/80 shadow-sm">
              <CardContent className="flex flex-col gap-3 p-4 sm:p-5 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Fluxo rápido
                  </p>
                  <h2 className="mt-1 font-display text-lg font-semibold text-foreground sm:text-xl">
                    {events.length > 0 ? "Escolha um evento para abrir o check-in" : "Nenhum evento atribuído"}
                  </h2>
                  <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
                    {events.length > 0
                      ? "Os cartões abaixo levam direto ao leitor QR. O perfil de comprador permanece acessível no cabeçalho para troca rápida."
                      : "Esta conta ainda não recebeu acesso a eventos. Se existir um perfil de comprador, você pode voltar ao modo de compra pelo cabeçalho."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {events.length === 0 ? (
              <EmptyState
                icon={LayoutGrid}
                title="Nenhum evento disponível"
                description="A equipe conectada nesta sessão não tem eventos atribuídos no momento."
                actionLabel={canSwitchToBuyer ? "Ir para comprador" : "Sair"}
                onAction={canSwitchToBuyer ? handleSwitchToBuyer : signOut}
              >
                {canSwitchToBuyer && (
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <Button variant="ghost" onClick={signOut}>
                      Sair da sessão
                    </Button>
                  </div>
                )}
              </EmptyState>
            ) : (
              <div className="space-y-3">
                {events.map((evt) => {
                  const badge = getEventBadge(evt.start_date, evt.end_date);
                  const isEnded = badge.label === "ENCERRADO";
                  const venueLabel = evt.venue_name
                    ? `${evt.venue_name}${evt.venue_city ? `, ${evt.venue_city}` : ""}`
                    : "Local não informado";

                  const card = (
                    <Card
                      className={cn(
                        "overflow-hidden border-border/80 bg-card/90 shadow-sm transition-all duration-200",
                        !isEnded && "group-hover:border-primary/40 group-hover:shadow-md"
                      )}
                    >
                      <CardContent className="flex flex-col p-0 sm:flex-row">
                        {evt.cover_image_url ? (
                          <div className="relative h-40 w-full shrink-0 overflow-hidden sm:h-auto sm:w-40">
                            <img
                              src={evt.cover_image_url}
                              alt={evt.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="hidden w-1 shrink-0 bg-primary/20 sm:block" />
                        )}

                        <div className="flex-1 p-4 sm:p-5 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate text-base font-semibold text-foreground sm:text-lg">
                                {evt.title}
                              </h3>
                              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                  <CalendarDays className="h-4 w-4 shrink-0" />
                                  {format(new Date(evt.start_date), "dd MMM yyyy", { locale: ptBR })}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-4 w-4 shrink-0" />
                                  {format(new Date(evt.start_date), "HH:mm", { locale: ptBR })}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="h-4 w-4 shrink-0" />
                                  <span className="truncate">{venueLabel}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <Badge variant={badge.variant} className="text-[10px] whitespace-nowrap">
                                {badge.label}
                              </Badge>
                              {!isEnded && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold text-foreground">
                                  Abrir check-in
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );

                  if (isEnded) {
                    return (
                      <div key={evt.id} className="opacity-55">
                        {card}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={evt.id}
                      to={`/staff/checkin/${evt.id}`}
                      className="group block rounded-2xl transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                    >
                      {card}
                    </Link>
                  );
                })}
              </div>
            )}
        </section>
      </main>
    </div>
  );
}
