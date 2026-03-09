import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Copy, Trash2, Users, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const fmt = (v: number) => `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

export default function ProducerEventPromoters() {
  const { id: eventId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showLink, setShowLink] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ promoter_id: "", commission_type: "percentage", commission_value: "", tracking_code: "" });

  const { data: promoters = [] } = useQuery({
    queryKey: ["promoters", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("promoters").select("*").eq("producer_id", user!.id).eq("status", "active").order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["promoter-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promoter_events")
        .select("*, promoters(name, email)")
        .eq("event_id", eventId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
    staleTime: 30_000,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const code = form.tracking_code.trim().toUpperCase().replace(/\s+/g, "-") ||
        `${promoters.find((p: any) => p.id === form.promoter_id)?.name?.split(" ")[0]?.toUpperCase() || "PROMO"}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const { error } = await supabase.from("promoter_events").insert({
        promoter_id: form.promoter_id,
        event_id: eventId!,
        producer_id: user!.id,
        commission_type: form.commission_type,
        commission_value: Number(form.commission_value) || 0,
        tracking_code: code,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoter-events", eventId] });
      setShowLink(false);
      setForm({ promoter_id: "", commission_type: "percentage", commission_value: "", tracking_code: "" });
      toast({ title: "Promoter vinculado ao evento!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promoter_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoter-events", eventId] });
      setDeletingId(null);
      toast({ title: "Vínculo removido!" });
    },
  });

  const { data: event } = useQuery({
    queryKey: ["event-slug", eventId],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("slug").eq("id", eventId!).single();
      return data;
    },
    enabled: !!eventId,
    staleTime: 30_000,
  });

  const copyFullLink = (code: string) => {
    const slug = event?.slug || eventId;
    const url = `${window.location.origin}/eventos/${slug}?ref=${code}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!" });
  };

  const alreadyLinked = assignments.map((a: any) => a.promoter_id);
  const availablePromoters = promoters.filter((p: any) => !alreadyLinked.includes(p.id));

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{assignments.length} promoter(s) vinculado(s)</p>
        <Button size="sm" onClick={() => setShowLink(true)} disabled={availablePromoters.length === 0}>
          <Plus className="h-4 w-4 mr-1" /> Vincular promoter
        </Button>
      </div>

      {availablePromoters.length === 0 && assignments.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Cadastre promoters primeiro em <strong>Promoters</strong> no menu lateral.
          </CardContent>
        </Card>
      )}

      {assignments.length > 0 && (
        <div className="space-y-3">
          {assignments.map((a: any) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{a.promoters?.name || "—"}</p>
                      <Badge variant={a.is_active ? "default" : "secondary"}>{a.is_active ? "Ativo" : "Inativo"}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p className="flex items-center gap-1"><LinkIcon className="h-3 w-3" /> Código: <code className="bg-muted px-1 rounded">{a.tracking_code}</code></p>
                      <p>Comissão: {a.commission_type === "percentage" ? `${a.commission_value}%` : fmt(a.commission_value)}</p>
                      <div className="flex gap-4 mt-1">
                        <span>Receita: {fmt(a.revenue_generated)}</span>
                        <span>Conversões: {a.conversions || 0}</span>
                        <span>Cliques: {a.clicks || 0}</span>
                        <span>Comissão Total: {fmt(a.commission_total)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => copyFullLink(a.tracking_code)} title="Copiar link">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeletingId(a.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover vínculo?</AlertDialogTitle>
            <AlertDialogDescription>O promoter será desvinculado deste evento. As comissões existentes serão mantidas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && deleteMut.mutate(deletingId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Link Promoter Dialog */}
      <Dialog open={showLink} onOpenChange={setShowLink}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular promoter ao evento</DialogTitle>
            <DialogDescription>Selecione o promoter e defina a comissão.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Promoter *</Label>
              <Select value={form.promoter_id} onValueChange={(v) => setForm((p) => ({ ...p, promoter_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione um promoter" /></SelectTrigger>
                <SelectContent>
                  {availablePromoters.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} {p.email ? `(${p.email})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo de comissão</Label>
                <Select value={form.commission_type} onValueChange={(v) => setForm((p) => ({ ...p, commission_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentual</SelectItem>
                    <SelectItem value="fixed">Valor fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{form.commission_type === "percentage" ? "Percentual (%)" : "Valor (R$)"}</Label>
                <Input type="number" value={form.commission_value} onChange={(e) => setForm((p) => ({ ...p, commission_value: e.target.value }))} placeholder={form.commission_type === "percentage" ? "10" : "5.00"} />
              </div>
            </div>
            <div>
              <Label>Código de rastreio (opcional)</Label>
              <Input value={form.tracking_code} onChange={(e) => setForm((p) => ({ ...p, tracking_code: e.target.value }))} placeholder="Gerado automaticamente se vazio" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLink(false)}>Cancelar</Button>
            <Button onClick={() => createMut.mutate()} disabled={!form.promoter_id || !form.commission_value || createMut.isPending}>
              Vincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
