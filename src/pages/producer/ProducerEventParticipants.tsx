import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Download, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV, ticketCSVColumns } from "@/lib/csv-export";
import { useState } from "react";

export default function ProducerEventParticipants() {
  const { id } = useParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["event-participants", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          id, attendee_name, attendee_email, attendee_cpf, status, created_at,
          checked_in_at, is_half_price,
          tier:ticket_tiers(name, price, tier_type),
          order:orders(id, buyer_id, status, profiles:buyer_id(full_name))
        `)
        .eq("event_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: tiers } = useQuery({
    queryKey: ["event-tiers-participants", id],
    queryFn: async () => {
      const { data } = await supabase.from("ticket_tiers").select("id, name").eq("event_id", id!);
      return data || [];
    },
    enabled: !!id,
  });

  const filtered = tickets?.filter((t: any) => {
    // Status filter
    if (statusFilter === "confirmed" && t.status !== "active") return false;
    if (statusFilter === "pending" && t.status !== "reserved") return false;
    if (statusFilter === "cancelled" && t.status !== "cancelled") return false;
    if (statusFilter === "used" && t.status !== "used") return false;

    // Tier filter
    if (tierFilter !== "all" && t.tier?.name !== tierFilter) return false;

    // Search
    if (search) {
      const s = search.toLowerCase();
      return (
        t.attendee_name?.toLowerCase().includes(s) ||
        t.attendee_email?.toLowerCase().includes(s) ||
        t.order?.profiles?.full_name?.toLowerCase().includes(s) ||
        t.id.includes(s)
      );
    }
    return true;
  }) || [];

  const statusLabel = (s: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      active: { label: "Confirmado", variant: "default" },
      reserved: { label: "Pendente", variant: "secondary" },
      cancelled: { label: "Cancelado", variant: "destructive" },
      used: { label: "Check-in", variant: "outline" },
    };
    const m = map[s] || { label: s, variant: "secondary" as const };
    return <Badge variant={m.variant}>{m.label}</Badge>;
  };

  const confirmed = tickets?.filter((t: any) => t.status === "active").length || 0;
  const pending = tickets?.filter((t: any) => t.status === "reserved").length || 0;
  const cancelled = tickets?.filter((t: any) => t.status === "cancelled").length || 0;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-display font-bold text-primary">{confirmed}</p>
            <p className="text-xs text-muted-foreground">Confirmados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-display font-bold">{pending}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-display font-bold text-destructive">{cancelled}</p>
            <p className="text-xs text-muted-foreground">Cancelados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-display font-bold">{tickets?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, email ou ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="confirmed">Confirmados</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
            <SelectItem value="used">Check-in realizado</SelectItem>
          </SelectContent>
        </Select>
        {tiers && tiers.length > 1 && (
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os ingressos</SelectItem>
              {tiers.map((t: any) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Button variant="outline" size="icon" onClick={() => filtered.length && exportToCSV(filtered as any, ticketCSVColumns, `participantes_${id}`)} disabled={!filtered.length} title="Exportar CSV">
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum participante encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Participante</th>
                    <th className="p-3 font-medium">Nº ingresso</th>
                    <th className="p-3 font-medium">Tipo</th>
                    <th className="p-3 font-medium">Comprado por</th>
                    <th className="p-3 font-medium">Data</th>
                    <th className="p-3 font-medium">Check-in</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ticket: any) => (
                    <tr key={ticket.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-3">{statusLabel(ticket.status)}</td>
                      <td className="p-3">
                        <p className="font-medium text-foreground">{ticket.attendee_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{ticket.attendee_email || ""}</p>
                      </td>
                      <td className="p-3 font-mono text-xs">{ticket.id.slice(0, 8)}</td>
                      <td className="p-3 text-muted-foreground">{ticket.tier?.name || "—"}</td>
                      <td className="p-3 text-muted-foreground">{ticket.order?.profiles?.full_name || "—"}</td>
                      <td className="p-3 text-muted-foreground">{new Date(ticket.created_at).toLocaleDateString("pt-BR")}</td>
                      <td className="p-3 text-muted-foreground">
                        {ticket.checked_in_at ? new Date(ticket.checked_in_at).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—"}
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
