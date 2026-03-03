import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Copy, Trash2, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export default function ProducerEventAffiliates() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", commission_type: "percentage", commission_value: "" });

  const { data: event } = useQuery({
    queryKey: ["producer-event", id],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("title, slug").eq("id", id).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: affiliates = [], isLoading } = useQuery({
    queryKey: ["event-affiliates", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliates")
        .select("*")
        .eq("event_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const code = form.code.trim().toUpperCase().replace(/\s+/g, "-") || form.name.trim().toUpperCase().replace(/\s+/g, "-").slice(0, 12);
      const { error } = await supabase.from("affiliates").insert({
        event_id: id!,
        producer_id: user!.id,
        name: form.name,
        code,
        commission_type: form.commission_type,
        commission_value: parseFloat(form.commission_value) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-affiliates"] });
      setShowCreate(false);
      setForm({ name: "", code: "", commission_type: "percentage", commission_value: "" });
      toast({ title: "Afiliado criado!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (affId: string) => {
      const { error } = await supabase.from("affiliates").delete().eq("id", affId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-affiliates"] });
      toast({ title: "Afiliado removido" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ affId, active }: { affId: string; active: boolean }) => {
      const { error } = await supabase.from("affiliates").update({ is_active: active }).eq("id", affId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event-affiliates"] }),
  });

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/eventos/${event?.slug || ""}?ref=${code}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!" });
  };

  const fmt = (v: number) => `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

  const totalClicks = affiliates.reduce((s: number, a: any) => s + (a.clicks || 0), 0);
  const totalConversions = affiliates.reduce((s: number, a: any) => s + (a.conversions || 0), 0);
  const totalRevenue = affiliates.reduce((s: number, a: any) => s + (a.revenue_generated || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <Link to="/producer/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <h1 className="font-display text-2xl font-bold">Afiliados — {event?.title || "..."}</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-display font-bold">{totalClicks}</p><p className="text-xs text-muted-foreground">Cliques</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-display font-bold text-primary">{totalConversions}</p><p className="text-xs text-muted-foreground">Conversões</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-display font-bold">{fmt(totalRevenue)}</p><p className="text-xs text-muted-foreground">Receita gerada</p></CardContent></Card>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-foreground">Links de afiliados</h3>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> Novo afiliado</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : affiliates.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground"><BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />Nenhum afiliado criado ainda.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {affiliates.map((aff: any) => (
            <Card key={aff.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground">{aff.name}</p>
                      <Badge variant={aff.is_active ? "default" : "secondary"}>{aff.is_active ? "Ativo" : "Inativo"}</Badge>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground mb-2">?ref={aff.code}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{aff.clicks || 0} cliques</span>
                      <span>{aff.conversions || 0} conversões</span>
                      <span>{fmt(aff.revenue_generated || 0)} receita</span>
                      <span>Comissão: {aff.commission_type === "percentage" ? `${aff.commission_value}%` : fmt(aff.commission_value)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => copyLink(aff.code)}><Copy className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => toggleMutation.mutate({ affId: aff.id, active: !aff.is_active })}>
                      {aff.is_active ? <Badge variant="outline" className="text-xs">On</Badge> : <Badge variant="secondary" className="text-xs">Off</Badge>}
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(aff.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo afiliado</DialogTitle>
            <DialogDescription>Crie um link rastreável para parceiros e influenciadores.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome do afiliado</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Ex: Influencer João" /></div>
            <div><Label>Código (opcional, gerado automaticamente)</Label><Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="JOAO2025" maxLength={20} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo de comissão</Label>
                <Select value={form.commission_type} onValueChange={(v) => setForm((p) => ({ ...p, commission_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentual (%)</SelectItem>
                    <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Valor</Label><Input type="number" step="0.01" value={form.commission_value} onChange={(e) => setForm((p) => ({ ...p, commission_value: e.target.value }))} placeholder="5" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!form.name.trim() || createMutation.isPending}>Criar afiliado</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
