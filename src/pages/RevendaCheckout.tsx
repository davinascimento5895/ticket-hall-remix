import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Calendar, MapPin, Shield, AlertTriangle, CheckCircle2, Tag, Percent, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEOHead } from "@/components/SEOHead";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  getResaleListingById,
  calculateResaleFee,
  createResalePayment,
  type ResaleCreditCardData,
} from "@/lib/api-resale";
import { getUserWalletSummary } from "@/lib/api-wallet";
import { DocumentInput } from "@/components/DocumentInput";
import { validateDocument } from "@/utils/document";

export default function RevendaCheckout() {
  const { listingId } = useParams<{ listingId: string }>();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmed, setConfirmed] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit_card" | "boleto">("pix");
  const [installments, setInstallments] = useState(1);
  const [useWalletCredit, setUseWalletCredit] = useState(false);
  const [payerCpf, setPayerCpf] = useState(profile?.document_number || "");
  const [cardData, setCardData] = useState<ResaleCreditCardData>({
    holderName: profile?.full_name || "",
    number: "",
    expiryMonth: "",
    expiryYear: "",
    ccv: "",
    postalCode: "",
    addressNumber: "",
  });

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ["resale-listing", listingId],
    queryFn: () => getResaleListingById(listingId!),
    enabled: !!listingId,
    staleTime: 30_000,
  });

  const { data: walletSummary } = useQuery({
    queryKey: ["user-wallet-summary", user?.id],
    queryFn: () => getUserWalletSummary(),
    enabled: !!user,
    staleTime: 15_000,
  });

  const purchaseMutation = useMutation({
    mutationFn: () => createResalePayment({
      listingId: listingId!,
      paymentMethod,
      creditCard: paymentMethod === "credit_card" ? cardData : undefined,
      installments: paymentMethod === "credit_card" ? installments : undefined,
      payerCpf,
      useWalletCredit,
    }),
    onSuccess: (data) => {
      if (!data?.success) {
        toast({ title: "Erro na compra", description: data?.error || "Tente novamente", variant: "destructive" });
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["my-resale-listings"] });
      queryClient.invalidateQueries({ queryKey: ["resale-listings"] });

      if (data.immediateConfirmation) {
        queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      }

      navigate(`/revenda/${listingId}/sucesso`, {
        state: {
          ticketId: data?.ticketId,
          total: data?.total ?? askingPrice,
          eventTitle: listing?.events?.title,
          tierName: listing?.ticket_tiers?.name,
          eventSlug: listing?.events?.slug,
          immediateConfirmation: !!data?.immediateConfirmation,
          paymentMethod,
          pixQrCode: data?.pixQrCode,
          pixQrCodeImage: data?.pixQrCodeImage,
          boletoUrl: data?.boletoUrl,
          boletoBarcode: data?.boletoBarcode,
          dueDate: data?.dueDate,
        },
      });
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
  const walletAvailable = Number(walletSummary?.wallet?.available_balance || 0);
  const { platformFee, sellerReceives } = calculateResaleFee(askingPrice);
  const isExpired = new Date(listing.expires_at) < new Date();
  const isSelf = user?.id === listing.seller_id;
  const cardIsValid = useMemo(() => {
    if (paymentMethod !== "credit_card") return true;
    return (
      cardData.holderName.trim().length >= 3
      && cardData.number.replace(/\s/g, "").length >= 13
      && cardData.expiryMonth.length >= 2
      && cardData.expiryYear.length >= 2
      && cardData.ccv.length >= 3
    );
  }, [cardData, paymentMethod]);
  const payerDocumentValid = validateDocument(payerCpf).valid;

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
            <img src={listing.events.cover_image_url} alt={listing.events?.title || "Evento"} className="w-20 h-20 rounded-lg object-cover shrink-0" />
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
                  {new Date(listing.events.start_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" })}
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
          <>
            <Button className="w-full" onClick={() => setShowAuth(true)}>
              Faça login para comprar
            </Button>
            <AuthModal open={showAuth} onOpenChange={setShowAuth} />
          </>
        ) : (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-3 gap-2">
              {[
                { id: "pix", label: "PIX" },
                { id: "boleto", label: "Boleto" },
                { id: "credit_card", label: "Cartão" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`rounded-lg border p-2 text-sm font-medium transition-colors ${paymentMethod === m.id ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/30"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {paymentMethod === "credit_card" && (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="space-y-1">
                  <Label>Nome no cartão</Label>
                  <Input value={cardData.holderName} onChange={(e) => setCardData((p) => ({ ...p, holderName: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Número do cartão</Label>
                  <Input value={cardData.number} onChange={(e) => setCardData((p) => ({ ...p, number: e.target.value }))} placeholder="0000 0000 0000 0000" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label>Mês</Label>
                    <Input value={cardData.expiryMonth} onChange={(e) => setCardData((p) => ({ ...p, expiryMonth: e.target.value }))} placeholder="MM" />
                  </div>
                  <div className="space-y-1">
                    <Label>Ano</Label>
                    <Input value={cardData.expiryYear} onChange={(e) => setCardData((p) => ({ ...p, expiryYear: e.target.value }))} placeholder="AA" />
                  </div>
                  <div className="space-y-1">
                    <Label>CVV</Label>
                    <Input value={cardData.ccv} onChange={(e) => setCardData((p) => ({ ...p, ccv: e.target.value }))} placeholder="123" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label>Parcelas</Label>
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(Number(e.target.value))}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {Array.from({ length: 12 }).map((_, idx) => (
                        <option key={idx + 1} value={idx + 1}>{idx + 1}x</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <DocumentInput label="CPF ou CNPJ pagador" value={payerCpf} onChange={setPayerCpf} />
                  </div>
                </div>
              </div>
            )}

            <label className="flex items-start gap-2 cursor-pointer rounded-lg border border-border p-3">
              <input
                type="checkbox"
                checked={useWalletCredit}
                onChange={(e) => setUseWalletCredit(e.target.checked)}
                className="mt-1"
              />
              <span className="text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-medium text-foreground"><Wallet className="h-3.5 w-3.5" /> Usar saldo da carteira primeiro</span>
                <br />
                Se houver saldo suficiente, a compra é concluída instantaneamente sem gateway.
                Saldo atual: R$ {walletAvailable.toFixed(2)}
              </span>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-border"
              />
              <span className="text-xs text-muted-foreground">
                Li e concordo com os{" "}
                <a href="/termos-de-uso/cliente#revenda" className="text-primary hover:underline">termos de revenda</a>.
                Entendo que a compra é definitiva e que a plataforma não garante reembolso em revendas.
              </span>
            </label>

            <Button
              className="w-full gap-2"
              size="lg"
              disabled={!confirmed || purchaseMutation.isPending || !cardIsValid || !payerDocumentValid}
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
