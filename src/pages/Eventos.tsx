import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import { Search, X, LayoutGrid, List, Ticket, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/EventCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { SEOHead } from "@/components/SEOHead";
import { SearchBar } from "@/components/SearchBar";
import { getEvents } from "@/lib/api";
import { RandomDiscoveryButton } from "@/components/RandomDiscoveryButton";
import { useCityDetection } from "@/hooks/useCityDetection";
import { cn } from "@/lib/utils";
import { addDays, format, isSameDay, startOfToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EVENT_CATEGORIES, CATEGORY_OPTIONS } from "@/lib/categories";

export default function Eventos() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(searchParams.get("categoria") || "");
  const [cityFilter, setCityFilter] = useState<string>(searchParams.get("cidade") || "");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [gridView, setGridView] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { city, loading: cityLoading, requestLocation } = useCityDetection();

  // Sync URL params on mount
  useEffect(() => {
    const cat = searchParams.get("categoria");
    const cid = searchParams.get("cidade");
    if (cat) setCategory(cat);
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
    queryKey: ["events", debouncedSearch, category, cityFilter],
    queryFn: async () => {
      const evts = await getEvents({
        search: debouncedSearch || undefined,
        category: category || undefined,
        city: cityFilter || undefined,
        limit: 30,
      });
      // Fetch min prices for all events
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
  const events = rawEvents;

  // Generate 14 days for date selector
  const today = startOfToday();
  const dateRange = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  // Filter by selected date on client side
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    if (!selectedDate) return events;
    return events.filter((e: any) => {
      const eventDate = new Date(e.start_date);
      return isSameDay(eventDate, selectedDate);
    });
  }, [events, selectedDate]);

  // Find a featured event (first one with cover image)
  const featuredEvent = useMemo(() => {
    if (!filteredEvents || filteredEvents.length === 0) return null;
    return filteredEvents.find((e: any) => e.cover_image_url) || filteredEvents[0];
  }, [filteredEvents]);

  const restEvents = useMemo(() => {
    if (!filteredEvents || !featuredEvent) return filteredEvents || [];
    return filteredEvents.filter((e: any) => e.id !== featuredEvent.id);
  }, [filteredEvents, featuredEvent]);

  const hasActiveFilters = category || selectedDate || cityFilter;

  const clearFilters = () => {
    setCategory("");
    setSelectedDate(null);
    setCityFilter("");
  };

  return (
    <>
      <SEOHead
        title="Eventos"
        description="Encontre os melhores eventos, shows, festivais e experiências perto de você. Compre ingressos com segurança no TicketHall."
      />

      <div className="container pt-4 lg:pt-24 pb-16">
        {/* Global Search bar */}
        <div className="mb-6">
          <SearchBar 
            variant="page" 
            placeholder="Buscar eventos, artistas, locais..." 
            className="max-w-2xl"
          />
        </div>

        {/* Date selector - horizontal scroll contained */}
        <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          <button
            onClick={() => setSelectedDate(null)}
            className={cn(
              "flex flex-col items-center min-w-[52px] px-2 py-2 rounded-xl text-xs font-medium transition-colors shrink-0",
              !selectedDate
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <span className="text-[10px] uppercase">Todos</span>
          </button>
          {dateRange.map((date) => {
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isToday = isSameDay(date, today);
            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(isSelected ? null : date)}
                className={cn(
                  "flex flex-col items-center min-w-[52px] px-2 py-2 rounded-xl text-xs transition-colors shrink-0",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <span className="text-[10px] uppercase">
                  {format(date, "EEE", { locale: ptBR })}
                </span>
                <span className={cn("text-base font-bold", isToday && !isSelected && "text-primary")}>
                  {format(date, "dd")}
                </span>
                <span className="text-[10px]">
                  {format(date, "MMM", { locale: ptBR })}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category chips - contained */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0 border",
                category === cat.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border-strong text-muted-foreground hover:text-foreground hover:border-foreground/30"
              )}
            >
              {cat.label}
            </button>
          ))}
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

        {/* Header with view toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-xl lg:text-2xl font-bold">
              {selectedDate
                ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR })
                : "Todos os eventos"}
            </h1>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <X className="h-3 w-3" /> Limpar
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <RandomDiscoveryButton className="hidden md:flex" />
            <div className="hidden md:flex items-center gap-1 border border-border rounded-lg p-0.5">
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
            onAction={hasActiveFilters ? clearFilters : undefined}
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
                ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                : "md:grid-cols-2 lg:grid-cols-3"
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
                />
              ))}
            </div>
          </div>
        )}
      </div>

    </>
  );
}
