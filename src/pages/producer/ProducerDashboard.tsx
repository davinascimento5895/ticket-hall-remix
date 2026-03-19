import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  CircleGauge,
  Edit,
  Plus,
  Ticket,
  Timer,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { getProducerDashboardStats } from "@/lib/api-producer";
import { formatBRL } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function ProducerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ["producer-dashboard", user?.id],
    queryFn: () => getProducerDashboardStats(user!.id),
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const metrics = [
    {
      label: "Faturamento total",
      value: stats ? formatBRL(stats.totalRevenue) : "—",
      icon: CircleDollarSign,
      support: "Receita acumulada",
    },
    {
      label: "Pedidos pagos",
      value: (stats?.confirmedOrders || 0).toLocaleString("pt-BR"),
      icon: Ticket,
      support: "Total confirmado",
    },
    {
      label: "Eventos ativos",
      value: (stats?.activeEvents || 0).toLocaleString("pt-BR"),
      icon: CircleGauge,
      support: "Operando agora",
    },
    {
      label: "Vendas nos últimos 7 dias",
      value: formatBRL(stats?.focusEvent?.paidSalesLast7DaysAmount || 0),
      icon: Timer,
      support: "Ritmo recente",
    },
  ];

  const topAlert = stats?.practicalAlerts?.[0];
  const focusEvent = stats?.focusEvent;

  const statusLabel = (() => {
    const normalized = String(focusEvent?.status || "").toLowerCase();
    if (normalized === "published") return "Publicado";
    if (normalized === "active") return "Em andamento";
    if (normalized === "draft") return "Rascunho";
    return focusEvent?.status || "Sem status";
  })();

  const alertStyles: Record<string, string> = {
    critical: "border-destructive/30 bg-destructive/10 text-destructive",
    warning: "border-warning/30 bg-warning/10 text-warning",
    info: "border-info/30 bg-info/10 text-info",
  };

  return (
    <div className="space-y-6 lg:space-y-7">
      <Card className="border-border/80 bg-gradient-to-br from-card to-muted/40 shadow-sm">
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <Badge variant="secondary" className="w-fit">Painel do produtor</Badge>
              <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Decisões rápidas do seu evento principal</h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Veja o que precisa de ação agora e ajuste o evento em foco sem perder tempo.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" asChild>
                <Link to="/producer/financial" className="gap-2">
                  Ver financeiro <Wallet className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/producer/events" className="gap-2">
                  Ver eventos <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild>
                <Link to="/producer/events/new" className="gap-2">
                  <Plus className="h-4 w-4" /> Criar evento
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-destructive/30 bg-destructive/10 shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Não foi possível carregar os dados</p>
                <p className="text-xs text-muted-foreground">Tente novamente ou confira o console para detalhes técnicos.</p>
              </div>
              <Button variant="outline" onClick={() => refetch()}>
                Recarregar dados
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label} className="border-border/80 bg-card shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{m.label}</p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-24" />
                  ) : (
                    <p className="text-2xl font-display font-bold leading-tight">{m.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{m.support}</p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <m.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2 border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Evento em foco</CardTitle>
            <CardDescription>Resumo do evento principal que merece sua atenção agora.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : focusEvent ? (
              <>
                <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 space-y-1">
                      <p className="font-semibold text-foreground truncate">{focusEvent.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {focusEvent.start_date
                          ? new Date(focusEvent.start_date).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                            timeZone: "America/Sao_Paulo",
                          })
                          : "Data não definida"}
                      </p>
                      <Badge variant="outline" className="w-fit">{statusLabel}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm md:min-w-[260px]">
                      <div>
                        <p className="text-xs text-muted-foreground">Faturamento</p>
                        <p className="font-semibold text-foreground">{formatBRL(focusEvent.revenue || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Ingressos vendidos</p>
                        <p className="font-semibold text-foreground">{(focusEvent.ticketsSold || 0).toLocaleString("pt-BR")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Dias para o evento</p>
                        <p className="font-semibold text-foreground">
                          {typeof focusEvent.daysUntilEvent === "number" ? focusEvent.daysUntilEvent : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pedidos pagos (7 dias)</p>
                        <p className="font-semibold text-foreground">{focusEvent.paidOrdersLast7DaysCount || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Capacidade usada</p>
                        <p className="font-semibold text-foreground">
                          {focusEvent.capacityTotal > 0
                            ? `${Math.round((focusEvent.capacitySold / focusEvent.capacityTotal) * 100)}%`
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <Link to={`/producer/events/${focusEvent.id}/edit`} className="gap-2">
                      <Edit className="h-4 w-4" /> Editar evento
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link to={`/producer/events/${focusEvent.id}/panel`} className="gap-2">
                      Abrir painel completo <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <p className="font-medium text-foreground">Nenhum evento para acompanhar agora</p>
                <p className="mt-1 text-sm text-muted-foreground">Crie um evento para começar a ver indicadores práticos.</p>
                <Button asChild className="mt-4">
                  <Link to="/producer/events/new" className="gap-2">
                    <Plus className="h-4 w-4" /> Criar evento
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Alertas práticos</CardTitle>
            <CardDescription>Problema e ação recomendada, sem rodeios.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.practicalAlerts?.map((alert: any) => (
                  <div
                    key={alert.id}
                    className="rounded-xl border border-border/80 p-3.5 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => navigate(alert.ctaTo)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(alert.ctaTo);
                      }
                    }}
                    aria-label={`${alert.title}: ${alert.ctaLabel}`}
                  >
                    <div className="min-w-0 space-y-2">
                      <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${alertStyles[alert.severity] || alertStyles.info}`}>
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {alert.severity === "critical" ? "Ação imediata" : alert.severity === "warning" ? "Prioridade alta" : "Acompanhar"}
                      </div>
                      <p className="font-semibold text-foreground">{alert.title}</p>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link
                          to={alert.ctaTo}
                          className="gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {alert.ctaLabel} <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
                {topAlert ? (
                  <Button asChild className="w-full">
                    <Link to={topAlert.ctaTo} className="gap-2">
                      Resolver prioridade principal <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2 border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Próximos eventos</CardTitle>
            <CardDescription>Contexto rápido para o que vem depois do evento principal.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : stats?.otherUpcomingEvents?.length ? (
              <div className="space-y-2.5">
                {stats.otherUpcomingEvents.map((event: any) => (
                  <div key={event.id} className="rounded-xl border border-border/80 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.start_date).toLocaleDateString("pt-BR", {
                            weekday: "short",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            timeZone: "America/Sao_Paulo",
                          })}
                        </p>
                      </div>
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/producer/events/${event.id}/panel`} className="gap-1.5">
                          Abrir <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <p className="font-medium text-foreground">Nenhum outro evento na fila</p>
                <p className="mt-1 text-sm text-muted-foreground">Quando houver novos eventos, eles aparecem aqui.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Resumo financeiro</CardTitle>
            <CardDescription>Visão consolidada da sua operação atual.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pedidos pagos</p>
                {isLoading ? <Skeleton className="h-7 w-20 mt-2" /> : (
                  <p className="mt-2 text-lg font-display font-semibold">
                    {(stats?.confirmedOrders || 0).toLocaleString("pt-BR")}
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Eventos cadastrados</p>
                {isLoading ? <Skeleton className="h-7 w-16 mt-2" /> : (
                  <p className="mt-2 text-lg font-display font-semibold">
                    {(stats?.totalEvents || 0).toLocaleString("pt-BR")}
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Eventos futuros</p>
                {isLoading ? <Skeleton className="h-7 w-10 mt-2" /> : (
                  <p className="mt-2 text-lg font-display font-semibold">{stats?.upcomingEvents || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
