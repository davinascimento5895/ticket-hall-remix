import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { DollarSign, Ticket, CalendarDays, TrendingUp, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { getProducerDashboardStats } from "@/lib/api-producer";

export default function ProducerDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["producer-dashboard", user?.id],
    queryFn: () => getProducerDashboardStats(user!.id),
    enabled: !!user?.id,
  });

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  const metrics = [
    { label: "Receita Total", value: stats ? fmt(stats.totalRevenue) : "—", icon: DollarSign },
    { label: "Ingressos Vendidos", value: stats?.ticketsSold?.toLocaleString("pt-BR") || "0", icon: Ticket },
    { label: "Total de Eventos", value: stats?.totalEvents?.toString() || "0", icon: CalendarDays },
    { label: "Eventos Próximos", value: stats?.upcomingEvents?.toString() || "0", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link to="/producer/events/new" className="gap-2">
            <Plus className="h-4 w-4" /> Criar evento
          </Link>
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
              <m.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <p className="text-2xl font-display font-bold">{m.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pedidos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : stats?.recentOrders && stats.recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Comprador</th>
                    <th className="pb-2 font-medium">Evento</th>
                    <th className="pb-2 font-medium">Total</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order: any) => (
                    <tr key={order.id} className="border-b border-border/50">
                      <td className="py-2 text-foreground">{order.profiles?.full_name || "—"}</td>
                      <td className="py-2 text-muted-foreground">{order.events?.title || "—"}</td>
                      <td className="py-2 text-foreground">{fmt(order.total)}</td>
                      <td className="py-2"><OrderStatusBadge status={order.status} /></td>
                      <td className="py-2 text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum pedido ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
