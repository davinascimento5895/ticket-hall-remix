import { useQuery } from "@tanstack/react-query";
import { Heart, Calendar, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { EmptyState } from "@/components/EmptyState";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Favoritos() {
  const { user } = useAuth();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["favorite-events", user?.id],
    queryFn: async () => {
      const { data: favs, error: favError } = await supabase
        .from("favorites")
        .select("event_id")
        .eq("user_id", user!.id);
      if (favError) throw favError;
      if (!favs.length) return [];

      const ids = favs.map((f: any) => f.event_id);
      const { data: events, error } = await supabase
        .from("events")
        .select("id, title, slug, cover_image_url, start_date, venue_city, category, status")
        .in("id", ids)
        .eq("status", "published");
      if (error) throw error;
      return events || [];
    },
    enabled: !!user?.id,
  });

  return (
    <>
      <SEOHead title="Favoritos | TicketHall" description="Seus eventos favoritos no TicketHall" />
      <div className="container pt-4 lg:pt-24 pb-16">
        <h1 className="font-display text-2xl lg:text-3xl font-bold mb-6">Favoritos</h1>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Heart className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-6">Você ainda não favoritou nenhum evento.</p>
            <Button asChild><Link to="/eventos">Explorar eventos</Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event: any) => (
              <Link
                key={event.id}
                to={`/eventos/${event.slug}`}
                className="group relative rounded-xl overflow-hidden border border-border bg-card hover:border-muted-foreground/30 transition-colors block"
              >
                <div className="aspect-video relative overflow-hidden">
                  {event.cover_image_url ? (
                    <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-secondary" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  <FavoriteButton eventId={event.id} className="absolute top-3 right-3" />
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-display font-semibold text-foreground line-clamp-2 leading-tight">{event.title}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{format(new Date(event.start_date), "dd MMM yyyy", { locale: ptBR })}</span>
                  </div>
                  {event.venue_city && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{event.venue_city}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
