import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit2, Users, Ban, CheckCircle } from "lucide-react";
import { getPromoters, createPromoter, updatePromoter, deletePromoter } from "@/lib/api-promoters";
import { toast } from "@/hooks/use-toast";

const fmt = (v: number) => `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

export default function ProducerPromotersList({ producerId }: { producerId: string }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", cpf: "", pix_key: "", notes: "" });

  const { data: promoters = [], isLoading } = useQuery({
    queryKey: ["promoters", producerId],
    queryFn: () => getPromoters(producerId),
    staleTime: 30_000,
  });

  const createMut = useMutation({
    mutationFn: () => createPromoter({ producer_id: producerId, ...form }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoters"] });
      setShowCreate(false);
      resetForm();
      toast({ title: "Promoter adicionado!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: () => updatePromoter(editingId!, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoters"] });
      setEditingId(null);
      resetForm();
      toast({ title: "Promoter atualizado!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deletePromoter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoters"] });
      setDeletingId(null);
      toast({ title: "Promoter removido!" });
    },
  });

  const toggleStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updatePromoter(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoters"] });
      toast({ title: "Status atualizado!" });
    },
  });

  const resetForm = () => setForm({ name: "", email: "", phone: "", cpf: "", pix_key: "", notes: "" });

  const openEdit = (p: any) => {
    setForm({ name: p.name, email: p.email || "", phone: p.phone || "", cpf: p.cpf || "", pix_key: p.pix_key || "", notes: p.notes || "" });
    setEditingId(p.id);
  };

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: any; label: string }> = {
      active: { variant: "default", label: "Ativo" },
      inactive: { variant: "secondary", label: "Inativo" },
      blocked: { variant: "destructive", label: "Bloqueado" },
    };
    const s = map[status] || { variant: "secondary", label: status };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{promoters.length} promoter(s) cadastrado(s)</p>
        <Button size="sm" onClick={() => { resetForm(); setShowCreate(true); }}><Plus className="h-4 w-4 mr-1" /> Novo promoter</Button>
      </div>

      {promoters.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground"><Users className="h-8 w-8 mx-auto mb-2 opacity-50" />Nenhum promoter cadastrado.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {promoters.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{p.name}</p>
                      {statusBadge(p.status)}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {p.email && <p>{p.email}</p>}
                      {p.phone && <p>{p.phone}</p>}
                      <div className="flex gap-4 mt-1">
                        <span>Vendas: {fmt(p.total_sales || 0)}</span>
                        <span>Comissão: {fmt(p.total_commission_earned || 0)}</span>
                        <span>Pago: {fmt(p.total_commission_paid || 0)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Edit2 className="h-4 w-4" /></Button>
                    {p.status === "active" ? (
                      <Button size="icon" variant="ghost" onClick={() => toggleStatusMut.mutate({ id: p.id, status: "inactive" })} title="Desativar">
                        <Ban className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    ) : (
                      <Button size="icon" variant="ghost" onClick={() => toggleStatusMut.mutate({ id: p.id, status: "active" })} title="Ativar">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeletingId(p.id)}>
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
            <AlertDialogTitle>Remover promoter?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação é permanente e removerá todos os vínculos deste promoter.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && deleteMut.mutate(deletingId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreate || !!editingId} onOpenChange={(open) => { if (!open) { setShowCreate(false); setEditingId(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar promoter" : "Novo promoter"}</DialogTitle>
            <DialogDescription>Cadastre ou edite os dados do promoter.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome completo" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="(11) 99999-9999" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>CPF</Label><Input value={form.cpf} onChange={(e) => setForm(p => ({ ...p, cpf: e.target.value }))} placeholder="000.000.000-00" /></div>
              <div><Label>Chave PIX</Label><Input value={form.pix_key} onChange={(e) => setForm(p => ({ ...p, pix_key: e.target.value }))} /></div>
            </div>
            <div><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditingId(null); resetForm(); }}>Cancelar</Button>
            <Button
              onClick={() => editingId ? updateMut.mutate() : createMut.mutate()}
              disabled={!form.name || createMut.isPending || updateMut.isPending}
            >
              {editingId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
