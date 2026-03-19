import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { DollarSign, Ticket, CalendarDays, TrendingUp, Plus, ArrowUpRight, Wallet, CalendarClock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { getProducerDashboardStats } from "@/lib/api-producer";
import { formatBRL } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function ProducerDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["producer-dashboard", user?.id],
    queryFn: () => getProducerDashboardStats(user!.id),
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const metrics = [
    {
      label: "Receita Total",
      value: stats ? formatBRL(stats.totalRevenue) : "—",
      icon: DollarSign,
      accent: "bg-primary/15 text-primary",
      support: "Receita acumulada",
    },
    {
      label: "Ingressos Vendidos",
      value: stats?.ticketsSold?.toLocaleString("pt-BR") || "0",
      icon: Ticket,
      accent: "bg-info/15 text-info",
      support: "Total vendido",
    },
    {
      label: "Total de Eventos",
      value: stats?.totalEvents?.toString() || "0",
      icon: CalendarDays,
      accent: "bg-warning/15 text-warning",
      support: "Eventos cadastrados",
    },
    {
      label: "Eventos Próximos",
      value: stats?.upcomingEvents?.toString() || "0",
      icon: TrendingUp,
      accent: "bg-success/15 text-success",
      support: "Agenda futura",
    },
  ];

  const hasRecentOrders = !!(stats?.recentOrders && stats.recentOrders.length > 0);

  return (
    <div className="space-y-6 lg:space-y-7">
      {/* Header */}
      <Card className="border-border/80 bg-gradient-to-br from-card to-muted/40 shadow-sm">
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <Badge variant="secondary" className="w-fit">Resumo operacional</Badge>
              <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Seu painel de resultados</h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Acompanhe performance de vendas, próximos eventos e pedidos em um único lugar.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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

      {/* Metric cards */}
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
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${m.accent}`}>
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
            <CardTitle className="text-base font-semibold">Pedidos Recentes</CardTitle>
            <CardDescription>Ultimas transacoes processadas nos seus eventos.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : hasRecentOrders ? (
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="px-6 pb-3 font-medium">Comprador</th>
                      <th className="px-6 pb-3 font-medium">Evento</th>
                      <th className="px-6 pb-3 font-medium">Total</th>
                      <th className="px-6 pb-3 font-medium">Status</th>
                      <th className="px-6 pb-3 font-medium">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.recentOrders.map((order: any) => (
                      <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-3 text-foreground">{order.profiles?.full_name || "—"}</td>
                        <td className="px-6 py-3 text-muted-foreground max-w-[160px] truncate">{order.events?.title || "—"}</td>
                        <td className="px-6 py-3 text-foreground font-medium">{formatBRL(order.total)}</td>
                        <td className="px-6 py-3"><OrderStatusBadge status={order.status} /></td>
                        <td className="px-6 py-3 text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">Nenhum pedido recente.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Acoes rapidas</CardTitle>
            <CardDescription>Atalhos do dia a dia do produtor.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/producer/events/new" className="gap-2">
                <CalendarClock className="h-4 w-4" />
                Novo evento
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/producer/financial" className="gap-2">
                <Wallet className="h-4 w-4" />
                Ver financeiro
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/producer/inbox" className="gap-2">
                <ArrowUpRight className="h-4 w-4" />
                Abrir mensagens
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Resumo financeiro</CardTitle>
          <CardDescription>Indicadores rapidos para acompanhamento semanal.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Receita media por evento</p>
              {isLoading ? <Skeleton className="h-7 w-28 mt-2" /> : (
                <p className="mt-2 text-lg font-display font-semibold">
                  {formatBRL((stats?.totalEvents || 0) > 0 ? (stats?.totalRevenue || 0) / (stats?.totalEvents || 1) : 0)}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ingressos por evento</p>
              {isLoading ? <Skeleton className="h-7 w-16 mt-2" /> : (
                <p className="mt-2 text-lg font-display font-semibold">
                  {((stats?.totalEvents || 0) > 0 ? (stats?.ticketsSold || 0) / (stats?.totalEvents || 1) : 0).toFixed(1)}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Eventos com data futura</p>
              {isLoading ? <Skeleton className="h-7 w-10 mt-2" /> : (
                <p className="mt-2 text-lg font-display font-semibold">{stats?.upcomingEvents || 0}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
