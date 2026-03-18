import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Search, X, Ticket, MapPin, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/EventCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { SEOHead } from "@/components/SEOHead";
import { BecomeProducerModal } from "@/components/BecomeProducerModal";
import { useAuth } from "@/contexts/AuthContext";
import { EventFilterBar, defaultEventFilters, getDateRangeFromPreset, type EventFilters } from "@/components/EventFilterBar";
import { sanitizePostgrestFilter } from "@/lib/search";
import { RandomDiscoveryButton } from "@/components/RandomDiscoveryButton";
import { useCityDetection } from "@/hooks/useCityDetection";
import { isWithinInterval, endOfDay } from "date-fns";

export default function Eventos() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [search, setSearch] = useState("");
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
    const q = searchParams.get("q");
    if (cat) setFilters((f) => ({ ...f, category: cat }));
    if (cid) setCityFilter(cid);
    if (q) { setSearch(q); setDebouncedSearch(q); }
  }, [searchParams]);

  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (value: string) => {
    setSearch(value);
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => setDebouncedSearch(value), 400);
    setTimer(t);
  };

  const PAGE_SIZE = 24;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data: rawEvents, isLoading } = useQuery({
    queryKey: ["events", debouncedSearch, filters.category, cityFilter],
    queryFn: async () => {
      // Query única: events + preço mínimo via ticket_tiers aninhado
      // Elimina o segundo round-trip ao Supabase que existia antes
      let query = supabase
        .from("events")
        .select("id, title, slug, start_date, end_date, venue_city, cover_image_url, category, is_online, views_count, ticket_tiers(price)")
        .eq("status", "published")
        .gte("end_date", new Date().toISOString())
        .order("start_date", { ascending: true })
        .limit(200);

      if (debouncedSearch) {
        const safe = sanitizePostgrestFilter(debouncedSearch);
        query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%,venue_name.ilike.%${safe}%,venue_city.ilike.%${safe}%`);
      }
      if (filters.category) query = query.eq("category", filters.category);
      if (cityFilter) query = query.eq("venue_city", cityFilter);

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((e: any) => {
        const prices = (e.ticket_tiers || []).map((t: any) => t.price ?? 0);
        const _minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const { ticket_tiers, ...rest } = e;
        return { ...rest, _minPrice };
      });
    },
  });

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearch, filters, cityFilter]);

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
          <Link to="/" className="hover:text-foreground transition-colors">Página inicial</Link>
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
        <div className="mb-5 max-w-2xl">
          <SearchInput
            type="text"
            placeholder="Buscar eventos, artistas, locais..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="bg-muted/50 border-border"
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
            {/* Event grid */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredEvents.slice(0, visibleCount).map((event: any, index: number) => (
                <EventCard
                  key={event.id}
                  title={event.title}
                  date={new Date(event.start_date).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                  city={event.venue_city || "Online"}
                  imageUrl={event.cover_image_url}
                  priceFrom={event._minPrice ?? 0}
                  category={event.category}
                  slug={event.slug}
                  eventId={event.id}
                  priority={index < 4}
                />
              ))}
            </div>

            {/* Load more */}
            {filteredEvents.length > visibleCount && (
              <div className="flex justify-center pt-8" ref={loadMoreRef}>
                <Button
                  variant="outline"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                >
                  Carregar mais eventos
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
