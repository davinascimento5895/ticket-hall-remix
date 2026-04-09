import { useState, useMemo, useCallback } from "react";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CalendarIcon,
  CheckCircle2,
  ChevronDown,
  Clock3,
  DollarSign,
  Download,
  Eye,
  LineChart as LineChartIcon,
  ShoppingCart,
  Ticket,
  TrendingUp,
  Users,
  Activity,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getAdminDashboardStats, getAllEvents } from "@/lib/api-admin";
import { exportToCSV } from "@/lib/csv-export";
import { getOrderStatusLabel } from "@/components/OrderStatusBadge";
import { EventImage } from "@/components/EventImage";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, CartesianGrid, ComposedChart, Legend } from "recharts";
import { format, subDays, startOfMonth, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, formatBRL } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EventPicker } from "@/components/admin/EventPicker";
import { Badge } from "@/components/ui/badge";
import { getEventStatusLabel } from "@/components/EventStatusBadge";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(142 71% 45%)", "hsl(38 92% 50%)"];
const TIME_ZONE = "America/Sao_Paulo";
type ChartGranularity = "month" | "day";
type PaymentSort = "total" | "count";
type TopEventSort = "revenue" | "tickets" | "conversion" | "views";

type TimelinePoint = {
  label: string;
  revenue: number;
  orders: number;
  ticketsSold: number;
  newEvents: number;
  newUsers: number;
  activeUsers: number;
  checkins: number;
};

const presets = [
  { label: "Últimos 7 dias", days: 7 },
  { label: "Últimos 30 dias", days: 30 },
  { label: "Últimos 90 dias", days: 90 },
  { label: "Este mês", getRange: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: "Este ano", getRange: () => ({ from: startOfYear(new Date()), to: new Date() }) },
  { label: "Todo o período", days: 0 },
];

const methodLabels: Record<string, string> = {
  pix: "PIX",
  credit_card: "Cartão",
  debit_card: "Débito",
  boleto: "Boleto",
  free: "Gratuito",
  outro: "Outro",
};

function sortEntriesByCount(entries: Array<[string, number]>) {
  return [...entries].sort((a, b) => b[1] - a[1]);
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value || 0);
}

function formatPercent(value: number) {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function getSeriesDelta(series: TimelinePoint[] | undefined, key: keyof TimelinePoint) {
  if (!series || series.length < 2) return null;
  const first = Number(series[0]?.[key] || 0);
  const last = Number(series[series.length - 1]?.[key] || 0);
  if (first === 0 && last === 0) return null;
  if (first === 0) return last > 0 ? `+${formatCompact(last)} no período` : null;
  const delta = ((last - first) / first) * 100;
  return `${delta >= 0 ? "+" : ""}${formatPercent(delta)}`;
}

const MiniSparkline = React.memo(function MiniSparkline({ data, dataKey, stroke }: { data: TimelinePoint[]; dataKey: keyof TimelinePoint; stroke: string }) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={48}>
      <LineChart data={data}>
        <Line type="monotone" dataKey={dataKey as string} stroke={stroke} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
});

