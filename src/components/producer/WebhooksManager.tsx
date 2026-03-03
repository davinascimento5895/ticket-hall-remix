import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, TestTube, Eye, EyeOff, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const WEBHOOK_EVENTS = [
  { value: "order.paid", label: "Pedido pago" },
  { value: "order.cancelled", label: "Pedido cancelado" },
  { value: "order.refunded", label: "Pedido reembolsado" },
  { value: "ticket.checked_in", label: "Check-in realizado" },
  { value: "ticket.transferred", label: "Ingresso transferido" },
  { value: "event.published", label: "Evento publicado" },
  { value: "event.cancelled", label: "Evento cancelado" },
];

export function WebhooksManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showDeliveries, setShowDeliveries] = useState<string | null>(null);
  const [form, setForm] = useState({ url: "", events: [] as string[] });
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ["producer-webhooks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhooks")
        .select("*")
        .eq("producer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: deliveries = [] } = useQuery({
    queryKey: ["webhook-deliveries", showDeliveries],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhook_deliveries")
        .select("*")
        .eq("webhook_id", showDeliveries!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!showDeliveries,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const secret = crypto.randomUUID();
      const { error } = await supabase.from("webhooks").insert({
        producer_id: user!.id,
        url: form.url,
        secret,
        events: form.events,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producer-webhooks"] });
      setShowCreate(false);
      setForm({ url: "", events: [] });
      toast({ title: "Webhook criado!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("webhooks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producer-webhooks"] });
      toast({ title: "Webhook removido" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("webhooks").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["producer-webhooks"] }),
  });

  const testMutation = useMutation({
    mutationFn: async (webhook: any) => {
      const payload = { event: "test.ping", data: { message: "Teste de webhook TicketHall", timestamp: new Date().toISOString() } };
      const { error } = await supabase.from("webhook_deliveries").insert({
        webhook_id: webhook.id,
        event_type: "test.ping",
        payload,
        response_status: null,
        attempts: 1,
      });
      if (error) throw error;
      // WEBHOOK_DISPATCH_INTEGRATION_POINT — in production, call edge function to POST to webhook.url
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhook-deliveries"] });
      toast({ title: "Teste enviado!" });
    },
  });

  const toggleEvent = (event: string) => {
    setForm((p) => ({
      ...p,
      events: p.events.includes(event) ? p.events.filter((e) => e !== event) : [...p.events, event],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-foreground">Webhooks</h3>
          <p className="text-xs text-muted-foreground">Receba notificações em tempo real via HTTP POST</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> Novo webhook</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : webhooks.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Nenhum webhook configurado.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh: any) => (
            <Card key={wh.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-foreground truncate">{wh.url}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {wh.events?.map((ev: string) => (
                        <Badge key={ev} variant="outline" className="text-xs">{ev}</Badge>
                      ))}
                    </div>
                  </div>
                  <Switch checked={wh.is_active} onCheckedChange={(v) => toggleMutation.mutate({ id: wh.id, is_active: v })} />
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Secret: </span>
                  <span className="font-mono">{showSecret[wh.id] ? wh.secret : "••••••••"}</span>
                  <button onClick={() => setShowSecret((p) => ({ ...p, [wh.id]: !p[wh.id] }))}>
                    {showSecret[wh.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(wh.secret); toast({ title: "Secret copiado!" }); }}>
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => testMutation.mutate(wh)}><TestTube className="h-3 w-3 mr-1" />Testar</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowDeliveries(wh.id)}>Histórico</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(wh.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo webhook</DialogTitle>
            <DialogDescription>Configure um endpoint para receber eventos em tempo real.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>URL do endpoint</Label><Input value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} placeholder="https://seu-servidor.com/webhook" /></div>
            <div>
              <Label>Eventos</Label>
              <div className="space-y-2 mt-2">
                {WEBHOOK_EVENTS.map((ev) => (
                  <label key={ev.value} className="flex items-center gap-2">
                    <Checkbox checked={form.events.includes(ev.value)} onCheckedChange={() => toggleEvent(ev.value)} />
                    <span className="text-sm">{ev.label} <span className="text-muted-foreground font-mono text-xs">({ev.value})</span></span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!form.url || form.events.length === 0 || createMutation.isPending}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deliveries dialog */}
      <Dialog open={!!showDeliveries} onOpenChange={() => setShowDeliveries(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de entregas</DialogTitle>
            <DialogDescription>Últimas 20 entregas deste webhook.</DialogDescription>
          </DialogHeader>
          {deliveries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma entrega registrada.</p>
          ) : (
            <div className="space-y-2">
              {deliveries.map((d: any) => (
                <div key={d.id} className="p-3 rounded border border-border text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{d.event_type}</Badge>
                    <span className={`text-xs font-mono ${d.response_status && d.response_status < 300 ? "text-green-500" : "text-destructive"}`}>
                      {d.response_status || "pendente"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString("pt-BR")} · {d.attempts} tentativa(s)</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
