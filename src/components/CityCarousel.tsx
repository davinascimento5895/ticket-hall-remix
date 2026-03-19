import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { FEATURED_CAPITALS } from "@/lib/cities";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CityCarouselProps {
  className?: string;
}

export function CityCarousel({ className }: CityCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

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

        <div className="relative group overflow-x-hidden">
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

        <div className="mt-4 text-center sm:hidden">
          <Button variant="outline" size="sm" asChild>
            <Link to="/cidades">Ver todas as cidades</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
