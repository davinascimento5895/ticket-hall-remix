import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EVENT_CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CategoryCarouselProps {
  className?: string;
}

export function CategoryCarousel({ className }: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className={cn("py-8 md:py-12", className)}>
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl md:text-2xl font-bold">
            Explore nossas coleções
          </h2>
          <Link 
            to="/eventos" 
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Ver tudo
          </Link>
        </div>

        {/* Mobile: Dropdown / Desktop: Carousel */}
        {isMobile ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>Escolher categoria</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] p-2" align="start">
              <div className="grid grid-cols-2 gap-2">
                {EVENT_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Link
                      key={category.value}
                      to={`/eventos?categoria=${category.value}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-medium">{category.label}</span>
                    </Link>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <div className="relative group">
            {/* Navigation buttons - desktop only */}
            <Button
              variant="outline"
              size="icon"
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/95 backdrop-blur shadow-lg border-border opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
              onClick={() => scroll("left")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/95 backdrop-blur shadow-lg border-border opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
              onClick={() => scroll("right")}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>

            {/* Scrollable categories */}
            <div
              ref={scrollRef}
              className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {EVENT_CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <Link
                    key={category.value}
                    to={`/eventos?categoria=${category.value}`}
                    className="flex-shrink-0 scroll-snap-align-start"
                    style={{ scrollSnapAlign: "start" }}
                  >
                    <div className="flex flex-col items-center gap-2 p-4 md:p-5 rounded-xl bg-card hover:bg-accent/10 border border-border hover:border-primary/30 transition-all duration-200 min-w-[100px] md:min-w-[120px] group/item">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-secondary flex items-center justify-center group-hover/item:bg-primary/10 transition-colors">
                        <Icon className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground group-hover/item:text-primary transition-colors" />
                      </div>
                      <span className="text-xs md:text-sm font-medium text-center text-muted-foreground group-hover/item:text-foreground transition-colors whitespace-nowrap">
                        {category.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
