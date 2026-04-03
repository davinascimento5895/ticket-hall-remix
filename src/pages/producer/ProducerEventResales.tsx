import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { ResaleConfiguration } from "@/components/resale/ResaleConfiguration";
import { 
  Store, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users,
  ArrowUpRight,
  Calendar
} from "lucide-react";
import { formatBRL } from "@/lib/utils";

interface ResaleStats {
  totalResold: number;
  totalValue: number;
  platformFeeGenerated: number;
  activeListings: number;
  avgResalePrice: number;
}

interface ResaleListing {
  id: string;
  ticket_id: string;
  seller_name: string;
  buyer_name: string | null;
  original_price: number;
  asking_price: number;
  platform_fee: number;
  status: string;
  created_at: string;
  sold_at: string | null;
}

export default function ProducerEventResales() {
  const { t } = useTranslation();
  const { id: eventId } = useParams();

  // Buscar configuração do evento
  const { data: eventConfig, isLoading: configLoading } = useQuery({
    queryKey: ["event-resale-config", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          allow_resale,
          resale_min_price_percent,
          resale_max_price_percent,
          resale_start_date,
          resale_end_date,
          half_price_enabled,
          half_price_require_document,
          half_price_accepted_documents,
          half_price_show_badge_checkin
        `)
        .eq("id", eventId!)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  // Buscar estatísticas de revenda
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["event-resale-stats", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resale_listings")
        .select("asking_price, platform_fee, status")
        .eq("event_id", eventId!);
      
      if (error) throw error;
      
      const listings = data || [];
      const sold = listings.filter(l => l.status === 'sold');
      const active = listings.filter(l => l.status === 'active');
      
      return {
        totalResold: sold.length,
        totalValue: sold.reduce((sum, l) => sum + (l.asking_price || 0), 0),
        platformFeeGenerated: sold.reduce((sum, l) => sum + (l.platform_fee || 0), 0),
        activeListings: active.length,
        avgResalePrice: sold.length > 0 
          ? sold.reduce((sum, l) => sum + (l.asking_price || 0), 0) / sold.length 
          : 0,
      } as ResaleStats;
    },
    enabled: !!eventId,
  });

  // Buscar listagens de revenda
  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ["event-resale-listings", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resale_listings")
        .select(`
          id,
          ticket_id,
          original_price,
          asking_price,
          platform_fee,
          status,
          created_at,
          sold_at,
          seller:seller_id(full_name),
          buyer:buyer_id(full_name)
        `)
        .eq("event_id", eventId!)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as ResaleListing[];
    },
    enabled: !!eventId,
  });

  const isLoading = configLoading || statsLoading || listingsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Store className="h-6 w-6" />
          Revenda de Ingressos
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie as revendas e acompanhe o marketplace do seu evento
        </p>
      </div>

      {/* Configuração */}
      <ResaleConfiguration 
        eventId={eventId!} 
        initialConfig={eventConfig || {}} 
      />

      {/* Estatísticas */}
      {eventConfig?.allow_resale && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.totalResold || 0}</p>
                    <p className="text-sm text-muted-foreground">{t('resale.resoldTickets')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatBRL(stats?.totalValue || 0)}</p>
                    <p className="text-sm text-muted-foreground">{t('resale.resaleVolume')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatBRL(stats?.platformFeeGenerated || 0)}</p>
                    <p className="text-sm text-muted-foreground">{t('resale.feesGenerated')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Users className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.activeListings || 0}</p>
                    <p className="text-sm text-muted-foreground">{t('resale.activeListings')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de revendas */}
          <Card>
            <CardHeader>
              <CardTitle>{t('resale.resaleHistory')}</CardTitle>
              <CardDescription>
                Últimas revendas realizadas no marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              {listings && listings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="p-3 font-medium">{t('common.seller')}</th>
                        <th className="p-3 font-medium">{t('common.buyer')}</th>
                        <th className="p-3 font-medium">{t('common.originalValue')}</th>
                        <th className="p-3 font-medium">{t('resale.resaleValue')}</th>
                        <th className="p-3 font-medium">{t('common.status')}</th>
                        <th className="p-3 font-medium">{t('common.date')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listings.map((listing) => (
                        <tr key={listing.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">{(listing as any).seller?.full_name || "—"}</td>
                          <td className="p-3">
                            {listing.status === 'sold' 
                              ? (listing as any).buyer?.full_name || "—"
                              : "—"
                            }
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {formatBRL(listing.original_price)}
                          </td>
                          <td className="p-3 font-medium">
                            {formatBRL(listing.asking_price)}
                          </td>
                          <td className="p-3">
                            <Badge variant={
                              listing.status === 'sold' ? 'default' :
                              listing.status === 'active' ? 'secondary' :
                              'outline'
                            }>
                              {listing.status === 'sold' ? 'Vendido' :
                               listing.status === 'active' ? 'Ativo' :
                               listing.status === 'cancelled' ? 'Cancelado' :
                               'Expirado'}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {listing.status === 'sold' && listing.sold_at
                              ? new Date(listing.sold_at).toLocaleDateString('pt-BR')
                              : new Date(listing.created_at).toLocaleDateString('pt-BR')
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Store className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                  <p className="text-muted-foreground">{t('resale.noResalesYet')}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    As revendas aparecerão aqui quando os compradores começarem a vender seus ingressos
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!eventConfig?.allow_resale && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Store className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium">{t('resale.resaleDisabled')}</p>
            <p className="text-muted-foreground mt-1 max-w-md mx-auto">
              A revenda de ingressos está desabilitada para este evento. 
              Ative nas configurações acima para permitir que os compradores 
              revendam seus ingressos no marketplace.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
