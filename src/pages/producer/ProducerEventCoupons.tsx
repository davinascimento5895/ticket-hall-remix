import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getEventCoupons, createCoupon, updateCoupon, deleteCoupon, getEventTiersBasic } from "@/lib/api-producer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { formatBRL } from "@/lib/utils";
import { useState } from "react";

export default function ProducerEventCoupons() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: 10,
    max_uses: 100,
    valid_from: "",
    valid_until: "",
    min_order_value: 0,
    applicable_tier_ids: [] as string[],
  });

  const { data: event } = useQuery({
    queryKey: ["producer-event", id],
    queryFn: async () => { const { data } = await supabase.from("events").select("title").eq("id", id).single(); return data; },
    enabled: !!id,
    staleTime: 30_000,
  });

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["event-coupons", id],
    queryFn: () => getEventCoupons(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ["event-tiers-basic", id],
    queryFn: () => getEventTiersBasic(id!),
    enabled: !!id,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createCoupon({
        event_id: id!,
        producer_id: user!.id,
        code: form.code.toUpperCase(),
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        max_uses: form.max_uses,
        valid_from: form.valid_from || undefined,
        valid_until: form.valid_until || undefined,
        min_order_value: form.min_order_value || undefined,
        applicable_tier_ids: form.applicable_tier_ids.length > 0 ? form.applicable_tier_ids : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-coupons", id] });
      setForm({ code: "", discount_type: "percentage", discount_value: 10, max_uses: 100, valid_from: "", valid_until: "", min_order_value: 0, applicable_tier_ids: [] });
      setShowForm(false);
      toast({ title: "Cupom criado!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ couponId, isActive }: { couponId: string; isActive: boolean }) => updateCoupon(couponId, { is_active: isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event-coupons", id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-coupons", id] });
      toast({ title: "Cupom removido." });
    },
  });

  const toggleTier = (tierId: string) => {
    setForm((p) => ({
      ...p,
      applicable_tier_ids: p.applicable_tier_ids.includes(tierId)
        ? p.applicable_tier_ids.filter((id) => id !== tierId)
        : [...p.applicable_tier_ids, tierId],
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Cupons — {event?.title || "..."}</h2>
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1"><Plus className="h-4 w-4" />Criar cupom</Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label className="text-xs">Código *</Label><Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="EX: DESCONTO20" /></div>
              <div><Label className="text-xs">Tipo de desconto</Label>
                <Select value={form.discount_type} onValueChange={(v) => setForm((p) => ({ ...p, discount_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                    <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Valor do desconto</Label><Input type="number" min={0} value={form.discount_value} onChange={(e) => setForm((p) => ({ ...p, discount_value: parseFloat(e.target.value) || 0 }))} /></div>
              <div><Label className="text-xs">Limite de usos</Label><Input type="number" min={1} value={form.max_uses} onChange={(e) => setForm((p) => ({ ...p, max_uses: parseInt(e.target.value) || 100 }))} /></div>
              <div><Label className="text-xs">Válido a partir de</Label><Input type="datetime-local" value={form.valid_from} onChange={(e) => setForm((p) => ({ ...p, valid_from: e.target.value }))} /></div>
              <div><Label className="text-xs">Válido até</Label><Input type="datetime-local" value={form.valid_until} onChange={(e) => setForm((p) => ({ ...p, valid_until: e.target.value }))} /></div>
              <div><Label className="text-xs">Valor mínimo do pedido (R$)</Label><Input type="number" min={0} value={form.min_order_value} onChange={(e) => setForm((p) => ({ ...p, min_order_value: parseFloat(e.target.value) || 0 }))} /></div>
            </div>

            {tiers.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs">Ingressos aplicáveis (vazio = todos)</Label>
                <div className="flex flex-wrap gap-3">
                  {tiers.map((tier: any) => (
                    <label key={tier.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.applicable_tier_ids.includes(tier.id)}
                        onCheckedChange={() => toggleTier(tier.id)}
                      />
                      {tier.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <Button size="sm" onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.code}>Criar</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !coupons || coupons.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum cupom criado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-3 font-medium">Código</th>
                    <th className="p-3 font-medium">Desconto</th>
                    <th className="p-3 font-medium">Usos</th>
                    <th className="p-3 font-medium">Validade</th>
                    <th className="p-3 font-medium">Ativo</th>
                    <th className="p-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon: any) => (
                    <tr key={coupon.id} className="border-b border-border/50">
                      <td className="p-3 font-mono font-medium">{coupon.code}</td>
                      <td className="p-3">{coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : formatBRL(coupon.discount_value)}</td>
                      <td className="p-3 text-muted-foreground">{coupon.uses_count || 0}{coupon.max_uses ? ` / ${coupon.max_uses}` : ""}</td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {coupon.valid_from ? new Date(coupon.valid_from).toLocaleDateString("pt-BR") : "—"}
                        {" → "}
                        {coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td className="p-3">
                        <Switch checked={coupon.is_active} onCheckedChange={(v) => toggleMutation.mutate({ couponId: coupon.id, isActive: v })} />
                      </td>
                      <td className="p-3">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover cupom?</AlertDialogTitle>
                              <AlertDialogDescription>
                                O cupom <strong>{coupon.code}</strong> será removido permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(coupon.id)}>Remover</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
