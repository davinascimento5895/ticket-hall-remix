import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Ticket, CalendarDays, Users, ShoppingCart, TrendingUp, CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getAdminDashboardStats } from "@/lib/api-admin";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subDays, startOfMonth, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, formatBRL } from "@/lib/utils";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(142 71% 45%)", "hsl(38 92% 50%)"];
type ChartGranularity = "month" | "day";

const presets = [
  { label: "Últimos 7 dias", days: 7 },
  { label: "Últimos 30 dias", days: 30 },
  { label: "Últimos 90 dias", days: 90 },
  { label: "Este mês", getRange: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: "Este ano", getRange: () => ({ from: startOfYear(new Date()), to: new Date() }) },
  { label: "Todo o período", days: 0 },
];

export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [activePreset, setActivePreset] = useState("Todo o período");
  const [granularity, setGranularity] = useState<ChartGranularity>("month");

  const queryDateRange = useMemo(() => {
    if (!dateRange.from) return undefined;
    return {
      from: dateRange.from.toISOString(),
      to: dateRange.to ? dateRange.to.toISOString() : new Date().toISOString(),
    };
  }, [dateRange]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-dashboard", queryDateRange],
    queryFn: () => getAdminDashboardStats(queryDateRange),
    staleTime: 60_000,
  });

  const handlePreset = (preset: typeof presets[number]) => {
    setActivePreset(preset.label);
    if (preset.days === 0) {
      setDateRange({ from: undefined, to: undefined });
    } else if (preset.getRange) {
      const range = preset.getRange();
      setDateRange({ from: range.from, to: range.to });
    } else {
      setDateRange({ from: subDays(new Date(), preset.days), to: new Date() });
    }
  };

  const avgTicket = stats && stats.totalOrders > 0 ? stats.totalGMV / stats.totalOrders : 0;

  const metrics = [
    { label: "GMV Total", value: stats ? formatBRL(stats.totalGMV) : "—", icon: DollarSign, accent: "bg-primary/10 text-primary" },
    { label: "Receita Plataforma", value: stats ? formatBRL(stats.platformRevenue) : "—", icon: TrendingUp, accent: "bg-accent/10 text-accent" },
    { label: "Ticket Médio", value: stats ? formatBRL(avgTicket) : "—", icon: DollarSign, accent: "bg-primary/10 text-primary" },
    { label: "Eventos", value: stats?.totalEvents?.toLocaleString("pt-BR") || "0", icon: CalendarDays, accent: "bg-accent/10 text-accent" },
    { label: "Usuários", value: stats?.totalUsers?.toLocaleString("pt-BR") || "0", icon: Users, accent: "bg-primary/10 text-primary" },
    { label: "Pedidos", value: stats?.totalOrders?.toLocaleString("pt-BR") || "0", icon: ShoppingCart, accent: "bg-accent/10 text-accent" },
    { label: "Ingressos Vendidos", value: stats?.ticketsSold?.toLocaleString("pt-BR") || "0", icon: Ticket, accent: "bg-primary/10 text-primary" },
  ];

  // Payment methods pie data
  const paymentPieData = stats?.paymentMethodMap
    ? Object.entries(stats.paymentMethodMap).map(([method, data]: [string, any]) => ({
        name: method === "pix" ? "PIX" : method === "credit_card" ? "Cartão" : method === "boleto" ? "Boleto" : method,
        value: data.total,
      }))
    : [];

  const chartData = granularity === "month" ? stats?.revenueByMonth : stats?.revenueByDay;
  const chartDataKey = granularity === "month" ? "month" : "day";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>

        <div className="flex items-center gap-2 flex-wrap">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => handlePreset(p)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-full transition-colors font-medium",
                activePreset === p.label
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
                <CalendarIcon className="h-3.5 w-3.5" />
                {dateRange.from
                  ? `${format(dateRange.from, "dd/MM/yy")} — ${dateRange.to ? format(dateRange.to, "dd/MM/yy") : "hoje"}`
                  : "Personalizado"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
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
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className="border-border bg-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${m.accent}`}>
                  <m.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground truncate">{m.label}</p>
                  <p className={cn("text-xl font-display font-bold", isLoading && "animate-pulse text-muted-foreground")}>{m.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue chart + Payment methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Receita</CardTitle>
              <div className="flex gap-1">
                {(["month", "day"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGranularity(g)}
                    className={cn(
                      "px-3 py-1 text-xs rounded-full transition-colors font-medium",
                      granularity === g
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
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
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <XAxis dataKey={chartDataKey} tick={{ fontSize: 12, className: "fill-muted-foreground" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, className: "fill-muted-foreground" }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                      color: "hsl(var(--foreground))",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    formatter={(v: number) => [formatBRL(v), "Receita"]}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                {isLoading ? "Carregando..." : "Sem dados para o período selecionado"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Métodos de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={paymentPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {paymentPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatBRL(value), "Total"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                {isLoading ? "Carregando..." : "Sem dados"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Eventos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.eventsByStatus && Object.keys(stats.eventsByStatus).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(stats.eventsByStatus).map(([status, count]) => {
                  const label = status === "draft" ? "Rascunho" : status === "published" ? "Publicado" : status === "cancelled" ? "Cancelado" : "Encerrado";
                  const total = Object.values(stats.eventsByStatus).reduce((a: number, b: any) => a + (b as number), 0) as number;
                  const pct = total > 0 ? ((count as number) / total) * 100 : 0;
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium">{count as number}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {isLoading ? "Carregando..." : "Sem dados"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Pedidos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.ordersByStatus && Object.keys(stats.ordersByStatus).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(stats.ordersByStatus).map(([status, count]) => {
                  const label = status === "paid" ? "Pago" : status === "pending" ? "Pendente" : status === "cancelled" ? "Cancelado" : status;
                  const total = Object.values(stats.ordersByStatus).reduce((a: number, b: any) => a + (b as number), 0) as number;
                  const pct = total > 0 ? ((count as number) / total) * 100 : 0;
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium">{count as number}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-accent/60 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {isLoading ? "Carregando..." : "Sem dados"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
