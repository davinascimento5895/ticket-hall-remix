import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/utils";

/**
 * Embeddable widget for external sites.
 * Usage: <iframe src="https://app.tickethall.com/embed?event=SLUG&theme=dark" />
 */
export default function EmbedWidget() {
  const [params] = useSearchParams();
  const slug = params.get("event");
  const theme = params.get("theme") || "light";

  const { data: event, isLoading } = useQuery({
    queryKey: ["embed-event", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, slug, cover_image_url, start_date, end_date, venue_name, venue_city, status")
        .eq("slug", slug!)
        .eq("status", "published")
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: tiers } = useQuery({
    queryKey: ["embed-tiers", event?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_tiers")
        .select("id, name, price, quantity_total, quantity_sold, is_visible")
        .eq("event_id", event!.id)
        .eq("is_visible", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!event?.id,
  });

  const isDark = theme === "dark";

  const bgClass = isDark ? "bg-[hsl(240,6%,7%)] text-[hsl(240,5%,96%)]" : "bg-white text-gray-900";
  const cardClass = isDark ? "bg-[hsl(240,5%,12%)] border-[hsl(240,4%,18%)]" : "bg-gray-50 border-gray-200";
  const mutedClass = isDark ? "text-[hsl(240,5%,65%)]" : "text-gray-500";

  if (isLoading) {
    return (
      <div className={`p-4 min-h-[200px] flex items-center justify-center ${bgClass}`}>
        <div className="animate-pulse text-sm" style={{ color: isDark ? "hsl(240,5%,65%)" : "#888" }}>
          Carregando evento...
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className={`p-4 min-h-[100px] flex items-center justify-center text-sm ${bgClass}`}>
        <span className={mutedClass}>Evento não encontrado.</span>
      </div>
    );
  }

  const eventUrl = `${window.location.origin}/eventos/${event.slug}`;
  const minPrice = tiers && tiers.length > 0
    ? Math.min(...tiers.map((t) => t.price || 0))
    : null;

  return (
    <div className={`p-4 font-sans ${bgClass}`} style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className={`rounded-xl border overflow-hidden ${cardClass}`}>
        {/* Cover */}
        {event.cover_image_url && (
          <div className="h-36 overflow-hidden">
            <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-4 space-y-3">
          <h3 className="font-bold text-lg leading-tight">{event.title}</h3>

          <div className={`flex flex-col gap-1 text-sm ${mutedClass}`}>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {new Date(event.start_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
            {event.venue_name && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {event.venue_name}{event.venue_city ? `, ${event.venue_city}` : ""}
              </span>
            )}
          </div>

          {/* Tiers preview */}
          {tiers && tiers.length > 0 && (
            <div className="space-y-1.5">
              {tiers.slice(0, 3).map((t) => {
                const available = t.quantity_total - (t.quantity_sold || 0);
                const soldOut = available <= 0;
                return (
                  <div key={t.id} className={`flex justify-between text-sm py-1 px-2 rounded ${isDark ? "bg-[hsl(240,5%,15%)]" : "bg-gray-100"}`}>
                    <span className={soldOut ? "line-through opacity-60" : ""}>{t.name}</span>
                    <span className="font-medium">{soldOut ? "Esgotado" : t.price ? formatBRL(t.price) : "Grátis"}</span>
                  </div>
                );
              })}
              {tiers.length > 3 && (
                <p className={`text-xs ${mutedClass}`}>+{tiers.length - 3} opções</p>
              )}
            </div>
          )}

          <a href={eventUrl} target="_blank" rel="noopener noreferrer" className="block">
            <button
              className="w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors"
              style={{
                backgroundColor: "hsl(243, 75%, 59%)",
                color: "#fff",
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                Comprar Ingressos <ExternalLink className="h-3.5 w-3.5" />
              </span>
            </button>
          </a>

          <p className={`text-[10px] text-center ${mutedClass}`}>
            Powered by TicketHall
          </p>
        </div>
      </div>
    </div>
  );
}
