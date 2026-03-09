import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, ChevronDown, MapPin } from "lucide-react";
import { useRef, useState } from "react";
import { FEATURED_CAPITALS } from "@/lib/cities";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CityCarouselProps {
  className?: string;
}

export function CityCarousel({ className }: CityCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 220;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className={cn("py-12 md:py-16", className)}>
      <div className="container">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
              O melhor de cada cidade
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Encontre eventos na sua cidade</p>
          </div>
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex text-primary">
            <Link to="/cidades">Ver tudo <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>

        {/* Mobile: Dropdown / Desktop: Carousel */}
        {isMobile ? (
          <div className="space-y-3">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>Escolher cidade</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[calc(100vw-2rem)] p-2 max-h-80 overflow-y-auto" align="start">
                <div className="flex flex-col gap-1">
                  {FEATURED_CAPITALS.map((city) => (
                    <Link
                      key={city.name}
                      to={`/eventos?cidade=${encodeURIComponent(city.name)}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <img
                        src={city.imageUrl}
                        alt={city.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium">{city.name}</p>
                        <p className="text-xs text-muted-foreground">{city.uf}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            <div className="text-center">
              <Button variant="outline" size="sm" asChild>
                <Link to="/cidades">Ver todas as cidades</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative group">
            {/* Scroll buttons - desktop only */}
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-background/90 border border-border shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2 hidden md:flex"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-background/90 border border-border shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity translate-x-1/2 hidden md:flex"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div
              ref={scrollRef}
              className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
            >
              {FEATURED_CAPITALS.map((city) => (
                <Link
                  key={city.name}
                  to={`/eventos?cidade=${encodeURIComponent(city.name)}`}
                  className="group/card relative flex-shrink-0 w-[140px] md:w-[180px] aspect-[3/4] rounded-xl overflow-hidden snap-start"
                >
                  <img
                    src={city.imageUrl}
                    alt={`Eventos em ${city.name}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-white font-semibold text-sm md:text-base leading-tight">
                      {city.name}
                    </h3>
                    <p className="text-white/70 text-[11px] mt-0.5">{city.uf}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
