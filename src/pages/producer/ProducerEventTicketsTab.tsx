import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Ticket, Plus, Edit, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export default function ProducerEventTicketsTab() {
  const { id } = useParams();

  const { data: tiers, isLoading } = useQuery({
    queryKey: ["event-tiers-tab", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_tiers")
        .select("*")
        .eq("event_id", id!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: stats } = useQuery({
    queryKey: ["event-ticket-stats", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("status, tier_id")
        .eq("event_id", id!);
      if (error) throw error;
      const confirmed = data?.filter((t) => t.status === "active").length || 0;
      const pending = data?.filter((t) => t.status === "reserved").length || 0;
      const cancelled = data?.filter((t) => t.status === "cancelled").length || 0;
      return { confirmed, pending, cancelled };
    },
    enabled: !!id,
  });

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-display font-bold text-primary">{stats?.confirmed || 0}</p>
            <p className="text-xs text-muted-foreground">Aprovados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-display font-bold">{stats?.pending || 0}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-display font-bold text-destructive">{stats?.cancelled || 0}</p>
            <p className="text-xs text-muted-foreground">Cancelados</p>
          </CardContent>
        </Card>
      </div>

      {/* Manage link */}
      <div className="flex justify-end">
        <Button asChild size="sm" variant="outline">
          <Link to={`/producer/events/${id}/edit`}><Edit className="h-4 w-4 mr-1" />Gerenciar ingressos</Link>
        </Button>
      </div>

      {/* Tier list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ingressos configurados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !tiers || tiers.length === 0 ? (
            <div className="py-8 text-center">
              <Ticket className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum ingresso configurado.</p>
              <Button asChild size="sm" variant="outline" className="mt-3">
                <Link to={`/producer/events/${id}/edit`}>Configurar ingressos</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-3 font-medium">Tipo</th>
                    <th className="p-3 font-medium">Vendidos/Total</th>
                    <th className="p-3 font-medium">Valor</th>
                    <th className="p-3 font-medium">Taxa</th>
                    <th className="p-3 font-medium">Visibilidade</th>
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((tier: any) => (
                    <tr key={tier.id} className="border-b border-border/50">
                      <td className="p-3 font-medium text-foreground">
                        {tier.name}
                        {tier.is_hidden_by_default && <Badge variant="secondary" className="ml-2 text-xs">Oculto</Badge>}
                      </td>
                      <td className="p-3">
                        <span className="text-foreground font-medium">{tier.quantity_sold || 0}</span>
                        <span className="text-muted-foreground">/{tier.quantity_total}</span>
                      </td>
                      <td className="p-3">{tier.tier_type === "free" ? "Grátis" : fmt(tier.price || 0)}</td>
                      <td className="p-3 text-muted-foreground">{fmt(0)}</td>
                      <td className="p-3">
                        {tier.is_visible !== false ? (
                          <span className="inline-flex items-center gap-1 text-xs text-primary"><Eye className="h-3.5 w-3.5" />Visível</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><EyeOff className="h-3.5 w-3.5" />Oculto</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
