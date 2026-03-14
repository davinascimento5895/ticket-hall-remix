import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Copy, Check, CreditCard, QrCode, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead } from "@/components/SEOHead";
import { CountdownTimer } from "@/components/CountdownTimer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { createPayment } from "@/lib/api-payment";
import { toast } from "@/hooks/use-toast";
import { formatBRL } from "@/lib/utils";

export default function PedidoRecuperacao() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isRegeneratingPix, setIsRegeneratingPix] = useState(false);

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ["order-recovery", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, events(title, cover_image_url, start_date, venue_name)")
        .eq("id", orderId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!orderId && !!user,
    staleTime: 10_000,
  });

  // Realtime subscription for payment confirmation
  useEffect(() => {
    if (!orderId) return;
    const channel = supabase
      .channel(`order-recovery-${orderId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `id=eq.${orderId}`,
      }, (payload: any) => {
        if (payload.new.status === "paid") {
          toast({ title: "Pagamento confirmado!", description: "Seus ingressos foram gerados." });
          navigate("/meus-ingressos");
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId, navigate]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegeneratePix = async () => {
    if (!orderId) return;
    setIsRegeneratingPix(true);
    try {
      const result = await createPayment(orderId, "pix");
      if (!result.success) {
        toast({
          title: "Não foi possível gerar o QR agora",
          description: result.error || "Tente novamente em alguns segundos.",
          variant: "destructive",
        });
        return;
      }
      await refetch();
      toast({ title: "Cobrança PIX atualizada", description: "Confira o QR Code abaixo." });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar cobrança PIX",
        description: error?.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsRegeneratingPix(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container pt-4 lg:pt-24 pb-16 max-w-2xl">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container pt-4 lg:pt-24 pb-16 max-w-2xl text-center">
        <p className="text-muted-foreground">Pedido não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/meus-ingressos")}>
          Ir para Meus Ingressos
        </Button>
      </div>
    );
  }

  const isPaid = order.status === "paid";
  const isExpired = order.status === "expired";
  const isPending = order.status === "pending" || order.status === "awaiting_payment";
  const event = order.events as any;

  return (
    <>
      <SEOHead title="Acompanhar Pedido" description="Acompanhe o status do seu pedido" />
      <div className="container pt-4 lg:pt-24 pb-16 max-w-2xl">
        <Link to="/meus-ingressos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Meus Ingressos
        </Link>

        <h1 className="font-display text-2xl font-bold mb-2">Pedido</h1>
        <p className="text-sm text-muted-foreground mb-6 font-mono">{order.id}</p>

        {/* Event info */}
        {event && (
          <Card className="mb-6">
            <CardContent className="flex items-center gap-4 p-4">
              {event.cover_image_url && (
                <img src={event.cover_image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
              )}
              <div>
                <p className="font-display font-semibold">{event.title}</p>
                <p className="text-sm text-muted-foreground">
                  {event.start_date && new Date(event.start_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                  {event.venue_name && ` • ${event.venue_name}`}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status */}
        <Card className="mb-6">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={isPaid ? "default" : isExpired ? "destructive" : "secondary"}>
                {isPaid ? "Pago" : isExpired ? "Expirado" : "Aguardando pagamento"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Método</span>
              <span className="text-sm font-medium flex items-center gap-1.5">
                {order.payment_method === "pix" && <><QrCode className="h-3.5 w-3.5" /> PIX</>}
                {order.payment_method === "credit_card" && <><CreditCard className="h-3.5 w-3.5" /> Cartão</>}
                {order.payment_method === "boleto" && <><FileText className="h-3.5 w-3.5" /> Boleto</>}
                {!order.payment_method && "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-semibold">{formatBRL(order.total)}</span>
            </div>
            {isPending && order.expires_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Expira em</span>
                <CountdownTimer expiresAt={new Date(order.expires_at)} onExpire={() => refetch()} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* PIX payment details */}
        {isPending && order.payment_method === "pix" && order.pix_qr_code && (
          <Card className="mb-6">
            <CardContent className="p-5 space-y-4 text-center">
              <h3 className="font-display font-semibold">Pague via PIX</h3>
              {order.pix_qr_code_image && (
                <img
                  src={order.pix_qr_code_image.startsWith("data:image") ? order.pix_qr_code_image : `data:image/png;base64,${order.pix_qr_code_image}`}
                  alt="QR Code PIX"
                  className="w-48 h-48 mx-auto"
                />
              )}
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-2">Código PIX (copia e cola):</p>
                <code className="text-xs break-all block">{order.pix_qr_code}</code>
              </div>
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(order.pix_qr_code!)}>
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "Copiado!" : "Copiar código"}
              </Button>
              <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Aguardando confirmação do pagamento...
              </div>
            </CardContent>
          </Card>
        )}

        {isPending && order.payment_method === "pix" && !order.pix_qr_code && (
          <Card className="mb-6">
            <CardContent className="p-5 space-y-4 text-center">
              <h3 className="font-display font-semibold">Gerando cobrança PIX</h3>
              <p className="text-sm text-muted-foreground">
                Estamos aguardando o gateway retornar seu código PIX. Clique abaixo para atualizar.
              </p>
              <Button variant="outline" onClick={handleRegeneratePix} disabled={isRegeneratingPix}>
                {isRegeneratingPix ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Atualizar QR Code PIX
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Boleto payment details */}
        {isPending && order.payment_method === "boleto" && order.boleto_url && (
          <Card className="mb-6">
            <CardContent className="p-5 space-y-4 text-center">
              <h3 className="font-display font-semibold">Pague o Boleto</h3>
              {order.boleto_barcode && (
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-2">Código de barras:</p>
                  <code className="text-xs break-all block">{order.boleto_barcode}</code>
                </div>
              )}
              <div className="flex gap-2 justify-center">
                {order.boleto_barcode && (
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(order.boleto_barcode!)}>
                    {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    Copiar código
                  </Button>
                )}
                <Button size="sm" asChild>
                  <a href={order.boleto_url} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4 mr-1" /> Abrir boleto
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Paid confirmation */}
        {isPaid && (
          <Card className="mb-6 border-primary/30">
            <CardContent className="p-5 text-center space-y-3">
              <Check className="h-10 w-10 text-primary mx-auto" />
              <h3 className="font-display font-semibold text-primary">Pagamento confirmado!</h3>
              <p className="text-sm text-muted-foreground">Seus ingressos estão disponíveis.</p>
              <Button onClick={() => navigate("/meus-ingressos")}>Ver meus ingressos</Button>
            </CardContent>
          </Card>
        )}

        {/* Expired */}
        {isExpired && (
          <Card className="mb-6 border-destructive/30">
            <CardContent className="p-5 text-center space-y-3">
              <Clock className="h-10 w-10 text-destructive mx-auto" />
              <h3 className="font-display font-semibold text-destructive">Pedido expirado</h3>
              <p className="text-sm text-muted-foreground">O prazo para pagamento expirou. Faça um novo pedido.</p>
              <Button variant="outline" onClick={() => navigate("/eventos")}>Ver eventos</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
