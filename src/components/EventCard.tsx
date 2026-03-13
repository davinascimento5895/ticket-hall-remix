import { Calendar, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/FavoriteButton";
import { cn } from "@/lib/utils";
import { getCategoryLabel } from "@/lib/categories";

interface EventCardProps {
  title: string;
  date: string;
  city: string;
  imageUrl: string;
  priceFrom: number;
  category?: string;
  slug?: string;
  eventId?: string;
  className?: string;
}

export function EventCard({ title, date, city, imageUrl, priceFrom, category, slug, eventId, className }: EventCardProps) {
  const Wrapper = slug ? Link : "div";
  const wrapperProps = slug ? { to: `/eventos/${slug}` } : {};
  return (
    <Wrapper
      {...wrapperProps as any}
      className={cn(
        "group relative rounded-xl overflow-hidden border border-border bg-card transition-colors duration-150 hover:border-muted-foreground/30 cursor-pointer block",
        className
      )}
    >
      <div className="aspect-video relative overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        {category && (
          <span className="absolute top-3 left-3 px-2 py-1 text-xs font-medium rounded-full bg-primary/90 text-primary-foreground">
            {getCategoryLabel(category)}
          </span>
        )}
        {eventId && (
          <FavoriteButton eventId={eventId} className="absolute top-3 right-3" />
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-display font-semibold text-foreground line-clamp-2 leading-tight">{title}</h3>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span>{city}</span>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-muted-foreground">
            A partir de{" "}
            <span className="text-foreground font-semibold">
              {priceFrom === 0 ? "Grátis" : `R$ ${priceFrom.toFixed(2).replace(".", ",")}`}
            </span>
          </span>
          <Button size="sm" variant="default" className="text-xs">
            {priceFrom === 0 ? "Inscrever-se" : "Comprar"}
          </Button>
        </div>
      </div>
    </Wrapper>
  );
}
