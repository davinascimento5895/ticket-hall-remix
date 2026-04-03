import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Star, StarOff, Loader2, Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SearchInput } from "@/components/ui/search-input";
import { EventImage } from "@/components/EventImage";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EmptyState } from "@/components/EmptyState";
import { getAllEvents } from "@/lib/api-admin";
import { getEventStatusLabel } from "@/components/EventStatusBadge";

async function getSetting(key: string): Promise<any> {
  try {
    const { data, error } = await (supabase as any).from("platform_settings").select("value").eq("key", key).maybeSingle();
    if (error) throw error;
    return (data as any)?.value ?? null;
  } catch {
    const stored = localStorage.getItem(`ps_${key}`);
    return stored ? JSON.parse(stored) : null;
  }
}

async function setSetting(key: string, value: any): Promise<void> {
  try {
    const { error } = await supabase.from("platform_settings" as any).upsert({ key, value } as any, { onConflict: "key" });
    if (error) throw error;
  } catch {
    localStorage.setItem(`ps_${key}`, JSON.stringify(value));
  }
}

async function toggleFeatured(eventId: string, featured: boolean) {
  const { error } = await supabase.from("events").update({ is_featured: featured }).eq("id", eventId);
  if (error) throw error;
}

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceLoaded, setMaintenanceLoaded] = useState(false);
  const [search, setSearch] = useState("");

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

  const { data: allEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["admin-settings-events"],
    queryFn: () => getAllEvents({ status: "all" }),
    staleTime: 30_000,
  });

  const filteredEvents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return allEvents;
    return allEvents.filter((evt: any) => {
      return [evt.title, evt.slug, evt.venue_city, evt.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [allEvents, search]);

  const featuredEvents = useMemo(() => filteredEvents.filter((evt: any) => evt.is_featured), [filteredEvents]);
  const availableEvents = useMemo(() => filteredEvents.filter((evt: any) => !evt.is_featured), [filteredEvents]);

  const featuredMutation = useMutation({
    mutationFn: ({ eventId, featured }: { eventId: string; featured: boolean }) => toggleFeatured(eventId, featured),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings-events"] });
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["admin-featured-events"] });
      toast({ title: vars.featured ? "Evento adicionado aos destaques" : "Evento removido dos destaques" });
    },
    onError: (err: any) => toast({ title: "Erro ao atualizar destaque", description: err.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Configurações da plataforma"
        title="Configurações"
        description="A manutenção agora persiste em backend e os destaques são gerenciados diretamente nesta tela, com busca e ação rápida para adicionar ou remover eventos."
      >
        <div className="flex flex-wrap gap-2">
          <Badge className="border-border/70 bg-background/70 text-muted-foreground">Taxa por evento ativa</Badge>
          <Badge className="border-border/70 bg-background/70 text-muted-foreground">Destaques em tempo real</Badge>
        </div>
      </AdminPageHeader>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Modo Manutenção</CardTitle>
            <CardDescription>Quando ativado, exibe uma página de manutenção para visitantes fora do painel.</CardDescription>
          </CardHeader>
          <CardContent>
            {!maintenanceLoaded ? (
              <Skeleton className="h-6 w-48" />
            ) : (
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
                <div>
                  <Label htmlFor="maintenance" className="text-sm font-medium">
                    {maintenanceMode ? "Ativado" : "Desativado"}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {maintenanceMode ? "O site público está em modo de manutenção" : "O site público está disponível"}
                  </p>
                </div>
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

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-base">Eventos em Destaque</CardTitle>
                <CardDescription>Adicione ou remova eventos destacados sem precisar ir para outra tela.</CardDescription>
              </div>
              <div className="w-full max-w-md">
                <SearchInput placeholder="Buscar por nome, cidade ou slug..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {eventsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <EmptyState
                icon={Search}
                title="Nenhum evento encontrado"
                description="Tente uma busca diferente para localizar o evento que deseja destacar."
                actionLabel="Limpar busca"
                onAction={() => setSearch("")}
              />
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Em destaque</p>
                    <Badge className="border-accent/20 bg-accent/10 text-accent">{featuredEvents.length}</Badge>
                  </div>
                  {featuredEvents.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
                      Nenhum evento em destaque. Use a lista ao lado para adicionar.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {featuredEvents.map((evt: any) => (
                        <div key={evt.id} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/70 p-3 transition-colors hover:bg-muted/20">
                          <div className="h-14 w-20 overflow-hidden rounded-xl border border-border/70 bg-muted">
                            <EventImage src={evt.cover_image_url} alt={evt.title} className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{evt.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {evt.venue_city || "Sem cidade"}
                              {evt.start_date ? ` · ${format(new Date(evt.start_date), "dd MMM yyyy", { locale: ptBR })}` : ""}
                            </p>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{getEventStatusLabel(evt.status)}</p>
                          </div>
                          <button
                            onClick={() => featuredMutation.mutate({ eventId: evt.id, featured: false })}
                            disabled={featuredMutation.isPending}
                            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
                            title="Remover dos destaques"
                          >
                            <Star className="h-4 w-4 fill-accent text-accent" />
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Disponíveis para destaque</p>
                    <Badge className="border-border/70 bg-background/70 text-muted-foreground">{availableEvents.length}</Badge>
                  </div>
                  {availableEvents.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
                      Todos os eventos filtrados já estão em destaque.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {availableEvents.map((evt: any) => (
                        <div key={evt.id} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/30">
                          <div className="h-14 w-20 overflow-hidden rounded-xl border border-border/70 bg-muted">
                            <EventImage src={evt.cover_image_url} alt={evt.title} className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{evt.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {evt.venue_city || "Sem cidade"}
                              {evt.start_date ? ` · ${format(new Date(evt.start_date), "dd MMM yyyy", { locale: ptBR })}` : ""}
                            </p>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{getEventStatusLabel(evt.status)}</p>
                          </div>
                          <button
                            onClick={() => featuredMutation.mutate({ eventId: evt.id, featured: true })}
                            disabled={featuredMutation.isPending}
                            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                            title="Adicionar aos destaques"
                          >
                            <StarOff className="h-4 w-4" />
                            Destacar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {featuredMutation.isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Atualizando destaques...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Templates de E-mail</CardTitle>
          <CardDescription>Personalização dos templates de e-mail enviados pela plataforma (confirmação de compra, ingresso, etc).</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="py-4 text-center text-sm text-muted-foreground">
            A configuração de templates de e-mail será disponibilizada após a integração com o provedor de e-mail transacional.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}