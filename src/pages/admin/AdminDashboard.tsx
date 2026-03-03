import { useQuery } from "@tanstack/react-query";
import { DollarSign, Ticket, CalendarDays, Users, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminDashboardStats } from "@/lib/api-admin";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getAdminDashboardStats,
  });

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  const metrics = [
    { label: "GMV Total", value: stats ? fmt(stats.totalGMV) : "—", icon: DollarSign },
    { label: "Receita Plataforma (7%)", value: stats ? fmt(stats.platformRevenue) : "—", icon: DollarSign },
    { label: "Eventos", value: stats?.totalEvents?.toLocaleString("pt-BR") || "0", icon: CalendarDays },
    { label: "Usuários", value: stats?.totalUsers?.toLocaleString("pt-BR") || "0", icon: Users },
    { label: "Pedidos", value: stats?.totalOrders?.toLocaleString("pt-BR") || "0", icon: ShoppingCart },
    { label: "Ingressos Vendidos", value: stats?.ticketsSold?.toLocaleString("pt-BR") || "0", icon: Ticket },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Dashboard Admin</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
              <m.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-7 w-24" /> : <p className="text-2xl font-display font-bold">{m.value}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Receita por Mês</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : stats?.revenueByMonth && stats.revenueByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.revenueByMonth}>
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(240 5% 65%)" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(240 5% 65%)" }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "hsl(240 6% 7%)", border: "1px solid hsl(240 4% 18%)", borderRadius: 8 }} formatter={(v: number) => [fmt(v), "Receita"]} />
                <Bar dataKey="revenue" fill="hsl(243 75% 59%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Eventos por Status</CardTitle></CardHeader>
          <CardContent>
            {stats?.eventsByStatus ? (
              <div className="space-y-2">
                {Object.entries(stats.eventsByStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{status === "draft" ? "Rascunho" : status === "published" ? "Publicado" : status === "cancelled" ? "Cancelado" : "Encerrado"}</span>
                    <span className="font-medium">{count as number}</span>
                  </div>
                ))}
              </div>
            ) : (
              <Skeleton className="h-20 w-full" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Pedidos por Status</CardTitle></CardHeader>
          <CardContent>
            {stats?.ordersByStatus ? (
              <div className="space-y-2">
                {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{status === "paid" ? "Pago" : status === "pending" ? "Pendente" : status === "cancelled" ? "Cancelado" : status}</span>
                    <span className="font-medium">{count as number}</span>
                  </div>
                ))}
              </div>
            ) : (
              <Skeleton className="h-20 w-full" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
