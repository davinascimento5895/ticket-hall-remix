import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getEventGuestList, addGuest, removeGuest, checkinGuest } from "@/lib/api-producer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

export default function ProducerEventGuestlist() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });


  const { data: guests, isLoading } = useQuery({
    queryKey: ["event-guestlist", id],
    queryFn: () => getEventGuestList(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const addMutation = useMutation({
    mutationFn: () => addGuest({ event_id: id!, name: form.name, email: form.email, phone: form.phone, added_by: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guestlist", id] });
      setForm({ name: "", email: "", phone: "" });
      setShowForm(false);
      toast({ title: "Convidado adicionado!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: removeGuest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guestlist", id] });
      setDeletingId(null);
      toast({ title: "Convidado removido." });
    },
  });

  const checkinMutation = useMutation({
    mutationFn: checkinGuest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guestlist", id] });
      toast({ title: "Check-in realizado!" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link to="/producer/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Lista de Convidados — {event?.title || "..."}</h1>
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1"><Plus className="h-4 w-4" />Adicionar</Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><Label className="text-xs">Nome</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
              <div><Label className="text-xs">E-mail</Label><Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></div>
              <div><Label className="text-xs">Telefone</Label><Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></div>
            </div>
            <Button size="sm" onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>Salvar</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : !guests || guests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum convidado na lista.</p>
          ) : (
            <div className="divide-y divide-border">
              {guests.map((guest: any) => (
                <div key={guest.id} className="flex items-center justify-between p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{guest.name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{guest.email || guest.phone || "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {guest.checked_in ? (
                      <span className="inline-flex items-center gap-1 text-sm text-success"><CheckCircle2 className="h-4 w-4" />Entrou</span>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => checkinMutation.mutate(guest.id)}>Check-in</Button>
                    )}
                    <button onClick={() => setDeletingId(guest.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover convidado?</AlertDialogTitle>
            <AlertDialogDescription>O convidado será removido da lista permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && removeMutation.mutate(deletingId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
