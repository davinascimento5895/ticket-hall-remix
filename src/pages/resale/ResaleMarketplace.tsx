import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  MapPin, 
  Calendar, 
  Tag,
  ArrowRight,
  Store,
  Filter,
  X
} from "lucide-react";
import { formatBRL } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface ResaleListing {
  id: string;
  asking_price: number;
  original_price: number;
  created_at: string;
  event: {
    id: string;
    title: string;
    slug: string;
    cover_image_url: string;
    start_date: string;
    venue_name: string;
    venue_city: string;
    venue_state: string;
  };
  ticket_tier: {
    name: string;
  };
}

export default function ResaleMarketplace() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "");
  const [showFilters, setShowFilters] = useState(false);

  // Buscar listagens de revenda
  const { data: listings, isLoading } = useQuery({
    queryKey: ["resale-marketplace", search, selectedCity],
    queryFn: async () => {
      let query = supabase
        .from("resale_listings")
        .select(`
          id,
          asking_price,
          original_price,
          created_at,
          event:event_id (
            id,
            title,
            slug,
            cover_image_url,
            start_date,
            venue_name,
            venue_city,
            venue_state
          ),
          ticket_tier:tier_id (
            name
          )
        `)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (selectedCity) {
        query = query.ilike("event.venue_city", `%${selectedCity}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filtrar no cliente se houver busca textual
      let results = data || [];
      if (search.trim()) {
        const searchLower = search.toLowerCase();
        results = results.filter((l: any) => 
          l.event?.title?.toLowerCase().includes(searchLower) ||
          l.event?.venue_city?.toLowerCase().includes(searchLower) ||
          l.ticket_tier?.name?.toLowerCase().includes(searchLower)
        );
      }

      return results as ResaleListing[];
    },
  });

  // Cidades únicas para filtro
  const cities = listings 
    ? [...new Set(listings.map(l => l.event?.venue_city).filter(Boolean))]
    : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (selectedCity) params.set("city", selectedCity);
    setSearchParams(params);
  };

  const handleBuy = (listingId: string) => {
    if (!user) {
      toast({
        title: t('auth.signInTitle'),
        description: t('resale.mustBeLoggedInToBuy'),
      });
      navigate("/login", { state: { from: `/revenda/${listingId}` } });
      return;
    }
    navigate(`/revenda/${listingId}`);
  };

  return (
    <>
      <SEOHead 
        title={t('resale.resaleMarketplaceTitle')} 
        description={t('resale.marketplaceDescription')}
      />
      
      <div className="min-h-screen bg-background">
        <Navbar />
        
        {/* Header */}
        <div className="bg-gradient-to-b from-primary/5 to-background pt-24 pb-12">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Store className="h-4 w-4" />
                Marketplace de Revenda
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Ingressos Revendidos
              </h1>
              <p className="text-muted-foreground text-lg">
                Encontre ingressos de outros usuários com preços especiais. 
                Compra 100% segura com garantia TicketHall.
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="container -mt-6 mb-12">
          <Card className="shadow-lg">
            <CardContent className="p-4 md:p-6">
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('search.searchByEventCity')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowFilters(!showFilters)}
                  className="md:w-auto"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                  {selectedCity && (
                    <Badge variant="secondary" className="ml-2">
                      1
                    </Badge>
                  )}
                </Button>
                
                <Button type="submit" className="md:w-auto">
                  Buscar
                </Button>
              </form>

              {/* Filtros expandidos */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-sm font-medium">{t('common.city')}</span>
                    {cities.length > 0 ? (
                      cities.map((city) => (
                        <Badge
                          key={city}
                          variant={selectedCity === city ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setSelectedCity(selectedCity === city ? "" : city)}
                        >
                          {city}
                          {selectedCity === city && <X className="h-3 w-3 ml-1" />}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Nenhuma cidade disponível
                      </span>
                    )}
                    {selectedCity && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedCity("")}
                      >
                        Limpar filtro
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Listagens */}
        <div className="container pb-20">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : listings && listings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <Card key={listing.id} className="overflow-hidden group">
                  {/* Imagem do evento */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={listing.event?.cover_image_url || "/placeholder-event.jpg"}
                      alt={listing.event?.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-primary/90 text-primary-foreground">
                        Revenda
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 right-3">
                      <Badge variant="secondary" className="font-semibold">
                        {formatBRL(listing.asking_price)}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    {/* Info do evento */}
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {listing.event?.title}
                    </h3>
                    
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {listing.event?.start_date && (
                          new Date(listing.event.start_date).toLocaleDateString("pt-BR", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        )}
                      </div>
                      
                      {(listing.event?.venue_city || listing.event?.venue_name) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {[
                            listing.event.venue_name,
                            listing.event.venue_city,
                            listing.event.venue_state
                          ].filter(Boolean).join(", ")}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        {listing.ticket_tier?.name || "Ingresso"}
                      </div>
                    </div>

                    {/* Preços */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">{t('common.original')}</p>
                        <p className="text-sm line-through text-muted-foreground">
                          {formatBRL(listing.original_price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{t('resale.resalePrice')}</p>
                        <p className="text-xl font-bold text-primary">
                          {formatBRL(listing.asking_price)}
                        </p>
                      </div>
                    </div>

                    {/* Desconto */}
                    {listing.asking_price < listing.original_price && (
                      <div className="mb-4">
                        <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                          {Math.round((1 - listing.asking_price / listing.original_price) * 100)}% OFF
                        </Badge>
                      </div>
                    )}

                    {/* Botão comprar */}
                    <Button 
                      className="w-full"
                      onClick={() => handleBuy(listing.id)}
                    >
                      Comprar Ingresso
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Store className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Nenhum ingresso disponível
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                No momento não há ingressos revendidos disponíveis. 
                Volte mais tarde ou procure por eventos diferentes.
              </p>
              <Button 
                variant="outline" 
                className="mt-6"
                onClick={() => navigate("/eventos")}
              >
                Ver todos os eventos
              </Button>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </>
  );
}
