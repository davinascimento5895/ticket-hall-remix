import { useQuery } from "@tanstack/react-query";
import { DollarSign, Ticket, CalendarDays, Users, ShoppingCart, TrendingUp } from "lucide-react";
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
    { label: "GMV Total", value: stats ? fmt(stats.totalGMV) : "—", icon: DollarSign, accent: "bg-primary/10 text-primary" },
    { label: "Receita Plataforma", value: stats ? fmt(stats.platformRevenue) : "—", icon: TrendingUp, accent: "bg-accent/10 text-accent" },
    { label: "Eventos", value: stats?.totalEvents?.toLocaleString("pt-BR") || "0", icon: CalendarDays, accent: "bg-info/10 text-info" },
    { label: "Usuários", value: stats?.totalUsers?.toLocaleString("pt-BR") || "0", icon: Users, accent: "bg-primary/10 text-primary" },
    { label: "Pedidos", value: stats?.totalOrders?.toLocaleString("pt-BR") || "0", icon: ShoppingCart, accent: "bg-accent/10 text-accent" },
    { label: "Ingressos Vendidos", value: stats?.ticketsSold?.toLocaleString("pt-BR") || "0", icon: Ticket, accent: "bg-info/10 text-info" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Dashboard Admin</h1>

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

      {/* Revenue chart */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Receita por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : stats?.revenueByMonth && stats.revenueByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.revenueByMonth}>
                <XAxis dataKey="month" tick={{ fontSize: 12, className: "fill-muted-foreground" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, className: "fill-muted-foreground" }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    color: "hsl(var(--foreground))",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                  formatter={(v: number) => [fmt(v), "Receita"]}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
          )}
        </CardContent>
      </Card>

      {/* Status breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Eventos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.eventsByStatus ? (
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
              <Skeleton className="h-20 w-full" />
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Pedidos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.ordersByStatus ? (
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
              <Skeleton className="h-20 w-full" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
