import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EventCard } from "@/components/EventCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { SEOHead } from "@/components/SEOHead";
import { getEvents } from "@/lib/api";
import { Ticket } from "lucide-react";

const categories = [
  { value: "music", label: "Música" },
  { value: "sports", label: "Esportes" },
  { value: "theater", label: "Teatro" },
  { value: "festival", label: "Festival" },
  { value: "corporate", label: "Corporativo" },
  { value: "education", label: "Educação" },
  { value: "other", label: "Outros" },
];

export default function Eventos() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (value: string) => {
    setSearch(value);
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => setDebouncedSearch(value), 400);
    setTimer(t);
  };

  const { data: events, isLoading } = useQuery({
    queryKey: ["events", debouncedSearch, category, city],
    queryFn: () =>
      getEvents({
        search: debouncedSearch || undefined,
        category: category || undefined,
        city: city || undefined,
        limit: 30,
      }),
  });

  // Extract unique cities from results for the filter
  const cities = useMemo(() => {
    if (!events) return [];
    const set = new Set(events.map((e: any) => e.venue_city).filter(Boolean));
    return Array.from(set).sort() as string[];
  }, [events]);

  const hasActiveFilters = category || city;

  const clearFilters = () => {
    setCategory("");
    setCity("");
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Eventos"
        description="Encontre os melhores eventos, shows, festivais e experiências perto de você. Compre ingressos com segurança no TicketHall."
      />
      <Navbar />

      <div className="container pt-24 pb-16">
        {/* Search bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar eventos, artistas, locais..."
              className="pl-10"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" /> Filtros
            {hasActiveFilters && (
              <span className="ml-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                {[category, city].filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 mb-6 p-4 rounded-lg border border-border bg-card animate-fade-in">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Cidade" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-3 w-3" /> Limpar filtros
              </Button>
            )}
          </div>
        )}

        <h1 className="font-display text-2xl md:text-3xl font-bold mb-6">Todos os eventos</h1>

        {isLoading ? (
          <LoadingSkeleton variant="card" count={6} />
        ) : !events || events.length === 0 ? (
          <EmptyState
            icon={<Ticket className="h-12 w-12" />}
            title="Nenhum evento encontrado"
            description="Tente ajustar seus filtros ou buscar por outro termo."
            actionLabel={hasActiveFilters ? "Limpar filtros" : undefined}
            onAction={hasActiveFilters ? clearFilters : undefined}
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event: any) => (
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
                priceFrom={0}
                category={event.category}
                slug={event.slug}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
