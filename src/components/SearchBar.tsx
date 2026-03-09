import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, MapPin, Tag, Calendar, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { normalizeText, fuzzyMatch } from "@/lib/search";
import { getCategoryLabel, EVENT_CATEGORIES } from "@/lib/categories";
import { BRAZILIAN_CAPITALS } from "@/lib/cities";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchSuggestion {
  type: "event" | "category" | "city";
  id: string;
  title: string;
  subtitle?: string;
  slug?: string;
}

interface SearchBarProps {
  className?: string;
  variant?: "hero" | "navbar" | "page";
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  className,
  variant = "page",
  placeholder = "Buscar eventos, shows, cidades...",
  autoFocus = false,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const debouncedQuery = useDebounce(query, 300);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    const results: SearchSuggestion[] = [];
    const normalizedQuery = normalizeText(searchQuery);

    try {
      // Search categories (local)
      const matchingCategories = EVENT_CATEGORIES.filter((cat) =>
        fuzzyMatch(searchQuery, cat.label, 0.6) ||
        fuzzyMatch(searchQuery, cat.description, 0.6)
      ).slice(0, 2);

      for (const cat of matchingCategories) {
        results.push({
          type: "category",
          id: cat.value,
          title: cat.label,
          subtitle: "Categoria",
          slug: cat.value,
        });
      }

      // Search cities (local)
      const matchingCities = BRAZILIAN_CAPITALS.filter((city) =>
        fuzzyMatch(searchQuery, city.name, 0.6) ||
        fuzzyMatch(searchQuery, city.state, 0.6)
      ).slice(0, 2);

      for (const city of matchingCities) {
        results.push({
          type: "city",
          id: city.uf,
          title: city.name,
          subtitle: city.state,
          slug: city.name,
        });
      }

      // Search events from database
      const { data: events } = await supabase
        .from("events")
        .select("id, title, slug, venue_city, category, start_date")
        .eq("status", "published")
        .or(
          `title.ilike.%${searchQuery}%,venue_city.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`
        )
        .limit(5);

      if (events) {
        for (const event of events) {
          // Additional fuzzy check
          const titleMatch = fuzzyMatch(searchQuery, event.title, 0.5);
          const cityMatch = event.venue_city && fuzzyMatch(searchQuery, event.venue_city, 0.5);
          const categoryMatch = event.category && fuzzyMatch(searchQuery, event.category, 0.5);

          if (titleMatch || cityMatch || categoryMatch) {
            results.push({
              type: "event",
              id: event.id,
              title: event.title,
              subtitle: event.venue_city || "Online",
              slug: event.slug,
            });
          }
        }
      }

      // Remove duplicates and limit
      const uniqueResults = results.filter(
        (item, index, self) =>
          index === self.findIndex((t) => t.type === item.type && t.id === item.id)
      );

      setSuggestions(uniqueResults.slice(0, 8));
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions(debouncedQuery);
  }, [debouncedQuery, fetchSuggestions]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "Enter" && query.trim()) {
        e.preventDefault();
        navigateToSearch();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          navigateToSearch();
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const navigateToSearch = () => {
    if (query.trim()) {
      navigate(`/busca?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery("");
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    switch (suggestion.type) {
      case "event":
        navigate(`/evento/${suggestion.slug}`);
        break;
      case "category":
        navigate(`/eventos?categoria=${suggestion.slug}`);
        break;
      case "city":
        navigate(`/eventos?cidade=${suggestion.slug}`);
        break;
    }
    setIsOpen(false);
    setQuery("");
  };

  const getSuggestionIcon = (type: SearchSuggestion["type"]) => {
    switch (type) {
      case "event":
        return <Calendar className="h-4 w-4 text-muted-foreground" />;
      case "category":
        return <Tag className="h-4 w-4 text-muted-foreground" />;
      case "city":
        return <MapPin className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const variantStyles = {
    hero: "h-14 text-lg rounded-full pl-6 pr-14",
    navbar: "h-9 text-sm rounded-lg pl-3 pr-10",
    page: "h-12 text-base rounded-xl pl-5 pr-12",
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            "w-full bg-background border-border focus-visible:ring-primary/30",
            variantStyles[variant]
          )}
        />
        <div
          className={cn(
            "absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1",
            variant === "hero" && "right-2",
            variant === "navbar" && "right-1"
          )}
        >
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                inputRef.current?.focus();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            variant={variant === "hero" ? "default" : "ghost"}
            size="icon"
            className={cn(
              variant === "hero" && "h-10 w-10 rounded-full",
              variant === "navbar" && "h-7 w-7",
              variant === "page" && "h-8 w-8"
            )}
            onClick={navigateToSearch}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && (suggestions.length > 0 || (query.length >= 2 && !isLoading)) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
          {suggestions.length > 0 ? (
            <ul className="py-2">
              {suggestions.map((suggestion, index) => (
                <li key={`${suggestion.type}-${suggestion.id}`}>
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={cn(
                      "w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-accent transition-colors",
                      selectedIndex === index && "bg-accent"
                    )}
                  >
                    {getSuggestionIcon(suggestion.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{suggestion.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {suggestion.subtitle}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">
                      {suggestion.type === "event"
                        ? "Evento"
                        : suggestion.type === "category"
                        ? "Categoria"
                        : "Cidade"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center text-muted-foreground">
              <p className="text-sm">Nenhum resultado para "{query}"</p>
              <p className="text-xs mt-1">Tente termos diferentes ou verifique a ortografia</p>
            </div>
          )}

          {query.trim() && (
            <div className="border-t border-border px-4 py-2">
              <button
                type="button"
                onClick={navigateToSearch}
                className="w-full text-sm text-primary hover:underline text-left flex items-center gap-2"
              >
                <Search className="h-3.5 w-3.5" />
                Ver todos os resultados para "{query}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
