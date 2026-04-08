import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download } from "lucide-react";
import { EmbedSnippetGenerator } from "@/components/EmbedSnippetGenerator";
import { exportToCSV, ticketCSVColumns } from "@/lib/csv-export";
import { getEventTickets } from "@/lib/api-producer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getEventAnalytics } from "@/lib/api-producer";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { formatBRL } from "@/lib/utils";

const COLORS = ["hsl(243 75% 59%)", "hsl(38 92% 50%)", "hsl(142 71% 45%)", "hsl(217 91% 60%)"];

export default function ProducerEventReports() {
  const { id } = useParams();

  const { data: event } = useQuery({
    queryKey: ["producer-event", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("title, slug").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: tickets } = useQuery({
    queryKey: ["event-tickets-export", id],
    queryFn: () => getEventTickets(id!),
    enabled: !!id,
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["event-analytics", id],
    queryFn: () => getEventAnalytics(id!),
    enabled: !!id,
  });

  const { data: tiers } = useQuery({
    queryKey: ["event-tiers-report", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("ticket_tiers").select("name, quantity_sold, quantity_total, price").eq("event_id", id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const tierChartData = tiers?.map((t) => ({ name: t.name, vendidos: t.quantity_sold || 0, total: t.quantity_total })) || [];
  const tierPieData = tiers?.filter((t) => (t.quantity_sold || 0) > 0).map((t) => ({ name: t.name, value: t.quantity_sold || 0 })) || [];

  return (
    <div className="space-y-6">
      <div>
        <Link to="/producer/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <h1 className="font-display text-2xl font-bold">Relatórios — {event?.title || "..."}</h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Receita Total</CardTitle></CardHeader><CardContent><p className="text-2xl font-display font-bold">{formatBRL(analytics?.total_revenue || 0)}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Receita do Produtor</CardTitle></CardHeader><CardContent><p className="text-2xl font-display font-bold">{formatBRL(analytics?.producer_revenue || 0)}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Ingressos Vendidos</CardTitle></CardHeader><CardContent><p className="text-2xl font-display font-bold">{analytics?.tickets_sold || 0}</p></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Vendas por Lote</CardTitle></CardHeader>
              <CardContent>
                {tierChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={tierChartData}>
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(240 5% 65%)" }} />
                      <YAxis tick={{ fontSize: 12, fill: "hsl(240 5% 65%)" }} />
                      <Tooltip contentStyle={{ background: "hsl(240 6% 7%)", border: "1px solid hsl(240 4% 18%)", borderRadius: 8 }} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                      <Bar dataKey="vendidos" fill="hsl(243 75% 59%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Distribuição de Vendas</CardTitle></CardHeader>
              <CardContent>
                {tierPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={tierPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {tierPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(240 6% 7%)", border: "1px solid hsl(240 4% 18%)", borderRadius: 8 }} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Taxa de Check-in</CardTitle>
              <span className="text-sm text-muted-foreground">{analytics?.tickets_checked_in || 0} / {analytics?.tickets_sold || 0}</span>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-secondary rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all"
                  style={{ width: `${analytics?.tickets_sold ? ((analytics.tickets_checked_in || 0) / analytics.tickets_sold * 100) : 0}%` }}
                />
              </div>
            </CardContent>
          </Card>
          {/* Export & Embed */}
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => tickets && exportToCSV(tickets, ticketCSVColumns, `ingressos_${id}`)} disabled={!tickets?.length}>
              <Download className="h-4 w-4 mr-1" /> Exportar Ingressos CSV
            </Button>
          </div>

          {event?.slug && <EmbedSnippetGenerator eventSlug={event.slug} />}
        </>
      )}
    </div>
  );
}
