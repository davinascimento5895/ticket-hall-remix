import { useState, type Dispatch, type SetStateAction } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ticket, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { createTicketTier, deleteTicketTier } from "@/lib/api-producer";
import { getCapacityGroups } from "@/lib/api-checkout";
import { cn, formatBRL } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const SECTOR_COLORS = [
  "#E53E3E", "#DD6B20", "#D69E2E", "#38A169", "#3182CE",
  "#805AD5", "#D53F8C", "#2B6CB0", "#2C7A7B", "#9B2C2C",
];

interface TierDraft {
  id?: string;
  name: string;
  tier_type: string;
  price: number;
  quantity_total: number;
  description: string;
  min_per_order: number;
  max_per_order: number;
  is_transferable: boolean;
  capacity_group_id: string | null;
  is_hidden_by_default: boolean;
  unlock_code: string;
  sector_color: string;
  sale_start_date: string;
  sale_end_date: string;
  who_can_buy: string;
  is_visible: boolean;
  is_half_price: boolean;
}

export default function ProducerEventTicketsTab() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [tierDraft, setTierDraft] = useState<TierDraft>(emptyTier(0));

  function emptyTier(index: number): TierDraft {
    return {
      name: "",
      tier_type: "paid",
      price: 0,
      quantity_total: 100,
      description: "",
      min_per_order: 1,
      max_per_order: 5,
      is_transferable: true,
      capacity_group_id: null,
      is_hidden_by_default: false,
      unlock_code: "",
      sector_color: SECTOR_COLORS[index % SECTOR_COLORS.length],
      sale_start_date: "",
      sale_end_date: "",
      who_can_buy: "public",
      is_visible: true,
      is_half_price: false,
    };
  }

  const toTierDraft = (tier: any, index: number): TierDraft => ({
    id: tier.id,
    name: tier.name || "",
    tier_type: tier.tier_type || "paid",
    price: tier.price || 0,
    quantity_total: tier.quantity_total || 1,
    description: tier.description || "",
    min_per_order: tier.min_per_order || 1,
    max_per_order: tier.max_per_order || 10,
    is_transferable: tier.is_transferable ?? true,
    capacity_group_id: tier.capacity_group_id || null,
    is_hidden_by_default: tier.is_hidden_by_default ?? false,
    unlock_code: tier.unlock_code || "",
    sector_color: SECTOR_COLORS[index % SECTOR_COLORS.length],
    sale_start_date: tier.sale_start_date?.slice(0, 16) || "",
    sale_end_date: tier.sale_end_date?.slice(0, 16) || "",
    who_can_buy: "public",
    is_visible: tier.is_visible ?? true,
    is_half_price: false,
  });

  const { data: tiers, isLoading } = useQuery({
    queryKey: ["event-tiers-tab", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_tiers")
        .select("*")
        .eq("event_id", id!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });

  const { data: capacityGroups = [] } = useQuery({
    queryKey: ["capacity-groups", id],
    queryFn: () => getCapacityGroups(id!),
    enabled: !!id,
  });

  const { data: stats } = useQuery({
    queryKey: ["event-ticket-stats", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("status, tier_id")
        .eq("event_id", id!);
      if (error) throw error;
      const confirmed = data?.filter((t) => t.status === "active").length || 0;
      const pending = data?.filter((t) => t.status === "reserved").length || 0;
      const cancelled = data?.filter((t) => t.status === "cancelled").length || 0;
      return { confirmed, pending, cancelled };
    },
    enabled: !!id,
    staleTime: 30_000,
  });

  const toggleTierVisibility = async (tierId: string, currentValue: boolean | null) => {
    const nextVisible = !(currentValue ?? true);
    const { error } = await supabase
      .from("ticket_tiers")
      .update({ is_visible: nextVisible })
      .eq("id", tierId)
      .eq("event_id", id!);

    if (error) {
      toast({
        title: "Erro ao alterar visibilidade",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["event-tiers-tab", id] });
    toast({
      title: nextVisible ? "Ingresso visivel" : "Ingresso oculto",
      description: "A visibilidade foi atualizada com sucesso.",
    });
  };

  const invalidateTierQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["event-tiers-tab", id] }),
      queryClient.invalidateQueries({ queryKey: ["edit-event-tiers", id] }),
      queryClient.invalidateQueries({ queryKey: ["producer-event-panel", id] }),
    ]);
  };

  const openNewTierDialog = (type: string) => {
    setEditingTierId(null);
    setTierDraft({ ...emptyTier((tiers || []).length), tier_type: type });
    setTierDialogOpen(true);
  };

  const openEditTierDialog = (tier: any, index: number) => {
    setEditingTierId(tier.id);
    setTierDraft(toTierDraft(tier, index));
    setTierDialogOpen(true);
  };

  const saveTierFromDialog = async () => {
    if (!id) return;
    if (!tierDraft.name.trim()) {
      toast({ title: "Nome obrigatório", description: "Informe o nome do ingresso.", variant: "destructive" });
      return;
    }

    const tierData = {
      name: tierDraft.name,
      tier_type: tierDraft.tier_type,
      price: tierDraft.tier_type === "free" ? 0 : tierDraft.price,
      quantity_total: tierDraft.quantity_total,
      description: tierDraft.description,
      min_per_order: tierDraft.min_per_order,
      max_per_order: tierDraft.max_per_order,
      is_transferable: tierDraft.is_transferable,
      capacity_group_id: tierDraft.capacity_group_id || null,
      is_hidden_by_default: tierDraft.is_hidden_by_default,
      unlock_code: tierDraft.unlock_code || null,
      sale_start_date: tierDraft.sale_start_date ? new Date(tierDraft.sale_start_date).toISOString() : null,
      sale_end_date: tierDraft.sale_end_date ? new Date(tierDraft.sale_end_date).toISOString() : null,
      is_visible: tierDraft.is_visible,
      sort_order: editingTierId
        ? (tiers || []).findIndex((tier: any) => tier.id === editingTierId)
        : (tiers || []).length,
    };

    try {
      if (editingTierId) {
        const { error } = await supabase
          .from("ticket_tiers")
          .update(tierData)
          .eq("id", editingTierId)
          .eq("event_id", id);
        if (error) throw error;
      } else {
        await createTicketTier({ event_id: id, ...tierData });
      }

      await invalidateTierQueries();
      setTierDialogOpen(false);
      toast({ title: editingTierId ? "Ingresso atualizado" : "Ingresso criado" });
    } catch (error: any) {
      toast({ title: "Erro ao salvar ingresso", description: error.message, variant: "destructive" });
    }
  };

  const removeTier = async (tierId: string) => {
    try {
      await deleteTicketTier(tierId);
      await invalidateTierQueries();
      toast({ title: "Ingresso removido" });
    } catch (error: any) {
      toast({ title: "Erro ao remover ingresso", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-display font-bold text-primary">{stats?.confirmed || 0}</p>
            <p className="text-xs text-muted-foreground">Aprovados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-display font-bold">{stats?.pending || 0}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-display font-bold text-destructive">{stats?.cancelled || 0}</p>
            <p className="text-xs text-muted-foreground">Cancelados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tier list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ingressos configurados</CardTitle>
          <CardDescription>Configure os tipos de ingresso do evento no mesmo contexto de gestão.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !tiers || tiers.length === 0 ? (
            <div className="py-8 text-center">
              <Ticket className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum ingresso configurado.</p>
              <div className="mt-3 flex flex-col sm:flex-row items-center justify-center gap-2">
                <Button size="sm" variant="outline" onClick={() => openNewTierDialog("free")}>
                  <Plus className="h-4 w-4 mr-1" /> Gratuito
                </Button>
                <Button size="sm" variant="outline" onClick={() => openNewTierDialog("paid")}>
                  <Plus className="h-4 w-4 mr-1" /> Pago
                </Button>
                <Button size="sm" variant="outline" onClick={() => openNewTierDialog("donation")}>
                  <Plus className="h-4 w-4 mr-1" /> Doação
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {tiers.map((tier: any, index: number) => (
                <div
                  key={tier.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 hover:border-primary/40 transition-colors cursor-pointer"
                  onClick={() => openEditTierDialog(tier, index)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {tier.is_visible !== false ? (
                      <Eye className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {tier.name}
                        {tier.is_hidden_by_default && (
                          <Badge variant="secondary" className="ml-2 text-[10px]">Oculto</Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tier.tier_type === "free" ? "Gratuito" : formatBRL(tier.price || 0)}
                        {" · "}
                        {tier.quantity_total} un.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleTierVisibility(tier.id, tier.is_visible);
                      }}
                    >
                      {tier.is_visible !== false ? "Visível" : "Oculto"}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={(event) => {
                        event.stopPropagation();
                        void removeTier(tier.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => openNewTierDialog("free")}>
                  <Plus className="h-4 w-4 mr-1" /> Gratuito
                </Button>
                <Button size="sm" variant="outline" onClick={() => openNewTierDialog("paid")}>
                  <Plus className="h-4 w-4 mr-1" /> Pago
                </Button>
                <Button size="sm" variant="outline" onClick={() => openNewTierDialog("donation")}>
                  <Plus className="h-4 w-4 mr-1" /> Doação
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <TierDialog
        open={tierDialogOpen}
        onOpenChange={setTierDialogOpen}
        tier={tierDraft}
        setTier={setTierDraft}
        onSave={() => {
          void saveTierFromDialog();
        }}
        isEdit={!!editingTierId}
        capacityGroups={capacityGroups}
      />
    </div>
  );
}

function TierDialog({
  open,
  onOpenChange,
  tier,
  setTier,
  onSave,
  isEdit,
  capacityGroups,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  tier: TierDraft;
  setTier: Dispatch<SetStateAction<TierDraft>>;
  onSave: () => void;
  isEdit: boolean;
  capacityGroups: any[];
}) {
  const update = (field: keyof TierDraft, value: string | number | boolean | null) => {
    setTier((prev) => ({ ...prev, [field]: value }));
  };

  const isPaid = tier.tier_type === "paid";
  const isFree = tier.tier_type === "free";
  const isDonation = tier.tier_type === "donation";

  if (!open) return null;

  return (
    <Card className="mt-6">
      <CardHeader className="flex items-start justify-between gap-4">
        <div>
          <CardTitle>{isEdit ? "Editar ingresso" : "Novo ingresso"}</CardTitle>
          {(isPaid || isDonation) && (
            <CardDescription>
              {isPaid
                ? "A taxa de serviço é exibida ao comprador de forma separada no checkout."
                : "Este ingresso é uma doação: o comprador poderá escolher o valor no checkout."}
            </CardDescription>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
          Fechar
        </Button>
      </CardHeader>

      <CardContent className="space-y-5">
        <div>
          <h4 className="text-sm font-semibold text-primary mb-3">Sobre o ingresso</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Título do ingresso</Label>
              <Input
                value={tier.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="VIP, Meia-Entrada, etc."
                maxLength={45}
              />
            </div>
            <div>
              <Label className="text-xs">Quantidade</Label>
              <Input
                type="number"
                min={1}
                value={tier.quantity_total}
                onChange={(event) => update("quantity_total", parseInt(event.target.value, 10) || 1)}
              />
            </div>
            <div>
              <Label className="text-xs">Valor</Label>
              {isFree ? (
                <Input disabled value="Grátis" className="bg-muted" />
              ) : isDonation ? (
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={tier.price || ""}
                  onChange={(event) => update("price", parseFloat(event.target.value) || 0)}
                  placeholder="Opcional - valor livre no checkout"
                />
              ) : (
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={tier.price || ""}
                  onChange={(event) => update("price", parseFloat(event.target.value) || 0)}
                  placeholder="R$"
                />
              )}
            </div>
          </div>
          {isPaid && (
            <div className="flex items-center gap-2 mt-3">
              <Checkbox
                checked={tier.is_half_price}
                onCheckedChange={(value) => update("is_half_price", !!value)}
              />
              <Label className="text-xs">Criar meia-entrada para este ingresso</Label>
            </div>
          )}
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-semibold text-primary mb-3">Quando o ingresso será vendido</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Início das vendas</Label>
              <Input
                type="datetime-local"
                value={tier.sale_start_date}
                onChange={(event) => update("sale_start_date", event.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Término das vendas</Label>
              <Input
                type="datetime-local"
                value={tier.sale_end_date}
                onChange={(event) => update("sale_end_date", event.target.value)}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-semibold text-primary mb-3">Quem pode comprar</h4>
          <RadioGroup
            value={tier.who_can_buy}
            onValueChange={(value) => update("who_can_buy", value)}
            className="space-y-2"
          >
            <label className="flex items-center gap-2 cursor-pointer">
              <RadioGroupItem value="public" />
              <span className="text-sm">Para todo o público</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <RadioGroupItem value="guests" />
              <span className="text-sm">Restrito a convidados</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <RadioGroupItem value="manual" />
              <span className="text-sm">Para ser adicionado manualmente</span>
            </label>
          </RadioGroup>
        </div>

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3">Quantidade por compra</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Mínima</Label>
                <Input
                  type="number"
                  min={1}
                  value={tier.min_per_order}
                  onChange={(event) => update("min_per_order", parseInt(event.target.value, 10) || 1)}
                />
              </div>
              <div>
                <Label className="text-xs">Máxima</Label>
                <Input
                  type="number"
                  min={1}
                  value={tier.max_per_order}
                  onChange={(event) => update("max_per_order", parseInt(event.target.value, 10) || 5)}
                />
              </div>
            </div>
          </div>
          <div>
            <Label className="text-xs">Descrição (opcional)</Label>
            <Textarea
              value={tier.description}
              onChange={(event) => update("description", event.target.value)}
              rows={3}
              maxLength={100}
              placeholder="Ex.: Esse ingresso dá direito a um copo"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={tier.is_transferable}
              onCheckedChange={(value) => update("is_transferable", value)}
            />
            <Label className="text-xs">Transferível</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={tier.is_hidden_by_default}
              onCheckedChange={(value) => update("is_hidden_by_default", value)}
            />
            <Label className="text-xs">Ocultar até código de acesso</Label>
          </div>

          {tier.is_hidden_by_default && (
            <div>
              <Label className="text-xs">Código de acesso</Label>
              <Input
                value={tier.unlock_code}
                onChange={(event) => update("unlock_code", event.target.value)}
                placeholder="Ex: VIP2026"
                maxLength={50}
              />
            </div>
          )}

          {capacityGroups.length > 0 && (
            <div>
              <Label className="text-xs">Grupo de capacidade</Label>
              <Select
                value={tier.capacity_group_id || "none"}
                onValueChange={(value) => update("capacity_group_id", value === "none" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {capacityGroups.map((group: any) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name} ({group.sold_count}/{group.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Label className="text-xs whitespace-nowrap">Cor do setor</Label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {SECTOR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => update("sector_color", color)}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 transition-all",
                    tier.sector_color === color
                      ? "border-foreground scale-110 ring-2 ring-primary/30"
                      : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-2 mr-auto">
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded",
                tier.is_visible ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              {tier.is_visible ? "VISÍVEL" : "OCULTO"}
            </span>
            <Switch
              checked={tier.is_visible}
              onCheckedChange={(value) => update("is_visible", value)}
            />
            <Label className="text-xs">Visibilidade</Label>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={onSave}>{isEdit ? "Salvar" : "Criar ingresso"}</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
