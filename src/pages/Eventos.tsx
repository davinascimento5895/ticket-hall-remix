import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, X, LayoutGrid, List, Ticket, MapPin, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/EventCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { SEOHead } from "@/components/SEOHead";
import { BecomeProducerModal } from "@/components/BecomeProducerModal";
import { useAuth } from "@/contexts/AuthContext";
import { EventFilterBar, defaultEventFilters, getDateRangeFromPreset, type EventFilters } from "@/components/EventFilterBar";

import { getEvents } from "@/lib/api";
import { RandomDiscoveryButton } from "@/components/RandomDiscoveryButton";
import { useCityDetection } from "@/hooks/useCityDetection";
import { cn } from "@/lib/utils";
import { isSameDay, isWithinInterval, format, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CATEGORY_OPTIONS } from "@/lib/categories";

export default function Eventos() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [search, setSearch] = useState("");
  const [gridView, setGridView] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { city, loading: cityLoading, requestLocation } = useCityDetection();
  const [producerModalOpen, setProducerModalOpen] = useState(false);
  const [cityFilter, setCityFilter] = useState<string>(searchParams.get("cidade") || "");

  // New unified filters
  const [filters, setFilters] = useState<EventFilters>(() => {
    const cat = searchParams.get("categoria") || "";
    return { ...defaultEventFilters, category: cat };
  });

  const handleCreateEvent = () => {
    if (role === "producer") {
      navigate("/producer/events/new");
      return;
    }
    setProducerModalOpen(true);
  };

  // Sync URL params on mount
  useEffect(() => {
    const cat = searchParams.get("categoria");
    const cid = searchParams.get("cidade");
    if (cat) setFilters((f) => ({ ...f, category: cat }));
    if (cid) setCityFilter(cid);
  }, [searchParams]);

  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (value: string) => {
    setSearch(value);
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => setDebouncedSearch(value), 400);
    setTimer(t);
  };

  const { data: rawEvents, isLoading } = useQuery({
    queryKey: ["events", debouncedSearch, filters.category, cityFilter],
    queryFn: async () => {
      const evts = await getEvents({
        search: debouncedSearch || undefined,
        category: filters.category || undefined,
        city: cityFilter || undefined,
        limit: 50,
      });
      if (!evts || evts.length === 0) return [];
      const eventIds = evts.map((e: any) => e.id);
      const { data: tiers } = await supabase
        .from("ticket_tiers")
        .select("event_id, price")
        .in("event_id", eventIds)
        .eq("is_visible", true);
      const minPriceMap: Record<string, number> = {};
      (tiers || []).forEach((t: any) => {
        const p = t.price ?? 0;
        if (!(t.event_id in minPriceMap) || p < minPriceMap[t.event_id]) {
          minPriceMap[t.event_id] = p;
        }
      });
      return evts.map((e: any) => ({ ...e, _minPrice: minPriceMap[e.id] ?? 0 }));
    },
  });

  // Apply all client-side filters
  const filteredEvents = useMemo(() => {
    if (!rawEvents) return [];
    let result = [...rawEvents];

    // Date preset filter
    if (filters.datePreset) {
      const range = getDateRangeFromPreset(filters.datePreset);
      if (range) {
        result = result.filter((e: any) => {
          const d = new Date(e.start_date);
          return isWithinInterval(d, { start: range.start, end: range.end });
        });
      }
    }

    // Calendar range filter
    if (filters.dateRange?.from) {
      const from = filters.dateRange.from;
      const to = filters.dateRange.to || from;
      result = result.filter((e: any) => {
        const d = new Date(e.start_date);
        return isWithinInterval(d, { start: from, end: endOfDay(to) });
      });
    }

    // Price filter
    if (filters.priceMin) {
      const min = Number(filters.priceMin);
      result = result.filter((e: any) => (e._minPrice ?? 0) >= min);
    }
    if (filters.priceMax) {
      const max = Number(filters.priceMax);
      result = result.filter((e: any) => (e._minPrice ?? 0) <= max);
    }

    // Modality filter
    if (filters.modality === "online") {
      result = result.filter((e: any) => e.is_online === true);
    } else if (filters.modality === "presential") {
      result = result.filter((e: any) => !e.is_online);
    }

    // Sort
    if (filters.sort === "relevance") {
      result.sort((a: any, b: any) => (b.views_count || 0) - (a.views_count || 0));
    }
    // default sort is by date (already from API)

    return result;
  }, [rawEvents, filters]);

  // Find a featured event (first one with cover image)
  const featuredEvent = useMemo(() => {
    if (!filteredEvents || filteredEvents.length === 0) return null;
    return filteredEvents.find((e: any) => e.cover_image_url) || filteredEvents[0];
  }, [filteredEvents]);

  const restEvents = useMemo(() => {
    if (!filteredEvents || !featuredEvent) return filteredEvents || [];
    return filteredEvents.filter((e: any) => e.id !== featuredEvent.id);
  }, [filteredEvents, featuredEvent]);

  const hasActiveFilters = filters.category || filters.datePreset || filters.dateRange?.from || filters.priceMin || filters.priceMax || filters.modality !== "all" || filters.sort !== "date" || cityFilter;

  const clearAll = () => {
    setFilters({ ...defaultEventFilters });
    setCityFilter("");
  };

  return (
    <>
      <SEOHead
        title="Eventos"
        description="Encontre os melhores eventos, shows, festivais e experiências perto de você. Compre ingressos com segurança no TicketHall."
      />

      <BecomeProducerModal
        open={producerModalOpen}
        onOpenChange={setProducerModalOpen}
      />

      <div className="container pt-4 lg:pt-24 pb-16">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted-foreground mb-4 hidden lg:flex items-center gap-1.5">
          <a href="/" className="hover:text-foreground transition-colors">Página inicial</a>
          <span>›</span>
          <span className="text-foreground font-medium">Encontre eventos</span>
        </nav>

        {/* Top section: Title + Filters */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <h1 className="font-display text-xl lg:text-2xl font-bold shrink-0">Encontre eventos</h1>
          <div className="flex-1 min-w-0">
            <EventFilterBar filters={filters} onChange={setFilters} />
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-5 max-w-2xl relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar eventos, artistas, locais..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 bg-muted/50 border-border"
          />
          {search && (
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => { setSearch(""); setDebouncedSearch(""); }}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* City filter indicator */}
        {cityFilter && (
          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>Eventos em <span className="text-foreground font-medium">{cityFilter}</span></span>
            <button onClick={() => setCityFilter("")} className="text-xs underline ml-1">Limpar</button>
          </div>
        )}

        {/* City detection bar */}
        {!city && !cityFilter && (
          <button
            onClick={requestLocation}
            disabled={cityLoading}
            className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
          >
            <MapPin className="h-4 w-4 text-primary" />
            {cityLoading ? "Detectando..." : "Usar minha localização para filtrar eventos"}
          </button>
        )}
        {city && !cityFilter && (
          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>Eventos em <span className="text-foreground font-medium">{city}</span></span>
            <button onClick={() => { localStorage.removeItem("tickethall_detected_city"); window.location.reload(); }} className="text-xs underline ml-1">Alterar</button>
          </div>
        )}

        {/* Result count + view toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {!isLoading && (
              <p className="text-sm text-muted-foreground">
                {filteredEvents.length} evento{filteredEvents.length !== 1 ? "s" : ""} encontrado{filteredEvents.length !== 1 ? "s" : ""}
              </p>
            )}
            {hasActiveFilters && (
              <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <X className="h-3 w-3" /> Limpar tudo
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleCreateEvent}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Criar evento</span>
            </Button>
            <RandomDiscoveryButton className="hidden lg:flex" />
            <div className="hidden lg:flex items-center gap-1 border border-border rounded-lg p-0.5">
              <button
                onClick={() => setGridView(false)}
                className={cn("p-1.5 rounded-md transition-colors", !gridView ? "bg-secondary text-foreground" : "text-muted-foreground")}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setGridView(true)}
                className={cn("p-1.5 rounded-md transition-colors", gridView ? "bg-secondary text-foreground" : "text-muted-foreground")}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <LoadingSkeleton variant="card" count={6} />
        ) : !filteredEvents || filteredEvents.length === 0 ? (
          <EmptyState
            icon={<Ticket className="h-12 w-12" />}
            title="Nenhum evento encontrado"
            description="Tente ajustar seus filtros ou buscar por outro termo."
            actionLabel={hasActiveFilters ? "Limpar filtros" : undefined}
            onAction={hasActiveFilters ? clearAll : undefined}
          />
        ) : (
          <div className="space-y-8">
            {/* Featured banner */}
            {featuredEvent && !gridView && (
              <a
                href={`/eventos/${featuredEvent.slug}`}
                className="group relative block rounded-2xl overflow-hidden border border-border bg-card h-[280px] md:h-[340px]"
              >
                <img
                  src={featuredEvent.cover_image_url || "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=80"}
                  alt={featuredEvent.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  {featuredEvent.category && (
                    <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-primary/90 text-primary-foreground mb-3">
                      {CATEGORY_OPTIONS.find(c => c.value === featuredEvent.category)?.label || featuredEvent.category}
                    </span>
                  )}
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-1">{featuredEvent.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {new Date(featuredEvent.start_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                    {featuredEvent.venue_city ? ` · ${featuredEvent.venue_city}` : ""}
                  </p>
                </div>
              </a>
            )}

            {/* Event grid */}
            <div className={cn(
              "grid gap-5",
              gridView
                ? "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "sm:grid-cols-2 lg:grid-cols-3"
            )}>
              {(gridView ? filteredEvents : restEvents).map((event: any) => (
                <EventCard
                  key={event.id}
                  title={event.title}
                  date={new Date(event.start_date).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                  city={event.venue_city || "Online"}
                  imageUrl={event.cover_image_url || "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80"}
                  priceFrom={event._minPrice ?? 0}
                  category={event.category}
                  slug={event.slug}
                  eventId={event.id}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
