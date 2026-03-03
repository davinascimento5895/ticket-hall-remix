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
import { getEventCoupons, createCoupon, updateCoupon, deleteCoupon } from "@/lib/api-producer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

export default function ProducerEventCoupons() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", discount_type: "percentage", discount_value: 10, max_uses: 100 });

  const { data: event } = useQuery({
    queryKey: ["producer-event", id],
    queryFn: async () => { const { data } = await supabase.from("events").select("title").eq("id", id).single(); return data; },
    enabled: !!id,
  });

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["event-coupons", id],
    queryFn: () => getEventCoupons(id!),
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
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-coupons", id] });
      setForm({ code: "", discount_type: "percentage", discount_value: 10, max_uses: 100 });
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

  return (
    <div className="space-y-6">
      <div>
        <Link to="/producer/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Cupons — {event?.title || "..."}</h1>
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
            </div>
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
                    <th className="p-3 font-medium">Ativo</th>
                    <th className="p-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon: any) => (
                    <tr key={coupon.id} className="border-b border-border/50">
                      <td className="p-3 font-mono font-medium">{coupon.code}</td>
                      <td className="p-3">{coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `R$ ${coupon.discount_value.toFixed(2).replace(".", ",")}`}</td>
                      <td className="p-3 text-muted-foreground">{coupon.uses_count || 0}{coupon.max_uses ? ` / ${coupon.max_uses}` : ""}</td>
                      <td className="p-3">
                        <Switch checked={coupon.is_active} onCheckedChange={(v) => toggleMutation.mutate({ couponId: coupon.id, isActive: v })} />
                      </td>
                      <td className="p-3">
                        <button onClick={() => deleteMutation.mutate(coupon.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
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
