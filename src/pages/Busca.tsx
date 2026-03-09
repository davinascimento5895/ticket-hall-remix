import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, MapPin, Tag, Calendar, Filter, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventCard } from "@/components/EventCard";
import { SearchBar } from "@/components/SearchBar";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { fuzzyMatch, normalizeText } from "@/lib/search";
import { getCategoryLabel, EVENT_CATEGORIES } from "@/lib/categories";
import { BRAZILIAN_CAPITALS } from "@/lib/cities";
import { format } from "date-fns";
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
}

interface CategoryMatch {
  value: string;
  label: string;
  count: number;
}

interface CityMatch {
  name: string;
  uf: string;
  count: number;
}

export default function Busca() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const activeTab = searchParams.get("tab") || "todos";

  const [events, setEvents] = useState<SearchResultEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalEvents, setTotalEvents] = useState(0);

  // Fetch events matching the query
  useEffect(() => {
    async function fetchResults() {
      if (!query.trim()) {
        setEvents([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch events with broad search
        const { data, error } = await supabase
          .from("events")
          .select("id, title, slug, venue_city, category, start_date, cover_image_url")
          .eq("status", "published")
          .gte("end_date", new Date().toISOString())
          .or(
            `title.ilike.%${query}%,venue_city.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`
          )
          .order("start_date", { ascending: true })
          .limit(100);

        if (error) throw error;

        // Apply fuzzy matching for better results
        const filteredEvents = (data || []).filter((event) => {
          const titleMatch = fuzzyMatch(query, event.title, 0.5);
          const cityMatch = event.venue_city && fuzzyMatch(query, event.venue_city, 0.5);
          const categoryMatch = event.category && fuzzyMatch(query, event.category, 0.5);
          return titleMatch || cityMatch || categoryMatch;
        });

        setEvents(filteredEvents);
        setTotalEvents(filteredEvents.length);
      } catch (error) {
        console.error("Search error:", error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchResults();
  }, [query]);

  // Compute matching categories and cities from results
  const matchingCategories = useMemo((): CategoryMatch[] => {
    const categoryCounts: Record<string, number> = {};

    // Count events per category
    for (const event of events) {
      if (event.category) {
        categoryCounts[event.category] = (categoryCounts[event.category] || 0) + 1;
      }
    }

    // Also add categories that match the query directly
    const matchedCats = EVENT_CATEGORIES.filter(
      (cat) => fuzzyMatch(query, cat.label, 0.6) || fuzzyMatch(query, cat.description, 0.6)
    );

    for (const cat of matchedCats) {
      if (!categoryCounts[cat.value]) {
        categoryCounts[cat.value] = 0;
      }
    }

    return Object.entries(categoryCounts)
      .map(([value, count]) => ({
        value,
        label: getCategoryLabel(value),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [events, query]);

  const matchingCities = useMemo((): CityMatch[] => {
    const cityCounts: Record<string, number> = {};

    // Count events per city
    for (const event of events) {
      if (event.venue_city) {
        cityCounts[event.venue_city] = (cityCounts[event.venue_city] || 0) + 1;
      }
    }

    // Also add cities that match the query directly
    const matchedCities = BRAZILIAN_CAPITALS.filter(
      (city) => fuzzyMatch(query, city.name, 0.6) || fuzzyMatch(query, city.state, 0.6)
    );

    for (const city of matchedCities) {
      if (!cityCounts[city.name]) {
        cityCounts[city.name] = 0;
      }
    }

    return Object.entries(cityCounts)
      .map(([name, count]) => {
        const capital = BRAZILIAN_CAPITALS.find((c) => c.name === name);
        return {
          name,
          uf: capital?.uf || "",
          count,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [events, query]);

  const handleTabChange = (tab: string) => {
    setSearchParams((prev) => {
      prev.set("tab", tab);
      return prev;
    });
  };

  const filteredEventsByTab = useMemo(() => {
    if (activeTab === "todos") return events;

    // Check if it's a category filter
    const category = EVENT_CATEGORIES.find((c) => c.value === activeTab);
    if (category) {
      return events.filter((e) => e.category === activeTab);
    }

    // Check if it's a city filter
    return events.filter((e) => e.venue_city === activeTab);
  }, [events, activeTab]);

  return (
    <>
      <SEOHead
        title={query ? `Busca: ${query} | TicketHall` : "Buscar Eventos | TicketHall"}
        description={`Resultados da busca por "${query}" no TicketHall. Encontre eventos, shows e experiências.`}
      />

      <div className="min-h-screen pt-20">
        {/* Search Header */}
        <section className="bg-muted/30 border-b border-border">
          <div className="container py-8 md:py-12">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="mb-4 -ml-2"
            >
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
              </Link>
            </Button>

            <h1 className="text-2xl md:text-3xl font-bold mb-6">
              {query ? (
                <>
                  Resultados para{" "}
                  <span className="text-primary">"{query}"</span>
                </>
              ) : (
                "Buscar eventos"
              )}
            </h1>

            <SearchBar variant="page" autoFocus={!query} className="max-w-2xl" />

            {query && !isLoading && (
              <p className="text-sm text-muted-foreground mt-4">
                {totalEvents === 0
                  ? "Nenhum evento encontrado"
                  : `${totalEvents} evento${totalEvents !== 1 ? "s" : ""} encontrado${totalEvents !== 1 ? "s" : ""}`}
              </p>
            )}
          </div>
        </section>

        {/* Results */}
        <section className="container py-8">
          {isLoading ? (
            <LoadingSkeleton variant="card" count={6} />
          ) : !query ? (
            <div className="text-center py-16">
              <Search className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                O que você está procurando?
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Digite o nome de um evento, cidade ou categoria para começar a buscar.
              </p>

              {/* Popular searches */}
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
          ) : totalEvents === 0 ? (
            <EmptyState
              icon={Search}
              title="Nenhum resultado encontrado"
              description={`Não encontramos eventos para "${query}". Tente termos diferentes ou verifique a ortografia.`}
            >
              <div className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">Sugestões:</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside text-left max-w-sm mx-auto">
                  <li>Verifique se digitou corretamente</li>
                  <li>Tente palavras mais genéricas</li>
                  <li>Busque por cidade ou categoria</li>
                </ul>
                <Button variant="outline" asChild className="mt-4">
                  <Link to="/eventos">Ver todos os eventos</Link>
                </Button>
              </div>
            </EmptyState>
          ) : (
            <>
              {/* Quick filters */}
              {(matchingCategories.length > 0 || matchingCities.length > 0) && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={activeTab === "todos" ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleTabChange("todos")}
                    >
                      Todos ({totalEvents})
                    </Badge>

                    {matchingCategories.slice(0, 4).map((cat) => (
                      <Badge
                        key={cat.value}
                        variant={activeTab === cat.value ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleTabChange(cat.value)}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {cat.label} {cat.count > 0 && `(${cat.count})`}
                      </Badge>
                    ))}

                    {matchingCities.slice(0, 4).map((city) => (
                      <Badge
                        key={city.name}
                        variant={activeTab === city.name ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleTabChange(city.name)}
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        {city.name} {city.count > 0 && `(${city.count})`}
                      </Badge>
                    ))}

                    {activeTab !== "todos" && (
                      <Badge
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => handleTabChange("todos")}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Limpar filtro
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Event grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEventsByTab.map((event, index) => (
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
                      priceFrom={0}
                      category={event.category || undefined}
                      slug={event.slug}
                    />
                  </motion.div>
                ))}
              </div>

              {filteredEventsByTab.length === 0 && activeTab !== "todos" && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Nenhum evento encontrado com este filtro.
                  </p>
                  <Button
                    variant="link"
                    onClick={() => handleTabChange("todos")}
                    className="mt-2"
                  >
                    Ver todos os resultados
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
