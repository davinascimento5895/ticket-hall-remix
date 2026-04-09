import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Edit,
  Plus,
  Wallet,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { getProducerDashboardStats } from "@/lib/api-producer";
import { formatBRL } from "@/lib/utils";

const TIME_ZONE = "America/Sao_Paulo";

type ProducerTimelinePoint = {
  label: string;
  revenue: number;
  orders: number;
  ticketsSold: number;
  checkins: number;
};

type ProducerEventSummary = {
  id: string;
  title: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  venue_city: string | null;
  grossRevenue: number;
  netRevenue: number;
  ticketRevenue: number;
  platformRevenue: number;
  gatewayFees: number;
  refundAmount: number;
  pageViews: number;
  ticketsSold: number;
  ticketsCheckedIn: number;
  conversionRate: number;
  checkinRate: number;
  capacityTotal: number;
  capacitySold: number;
  occupancyRate: number;
  remainingCapacity: number;
  daysUntilEvent: number | null;
  paidOrdersCount: number;
  paidOrdersLast7DaysCount: number;
  revenueLast7DaysAmount: number;
  paidOrdersLast30DaysCount: number;
  revenueLast30DaysAmount: number;
  couponOrdersCount: number;
  couponUseRate: number;
  hasPublishedTiers: boolean;
};

type MetricCardProps = {
  label: string;
  value: string;
  support: string;
  loading: boolean;
  sparklineData?: ProducerTimelinePoint[];
  sparklineKey?: keyof ProducerTimelinePoint;
};

function formatPercent(value: number) {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value || 0);
}

function formatShortDate(value: string | null | undefined) {
  if (!value) return "Data não definida";
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    timeZone: TIME_ZONE,
  });
}

function formatLongDate(value: string | null | undefined) {
  if (!value) return "Data não definida";
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
  });
}

function getStatusLabel(status: string | null | undefined) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "published") return "Publicado";
  if (normalized === "active") return "Em andamento";
  if (normalized === "draft") return "Rascunho";
  if (normalized === "ended" || normalized === "completed" || normalized === "finished") return "Encerrado";
  return status || "Sem status";
}