export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [activePreset, setActivePreset] = useState("Todo o período");
  const [granularity, setGranularity] = useState<ChartGranularity>("month");
  const [paymentSort, setPaymentSort] = useState<PaymentSort>("total");
  const [topEventSort, setTopEventSort] = useState<TopEventSort>("revenue");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const queryDateRange = useMemo(() => {
    const hasRange = Boolean(dateRange.from || dateRange.to || selectedEventId);
    if (!hasRange) return undefined;

    return {
      from: dateRange.from ? dateRange.from.toISOString() : undefined,
      to: dateRange.to ? dateRange.to.toISOString() : undefined,
      eventId: selectedEventId || undefined,
    };
  }, [dateRange, selectedEventId]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-dashboard", queryDateRange],
    queryFn: () => getAdminDashboardStats(queryDateRange),
    staleTime: 5 * 60_000,  // 5 min — dados agregados não mudam a cada minuto
    gcTime: 15 * 60_000,  // 15 min — cache persistido
  });

  const { data: events = [] } = useQuery({
    queryKey: ["admin-dashboard-events"],
    queryFn: () => getAllEvents({ status: "all" }),
    staleTime: 5 * 60_000,
  });

  const selectedEvent = events.find((event: any) => event.id === selectedEventId);

  const handlePreset = useCallback((preset: typeof presets[number]) => {
    setActivePreset(preset.label);
    if (preset.days === 0) {
      setDateRange({ from: undefined, to: undefined });
    } else if (preset.getRange) {
      const range = preset.getRange();
      setDateRange({ from: range.from, to: range.to });
    } else {
      setDateRange({ from: subDays(new Date(), preset.days), to: new Date() });
    }
  }, []);

  const timelineData = useMemo(
    () => (granularity === "month" ? stats?.timelineByMonth : stats?.timelineByDay) as TimelinePoint[] | undefined,
    [stats?.timelineByMonth, stats?.timelineByDay, granularity]
  );

  const calculatedMetrics = useMemo(() => {
    const revenueTrend = getSeriesDelta(timelineData, "revenue");
    const ordersTrend = getSeriesDelta(timelineData, "orders");
    const ticketsTrend = getSeriesDelta(timelineData, "ticketsSold");
    const eventsTrend = getSeriesDelta(timelineData, "newEvents");
    const usersTrend = getSeriesDelta(timelineData, "newUsers");
    const activeUsersTrend = getSeriesDelta(timelineData, "activeUsers");

    const paidOrders = Number(stats?.ordersByStatus?.paid || 0);
    const paymentSuccessRate = stats && stats.totalOrders > 0 ? Math.round((paidOrders / stats.totalOrders) * 100) : 0;
    
    const totalCheckedIn = Number(stats?.totalCheckedIn || 0);
    const totalPageViews = Number(stats?.totalPageViews || 0);
    const checkinRate = stats && stats.ticketsSold > 0 ? Math.round((totalCheckedIn / stats.ticketsSold) * 100) : 0;
    const conversionRate = stats && totalPageViews > 0 ? Math.round((stats.ticketsSold / totalPageViews) * 100) : 0;
    const revenuePerEvent = stats && stats.totalEvents > 0 ? stats.totalGMV / stats.totalEvents : 0;
    const publishedEventCount = Number(stats?.publishedEvents || 0);
    const draftEventCount = Number(stats?.draftEvents || 0);
    const endedEventCount = Number(stats?.endedEvents || 0);
    const featuredEventCount = Array.isArray(stats?.topEvents) ? stats.topEvents.filter((event: any) => event.featured).length : 0;

    return {
      revenueTrend,
      ordersTrend,
      ticketsTrend,
      eventsTrend,
      usersTrend,
      activeUsersTrend,
      paidOrders,
      paymentSuccessRate,
      totalCheckedIn,
      totalPageViews,
      checkinRate,
      conversionRate,
      revenuePerEvent,
      publishedEventCount,
      draftEventCount,
      endedEventCount,
      featuredEventCount,
    };
  }, [stats, timelineData]);

  const {
    revenueTrend,
    ordersTrend,
    ticketsTrend,
    eventsTrend,
    usersTrend,
    activeUsersTrend,
    paidOrders,
    paymentSuccessRate,
    totalCheckedIn,
    totalPageViews,
    checkinRate,
    conversionRate,
    revenuePerEvent,
    publishedEventCount,
    draftEventCount,
    endedEventCount,
    featuredEventCount,
  } = calculatedMetrics;

  const topPaymentMethodEntry = useMemo(() => {
    if (!stats?.paymentMethodMap) return undefined;
    return Object.entries(stats.paymentMethodMap).sort((a, b) => b[1].total - a[1].total)[0];
  }, [stats?.paymentMethodMap]);

  const topPaymentMethod = useMemo(
    () =>
      topPaymentMethodEntry
        ? {
            name: methodLabels[topPaymentMethodEntry[0]] || topPaymentMethodEntry[0],
            count: topPaymentMethodEntry[1].count,
            total: topPaymentMethodEntry[1].total,
          }
        : undefined,
    [topPaymentMethodEntry]
  );

  const topPaymentShare = useMemo(
    () =>
      stats && stats.totalGMV > 0 && topPaymentMethod ? Math.round((topPaymentMethod.total / stats.totalGMV) * 100) : 0,
    [stats, topPaymentMethod]
  );

  const revenueChartData = useMemo(() => timelineData || [], [timelineData]);
  const growthChartData = useMemo(() => timelineData || [], [timelineData]);

  const metrics = [
    {
      label: "GMV no período",
      value: stats ? formatBRL(stats.totalGMV) : "—",
      icon: DollarSign,
      accent: "bg-primary/10 text-primary",
      subtitle: revenueTrend ? `${revenueTrend} vs início do recorte` : "Sem variação no recorte",
      sparklineData: revenueChartData,
      sparklineKey: "revenue" as const,
    },
    {
      label: "Receita da plataforma",
      value: stats ? formatBRL(stats.platformRevenue) : "—",
      icon: TrendingUp,
      accent: "bg-accent/10 text-accent",
      subtitle: stats ? `${paymentSuccessRate}% dos pedidos filtrados pagos` : "—",
      sparklineData: revenueChartData,
      sparklineKey: "revenue" as const,
    },
    {
      label: "Pedidos",
      value: stats?.totalOrders?.toLocaleString("pt-BR") || "0",
      icon: ShoppingCart,
      accent: "bg-primary/10 text-primary",
      subtitle: ordersTrend ? `${ordersTrend} vs início do recorte` : "Pedidos totais no recorte",
      sparklineData: growthChartData,
      sparklineKey: "orders" as const,
    },
    {
      label: "Ingressos vendidos",
      value: stats?.ticketsSold?.toLocaleString("pt-BR") || "0",
      icon: Ticket,
      accent: "bg-accent/10 text-accent",
      subtitle: `${checkinRate}% com check-in`,
      sparklineData: growthChartData,
      sparklineKey: "ticketsSold" as const,
    },
    {
      label: "Eventos criados",
      value: stats?.newEvents?.toLocaleString("pt-BR") || "0",
      icon: CalendarDays,
      accent: "bg-primary/10 text-primary",
      subtitle: eventsTrend ? `${eventsTrend} vs início do recorte` : "Novos eventos no período",
      sparklineData: growthChartData,
      sparklineKey: "newEvents" as const,
    },
    {
      label: "Usuários cadastrados",
      value: stats?.newUsers?.toLocaleString("pt-BR") || "0",
      icon: Users,
      accent: "bg-accent/10 text-accent",
      subtitle: usersTrend ? `${usersTrend} vs início do recorte` : "Novos cadastros no período",
      sparklineData: growthChartData,
      sparklineKey: "newUsers" as const,
    },
    {
      label: "Usuários ativos",
      value: stats?.activeUsers?.toLocaleString("pt-BR") || "0",
      icon: Activity,
      accent: "bg-primary/10 text-primary",
      subtitle: activeUsersTrend ? `${activeUsersTrend} vs início do recorte` : "Com ação registrada",
      sparklineData: growthChartData,
      sparklineKey: "activeUsers" as const,
    },
    {
      label: "Visualizações acumuladas",
      value: totalPageViews.toLocaleString("pt-BR"),
      icon: Eye,
      accent: "bg-accent/10 text-accent",
      subtitle: "Snapshot atual do portfólio",
      sparklineData: undefined,
      sparklineKey: undefined,
    },
  ];

  const paymentEntries = useMemo(() => {
    if (!stats?.paymentMethodMap) return [];
    const entries = Object.entries(stats.paymentMethodMap);
    return sortEntriesByCount(
      paymentSort === "count"
        ? entries.map(([method, data]) => [method, data.count] as [string, number])
        : entries.map(([method, data]) => [method, data.total] as [string, number]),
    ).map(([method, value]) => {
      const original = stats.paymentMethodMap[method];
      return {
        name: methodLabels[method] || method,
        value,
        count: original.count,
        total: original.total,
      };
    });
  }, [stats?.paymentMethodMap, paymentSort]);

  const eventContextLabel = selectedEvent ? selectedEvent.title : "Todos os eventos";

  const statusEntries = useMemo(() => {
    if (!stats?.eventsByStatus) return [];
    return sortEntriesByCount(Object.entries(stats.eventsByStatus).map(([k, v]) => [k, Number(v)]));
  }, [stats?.eventsByStatus]);

  const orderEntries = useMemo(() => {
    if (!stats?.ordersByStatus) return [];
    return sortEntriesByCount(Object.entries(stats.ordersByStatus).map(([k, v]) => [k, Number(v)]));
  }, [stats?.ordersByStatus]);

  const topEvents = useMemo(() => {
    if (!stats?.topEvents) return [];
    const items = [...stats.topEvents];
    return items.sort((a: any, b: any) => {
      if (topEventSort === "tickets") return (b.tickets_sold || 0) - (a.tickets_sold || 0);
      if (topEventSort === "conversion") return (b.conversion_rate || 0) - (a.conversion_rate || 0);
      if (topEventSort === "views") return (b.page_views || 0) - (a.page_views || 0);
      return (b.total_revenue || 0) - (a.total_revenue || 0);
    });
  }, [stats?.topEvents, topEventSort]);

  const recentActivity = stats?.recentActivity || [];

  const alerts = useMemo(() => {
    const items: Array<{ title: string; detail: string; tone: "warning" | "primary" | "muted" }> = [];

    if (draftEventCount > 0) {
      items.push({
        title: `${draftEventCount} evento(s) em rascunho`,
        detail: "Revise os cadastros pendentes antes de publicar ou destacar.",
        tone: "warning",
      });
    }

    if (stats?.totalPageViews && conversionRate < 2) {
      items.push({
        title: "Conversão abaixo da meta",
        detail: `${conversionRate}% de visualizações viraram ingressos no recorte atual.`,
        tone: "warning",
      });
    }

    if (stats?.ticketsSold && checkinRate < 65) {
      items.push({
        title: "Taxa de check-in sensível",
        detail: `${checkinRate}% dos ingressos vendidos foram validados.`,
        tone: "primary",
      });
    }

    if (topPaymentMethod && topPaymentShare > 70) {
      items.push({
        title: "Concentração de pagamentos",
        detail: `${topPaymentMethod.name} representa ${topPaymentShare}% do volume financeiro.`,
        tone: "muted",
      });
    }

    if (publishedEventCount === 0 && stats?.totalEvents > 0) {
      items.push({
        title: "Nenhum evento publicado",
        detail: "A base está ativa, mas não há eventos publicados no recorte atual.",
        tone: "warning",
      });
    }

    if (featuredEventCount === 0 && stats?.totalEvents > 0) {
      items.push({
        title: "Sem eventos em destaque",
        detail: "Talvez valha selecionar eventos com melhor desempenho para vitrine.",
        tone: "muted",
      });
    }

    return items.slice(0, 4);
  }, [conversionRate, draftEventCount, featuredEventCount, publishedEventCount, stats?.ticketsSold, stats?.totalEvents, stats?.totalPageViews, checkinRate, topPaymentMethod, topPaymentShare]);

  const buildFileSlug = () => {
    const base = selectedEvent?.slug || activePreset || "dashboard";
    return base
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const exportSummary = () => {
    if (!stats) return;
    const rows = [
      { metric: "GMV no período", value: formatBRL(stats.totalGMV) },
      { metric: "Receita da plataforma", value: formatBRL(stats.platformRevenue) },
      { metric: "Pedidos", value: stats.totalOrders.toLocaleString("pt-BR") },
      { metric: "Ingressos vendidos", value: stats.ticketsSold.toLocaleString("pt-BR") },
      { metric: "Eventos criados", value: stats.newEvents.toLocaleString("pt-BR") },
      { metric: "Usuários cadastrados", value: stats.newUsers.toLocaleString("pt-BR") },
      { metric: "Usuários ativos", value: stats.activeUsers.toLocaleString("pt-BR") },
      { metric: "Visualizações acumuladas", value: totalPageViews.toLocaleString("pt-BR") },
      { metric: "Taxa de conversão", value: `${conversionRate}%` },
      { metric: "Taxa de check-in", value: `${checkinRate}%` },
    ];
    exportToCSV(rows, [
      { key: "metric", header: "Métrica" },
      { key: "value", header: "Valor" },
    ], `dashboard-resumo-${buildFileSlug()}`);
  };

  const exportTimeline = () => {
    if (!timelineData?.length) return;
    exportToCSV(timelineData, [
      { key: "label", header: "Período" },
      { key: "revenue", header: "GMV", format: (v: number) => formatBRL(v) },
      { key: "orders", header: "Pedidos", format: (v: number) => v.toLocaleString("pt-BR") },
      { key: "ticketsSold", header: "Ingressos vendidos", format: (v: number) => v.toLocaleString("pt-BR") },
      { key: "newEvents", header: "Eventos criados", format: (v: number) => v.toLocaleString("pt-BR") },
      { key: "newUsers", header: "Usuários cadastrados", format: (v: number) => v.toLocaleString("pt-BR") },
      { key: "activeUsers", header: "Usuários ativos", format: (v: number) => v.toLocaleString("pt-BR") },
      { key: "checkins", header: "Check-ins", format: (v: number) => v.toLocaleString("pt-BR") },
    ], `dashboard-linha-do-tempo-${buildFileSlug()}`);
  };

  const exportTopEvents = () => {
    if (!topEvents.length) return;
    exportToCSV(topEvents, [
      { key: "title", header: "Evento" },
      { key: "status", header: "Status", format: (v: string) => getEventStatusLabel(v) },
      { key: "venue_city", header: "Cidade" },
      { key: "total_revenue", header: "Receita", format: (v: number) => formatBRL(v) },
      { key: "tickets_sold", header: "Ingressos", format: (v: number) => v.toLocaleString("pt-BR") },
      { key: "conversion_rate", header: "Conversão", format: (v: number) => `${v.toFixed(1).replace(".", ",")}%` },
      { key: "occupancy_rate", header: "Ocupação", format: (v: number) => `${v.toFixed(1).replace(".", ",")}%` },
      { key: "page_views", header: "Views", format: (v: number) => v.toLocaleString("pt-BR") },
    ], `dashboard-eventos-top-${buildFileSlug()}`);
  };

  const exportPayments = () => {
    if (!paymentEntries.length) return;
    exportToCSV(paymentEntries, [
      { key: "name", header: "Método" },
      { key: "count", header: "Quantidade", format: (v: number) => v.toLocaleString("pt-BR") },
      { key: "total", header: "Valor", format: (v: number) => formatBRL(v) },
    ], `dashboard-pagamentos-${buildFileSlug()}`);
  };

  const exportActivity = () => {
    if (!recentActivity.length) return;
    exportToCSV(recentActivity, [
      { key: "createdAt", header: "Data", format: (v: string) => new Date(v).toLocaleString("pt-BR", { timeZone: TIME_ZONE }) },
      { key: "kind", header: "Tipo" },
      { key: "title", header: "Título" },
      { key: "detail", header: "Detalhe" },
    ], `dashboard-atividade-${buildFileSlug()}`);
  };

  const chartData = revenueChartData;
  const chartDataKey = "label";
  const closedEventCount = endedEventCount;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Central de operação"
        title="Dashboard"
        description="Use o filtro de evento e o intervalo para recortar receitas, pedidos, ingressos e gráficos. O painel deixa de ser um resumo genérico e vira uma leitura real da operação."
      >
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-4 w-4" />
                Exportar
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Exportar dados</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportSummary}>Resumo do período</DropdownMenuItem>
              <DropdownMenuItem onClick={exportTimeline}>Linha do tempo</DropdownMenuItem>
              <DropdownMenuItem onClick={exportTopEvents}>Top eventos</DropdownMenuItem>
              <DropdownMenuItem onClick={exportPayments}>Pagamentos</DropdownMenuItem>
              <DropdownMenuItem onClick={exportActivity}>Atividade recente</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Badge className="border-border/70 bg-background/70 text-muted-foreground">Contexto: {eventContextLabel}</Badge>
          <Badge className="border-border/70 bg-background/70 text-muted-foreground">
            Período: {activePreset || "Personalizado"}
          </Badge>
        </div>
      </AdminPageHeader>

      <Card className="border-border/80 shadow-sm">
        <CardContent className="space-y-4 p-4 md:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handlePreset(p)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    activePreset === p.label
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  {p.label}
                </button>
              ))}

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {dateRange.from
                      ? `${format(dateRange.from, "dd/MM/yy")} — ${dateRange.to ? format(dateRange.to, "dd/MM/yy") : "hoje"}`
                      : "Personalizado"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange.from ? { from: dateRange.from, to: dateRange.to } : undefined}
                    onSelect={(range) => {
                      setDateRange({ from: range?.from, to: range?.to });
                      setActivePreset("");
                    }}
                    numberOfMonths={2}
                    locale={ptBR}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <EventPicker
                value={selectedEventId}
                onValueChange={setSelectedEventId}
                events={events}
                placeholder="Filtrar por evento"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            O recorte aplicado altera os números de receita, pedidos, ingressos e séries gráficas. Usuários e eventos refletem o evento selecionado quando houver um filtro ativo.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {metrics.map((m: any) => (
          <Card key={m.label} className="group overflow-hidden border-border/80 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", m.accent)}>
                    <m.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{m.label}</p>
                    <p className={cn("mt-1 text-2xl font-display font-bold", isLoading && "animate-pulse text-muted-foreground")}>{m.value}</p>
                    <p className="text-xs text-muted-foreground">{m.subtitle}</p>
                  </div>
                </div>

                {m.sparklineData?.length ? (
                  <div className="h-12 w-28 shrink-0 self-end opacity-90 transition-opacity group-hover:opacity-100">
                    <MiniSparkline data={m.sparklineData} dataKey={m.sparklineKey || "revenue"} stroke="hsl(var(--primary))" />
                  </div>
                ) : (
                  <div className="flex h-12 w-28 shrink-0 items-center justify-end text-right text-xs text-muted-foreground">
                    <span>{m.subtitle}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Leitura executiva</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pedidos pagos</p>
              <p className="mt-2 text-2xl font-display font-bold">{paidOrders.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground">{paymentSuccessRate}% do total filtrado</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Eventos publicados</p>
              <p className="mt-2 text-2xl font-display font-bold">{publishedEventCount.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground">{endedEventCount.toLocaleString("pt-BR") } encerrados no portfólio</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Método líder</p>
              <p className="mt-2 text-2xl font-display font-bold">{topPaymentMethod?.name || "—"}</p>
              <p className="text-xs text-muted-foreground">{topPaymentShare}% do volume financeiro</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Conversão e check-in</p>
              <p className="mt-2 text-2xl font-display font-bold">{conversionRate}%</p>
              <p className="text-xs text-muted-foreground">Check-in em {checkinRate}% dos ingressos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="border-border/80 shadow-sm xl:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base font-semibold">Receita e pedidos</CardTitle>
              <div className="flex gap-1">
                {(["month", "day"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGranularity(g)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      granularity === g
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {g === "month" ? "Mês" : "Dia"}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={chartData}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} opacity={0.4} />
                  <XAxis dataKey={chartDataKey} tick={{ fontSize: 12, className: "fill-muted-foreground" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12, className: "fill-muted-foreground" }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, className: "fill-muted-foreground" }} tickFormatter={(v) => v.toLocaleString("pt-BR")} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                      color: "hsl(var(--foreground))",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    formatter={(v: number, name) => [name === "revenue" ? formatBRL(v) : v.toLocaleString("pt-BR"), name === "revenue" ? "Receita" : "Pedidos"]}
                    labelFormatter={(label) => {
                      const parsed = new Date(String(label));
                      return isNaN(parsed.getTime()) ? String(label) : parsed.toLocaleDateString("pt-BR");
                    }}
                    cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1 }}
                  />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" fill="hsl(var(--primary) / 0.18)" stroke="hsl(var(--primary))" strokeWidth={2} name="Receita" />
                  <Bar yAxisId="right" dataKey="orders" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} name="Pedidos" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {isLoading ? "Carregando..." : "Sem dados para o período selecionado"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base font-semibold">Métodos de Pagamento</CardTitle>
              <div className="flex gap-1">
                {(["total", "count"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setPaymentSort(mode)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      paymentSort === mode
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {mode === "total" ? "Valor" : "Quantidade"}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {paymentEntries.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={paymentEntries} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={86} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {paymentEntries.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [paymentSort === "total" ? formatBRL(value) : value, paymentSort === "total" ? "Total" : "Pedidos"]}
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {isLoading ? "Carregando..." : "Sem dados"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="border-border/80 shadow-sm xl:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base font-semibold">Crescimento do negócio</CardTitle>
              <Badge variant="outline" className="border-border/70 bg-muted/30 text-muted-foreground">
                {granularity === "month" ? "Série mensal" : "Série diária"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {growthChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={growthChartData}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} opacity={0.4} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, className: "fill-muted-foreground" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, className: "fill-muted-foreground" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                      color: "hsl(var(--foreground))",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value: number, name) => [value.toLocaleString("pt-BR"), name === "newEvents" ? "Eventos" : name === "newUsers" ? "Usuários" : name === "activeUsers" ? "Ativos" : "Check-ins"]}
                    labelFormatter={(label) => {
                      const parsed = new Date(String(label));
                      return isNaN(parsed.getTime()) ? String(label) : parsed.toLocaleDateString("pt-BR");
                    }}
                    cursor={{ stroke: "hsl(var(--accent))", strokeWidth: 1 }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="newEvents" name="Eventos criados" stroke="hsl(var(--primary))" strokeWidth={2.25} dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="newUsers" name="Usuários novos" stroke="hsl(var(--accent))" strokeWidth={2.25} dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="activeUsers" name="Usuários ativos" stroke="hsl(142 71% 45%)" strokeWidth={2.25} dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="checkins" name="Check-ins" stroke="hsl(38 92% 50%)" strokeWidth={2.25} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">{isLoading ? "Carregando..." : "Sem dados para o período selecionado"}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Radar executivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Conversão</p>
                <p className="mt-2 text-2xl font-display font-bold">{conversionRate}%</p>
                <p className="text-xs text-muted-foreground">{totalPageViews.toLocaleString("pt-BR")} visualizações acumuladas</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Check-in</p>
                <p className="mt-2 text-2xl font-display font-bold">{checkinRate}%</p>
                <p className="text-xs text-muted-foreground">{totalCheckedIn.toLocaleString("pt-BR")} validações registradas</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Eventos publicados</p>
                <p className="mt-2 text-2xl font-display font-bold">{publishedEventCount.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground">{endedEventCount.toLocaleString("pt-BR")} encerrados no portfólio</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Rascunhos</p>
                <p className="mt-2 text-2xl font-display font-bold">{draftEventCount.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground">{featuredEventCount.toLocaleString("pt-BR")} em destaque</p>
              </div>
            </div>

            <div className="space-y-3">
              {alerts.length > 0 ? (
                alerts.map((alert, index) => (
                  <div key={`${alert.title}-${index}`} className={cn("rounded-2xl border p-4", alert.tone === "warning" ? "border-amber-500/30 bg-amber-500/10" : alert.tone === "primary" ? "border-primary/30 bg-primary/10" : "border-border/70 bg-muted/20")}>
                    <div className="flex items-start gap-3">
                      <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", alert.tone === "warning" ? "bg-amber-500/15 text-amber-500" : alert.tone === "primary" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">{alert.detail}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                  Sem alertas críticos no recorte atual.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="border-border/80 shadow-sm xl:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base font-semibold">Top eventos</CardTitle>
              <div className="flex flex-wrap gap-1">
                {[
                  { value: "revenue" as const, label: "Receita" },
                  { value: "tickets" as const, label: "Ingressos" },
                  { value: "conversion" as const, label: "Conversão" },
                  { value: "views" as const, label: "Views" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTopEventSort(option.value)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      topEventSort === option.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {topEvents.length > 0 ? (
              topEvents.slice(0, 6).map((event: any) => {
                const occupancy = Number(event.occupancy_rate || 0);
                return (
                  <div key={event.id} className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/20 p-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-14 w-20 overflow-hidden rounded-xl border border-border/70 bg-background">
                        <EventImage src={event.cover_image_url} alt={event.title || "Evento"} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-medium">{event.title}</p>
                          <Badge variant="outline" className="border-border/70 bg-background/80 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            {getEventStatusLabel(event.status)}
                          </Badge>
                          {event.featured && <Badge className="bg-primary/15 text-primary hover:bg-primary/20">Destaque</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {event.venue_city || "Sem cidade"} · {event.page_views.toLocaleString("pt-BR")} views · {event.tickets_checked_in.toLocaleString("pt-BR")} check-ins
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:min-w-[360px] md:grid-cols-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Receita</p>
                        <p className="font-medium">{formatBRL(event.total_revenue)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Ingressos</p>
                        <p className="font-medium">{event.tickets_sold.toLocaleString("pt-BR")}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Conversão</p>
                        <p className="font-medium">{formatPercent(event.conversion_rate)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Ocupação</p>
                        <p className="font-medium">{formatPercent(occupancy)}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">{isLoading ? "Carregando..." : "Sem eventos para exibir"}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Atividade recente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((item: any, index: number) => (
                <div key={`${item.id}-${index}`} className="flex gap-3 rounded-2xl border border-border/70 bg-muted/20 p-3">
                  <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", item.tone === "primary" ? "bg-primary/15 text-primary" : item.tone === "accent" ? "bg-accent/15 text-accent" : item.tone === "warning" ? "bg-amber-500/15 text-amber-500" : "bg-muted text-muted-foreground")}>
                    {item.kind === "event" ? <CalendarDays className="h-4 w-4" /> : item.kind === "order" ? <ShoppingCart className="h-4 w-4" /> : item.kind === "ticket" ? <Ticket className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">{isLoading ? "Carregando..." : "Sem atividade recente"}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Eventos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusEntries.length > 0 ? (
              <div className="space-y-3">
                {statusEntries.map(([status, count]) => {
                  const label = getEventStatusLabel(status);
                  const total = statusEntries.reduce((sum, [, value]) => sum + value, 0);
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">{isLoading ? "Carregando..." : "Sem dados"}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Pedidos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {orderEntries.length > 0 ? (
              <div className="space-y-3">
                {orderEntries.map(([status, count]) => {
                  const label = getOrderStatusLabel(status);
                  const total = orderEntries.reduce((sum, [, value]) => sum + value, 0);
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-accent/60 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">{isLoading ? "Carregando..." : "Sem dados"}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}