import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, MapPin, Tag, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EventCard } from "@/components/EventCard";
import { SearchBar } from "@/components/SearchBar";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { SEOHead } from "@/components/SEOHead";
import { SearchFilters, defaultFilters, type SearchFilterValues } from "@/components/SearchFilters";
import { supabase } from "@/integrations/supabase/client";
import { fuzzyMatch } from "@/lib/search";
import { getCategoryLabel, EVENT_CATEGORIES } from "@/lib/categories";
import { format, getHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

interface SearchResultEvent {
  id: string;
  title: string;
  slug: string;
  venue_city: string | null;
  category: string | null;
  start_date: string;
  cover_image_url: string | null;
  is_featured: boolean | null;
  views_count: number | null;
  min_price: number | null;
  has_discount: boolean;
}

function getTimeOfDay(dateStr: string): string {
  const h = getHours(new Date(dateStr));
  if (h < 6) return "dawn";
  if (h < 13) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

export default function Busca() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [events, setEvents] = useState<SearchResultEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilterValues>({ ...defaultFilters });

  // Fetch events
  useEffect(() => {
    async function fetchResults() {
      setIsLoading(true);
      try {
        let q = supabase
          .from("events")
          .select("id, title, slug, venue_city, category, start_date, cover_image_url, is_featured, views_count, ticket_tiers(price, original_price)")
          .eq("status", "published")
          .gte("end_date", new Date().toISOString())
          .order("start_date", { ascending: true })
          .limit(200);

        if (query.trim()) {
          q = q.or(
            `title.ilike.%${query}%,venue_city.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`
          );
        }

        const { data, error } = await q;
        if (error) throw error;

        let rawResults = data || [];

        // Compute min_price and has_discount from tiers
        let results: SearchResultEvent[] = rawResults.map((e: any) => {
          const tiers = e.ticket_tiers || [];
          const prices = tiers.map((t: any) => t.price ?? 0);
          const minPrice = prices.length > 0 ? Math.min(...prices) : null;
          const hasDiscount = tiers.some((t: any) => t.original_price != null && t.original_price > (t.price ?? 0));
          const { ticket_tiers, ...rest } = e;
          return { ...rest, min_price: minPrice, has_discount: hasDiscount };
        });

        // Fuzzy filter only when there's a query
        if (query.trim()) {
          results = results.filter((event) => {
            const titleMatch = fuzzyMatch(query, event.title, 0.5);
            const cityMatch = event.venue_city && fuzzyMatch(query, event.venue_city, 0.5);
            const categoryMatch = event.category && fuzzyMatch(query, event.category, 0.5);
            return titleMatch || cityMatch || categoryMatch;
          });
        }

        setEvents(results);
      } catch (error) {
        console.error("Search error:", error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchResults();
  }, [query]);

  // Apply local filters
  const filteredEvents = useMemo(() => {
    let result = [...events];

    // Category
    if (filters.category) {
      result = result.filter((e) => e.category === filters.category);
    }

    // City
    if (filters.city) {
      result = result.filter((e) => e.venue_city === filters.city);
    }

    // Price filter (using min_price from tiers)
    if (filters.priceMax) {
      const max = Number(filters.priceMax);
      result = result.filter((e) => e.min_price !== null && e.min_price <= max);
    }
    if (filters.priceMin) {
      const min = Number(filters.priceMin);
      result = result.filter((e) => e.min_price !== null && e.min_price >= min);
    }

    // Time of day
    if (filters.timeOfDay && filters.timeOfDay !== "all") {
      result = result.filter((e) => getTimeOfDay(e.start_date) === filters.timeOfDay);
    }

    // Sort
    if (filters.sort === "popular") {
      result.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
    } else if (filters.sort === "deals") {
      // Prioritize events with real discounts (original_price > price)
      result.sort((a, b) => {
        const aDeals = a.has_discount ? 1 : 0;
        const bDeals = b.has_discount ? 1 : 0;
        return bDeals - aDeals;
      });
    }

    return result;
  }, [events, filters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.sort) count++;
    if (filters.priceMin || filters.priceMax || filters.pricePreset) count++;
    if (filters.category) count++;
    if (filters.city) count++;
    if (filters.timeOfDay && filters.timeOfDay !== "all") count++;
    return count;
  }, [filters]);

  return (
    <>
      <SEOHead
        title={query ? `Busca: ${query} | TicketHall` : "Buscar Eventos | TicketHall"}
        description={`Resultados da busca por "${query}" no TicketHall. Encontre eventos, shows e experiências.`}
      />

      <div className="min-h-screen pt-4 lg:pt-20">
        {/* Search Header */}
        <section className="bg-muted/30 border-b border-border">
          <div className="container py-6 lg:py-12">
            <h1 className="text-xl lg:text-3xl font-bold mb-4">
              {query ? (
                <>
                  Resultados para{" "}
                  <span className="text-primary">"{query}"</span>
                </>
              ) : (
                "Pesquisar eventos"
              )}
            </h1>

            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <SearchBar variant="page" autoFocus={!query} className="max-w-2xl" />
              </div>
              <div className="lg:hidden">
                <SearchFilters
                  filters={filters}
                  onChange={setFilters}
                  activeCount={activeFilterCount}
                />
              </div>
            </div>

            {!isLoading && (
              <p className="text-sm text-muted-foreground mt-3">
                {filteredEvents.length === 0
                  ? "Nenhum evento encontrado"
                  : `${filteredEvents.length} evento${filteredEvents.length !== 1 ? "s" : ""} encontrado${filteredEvents.length !== 1 ? "s" : ""}`}
              </p>
            )}
          </div>
        </section>

        {/* Results + Desktop Sidebar */}
        <section className="container py-6 lg:py-8">
          <div className="flex gap-8">
            {/* Desktop Filters Sidebar */}
            <div className="hidden lg:block">
              <SearchFilters
                filters={filters}
                onChange={setFilters}
                activeCount={activeFilterCount}
              />
            </div>

            {/* Event Results */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <LoadingSkeleton variant="card" count={6} />
              ) : !query && filteredEvents.length === 0 ? (
                <div className="text-center py-16">
                  <Search className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">
                    O que você está procurando?
                  </h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Digite o nome de um evento, cidade ou categoria para começar.
                  </p>
                  <div className="mt-8">
                    <p className="text-sm text-muted-foreground mb-3">Buscas populares:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {["Stand Up", "Festival", "Show", "São Paulo", "Workshop"].map((term) => (
                        <Button
                          key={term}
                          variant="outline"
                          size="sm"
                          onClick={() => setSearchParams({ q: term })}
                        >
                          {term}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : filteredEvents.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="Nenhum resultado encontrado"
                  description={
                    query
                      ? `Não encontramos eventos para "${query}" com esses filtros.`
                      : "Nenhum evento corresponde aos filtros selecionados."
                  }
                >
                  <div className="mt-4 space-y-3">
                    {activeFilterCount > 0 && (
                      <Button variant="outline" onClick={() => setFilters({ ...defaultFilters })}>
                        Limpar filtros
                      </Button>
                    )}
                    <Button variant="outline" asChild className="ml-2">
                      <Link to="/eventos">Ver todos os eventos</Link>
                    </Button>
                  </div>
                </EmptyState>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <EventCard
                        title={event.title}
                        date={format(new Date(event.start_date), "dd MMM yyyy · HH'h'mm", {
                          locale: ptBR,
                        })}
                        city={event.venue_city || "Online"}
                        imageUrl={event.cover_image_url || "/placeholder.svg"}
                        priceFrom={event.min_price ?? 0}
                        category={event.category || undefined}
                        slug={event.slug}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
