import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { DollarSign, Ticket, CalendarDays, TrendingUp, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { getProducerDashboardStats } from "@/lib/api-producer";
import { formatBRL } from "@/lib/utils";

export default function ProducerDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["producer-dashboard", user?.id],
    queryFn: () => getProducerDashboardStats(user!.id),
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const metrics = [
    { label: "Receita Total", value: stats ? formatBRL(stats.totalRevenue) : "—", icon: DollarSign, accent: "bg-primary/10 text-primary" },
    { label: "Ingressos Vendidos", value: stats?.ticketsSold?.toLocaleString("pt-BR") || "0", icon: Ticket, accent: "bg-accent/10 text-accent" },
    { label: "Total de Eventos", value: stats?.totalEvents?.toString() || "0", icon: CalendarDays, accent: "bg-info/10 text-info" },
    { label: "Eventos Próximos", value: stats?.upcomingEvents?.toString() || "0", icon: TrendingUp, accent: "bg-primary/10 text-primary" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link to="/producer/events/new" className="gap-2">
            <Plus className="h-4 w-4" /> Criar evento
          </Link>
        </Button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className="border-border bg-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${m.accent}`}>
                  <m.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground truncate">{m.label}</p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-24 mt-1" />
                  ) : (
                    <p className="text-xl font-display font-bold">{m.value}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Pedidos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : stats?.recentOrders && stats.recentOrders.length > 0 ? (
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
                  {stats.recentOrders.map((order: any) => (
                    <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-3 text-foreground">{order.profiles?.full_name || "—"}</td>
                      <td className="px-6 py-3 text-muted-foreground max-w-[160px] truncate">{order.events?.title || "—"}</td>
                      <td className="px-6 py-3 text-foreground font-medium">{formatBRL(order.total)}</td>
                      <td className="px-6 py-3"><OrderStatusBadge status={order.status} /></td>
                      <td className="px-6 py-3 text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhum pedido ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
