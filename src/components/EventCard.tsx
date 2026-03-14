import { useCallback } from "react";
import { Calendar, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/FavoriteButton";
import { EventImage } from "@/components/EventImage";
import { cn, formatBRLOrFree } from "@/lib/utils";
import { getCategoryLabel } from "@/lib/categories";
import { getEventBySlug } from "@/lib/api";

interface EventCardProps {
  title: string;
  date: string;
  city: string;
  imageUrl: string | null | undefined;
  priceFrom: number;
  category?: string;
  slug?: string;
  eventId?: string;
  className?: string;
  /** Prioridade de carregamento da imagem — use true APENAS no primeiro card visível */
  priority?: boolean;
}

export function EventCard({ title, date, city, imageUrl, priceFrom, category, slug, eventId, className, priority }: EventCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const Wrapper = slug ? Link : "div";
  const wrapperProps = slug ? { to: `/eventos/${slug}` } : {};

  // Ao hover: pré-carrega o chunk JS do EventDetail + dados do evento
  const handlePrefetch = useCallback(() => {
    if (!slug) return;
    import("@/pages/EventDetail");
    queryClient.prefetchQuery({
      queryKey: ["event", slug],
      queryFn: () => getEventBySlug(slug),
      staleTime: 5 * 60 * 1000,
    });
  }, [slug, queryClient]);

  const handleBuyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (slug) {
      navigate(`/eventos/${slug}?tab=tickets`);
    }
  };

  return (
    <Wrapper
      {...wrapperProps as any}
      onMouseEnter={handlePrefetch}
      className={cn(
        "group relative rounded-xl overflow-hidden border border-border bg-card transition-colors duration-150 hover:border-muted-foreground/30 cursor-pointer block",
        className
      )}
    >
      <div className="aspect-[16/10] relative overflow-hidden">
        <EventImage
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          priority={priority}
        />
        {category && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/90 text-primary-foreground">
            {getCategoryLabel(category)}
          </span>
        )}
        {eventId && (
          <FavoriteButton eventId={eventId} className="absolute top-2 right-2" />
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <h3 className="font-display font-semibold text-sm text-foreground line-clamp-2 leading-tight">{title}</h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 shrink-0" />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{city}</span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            A partir de{" "}
            <span className="text-foreground font-semibold">
              {formatBRLOrFree(priceFrom)}
            </span>
          </span>
          <Button size="sm" variant="default" className="text-[10px] h-7 px-2.5" onClick={handleBuyClick}>
            {priceFrom === 0 ? "Inscrever-se" : "Comprar"}
          </Button>
        </div>
      </div>
    </Wrapper>
  );
}
