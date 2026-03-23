import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { Plus, MoreHorizontal, Eye, BarChart3, Users, Edit, ShoppingCart, ScanLine, Tag, CalendarDays, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EventStatusBadge } from "@/components/EventStatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { getProducerEvents } from "@/lib/api-producer";
import { useNavigate } from "react-router-dom";

export default function ProducerEvents() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  const { data: events, isLoading } = useQuery({
    queryKey: ["producer-events", user?.id],
    queryFn: () => getProducerEvents(user!.id),
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const filteredEvents = useMemo(() => {
    if (!events) return [];

    return events.filter((event: any) => {
      const matchesStatus = statusFilter === "all" ? true : event.status === statusFilter;
      const searchTerm = search.trim().toLowerCase();
      const matchesSearch = !searchTerm
        ? true
        : [event.title, event.venue_city, event.slug].filter(Boolean).join(" ").toLowerCase().includes(searchTerm);

      return matchesStatus && matchesSearch;
    });
  }, [events, search, statusFilter]);

  const summary = useMemo(() => {
    const source = events || [];
    const published = source.filter((event: any) => event.status === "published").length;
    const drafts = source.filter((event: any) => event.status === "draft").length;
    const upcoming = source.filter((event: any) => new Date(event.start_date) > new Date()).length;
    const sold = source.reduce((sum: number, event: any) => {
      const soldByEvent = event.ticket_tiers?.reduce((acc: number, tier: any) => acc + (tier.quantity_sold || 0), 0) || 0;
      return sum + soldByEvent;
    }, 0);

    return { total: source.length, published, drafts, upcoming, sold };
  }, [events]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Meus Eventos</h1>
          <p className="text-sm text-muted-foreground">Gerencie sua agenda, monitore lotes e acesse atalhos operacionais.</p>
        </div>
        <Button asChild>
          <Link to="/producer/events/new" className="gap-2">
            <Plus className="h-4 w-4" /> Criar evento
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Card className="border-border/80">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-display font-bold mt-1">{summary.total}</p>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Publicados</p>
            <p className="text-xl font-display font-bold mt-1">{summary.published}</p>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Rascunhos</p>
            <p className="text-xl font-display font-bold mt-1">{summary.drafts}</p>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Próximos</p>
            <p className="text-xl font-display font-bold mt-1">{summary.upcoming}</p>
          </CardContent>
        </Card>
        <Card className="border-border/80 col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Ingressos vendidos</p>
            <p className="text-xl font-display font-bold mt-1">{summary.sold.toLocaleString("pt-BR")}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtrar eventos</CardTitle>
          <CardDescription>Encontre rapidamente eventos por nome, cidade ou status.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título, slug ou cidade"
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("all")}>Todos</Button>
              <Button variant={statusFilter === "published" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("published")}>Publicados</Button>
              <Button variant={statusFilter === "draft" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("draft")}>Rascunhos</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {!events || events.length === 0 ? (
        <EmptyState
          icon={<Plus className="h-12 w-12" />}
          title="Nenhum evento criado"
          description="Crie seu primeiro evento e comece a vender ingressos."
          actionLabel="Criar evento"
          onAction={() => navigate("/producer/events/new")}
        />
      ) : (
        <div className="grid gap-4">
          {filteredEvents.map((event: any) => {
            const totalSold = event.ticket_tiers?.reduce((s: number, t: any) => s + (t.quantity_sold || 0), 0) || 0;
            const totalCapacity = event.ticket_tiers?.reduce((s: number, t: any) => s + (t.quantity_total || 0), 0) || 0;
            const occupancy = totalCapacity > 0 ? Math.min(100, Math.round((totalSold / totalCapacity) * 100)) : 0;
            const eventDate = new Date(event.start_date);
            const formattedDate = eventDate.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
            const isUpcoming = eventDate > new Date();

            return (
              <Card
                key={event.id}
                onClick={() => navigate(`/producer/events/${event.id}/panel`)}
                className="cursor-pointer border-border/80 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardContent className="p-4 md:p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start">
                    {event.cover_image_url ? (
                      <img
                        src={event.cover_image_url}
                        alt={event.title}
                        className="h-20 w-full rounded-lg object-cover md:h-24 md:w-40"
                      />
                    ) : (
                      <div className="flex h-20 w-full items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground md:h-24 md:w-40">
                        Sem capa
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-display text-lg font-semibold text-foreground">{event.title}</h3>
                        <EventStatusBadge status={event.status} />
                        {isUpcoming && <Badge variant="secondary">Próximo</Badge>}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{formattedDate}</span>
                        {event.venue_city && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.venue_city}</span>}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Ocupação de ingressos</span>
                          <span>{totalSold}/{totalCapacity} vendidos</span>
                        </div>
                        <Progress value={occupancy} className="h-2" />
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild><Link to={`/producer/events/${event.id}/panel`}><BarChart3 className="h-4 w-4 mr-2" />Painel do evento</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link to={`/eventos/${event.slug}`}><Eye className="h-4 w-4 mr-2" />Ver página</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link to={`/producer/events/${event.id}/edit`}><Edit className="h-4 w-4 mr-2" />Editar</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link to={`/producer/events/${event.id}/panel/participants`}><Users className="h-4 w-4 mr-2" />Participantes</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link to={`/producer/events/${event.id}/panel/checkin`}><ScanLine className="h-4 w-4 mr-2" />Check-in</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link to={`/producer/events/${event.id}/panel/financial`}><ShoppingCart className="h-4 w-4 mr-2" />Financeiro</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link to={`/producer/events/${event.id}/panel/coupons`}><Tag className="h-4 w-4 mr-2" />Cupons</Link></DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredEvents.length === 0 && (
            <Card className="border-border/80">
              <CardContent className="py-10 text-center">
                <p className="text-sm text-muted-foreground">Nenhum evento encontrado com os filtros atuais.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
