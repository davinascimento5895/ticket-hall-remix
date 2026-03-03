import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Copy, Trash2, Link2, QrCode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  eventId: string;
}

export function CheckinListsManager({ eventId }: Props) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [allowedTierIds, setAllowedTierIds] = useState<string[]>([]);

  const { data: lists = [], isLoading } = useQuery({
    queryKey: ["checkin-lists", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checkin_lists")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ["event-tiers-checkin", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_tiers")
        .select("id, name")
        .eq("event_id", eventId);
      if (error) throw error;
      return data;
    },
  });

  const { data: scanCounts = {} } = useQuery({
    queryKey: ["checkin-scan-counts", eventId],
    queryFn: async () => {
      const listIds = lists.map((l: any) => l.id);
      if (listIds.length === 0) return {};
      const { data, error } = await supabase
        .from("checkin_scan_logs")
        .select("checkin_list_id, result")
        .in("checkin_list_id", listIds);
      if (error) return {};
      const counts: Record<string, { success: number; total: number }> = {};
      for (const log of data || []) {
        if (!log.checkin_list_id) continue;
        if (!counts[log.checkin_list_id]) counts[log.checkin_list_id] = { success: 0, total: 0 };
        counts[log.checkin_list_id].total++;
        if (log.result === "success") counts[log.checkin_list_id].success++;
      }
      return counts;
    },
    enabled: lists.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const accessCode = crypto.randomUUID().slice(0, 12).toUpperCase();
      const { error } = await supabase.from("checkin_lists").insert({
        event_id: eventId,
        name,
        allowed_tier_ids: allowedTierIds.length > 0 ? allowedTierIds : null,
        access_code: accessCode,
        is_active: true,
        activated_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkin-lists", eventId] });
      setShowCreate(false);
      setName("");
      setAllowedTierIds([]);
      toast({ title: "Lista de check-in criada!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("checkin_lists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkin-lists", eventId] });
      toast({ title: "Lista removida" });
    },
  });

  const copyLink = (accessCode: string) => {
    const url = `${window.location.origin}/checkin/${accessCode}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!" });
  };

  const toggleTier = (tierId: string) => {
    setAllowedTierIds((prev) =>
      prev.includes(tierId) ? prev.filter((t) => t !== tierId) : [...prev, tierId]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-foreground">Listas de Check-in</h3>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nova lista
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : lists.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            <QrCode className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Nenhuma lista de check-in criada. Crie uma para compartilhar com sua equipe.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {lists.map((list: any) => {
            const counts = scanCounts[list.id] || { success: 0, total: 0 };
            return (
              <Card key={list.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground">{list.name}</p>
                        <Badge variant={list.is_active ? "default" : "secondary"}>
                          {list.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Código: <span className="font-mono">{list.access_code}</span>
                      </p>
                      {list.allowed_tier_ids && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {list.allowed_tier_ids.map((tid: string) => {
                            const tier = tiers.find((t: any) => t.id === tid);
                            return (
                              <Badge key={tid} variant="outline" className="text-xs">
                                {tier?.name || tid.slice(0, 8)}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {counts.success} check-ins · {counts.total} scans totais
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => copyLink(list.access_code)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => window.open(`/checkin/${list.access_code}`, "_blank")}
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(list.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova lista de check-in</DialogTitle>
            <DialogDescription>Crie um ponto de entrada para sua equipe realizar check-ins.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da lista</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Entrada VIP, Portão Principal"
              />
            </div>
            {tiers.length > 0 && (
              <div>
                <Label>Tipos de ingresso permitidos (deixe vazio para todos)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tiers.map((tier: any) => (
                    <button
                      key={tier.id}
                      onClick={() => toggleTier(tier.id)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        allowedTierIds.includes(tier.id)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                      }`}
                    >
                      {tier.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!name.trim() || createMutation.isPending}>
              Criar lista
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
