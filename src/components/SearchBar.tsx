import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Search, X, MapPin, Tag, Calendar, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { normalizeText, fuzzyMatch, sanitizePostgrestFilter } from "@/lib/search";
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
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
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
      const safeQuery = sanitizePostgrestFilter(searchQuery);
      const { data: events } = await supabase
        .from("events")
        .select("id, title, slug, venue_city, category, start_date")
        .eq("status", "published")
        .or(
          `title.ilike.%${safeQuery}%,venue_city.ilike.%${safeQuery}%,category.ilike.%${safeQuery}%`
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

  // Update dropdown position for portal rendering
  useLayoutEffect(() => {
    if (!isOpen) return;
    const update = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setDropdownRect({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
      }
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [isOpen, suggestions]);

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
      case "event": {
        const slug = suggestion.slug || suggestion.id;
        navigate(`/evento/${encodeURIComponent(String(slug))}`);
        break;
      }
      case "category": {
        const cat = suggestion.slug || suggestion.id;
        navigate(`/eventos?categoria=${encodeURIComponent(String(cat))}`);
        break;
      }
      case "city": {
        const city = suggestion.slug || suggestion.id;
        navigate(`/eventos?cidade=${encodeURIComponent(String(city))}`);
        break;
      }
    }
    setIsOpen(false);
    setQuery("");
  };

  const getSuggestionIcon = (type: SearchSuggestion["type"]) => {
    switch (type) {
      case "event":
        return <Calendar className="h-4 w-4 text-gray-500" />;
      case "category":
        return <Tag className="h-4 w-4 text-gray-500" />;
      case "city":
        return <MapPin className="h-4 w-4 text-gray-500" />;
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
      {isOpen && (suggestions.length > 0 || (query.length >= 2 && !isLoading)) &&
        typeof document !== "undefined" &&
        dropdownRect &&
        createPortal(
          <div
            style={{ position: "absolute", top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width }}
            className="mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-[9999] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
          >
            {suggestions.length > 0 ? (
              (() => {
                const grouped: Record<string, SearchSuggestion[]> = {
                  category: [],
                  city: [],
                  event: [],
                };

                suggestions.forEach((s) => grouped[s.type].push(s));

                const flat: SearchSuggestion[] = [
                  ...grouped.category,
                  ...grouped.city,
                  ...grouped.event,
                ];

                return (
                  <div>
                    {grouped.category.length > 0 && (
                      <div>
                        <div className="px-3 py-1 bg-gray-50 text-xxs text-gray-500 uppercase text-[11px]">Categorias</div>
                        <ul className="py-1">
                          {grouped.category.map((suggestion, i) => {
                            const overallIndex = i;
                            return (
                              <li key={`category-${suggestion.id}`}>
                                <button
                                  type="button"
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className={cn(
                                    "w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-gray-100 transition-colors",
                                    selectedIndex === overallIndex && "bg-gray-200"
                                  )}
                                >
                                  {getSuggestionIcon(suggestion.type)}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate text-sm text-gray-900">{suggestion.title}</p>
                                    <p className="text-xs text-gray-600 truncate">{suggestion.subtitle}</p>
                                  </div>
                                  <span className="text-xs text-gray-600 capitalize">Categoria</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {grouped.city.length > 0 && (
                      <div>
                        <div className="px-3 py-1 bg-gray-50 text-xxs text-gray-500 uppercase text-[11px]">Cidades</div>
                        <ul className="py-1">
                          {grouped.city.map((suggestion, i) => {
                            const overallIndex = grouped.category.length + i;
                            return (
                              <li key={`city-${suggestion.id}`}>
                                <button
                                  type="button"
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className={cn(
                                    "w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-gray-100 transition-colors",
                                    selectedIndex === overallIndex && "bg-gray-200"
                                  )}
                                >
                                  {getSuggestionIcon(suggestion.type)}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate text-sm text-gray-900">{suggestion.title}</p>
                                    <p className="text-xs text-gray-600 truncate">{suggestion.subtitle}</p>
                                  </div>
                                  <span className="text-xs text-gray-600 capitalize">Cidade</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {grouped.event.length > 0 && (
                      <div>
                        <div className="px-3 py-1 bg-gray-50 text-xxs text-gray-500 uppercase text-[11px]">Eventos</div>
                        <ul className="py-1">
                          {grouped.event.map((suggestion, i) => {
                            const overallIndex = grouped.category.length + grouped.city.length + i;
                            return (
                              <li key={`event-${suggestion.id}`}>
                                <button
                                  type="button"
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className={cn(
                                    "w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-gray-100 transition-colors",
                                    selectedIndex === overallIndex && "bg-gray-200"
                                  )}
                                >
                                  {getSuggestionIcon(suggestion.type)}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate text-sm text-gray-900">{suggestion.title}</p>
                                    <p className="text-xs text-gray-600 truncate">{suggestion.subtitle}</p>
                                  </div>
                                  <span className="text-xs text-gray-600 capitalize">Evento</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="px-4 py-6 text-center text-gray-600">
                <p className="text-sm text-gray-800">Nenhum resultado para "{query}"</p>
                <p className="text-xs mt-1">Tente termos diferentes ou verifique a ortografia</p>
              </div>
            )}

            {query.trim() && (
              <div className="border-t border-gray-100 px-3 py-2">
                <button
                  type="button"
                  onClick={navigateToSearch}
                  className="w-full text-sm text-gray-800 hover:underline text-left flex items-center gap-2"
                >
                  <Search className="h-3.5 w-3.5 text-gray-600" />
                  Ver todos os resultados para "{query}"
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
