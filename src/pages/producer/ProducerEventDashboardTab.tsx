import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Ticket, Clock, TrendingUp, CreditCard, Download, Users, UserCheck, UserX, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { getEventAnalytics } from "@/lib/api-producer";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useState, useEffect } from "react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(142 71% 45%)", "hsl(38 92% 50%)"];

export default function ProducerEventDashboardTab() {
  const { id } = useParams();
  const [countdown, setCountdown] = useState("");

  const { data: event } = useQuery({
    queryKey: ["event-dash-meta", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("title, start_date, platform_fee_percent")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["event-analytics", id],
    queryFn: () => getEventAnalytics(id!),
    enabled: !!id,
  });

  const { data: tiers } = useQuery({
    queryKey: ["event-tiers-dash", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("ticket_tiers").select("name, quantity_sold, quantity_total, price, tier_type").eq("event_id", id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: orders } = useQuery({
    queryKey: ["event-orders-dash", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("total, payment_method, status, coupon_id, platform_fee, created_at")
        .eq("event_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Countdown timer
  useEffect(() => {
    if (!event?.start_date) return;
    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = new Date(event.start_date).getTime();
      const diff = target - now;
      if (diff <= 0) {
        setCountdown("Evento em andamento ou encerrado");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      parts.push(`${hours}h ${minutes}min`);
      setCountdown(parts.join(" "));
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [event?.start_date]);

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  // Computed metrics
  const paidOrders = orders?.filter((o) => o.status === "paid") || [];
  const totalRevenue = paidOrders.reduce((s, o) => s + (o.total || 0), 0);
  const platformFees = paidOrders.reduce((s, o) => s + (o.platform_fee || 0), 0);
  const netRevenue = totalRevenue - platformFees;
  const totalSold = tiers?.reduce((s, t) => s + (t.quantity_sold || 0), 0) || 0;
  const freeSold = tiers?.filter((t) => t.tier_type === "free").reduce((s, t) => s + (t.quantity_sold || 0), 0) || 0;
  const paidSold = totalSold - freeSold;
  const avgTicket = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

  // Payment methods breakdown
  const paymentMethods = paidOrders.reduce<Record<string, number>>((acc, o) => {
    const method = o.payment_method || "Outro";
    acc[method] = (acc[method] || 0) + o.total;
    return acc;
  }, {});
  const paymentPieData = Object.entries(paymentMethods).map(([name, value]) => ({ name: name === "pix" ? "PIX" : name === "credit_card" ? "Cartão" : name === "boleto" ? "Boleto" : name, value }));

  // Coupon stats
  const withCoupon = paidOrders.filter((o) => o.coupon_id).length;
  const withoutCoupon = paidOrders.length - withCoupon;

  // Tier chart data
  const tierChartData = tiers?.map((t) => ({ name: t.name, vendidos: t.quantity_sold || 0, total: t.quantity_total })) || [];

  return (
    <div className="space-y-6">
      {/* Last updated + countdown */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-muted-foreground">
        <span>
          Última atualização: {new Date().toLocaleString("pt-BR")}
        </span>
        {countdown && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            Contagem regressiva: <strong className="text-foreground">{countdown}</strong>
          </span>
        )}
      </div>

      {/* Key metrics */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vendas Líquidas</p>
                  <p className="text-2xl font-display font-bold">{fmt(netRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <Ticket className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ingressos Aprovados</p>
                  <p className="text-2xl font-display font-bold">{totalSold}</p>
                  <p className="text-xs text-muted-foreground">{freeSold} gratuitos e {paidSold} pagos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ticket Médio</p>
                  <p className="text-2xl font-display font-bold">{fmt(avgTicket)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets by tier */}
        <Card>
          <CardHeader><CardTitle className="text-base">Ingressos vendidos</CardTitle></CardHeader>
          <CardContent>
            {tierChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={tierChartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="vendidos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Não encontramos dados neste filtro.</p>
            )}
          </CardContent>
        </Card>

        {/* Payment methods */}
        <Card>
          <CardHeader><CardTitle className="text-base">Métodos de pagamento</CardTitle></CardHeader>
          <CardContent>
            {paymentPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={paymentPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {paymentPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => fmt(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Não encontramos métodos de pagamento neste filtro.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Coupon stats */}
      <Card>
        <CardHeader><CardTitle className="text-base">Vendas com e sem código promocional</CardTitle></CardHeader>
        <CardContent>
          {paidOrders.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm">Sem cupom: {withoutCoupon} ({paidOrders.length > 0 ? Math.round(withoutCoupon / paidOrders.length * 100) : 0}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <span className="text-sm">Com cupom: {withCoupon} ({paidOrders.length > 0 ? Math.round(withCoupon / paidOrders.length * 100) : 0}%)</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Não encontramos dados de códigos promocionais.</p>
          )}
        </CardContent>
      </Card>

      {/* Tier table */}
      {tiers && tiers.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Detalhamento por ingresso</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-3 font-medium">Tipo</th>
                    <th className="p-3 font-medium">Vendidos/Total</th>
                    <th className="p-3 font-medium">Valor</th>
                    <th className="p-3 font-medium">Receita</th>
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((t, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="p-3 font-medium text-foreground">{t.name}</td>
                      <td className="p-3 text-muted-foreground">{t.quantity_sold || 0}/{t.quantity_total}</td>
                      <td className="p-3">{t.tier_type === "free" ? "Grátis" : fmt(t.price || 0)}</td>
                      <td className="p-3 font-medium">{fmt((t.quantity_sold || 0) * (t.price || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
