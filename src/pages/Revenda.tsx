import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Search, Calendar, MapPin, Tag, ArrowRight, ShoppingBag, Repeat } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { EmptyState } from "@/components/EmptyState";
import { getResaleListings } from "@/lib/api-resale";
import { useDebounce } from "@/hooks/useDebounce";

export default function Revenda() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const navigate = useNavigate();

  const { data: listings, isLoading } = useQuery({
    queryKey: ["resale-listings", debouncedSearch],
    queryFn: () => getResaleListings({
      search: debouncedSearch || undefined,
      limit: 50,
    }),
    staleTime: 30_000,
  });

  // Group by event
  const groupedByEvent = (listings || []).reduce((acc: Record<string, any>, listing: any) => {
    const eventId = listing.event_id;
    if (!acc[eventId]) {
      acc[eventId] = {
        event: listing.events,
        listings: [],
      };
    }
    acc[eventId].listings.push(listing);
    return acc;
  }, {});

  const eventGroups = Object.values(groupedByEvent) as { event: any; listings: any[] }[];

  return (
    <>
      <SEOHead
        title="Revenda de Ingressos — TicketHall"
        description="Compre ingressos de outros usuários com segurança na TicketHall. QR Codes verificados e proteção anti-fraude."
      />

      <div className="container pt-4 lg:pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Repeat className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Revenda de Ingressos</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Compre ingressos de outros usuários com segurança. Todos os ingressos são verificados e um novo QR Code exclusivo é gerado para você.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por evento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50"
          />
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5 mb-8">
          <ShoppingBag className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">Como funciona a revenda?</p>
            <p className="text-muted-foreground">
              Usuários que não podem mais ir ao evento anunciam seus ingressos aqui. Ao comprar, o QR Code antigo é invalidado
              e um novo é gerado exclusivamente para você. A plataforma cobra 10% de taxa do vendedor.
            </p>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-48" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 2 }).map((_, j) => <Skeleton key={j} className="h-40" />)}
                </div>
              </div>
            ))}
          </div>
        ) : eventGroups.length > 0 ? (
          <div className="space-y-10">
            {eventGroups.map(({ event, listings: eventListings }) => (
              <section key={event.id}>
                {/* Event header */}
                <div className="flex items-center gap-4 mb-4">
                  {event.cover_image_url && (
                    <img src={event.cover_image_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="min-w-0">
                    <Link to={`/eventos/${event.slug}`} className="font-display font-semibold text-foreground hover:text-primary transition-colors truncate block">
                      {event.title}
                    </Link>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                      {event.start_date && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-primary" />
                          {new Date(event.start_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      )}
                      {event.venue_city && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-primary" />
                          {event.venue_city}, {event.venue_state}
                        </span>
                      )}
                      {event.category && (
                        <Badge variant="secondary" className="text-xs">{event.category}</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Listings grid */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {eventListings.map((listing: any) => {
                    const originalPrice = listing.ticket_tiers?.price || listing.original_price || 0;
                    const discount = originalPrice > 0
                      ? Math.round((1 - listing.asking_price / originalPrice) * 100)
                      : 0;

                    return (
                      <div
                        key={listing.id}
                        className="group p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all cursor-pointer"
                        onClick={() => navigate(`/revenda/${listing.id}`)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium text-foreground text-sm">{listing.ticket_tiers?.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Expira: {new Date(listing.expires_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          {discount > 0 && (
                            <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-0">
                              -{discount}%
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-1">
                          {originalPrice > 0 && originalPrice !== listing.asking_price && (
                            <p className="text-xs text-muted-foreground line-through">
                              R$ {Number(originalPrice).toFixed(2)}
                            </p>
                          )}
                          <div className="flex items-baseline gap-1">
                            <Tag className="h-4 w-4 text-primary" />
                            <span className="text-lg font-bold text-foreground">
                              R$ {Number(listing.asking_price).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <Button variant="ghost" size="sm" className="w-full mt-3 gap-1.5 text-primary group-hover:bg-primary/5">
                          Comprar <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Repeat className="h-12 w-12" />}
            title="Nenhum ingresso à venda"
            description={searchQuery ? "Nenhum resultado encontrado. Tente outra busca." : "No momento não há ingressos disponíveis para revenda."}
            children={undefined}
          />
        )}
      </div>
    </>
  );
}
