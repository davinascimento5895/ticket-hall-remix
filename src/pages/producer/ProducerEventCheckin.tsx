import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Search, QrCode, CheckCircle2, Wifi, WifiOff, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckinListsManager } from "@/components/producer/CheckinListsManager";
import { getEventTickets } from "@/lib/api-producer";
import { validateCheckinByTicketId, type CheckinResult } from "@/lib/api-checkin";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

export default function ProducerEventCheckin() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isOnline] = useState(navigator.onLine);
  const [lastResult, setLastResult] = useState<CheckinResult | null>(null);

  const { data: event } = useQuery({
    queryKey: ["producer-event", id],
    queryFn: async () => { const { data } = await supabase.from("events").select("title").eq("id", id).single(); return data; },
    enabled: !!id,
  });

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["event-tickets-checkin", id],
    queryFn: () => getEventTickets(id!),
    enabled: !!id,
  });

  const checkinMutation = useMutation({
    mutationFn: (ticketId: string) => validateCheckinByTicketId({ ticketId, scannedBy: user?.id }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["event-tickets-checkin", id] });
      setLastResult(result);
      toast({ title: "Check-in realizado!", description: result.attendeeName });
    },
    onError: (err: any) => {
      setLastResult({ success: false, result: "error", message: err.message });
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const totalTickets = tickets?.length || 0;
  const checkedIn = tickets?.filter((t: any) => t.status === "used").length || 0;

  const filtered = tickets?.filter((t: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return t.attendee_name?.toLowerCase().includes(s) ||
      t.attendee_email?.toLowerCase().includes(s) ||
      t.id.includes(s);
  }) || [];

  return (
    <div className="space-y-6">
      <div>
        <Link to="/producer/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Check-in — {event?.title || "..."}</h1>
          <div className="flex items-center gap-2 text-sm">
            {isOnline ? <Wifi className="h-4 w-4 text-success" /> : <WifiOff className="h-4 w-4 text-destructive" />}
            <span className={isOnline ? "text-success" : "text-destructive"}>{isOnline ? "Online" : "Offline"}</span>
          </div>
        </div>
      </div>

      {/* Counter */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-display font-bold text-primary">{checkedIn}</p>
            <p className="text-sm text-muted-foreground">Check-ins realizados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-display font-bold">{totalTickets}</p>
            <p className="text-sm text-muted-foreground">Total de ingressos</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="scanner" className="w-full">
        <TabsList>
          <TabsTrigger value="scanner">Scanner</TabsTrigger>
          <TabsTrigger value="lists">Listas de Acesso</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-4 pt-2">
          {/* Last scan result */}
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

          {/* QR Scanner placeholder */}
          <Card>
            <CardContent className="pt-6">
              <div className="w-full h-48 bg-muted rounded-lg flex flex-col items-center justify-center gap-2 border border-dashed border-border">
                <QrCode className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Scanner de câmera (em breve)</p>
                <p className="text-xs text-muted-foreground">Use a busca manual abaixo</p>
              </div>
            </CardContent>
          </Card>

          {/* Manual search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome, email ou código..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>

          {/* Attendee list */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <div className="divide-y divide-border">
                  {filtered.map((ticket: any) => (
                    <div key={ticket.id} className="flex items-center justify-between p-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{ticket.attendee_name || ticket.profiles?.full_name || "Sem nome"}</p>
                        <p className="text-xs text-muted-foreground">{ticket.ticket_tiers?.name} · #{ticket.id.slice(0, 8)}</p>
                      </div>
                      {ticket.status === "used" ? (
                        <span className="inline-flex items-center gap-1 text-sm text-success"><CheckCircle2 className="h-4 w-4" />Entrou</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => checkinMutation.mutate(ticket.id)}
                          disabled={checkinMutation.isPending}
                        >
                          Check-in
                        </Button>
                      )}
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <p className="text-sm text-muted-foreground py-8 text-center">Nenhum ingresso encontrado.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lists" className="pt-2">
          {id && <CheckinListsManager eventId={id} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
