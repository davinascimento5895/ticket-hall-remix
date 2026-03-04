import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QrCode, CheckCircle2, XCircle, Search, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { validateCheckinByTicketId, type CheckinResult } from "@/lib/api-checkin";
import { toast } from "@/hooks/use-toast";

export default function PublicCheckin() {
  const { accessCode } = useParams<{ accessCode: string }>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [lastResult, setLastResult] = useState<CheckinResult | null>(null);

  const { data: checkinList, isLoading: loadingList } = useQuery({
    queryKey: ["checkin-list-public", accessCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checkin_lists")
        .select("*, events(id, title)")
        .eq("access_code", accessCode)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!accessCode,
  });

  const eventId = (checkinList as any)?.events?.id;

  const { data: tickets = [], isLoading: loadingTickets } = useQuery({
    queryKey: ["checkin-tickets", eventId, checkinList?.id],
    queryFn: async () => {
      let query = supabase
        .from("tickets")
        .select("*, ticket_tiers(name), profiles!tickets_owner_id_fkey(full_name)")
        .eq("event_id", eventId);

      if (checkinList?.allowed_tier_ids && checkinList.allowed_tier_ids.length > 0) {
        query = query.in("tier_id", checkinList.allowed_tier_ids);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId && !!checkinList,
  });

  const checkinMutation = useMutation({
    mutationFn: (ticketId: string) =>
      validateCheckinByTicketId({ ticketId, checkinListId: checkinList?.id }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["checkin-tickets"] });
      setLastResult(result);
      toast({ title: "Check-in realizado!", description: result.attendeeName });
    },
    onError: (err: any) => {
      setLastResult({ success: false, result: "error", message: err.message });
      toast({ title: "Erro no check-in", description: err.message, variant: "destructive" });
    },
  });

  const totalTickets = tickets.length;
  const checkedIn = tickets.filter((t: any) => t.status === "used").length;

  const filtered = tickets.filter((t: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      t.attendee_name?.toLowerCase().includes(s) ||
      t.attendee_email?.toLowerCase().includes(s) ||
      t.id.includes(s)
    );
  });

  if (loadingList) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-10 w-48" />
      </div>
    );
  }

  if (!checkinList) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
        <XCircle className="h-12 w-12 text-destructive" />
        <h1 className="font-display text-xl font-bold text-foreground">Lista não encontrada</h1>
        <p className="text-sm text-muted-foreground text-center">
          O código de acesso é inválido ou a lista foi desativada.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 max-w-lg mx-auto space-y-4">
      <div className="text-center space-y-1">
        <h1 className="font-display text-lg font-bold text-foreground">{checkinList.name}</h1>
        <p className="text-sm text-muted-foreground">{(checkinList as any)?.events?.title}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-display font-bold text-primary">{checkedIn}</p>
            <p className="text-xs text-muted-foreground">Check-ins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-display font-bold">{totalTickets}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {lastResult && (
        <Card className={lastResult.success ? "border-green-500/50" : "border-destructive/50"}>
          <CardContent className="py-3 flex items-center gap-3">
            {lastResult.success ? (
              <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
            ) : lastResult.result === "already_used" ? (
              <AlertTriangle className="h-6 w-6 text-yellow-500 shrink-0" />
            ) : (
              <XCircle className="h-6 w-6 text-destructive shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">{lastResult.message}</p>
              {lastResult.attendeeName && (
                <p className="text-xs text-muted-foreground">{lastResult.attendeeName} · {lastResult.tierName}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="w-full h-40 bg-muted rounded-lg flex flex-col items-center justify-center gap-2 border border-dashed border-border">
            <QrCode className="h-8 w-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Scanner de câmera (em breve)</p>
          </div>
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loadingTickets ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[50vh] overflow-y-auto">
              {filtered.map((ticket: any) => (
                <div key={ticket.id} className="flex items-center justify-between p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground text-sm truncate">
                      {ticket.attendee_name || ticket.profiles?.full_name || "Sem nome"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ticket.ticket_tiers?.name} · #{ticket.id.slice(0, 8)}
                    </p>
                  </div>
                  {ticket.status === "used" ? (
                    <Badge variant="outline" className="text-green-500 border-green-500/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Entrou
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => checkinMutation.mutate(ticket.id)}
                      disabled={checkinMutation.isPending}
                    >
                      Check-in
                    </Button>
                  )}
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">Nenhum ingresso encontrado.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
