import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, StarOff, Percent, ChevronLeft, ChevronRight, ArrowRight, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EventStatusBadge } from "@/components/EventStatusBadge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { EventImage } from "@/components/EventImage";
import { getAllEventsPaginated, adminUpdateEvent, adminDeleteEvent } from "@/lib/api-admin";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { ForceDeleteEventDialog } from "@/components/admin/ForceDeleteEventDialog";
import { getEventStatusLabel } from "@/components/EventStatusBadge";

function FeeEditor({ eventId, currentFee, onSave }: { eventId: string; currentFee: number; onSave: (id: string, fee: number) => void }) {
  const [fee, setFee] = useState(currentFee);
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 justify-between gap-2 border-border/80 bg-background/80 text-xs shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="inline-flex items-center gap-1.5">
            <Percent className="h-3.5 w-3.5" />
            Taxa {currentFee}%
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-3" align="start">
        <div className="space-y-3">
          <p className="text-xs font-medium text-foreground">Taxa por evento</p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={30}
              step={0.5}
              value={fee}
              onChange={(e) => setFee(parseFloat(e.target.value) || 0)}
              className="h-9 text-sm"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Eventos gratuitos ignoram esta taxa. O padrão do sistema é 7%.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                onSave(eventId, fee);
                setOpen(false);
              }}
            >
              Salvar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const sortOptions = [
  { value: "recent", label: "Mais recentes" },
  { value: "soonest", label: "Próximos" },
  { value: "featured", label: "Destaques" },
  { value: "highest_fee", label: "Maior taxa" },
] as const;

export default function AdminEvents() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]["value"]>("recent");

  const {
    items: events,
    totalCount,
    page,
    totalPages,
    pageSize,
    setPage,
    resetPage,
    isLoading,
  } = usePaginatedQuery({
    queryKey: ["admin-events", statusFilter, debouncedSearch, sortBy],
    queryFn: (range) => getAllEventsPaginated({ status: statusFilter, search: debouncedSearch || undefined, sortBy }, range),
    pageSize: 12,
    staleTime: 2 * 60_000,
  });

  useEffect(() => {
    resetPage();
  }, [statusFilter, debouncedSearch, sortBy, resetPage]);

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, any> }) => adminUpdateEvent(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["admin-featured-events"] });
      queryClient.invalidateQueries({ queryKey: ["admin-settings-events"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-events"] });
      toast({ title: "Evento atualizado" });
    },
    onError: (err: any) => toast({ title: "Erro ao atualizar evento", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["admin-featured-events"] });
      queryClient.invalidateQueries({ queryKey: ["admin-settings-events"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-events"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-finance"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order-events"] });
      toast({ title: "Evento removido com sucesso" });
    },
    onError: (err: any) => toast({ title: "Erro ao remover", description: err.message, variant: "destructive" }),
  });

  const handleFeeUpdate = (id: string, fee: number) => {
    updateMutation.mutate({ id, updates: { platform_fee_percent: fee } });
  };

  const statuses = [
    { value: "all", label: "Todos" },
    { value: "draft", label: "Rascunho" },
    { value: "published", label: "Publicado" },
    { value: "cancelled", label: "Cancelado" },
    { value: "ended", label: "Encerrado" },
  ];

  const openEvent = (eventId?: string | null) => {
    if (!eventId) return;
    navigate(`/admin/events/${eventId}/panel`);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Catálogo operacional"
        title="Eventos"
        description="Cada evento abre o mesmo painel operacional usado pelo produtor. A lista permite criar, ajustar taxa, destacar e remover de forma forçada sem sair da área administrativa."
        actions={
          <Button size="sm" onClick={() => navigate("/admin/events/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Criar evento
          </Button>
        }
      />

      <Card className="border-border/80 shadow-sm">
        <CardContent className="p-4 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl flex-1">
              <SearchInput placeholder="Buscar evento, cidade ou slug..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    sortBy === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {statuses.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  statusFilter === s.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-border/80 shadow-sm">
              <Skeleton className="aspect-[16/9] w-full" />
              <CardContent className="space-y-3 p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
        ) : events.length === 0 ? (
          <div className="sm:col-span-2 xl:col-span-3">
            <Card className="border-border/80 shadow-sm">
              <CardContent className="p-0">
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <p className="text-base font-medium">Nenhum evento encontrado</p>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Ajuste a busca, a ordenação ou o status para localizar o evento desejado.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          events.map((event: any) => {
            const currentFee = event.platform_fee_percent ?? 7;
            return (
              <Card
                key={event.id}
                className="group overflow-hidden border-border/80 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              >
                <button
                  type="button"
                  className="block w-full text-left focus:outline-none"
                  onClick={() => openEvent(event.id)}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && event.id) {
                      e.preventDefault();
                      openEvent(event.id);
                    }
                  }}
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                    <EventImage
                      src={event.cover_image_url}
                      alt={event.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <EventStatusBadge status={event.status} />
                      {event.is_featured ? <Badge className="border-0 bg-accent/15 text-[10px] text-accent">Destaque</Badge> : null}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-black/80 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-white/70">Taxa por evento</p>
                      <div className="mt-1 flex items-baseline gap-2 text-white">
                        <span className="font-display text-3xl font-bold">{currentFee}%</span>
                        <span className="text-sm text-white/80">sobre a venda bruta</span>
                      </div>
                    </div>
                  </div>
                </button>

                <CardContent className="space-y-4 p-4 md:p-5">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-display text-xl font-bold leading-tight text-foreground">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {event.profiles?.full_name || "Produtor não identificado"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEvent(event.id)}
                        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Abrir <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {event.venue_city || "Sem cidade"}
                      {event.start_date ? ` · ${format(new Date(event.start_date), "dd MMM yyyy", { locale: ptBR })}` : ""}
                    </p>
                    {event.category ? (
                      <Badge variant="secondary" className="mt-1 w-fit bg-secondary/80 text-xs capitalize">
                        {event.category}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="rounded-2xl border border-border/70 bg-muted/30 p-3 text-left transition-colors hover:bg-muted/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEvent(event.id);
                      }}
                    >
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Destino</p>
                      <p className="mt-1 truncate text-sm font-medium">{event.venue_city || "Online"}</p>
                    </button>
                    <button
                      type="button"
                      className="rounded-2xl border border-border/70 bg-muted/30 p-3 text-left transition-colors hover:bg-muted/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEvent(event.id);
                      }}
                    >
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Status</p>
                      <p className="mt-1 text-sm font-medium">{getEventStatusLabel(event.status)}</p>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <FeeEditor eventId={event.id} currentFee={currentFee} onSave={handleFeeUpdate} />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateMutation.mutate({ id: event.id, updates: { is_featured: !event.is_featured } });
                      }}
                    >
                      {event.is_featured ? <Star className="h-3.5 w-3.5 fill-accent text-accent" /> : <StarOff className="h-3.5 w-3.5" />}
                      {event.is_featured ? "Remover destaque" : "Destacar"}
                    </Button>

                    <div onClick={(e) => e.stopPropagation()}>
                      <ForceDeleteEventDialog
                        eventTitle={event.title}
                        onConfirm={() => deleteMutation.mutateAsync(event.id)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {totalCount > pageSize && (
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            {totalCount} evento(s) · Página {page} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
