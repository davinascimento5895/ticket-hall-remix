import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Calendar, MapPin, Shield, AlertTriangle, CheckCircle2, Tag, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getResaleListingById, purchaseResaleListing, calculateResaleFee } from "@/lib/api-resale";
import { useState } from "react";

export default function RevendaCheckout() {
  const { listingId } = useParams<{ listingId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmed, setConfirmed] = useState(false);

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ["resale-listing", listingId],
    queryFn: () => getResaleListingById(listingId!),
    enabled: !!listingId,
  });

  const purchaseMutation = useMutation({
    mutationFn: () => purchaseResaleListing(listingId!),
    onSuccess: () => {
      toast({ title: "Ingresso adquirido!", description: "O ingresso foi transferido para sua conta." });
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["resale-listings"] });
      navigate("/meus-ingressos");
    },
    onError: (err: any) => {
      toast({ title: "Erro na compra", description: err.message || "Tente novamente", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="container pt-4 lg:pt-24 pb-16 max-w-2xl">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !listing || listing.status !== "active") {
    return (
      <div className="container pt-4 lg:pt-24 pb-16 max-w-2xl text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="font-display text-xl font-bold mb-2">Anúncio indisponível</h1>
        <p className="text-muted-foreground mb-6">Este ingresso já foi vendido ou o anúncio expirou.</p>
        <Button onClick={() => navigate("/revenda")}>Ver outros ingressos</Button>
      </div>
    );
  }

  const askingPrice = Number(listing.asking_price);
  const originalPrice = listing.ticket_tiers?.price || listing.original_price || 0;
  const { platformFee, sellerReceives } = calculateResaleFee(askingPrice);
  const isExpired = new Date(listing.expires_at) < new Date();
  const isSelf = user?.id === listing.seller_id;

  return (
    <>
      <SEOHead title={`Comprar ingresso — ${listing.events?.title} — TicketHall`} />

      <div className="container pt-4 lg:pt-24 pb-16 max-w-2xl">
        <Button variant="ghost" size="sm" className="gap-1.5 mb-6" onClick={() => navigate("/revenda")}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <h1 className="font-display text-2xl font-bold mb-6">Comprar ingresso via revenda</h1>

        {/* Event info */}
        <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card mb-6">
          {listing.events?.cover_image_url && (
            <img src={listing.events.cover_image_url} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
          )}
          <div className="min-w-0">
            <Link to={`/eventos/${listing.events?.slug}`} className="font-display font-semibold text-foreground hover:text-primary transition-colors">
              {listing.events?.title}
            </Link>
            <p className="text-sm text-muted-foreground mt-1">{listing.ticket_tiers?.name}</p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
              {listing.events?.start_date && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-primary" />
                  {new Date(listing.events.start_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                </span>
              )}
              {listing.events?.venue_city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-primary" />
                  {listing.events.venue_city}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="p-4 rounded-xl border border-border bg-card space-y-3 mb-6">
          <h2 className="font-semibold text-foreground text-sm">Resumo da compra</h2>

          {Number(originalPrice) > 0 && Number(originalPrice) !== askingPrice && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Preço original</span>
              <span className="text-muted-foreground line-through">R$ {Number(originalPrice).toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Tag className="h-3 w-3" /> Preço de revenda
            </span>
            <span className="text-foreground font-medium">R$ {askingPrice.toFixed(2)}</span>
          </div>

          <div className="border-t border-border pt-3 flex justify-between">
            <span className="font-semibold text-foreground">Total a pagar</span>
            <span className="font-bold text-lg text-primary">R$ {askingPrice.toFixed(2)}</span>
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Percent className="h-3 w-3" />
            A taxa de 10% (R$ {platformFee.toFixed(2)}) é descontada do vendedor. O vendedor receberá R$ {sellerReceives.toFixed(2)}.
          </p>
        </div>

        {/* Security info */}
        <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-muted/30 mb-6">
          <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-medium text-foreground">Compra segura</p>
            <ul className="text-muted-foreground space-y-1">
              <li>• QR Code anterior será invalidado imediatamente</li>
              <li>• Novo QR Code exclusivo gerado para você</li>
              <li>• Ingresso aparecerá em "Meus Ingressos"</li>
              <li>• Protegido contra fraude e duplicação</li>
            </ul>
          </div>
        </div>

        {/* Action */}
        {isExpired ? (
          <div className="text-center p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
            Este anúncio expirou.
          </div>
        ) : isSelf ? (
          <div className="text-center p-4 rounded-xl bg-muted text-muted-foreground text-sm">
            Você não pode comprar seu próprio ingresso.
          </div>
        ) : !user ? (
          <Button className="w-full" onClick={() => navigate("/?login=true")}>
            Faça login para comprar
          </Button>
        ) : (
          <div className="space-y-3">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-border"
              />
              <span className="text-xs text-muted-foreground">
                Li e concordo com os{" "}
                <a href="/termos-de-uso#revenda" className="text-primary hover:underline">termos de revenda</a>.
                Entendo que a compra é definitiva e que a plataforma não garante reembolso em revendas.
              </span>
            </label>

            <Button
              className="w-full gap-2"
              size="lg"
              disabled={!confirmed || purchaseMutation.isPending}
              onClick={() => purchaseMutation.mutate()}
            >
              {purchaseMutation.isPending ? (
                "Processando..."
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Confirmar compra — R$ {askingPrice.toFixed(2)}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