function MiniSparkline({ data, dataKey }: { data: ProducerTimelinePoint[]; dataKey: keyof ProducerTimelinePoint }) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={48}>
      <LineChart data={data}>
        <Line type="monotone" dataKey={dataKey as string} stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function MetricCard({
  label,
  value,
  support,
  loading,
  sparklineData,
  sparklineKey,
}: MetricCardProps) {
  return (
    <Card className="group overflow-hidden border-border/80 shadow-sm">
      <CardContent className="p-4 md:p-5">
        <div className="space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="mt-1 h-8 w-28" />
            ) : (
              <p className="mt-1 text-2xl font-display font-bold leading-tight">{value}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">{support}</p>
          </div>

          {loading ? (
            <Skeleton className="h-12 w-full" />
          ) : sparklineData?.length && sparklineKey ? (
            <MiniSparkline data={sparklineData} dataKey={sparklineKey} />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProducerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ["producer-dashboard", user?.id],
    queryFn: () => getProducerDashboardStats(user!.id),
    enabled: !!user?.id,
    staleTime: 3 * 60_000,  //3 min — dashboard agregado não muda frequentemente
    gcTime: 10 * 60_000,  // 10 min — cache persistido
  });

  const dashboard = stats as any;
  const timelineByDay = (dashboard?.timelineByDay || []) as ProducerTimelinePoint[];
  const topEvents = (dashboard?.topEvents || []) as ProducerEventSummary[];
  const upcomingEvents = (dashboard?.otherUpcomingEvents || []) as ProducerEventSummary[];
  const focusEvent = (dashboard?.focusEvent || null) as ProducerEventSummary | null;
  const hasTimelineActivity = timelineByDay.some((point) =>
    Number(point.revenue || 0) > 0
    || Number(point.orders || 0) > 0
    || Number(point.ticketsSold || 0) > 0
    || Number(point.checkins || 0) > 0,
  );

  const grossRevenue = Number(dashboard?.grossRevenue || dashboard?.totalRevenue || 0);
  const netRevenue = Number(dashboard?.netRevenue || 0);
  const platformRevenue = Number(dashboard?.platformRevenue || 0);
  const gatewayFees = Number(dashboard?.gatewayFees || 0);
  const refundAmount = Number(dashboard?.refundAmount || 0);
  const ticketsSold = Number(dashboard?.ticketsSold || 0);
  const ticketsCheckedIn = Number(dashboard?.ticketsCheckedIn || 0);
  const pageViews = Number(dashboard?.pageViews || 0);
  const conversionRate = Number(dashboard?.conversionRate || 0);
  const checkinRate = Number(dashboard?.checkinRate || 0);
  const portfolioOccupancyRate = Number(dashboard?.portfolioOccupancyRate || 0);
  const confirmedOrders = Number(dashboard?.confirmedOrders || 0);
  const averageOrderValue = Number(dashboard?.averageOrderValue || 0);
  const viewsPerTicket = Number(dashboard?.viewsPerTicket || 0);
  const activeEvents = Number(dashboard?.activeEvents || 0);
  const upcomingEventsCount = Number(dashboard?.upcomingEvents || 0);
  const draftEvents = Number(dashboard?.draftEvents || 0);
  const soldOutEvents = Number(dashboard?.soldOutEvents || 0);
  const nearSoldOutEvents = Number(dashboard?.nearSoldOutEvents || 0);
  const ordersLast30DaysCount = Number(dashboard?.ordersLast30DaysCount || 0);
  const revenueLast30DaysAmount = Number(dashboard?.revenueLast30DaysAmount || 0);
  const ticketsSoldLast30DaysCount = Number(dashboard?.ticketsSoldLast30DaysCount || 0);
  const checkinsLast30DaysCount = Number(dashboard?.checkinsLast30DaysCount || 0);
  const revenueLast7DaysAmount = Number(dashboard?.revenueLast7DaysAmount || 0);

  const statusLabel = getStatusLabel(focusEvent?.status);
  const topAlert = dashboard?.practicalAlerts?.[0];

  const metrics = useMemo(
    () => [
      {
        label: "Receita líquida",
        value: formatBRL(netRevenue),
        support: `${formatBRL(gatewayFees)} de gateway · ${formatBRL(refundAmount)} em estornos`,
        sparklineData: timelineByDay,
        sparklineKey: "revenue" as const,
      },
      {
        label: "GMV bruto",
        value: formatBRL(grossRevenue),
        support: `${formatBRL(revenueLast30DaysAmount)} nos últimos 30 dias`,
        sparklineData: timelineByDay,
        sparklineKey: "revenue" as const,
      },
      {
        label: "Ingressos vendidos",
        value: ticketsSold.toLocaleString("pt-BR"),
        support: `${ticketsSoldLast30DaysCount.toLocaleString("pt-BR")} nos últimos 30 dias`,
        sparklineData: timelineByDay,
        sparklineKey: "ticketsSold" as const,
      },
      {
        label: "Pedidos pagos",
        value: confirmedOrders.toLocaleString("pt-BR"),
        support: `Ticket médio: ${formatBRL(averageOrderValue)}`,
        sparklineData: timelineByDay,
        sparklineKey: "orders" as const,
      },
      {
        label: "Visualizações",
        value: pageViews.toLocaleString("pt-BR"),
        support: `${formatCompact(viewsPerTicket)} views por ingresso`,
      },
      {
        label: "Conversão",
        value: formatPercent(conversionRate),
        support: pageViews > 0 ? `1 ingresso a cada ${formatCompact(pageViews / Math.max(ticketsSold, 1))} views` : "Sem visualizações registradas",
      },
      {
        label: "Check-ins",
        value: ticketsCheckedIn.toLocaleString("pt-BR"),
        support: `Comparecimento: ${formatPercent(checkinRate)}`,
        sparklineData: timelineByDay,
        sparklineKey: "checkins" as const,
      },
      {
        label: "Ocupação do portfólio",
        value: formatPercent(portfolioOccupancyRate),
        support: `${soldOutEvents} esgotados · ${nearSoldOutEvents} quase esgotados`,
      },
    ],
    [
      averageOrderValue,
      checkinRate,
      conversionRate,
      gatewayFees,
      grossRevenue,
      nearSoldOutEvents,
      netRevenue,
      pageViews,
      portfolioOccupancyRate,
      refundAmount,
      revenueLast30DaysAmount,
      soldOutEvents,
      ticketsCheckedIn,
      ticketsSold,
      ticketsSoldLast30DaysCount,
      timelineByDay,
      viewsPerTicket,
    ],
  );

  const alertStyles: Record<string, string> = {
    critical: "border-destructive/30 bg-destructive/10 text-destructive",
    warning: "border-warning/30 bg-warning/10 text-warning",
    info: "border-info/30 bg-info/10 text-info",
  };

  const focusCountdown = (() => {
    if (!focusEvent && focusEvent !== null) return null;
    if (focusEvent?.daysUntilEvent === null || focusEvent?.daysUntilEvent === undefined) return null;
    if (focusEvent.daysUntilEvent < 0) return "Evento em andamento ou encerrado";
    if (focusEvent.daysUntilEvent === 0) return "Evento hoje";
    if (focusEvent.daysUntilEvent === 1) return "1 dia para o evento";
    return `${focusEvent.daysUntilEvent} dias para o evento`;
  })();

  return (
    <div className="space-y-6 lg:space-y-7">
      <Card className="border-border/80 bg-gradient-to-br from-card to-muted/40 shadow-sm">
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Painel do produtor</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Hoje: {activeEvents} eventos ativos, {upcomingEventsCount} futuros, {draftEvents} rascunhos e {formatBRL(revenueLast30DaysAmount)} em receita líquida nos últimos 30 dias.
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

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="border-border/70 bg-background/70 text-muted-foreground">Ativos: {activeEvents}</Badge>
            <Badge className="border-border/70 bg-background/70 text-muted-foreground">Futuros: {upcomingEventsCount}</Badge>
            <Badge className="border-border/70 bg-background/70 text-muted-foreground">Rascunhos: {draftEvents}</Badge>
            <Badge className="border-border/70 bg-background/70 text-muted-foreground">Receita 7 dias: {formatBRL(revenueLast7DaysAmount)}</Badge>
            <Badge className="border-border/70 bg-background/70 text-muted-foreground">Check-ins: {formatPercent(checkinRate)}</Badge>
            <Badge className="border-border/70 bg-background/70 text-muted-foreground">Conversão: {formatPercent(conversionRate)}</Badge>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            support={metric.support}
            loading={isLoading}
            sparklineData={metric.sparklineData}
            sparklineKey={metric.sparklineKey}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2 border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Evento em foco</CardTitle>
            <CardDescription>O evento que mais merece atenção agora, com leitura financeira e operacional.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : focusEvent ? (
              <>
                <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 md:p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{statusLabel}</Badge>
                        <Badge variant="secondary">{focusCountdown || "Data não definida"}</Badge>
                      </div>
                      <h3 className="truncate text-lg font-semibold text-foreground">{focusEvent.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatLongDate(focusEvent.start_date)}
                        {focusEvent.venue_city ? ` · ${focusEvent.venue_city}` : ""}
                      </p>
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
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-border/80 bg-card p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Financeiro</p>
                      <p className="mt-2 text-lg font-display font-semibold text-foreground">{formatBRL(focusEvent.netRevenue)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBRL(focusEvent.grossRevenue)} bruto · {formatBRL(focusEvent.platformRevenue)} taxa da plataforma
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/80 bg-card p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Demanda</p>
                      <p className="mt-2 text-lg font-display font-semibold text-foreground">
                        {focusEvent.ticketsSold.toLocaleString("pt-BR")} ingressos
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPercent(focusEvent.conversionRate)} de conversão · {formatCompact(focusEvent.pageViews)} views
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/80 bg-card p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Operação</p>
                      <p className="mt-2 text-lg font-display font-semibold text-foreground">
                        {formatPercent(focusEvent.checkinRate)} de comparecimento
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {focusEvent.remainingCapacity} lugares livres · {focusEvent.daysUntilEvent !== null ? `${focusEvent.daysUntilEvent} dias` : "sem data"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-border/80 bg-background/80 p-3">
                      <p className="text-xs text-muted-foreground">Pedidos pagos</p>
                      <p className="mt-1 text-lg font-display font-semibold">{focusEvent.paidOrdersCount.toLocaleString("pt-BR")}</p>
                    </div>
                    <div className="rounded-xl border border-border/80 bg-background/80 p-3">
                      <p className="text-xs text-muted-foreground">Vendas 7 dias</p>
                      <p className="mt-1 text-lg font-display font-semibold">{formatBRL(focusEvent.revenueLast7DaysAmount)}</p>
                      <p className="text-xs text-muted-foreground">{focusEvent.paidOrdersLast7DaysCount} pedidos</p>
                    </div>
                    <div className="rounded-xl border border-border/80 bg-background/80 p-3">
                      <p className="text-xs text-muted-foreground">Ocupação</p>
                      <p className="mt-1 text-lg font-display font-semibold">{formatPercent(focusEvent.occupancyRate)}</p>
                      <p className="text-xs text-muted-foreground">
                        {focusEvent.capacitySold}/{focusEvent.capacityTotal || 0} vendidos
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/80 bg-background/80 p-3">
                      <p className="text-xs text-muted-foreground">Ingresso médio</p>
                      <p className="mt-1 text-lg font-display font-semibold">{formatBRL(focusEvent.ticketRevenue / Math.max(focusEvent.ticketsSold, 1))}</p>
                      <p className="text-xs text-muted-foreground">Receita por ingresso</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Taxas e estornos</p>
                      <p className="mt-2 text-lg font-display font-semibold">{formatBRL(focusEvent.platformRevenue + focusEvent.gatewayFees + focusEvent.refundAmount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBRL(focusEvent.platformRevenue)} plataforma · {formatBRL(focusEvent.gatewayFees)} gateway · {formatBRL(focusEvent.refundAmount)} estornos
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ritmo recente</p>
                      <p className="mt-2 text-lg font-display font-semibold">{formatBRL(focusEvent.revenueLast30DaysAmount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {focusEvent.paidOrdersLast30DaysCount} pedidos · {focusEvent.revenueLast30DaysAmount > 0 ? formatPercent((focusEvent.revenueLast7DaysAmount / Math.max(focusEvent.revenueLast30DaysAmount, 1)) * 100) : "0,0%"} da receita dos últimos 30 dias veio nos últimos 7 dias
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Check-ins</p>
                      <p className="mt-2 text-lg font-display font-semibold">{focusEvent.ticketsCheckedIn.toLocaleString("pt-BR")}</p>
                      <p className="text-xs text-muted-foreground">{formatPercent(focusEvent.checkinRate)} de comparecimento</p>
                    </div>
                  </div>
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
                {dashboard?.practicalAlerts?.map((alert: any) => (
                  <div
                    key={alert.id}
                    className="cursor-pointer rounded-xl border border-border/80 p-3.5 transition-colors hover:bg-muted/30"
                    onClick={() => navigate(alert.ctaTo)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
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
                        <Link to={alert.ctaTo} className="gap-2" onClick={(event) => event.stopPropagation()}>
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
            <CardTitle className="text-base font-semibold">Ritmo comercial</CardTitle>
            <CardDescription>Receita e volume de vendas nos últimos 30 dias, com dados reais da operação.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Receita 30 dias</p>
                    <p className="mt-2 text-lg font-display font-semibold">{formatBRL(revenueLast30DaysAmount)}</p>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pedidos 30 dias</p>
                    <p className="mt-2 text-lg font-display font-semibold">{ordersLast30DaysCount.toLocaleString("pt-BR")}</p>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ingressos 30 dias</p>
                    <p className="mt-2 text-lg font-display font-semibold">{ticketsSoldLast30DaysCount.toLocaleString("pt-BR")}</p>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Check-ins 30 dias</p>
                    <p className="mt-2 text-lg font-display font-semibold">{checkinsLast30DaysCount.toLocaleString("pt-BR")}</p>
                  </div>
                </div>

                <div className="relative h-72 rounded-2xl border border-border/80 bg-muted/20 p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineByDay} margin={{ top: 12, right: 24, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis yAxisId="revenue" width={72} domain={[0, "dataMax + 1"]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => formatCompact(Number(value))} />
                      <YAxis yAxisId="count" orientation="right" width={52} domain={[0, "dataMax + 1"]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => formatCompact(Number(value))} />
                      <Legend verticalAlign="top" height={28} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, borderColor: "hsl(var(--border))" }}
                        formatter={(value: number, name: string) => {
                          if (name === "Receita") return [formatBRL(value), name];
                          if (name === "Pedidos") return [value.toLocaleString("pt-BR"), name];
                          if (name === "Ingressos") return [value.toLocaleString("pt-BR"), name];
                          if (name === "Check-ins") return [value.toLocaleString("pt-BR"), name];
                          return [value, name];
                        }}
                      />
                      <Line yAxisId="revenue" type="monotone" dataKey="revenue" name="Receita" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
                      <Line yAxisId="count" type="monotone" dataKey="orders" name="Pedidos" stroke="hsl(var(--accent))" strokeWidth={2.2} dot={false} />
                      <Line yAxisId="count" type="monotone" dataKey="ticketsSold" name="Ingressos" stroke="hsl(var(--success))" strokeWidth={2.2} dot={false} />
                      <Line yAxisId="count" type="monotone" dataKey="checkins" name="Check-ins" stroke="hsl(var(--info))" strokeWidth={2.2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>

                  {!hasTimelineActivity ? (
                    <div className="absolute inset-3 flex items-center justify-center rounded-2xl border border-dashed border-border/80 bg-background/75 p-6 text-center backdrop-blur-sm">
                      <div className="max-w-sm space-y-2">
                        <p className="font-semibold text-foreground">Sem movimentação registrada nos últimos 30 dias</p>
                        <p className="text-sm text-muted-foreground">A série veio zerada do banco, então o gráfico está funcionando, mas não há variação para mostrar.</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Próximos eventos</CardTitle>
            <CardDescription>Contexto rápido para o que vem depois do evento principal.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            ) : upcomingEvents.length ? (
              <div className="space-y-2.5">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="rounded-xl border border-border/80 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatShortDate(event.start_date)}
                          {event.venue_city ? ` · ${event.venue_city}` : ""}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{event.daysUntilEvent !== null ? `${event.daysUntilEvent} dias` : "Sem data"}</p>
                        <p>{formatPercent(event.occupancyRate)} de ocupação</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Receita</p>
                        <p className="font-semibold text-foreground">{formatBRL(event.netRevenue)}</p>
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
                <p className="mt-1 text-sm text-muted-foreground">Quando houver novos eventos, eles aparecerão aqui.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Top eventos do portfólio</CardTitle>
          <CardDescription>Comparativo dos eventos com melhor desempenho financeiro e operacional.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : topEvents.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-3 font-medium">Evento</th>
                    <th className="p-3 font-medium">Receita líquida</th>
                    <th className="p-3 font-medium">Ingressos e ocupação</th>
                    <th className="p-3 font-medium">Conversão e check-in</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {topEvents.map((event) => (
                    <tr key={event.id} className="border-b border-border/50 last:border-b-0">
                      <td className="p-3">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatShortDate(event.start_date)}{event.venue_city ? ` · ${event.venue_city}` : ""}
                          </p>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-foreground">{formatBRL(event.netRevenue)}</p>
                        <p className="text-xs text-muted-foreground">{formatBRL(event.grossRevenue)} bruto</p>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        <p>{event.ticketsSold.toLocaleString("pt-BR")} ingressos</p>
                        <p className="text-xs">{formatPercent(event.occupancyRate)} de ocupação</p>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        <p>{formatPercent(event.conversionRate)} de conversão</p>
                        <p className="text-xs">{formatPercent(event.checkinRate)} de check-in</p>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">{getStatusLabel(event.status)}</Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/producer/events/${event.id}/panel`} className="gap-1.5">
                            Abrir <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="font-medium text-foreground">Nenhum evento para classificar</p>
              <p className="mt-1 text-sm text-muted-foreground">Assim que houver dados, o ranking aparecerá aqui.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}