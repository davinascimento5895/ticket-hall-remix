import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Star, StarOff, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Platform settings helpers — persisted in Supabase `platform_settings` table
// (single-row key–value: key TEXT PK, value JSONB).
// If the table doesn't exist yet, we gracefully fall back to localStorage so
// the UI never breaks.
// ---------------------------------------------------------------------------
async function getSetting(key: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from("platform_settings" as any)
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    return data?.value ?? null;
  } catch {
    // Table doesn't exist yet — fall back to localStorage
    const stored = localStorage.getItem(`ps_${key}`);
    return stored ? JSON.parse(stored) : null;
  }
}

async function setSetting(key: string, value: any): Promise<void> {
  try {
    const { error } = await supabase
      .from("platform_settings" as any)
      .upsert({ key, value } as any, { onConflict: "key" });
    if (error) throw error;
  } catch {
    // Fall back to localStorage
    localStorage.setItem(`ps_${key}`, JSON.stringify(value));
  }
}

// ---------------------------------------------------------------------------
// Featured events helpers (uses existing `is_featured` column on `events`)
// ---------------------------------------------------------------------------
async function getFeaturedEvents() {
  const { data, error } = await supabase
    .from("events")
    .select("id, title, start_date, status")
    .eq("is_featured", true)
    .order("start_date", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function toggleFeatured(eventId: string, featured: boolean) {
  const { error } = await supabase.from("events").update({ is_featured: featured }).eq("id", eventId);
  if (error) throw error;
}

// ===========================================================================
export default function AdminSettings() {
  const queryClient = useQueryClient();

  // ---- Maintenance mode ----
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceLoaded, setMaintenanceLoaded] = useState(false);

  useEffect(() => {
    getSetting("maintenance_mode").then((v) => {
      setMaintenanceMode(v === true);
      setMaintenanceLoaded(true);
    });
  }, []);

  const maintenanceMutation = useMutation({
    mutationFn: (on: boolean) => setSetting("maintenance_mode", on),
    onSuccess: (_, on) => {
      setMaintenanceMode(on);
      toast({ title: on ? "Modo manutenção ativado" : "Modo manutenção desativado" });
    },
    onError: (err: any) => toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" }),
  });

  // ---- Default platform fee ----
  const [defaultFee, setDefaultFee] = useState<number>(7);
  const [feeLoaded, setFeeLoaded] = useState(false);

  useEffect(() => {
    getSetting("default_platform_fee").then((v) => {
      if (v != null) setDefaultFee(Number(v));
      setFeeLoaded(true);
    });
  }, []);

  const feeMutation = useMutation({
    mutationFn: (fee: number) => setSetting("default_platform_fee", fee),
    onSuccess: () => toast({ title: "Taxa padrão atualizada" }),
    onError: (err: any) => toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" }),
  });

  // ---- Featured events ----
  const { data: featuredEvents, isLoading: featuredLoading } = useQuery({
    queryKey: ["admin-featured-events"],
    queryFn: getFeaturedEvents,
    staleTime: 30_000,
  });

  const removeFeaturedMutation = useMutation({
    mutationFn: (eventId: string) => toggleFeatured(eventId, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-featured-events"] });
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast({ title: "Evento removido dos destaques" });
    },
  });

  const statusLabel: Record<string, string> = { draft: "Rascunho", published: "Publicado", cancelled: "Cancelado", ended: "Encerrado" };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold">Configurações da Plataforma</h1>

      {/* Modo Manutenção */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Modo Manutenção</CardTitle>
          <CardDescription>Quando ativado, exibe uma página de manutenção para os visitantes.</CardDescription>
        </CardHeader>
        <CardContent>
          {!maintenanceLoaded ? (
            <Skeleton className="h-6 w-48" />
          ) : (
            <div className="flex items-center justify-between">
              <Label htmlFor="maintenance" className="text-sm">
                {maintenanceMode ? "Ativado — o site está em manutenção" : "Desativado — o site está disponível"}
              </Label>
              <Switch
                id="maintenance"
                checked={maintenanceMode}
                onCheckedChange={(v) => maintenanceMutation.mutate(v)}
                disabled={maintenanceMutation.isPending}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Taxa padrão */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Taxa Padrão da Plataforma</CardTitle>
          <CardDescription>Valor pré-definido ao criar novos eventos. Pode ser alterado individualmente em cada evento na página de Eventos.</CardDescription>
        </CardHeader>
        <CardContent>
          {!feeLoaded ? (
            <Skeleton className="h-9 w-40" />
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={30}
                  step={0.5}
                  value={defaultFee}
                  onChange={(e) => setDefaultFee(parseFloat(e.target.value) || 0)}
                  className="h-9 w-24 text-sm"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <Button
                size="sm"
                onClick={() => feeMutation.mutate(defaultFee)}
                disabled={feeMutation.isPending}
              >
                {feeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">Eventos gratuitos não possuem taxa.</p>
        </CardContent>
      </Card>

      {/* Eventos em destaque */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Eventos em Destaque</CardTitle>
          <CardDescription>Eventos marcados como destaque na página "Todos os Eventos". Para adicionar, use o ícone de estrela na listagem de Eventos.</CardDescription>
        </CardHeader>
        <CardContent>
          {featuredLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : !featuredEvents || featuredEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum evento em destaque. Marque eventos na página de Eventos.
            </p>
          ) : (
            <div className="space-y-2">
              {featuredEvents.map((evt: any) => (
                <div key={evt.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{evt.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(evt.start_date).toLocaleDateString("pt-BR")} · {statusLabel[evt.status] || evt.status}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFeaturedMutation.mutate(evt.id)}
                    disabled={removeFeaturedMutation.isPending}
                    className="text-accent hover:text-destructive transition-colors p-1"
                    title="Remover dos destaques"
                  >
                    <Star className="h-4 w-4 fill-accent" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Templates de E-mail (info card — real implementation needs email provider integration) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Templates de E-mail</CardTitle>
          <CardDescription>Personalização dos templates de e-mail enviados pela plataforma (confirmação de compra, ingresso, etc).</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            A configuração de templates de e-mail será disponibilizada após a integração com o provedor de e-mail transacional.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
