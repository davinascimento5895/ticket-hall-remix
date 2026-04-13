import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SEOHead } from "@/components/SEOHead";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { 
  MapPin, 
  Calendar, 
  Clock,
  Tag,
  Shield,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Wallet,
  Store,
  User
} from "lucide-react";
import { formatBRL } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface ResaleListingDetail {
  id: string;
  asking_price: number;
  original_price: number;
  platform_fee: number;
  seller_receives: number;
  status: string;
  expires_at: string;
  created_at: string;
  event: {
    id: string;
    title: string;
    slug: string;
    description: string;
    cover_image_url: string;
    start_date: string;
    end_date: string;
    venue_name: string;
    venue_address: string;
    venue_city: string;
    venue_state: string;
  };
  ticket_tier: {
    name: string;
    description: string;
  };
  seller: {
    full_name: string;
  };
}

export default function ResaleDetail() {
  const { t } = useTranslation();
  const { id: listingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);

  // Buscar detalhes da listagem
  const { data: listing, isLoading } = useQuery({
    queryKey: ["resale-detail", listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resale_listings")
        .select(`
          id,
          asking_price,
          original_price,
          platform_fee,
          seller_receives,
          status,
          expires_at,
          created_at,
          event:event_id (
            id,
            title,
            slug,
            description,
            cover_image_url,
            start_date,
            end_date,
            venue_name,
            venue_address,
            venue_city,
            venue_state
          ),
          ticket_tier:tier_id (
            name,
            description
          ),
          seller:seller_id (
            full_name
          )
        `)
        .eq("id", listingId!)
        .eq("status", "active")
        .single();

      if (error) throw error;
      return data as ResaleListingDetail;
    },
    enabled: !!listingId,
  });

  // Handler de compra - redireciona para checkout seguro com pagamento
  const handleBuy = () => {
    if (!user) {
      toast({
        title: t('auth.signInTitle'),
        description: t('resale.mustBeLoggedInToBuy'),
      });
      navigate("/login", { state: { from: `/revenda/${listingId}` } });
      return;
    }
    // Redirecionar para o checkout oficial com gateway de pagamento
    navigate(`/revenda/${listingId}/checkout`);
  };

  if (isLoading) {
    return (
      <>
        <SEOHead title={t('resale.resaleDetailsTitle')} />
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="container pt-24 pb-20">
            <Skeleton className="h-8 w-32 mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
          <Footer />
        </div>
      </>
    );
  }

  if (!listing) {
    return (
      <>
        <SEOHead title={t('errors.ticketNotFoundTitle')} />
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="container pt-24 pb-20">
            <div className="text-center py-20">
              <AlertTriangle className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
              <h1 className="text-2xl font-bold mb-2">{t('errors.ticketNotFound')}</h1>
              <p className="text-muted-foreground">
                Este ingresso pode já ter sido vendido ou o anúncio foi removido.
              </p>
              <Button 
                variant="outline" 
                className="mt-6"
                onClick={() => navigate("/revenda")}
              >
                Ver outras revendas
              </Button>
            </div>
          </div>
          <Footer />
        </div>
      </>
    );
  }

  const isExpired = new Date(listing.expires_at) < new Date();
  const discount = Math.round((1 - listing.asking_price / listing.original_price) * 100);

  return (
    <>
      <SEOHead 
        title={`${listing.event.title} - Revenda - TicketHall`}
        description={`Compre ingresso revendido para ${listing.event.title} com segurança.`}
      />
      
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="container pt-24 pb-20">
          {/* Breadcrumb */}
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate("/revenda")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para revendas
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Banner do evento */}
              <div className="relative h-64 md:h-96 rounded-xl overflow-hidden">
                <img
                  src={listing.event.cover_image_url || "/placeholder-event.jpg"}
                  alt={listing.event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <Badge className="mb-2 bg-primary/90">
                    <Store className="h-3 w-3 mr-1" />
                    Revenda
                  </Badge>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    {listing.event.title}
                  </h1>
                </div>
              </div>

              {/* Info do evento */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-xl font-semibold">{t('common.aboutTheEvent')}</h2>
                  <p className="text-muted-foreground">
                    {listing.event.description || "Sem descrição disponível."}
                  </p>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">{t('common.date')}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(listing.event.start_date).toLocaleDateString("pt-BR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">{t('filters.time')}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(listing.event.start_date).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">{t('common.venue')}</p>
                        <p className="text-sm text-muted-foreground">
                          {listing.event.venue_name}
                          <br />
                          {listing.event.venue_address}
                          <br />
                          {listing.event.venue_city}, {listing.event.venue_state}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Tag className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">{t('common.ticketType')}</p>
                        <p className="text-sm text-muted-foreground">
                          {listing.ticket_tier.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Alertas */}
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Esta é uma revenda entre usuários da TicketHall. O ingresso foi verificado 
                  e é garantido pela plataforma. Após a compra, você receberá um novo QR Code 
                  único para acesso ao evento.
                </AlertDescription>
              </Alert>
            </div>

            {/* Coluna lateral - Compra */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">{t('common.purchaseSummary')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Vendedor */}
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t('common.seller')}</p>
                      <p className="font-medium">{listing.seller.full_name}</p>
                    </div>
                  </div>

                  {/* Preços */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('common.originalPrice')}</span>
                      <span className="line-through">{formatBRL(listing.original_price)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('resale.resalePrice')}</span>
                      <span className="font-semibold">{formatBRL(listing.asking_price)}</span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-green-600">{t('common.discount')}</span>
                        <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                          {discount}% OFF
                        </Badge>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{t('common.totalToPay')}</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatBRL(listing.asking_price)}
                      </span>
                    </div>
                  </div>

                  {/* Info de segurança */}
                  <div className="p-3 bg-blue-50 rounded-lg text-sm space-y-2">
                    <div className="flex items-center gap-2 text-blue-700">
                      <CheckCircle className="h-4 w-4" />
                      <span>{t('resale.verifiedTicket')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-700">
                      <CheckCircle className="h-4 w-4" />
                      <span>{t('resale.newQrCodeGenerated')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-700">
                      <CheckCircle className="h-4 w-4" />
                      <span>{t('resale.ticketHallGuarantee')}</span>
                    </div>
                  </div>

                  {/* Botão de compra */}
                  {isExpired ? (
                    <Button disabled className="w-full">
                      Anúncio expirado
                    </Button>
                  ) : (
                    <Button 
                      className="w-full"
                      size="lg"
                      onClick={handleBuy}
                    >
                      Comprar ingresso
                    </Button>
                  )}

                  <p className="text-xs text-muted-foreground text-center">
                    Ao comprar, você concorda com os{" "}
                    <a href="/termos-de-uso/cliente#revenda" className="underline">{t('terms.termsOfUse')}</a>
                    {" "}de revenda.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
