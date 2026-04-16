import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Copy, Download, ExternalLink, Globe, MapPin, Ticket, Clock } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { TicketDownloadCard, type TicketDownloadData } from "@/components/checkout/TicketDownloadCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { generateTicketPDF } from "@/lib/ticket-pdf";
import { useToast } from "@/hooks/use-toast";
import { formatBRL } from "@/lib/utils";
import { resolveTicketQrCode } from "@/lib/ticket-qr";

export default function TicketDetailPage() {
  const { ticketId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copying, setCopying] = useState(false);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["my-ticket-detail", user?.id, ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("id, qr_code, qr_code_image_url, attendee_name, attendee_cpf, order_id, created_at, status, ticket_tiers(name, price, is_resellable, is_transferable), events(title, slug, cover_image_url, start_date, end_date, venue_name, venue_address, venue_city, venue_state, is_online, online_url, description), orders(id, total, subtotal, platform_fee, discount_amount, created_at, payment_method)")
        .eq("id", ticketId!)
        .eq("owner_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!ticketId,
  });

  const event = ticket?.events as any;
  const order = ticket?.orders as any;

  const ticketDownloadData = useMemo<TicketDownloadData | null>(() => {
    if (!ticket || !event || !order) return null;

    return {
      ticketId: ticket.id,
      tierName: ticket.ticket_tiers?.name || "Ingresso",
      tierPrice: ticket.ticket_tiers?.price,
      attendeeName: ticket.attendee_name || undefined,
      attendeeCpf: ticket.attendee_cpf || undefined,
      qrCode: resolveTicketQrCode(ticket.qr_code, ticket.id),
      qrCodeImageUrl: ticket.qr_code_image_url,
      eventTitle: event.title || "Evento",
      eventDate: event.start_date || new Date().toISOString(),
      eventEndDate: event.end_date,
      venueName: event.venue_name,
      venueAddress: event.venue_address,
      venueCity: event.venue_city,
      venueState: event.venue_state,
      isOnline: event.is_online,
      coverImageUrl: event.cover_image_url,
      orderCode: (order.id || ticket.order_id || "").slice(0, 8).toUpperCase(),
      purchaseDate: order.created_at,
      paymentMethod: order.payment_method,
      eventDescription: event.description || undefined,
      index: 0,
    };
  }, [ticket, event, order]);

  const onlineUrl = event?.online_url || "";
  const eventUrl = event?.slug ? `${window.location.origin}/eventos/${event.slug}` : "";

  const handleDownloadPDF = async () => {
    if (!ticketDownloadData) return;
    try {
      await generateTicketPDF(ticketDownloadData);
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({ title: "Erro ao gerar PDF", description: "Não foi possível baixar o ingresso agora.", variant: "destructive" });
    }
  };

  const handleCopyLink = async () => {
    if (!onlineUrl) return;
    try {
      setCopying(true);
      await navigator.clipboard.writeText(onlineUrl);
      toast({ title: "Link copiado", description: "O link do evento online foi copiado para a área de transferência." });
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    } finally {
      setCopying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container pt-6 lg:pt-24 pb-16 max-w-5xl">
        <div className="space-y-4">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-6 w-72" />
          <Skeleton className="h-[520px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!ticket || !event || !ticketDownloadData) {
    return (
      <div className="container pt-6 lg:pt-24 pb-16 max-w-5xl">
        <SEOHead title="Ingresso não encontrado" description="O ingresso solicitado não foi localizado." />
        <EmptyState
          icon={<Ticket className="h-12 w-12" />}
          title="Ingresso não encontrado"
          description="Não conseguimos localizar esse ingresso na sua conta."
          actionLabel="Voltar para meus ingressos"
          onAction={() => navigate("/meus-ingressos")}
        />
      </div>
    );
  }

  const eventStart = new Date(event.start_date);
  const eventEnd = event.end_date ? new Date(event.end_date) : null;

  return (
    <>
      <SEOHead
        title={`${event.title || "Ingresso"}`}
        description={event.description || "Visualize seu ingresso e o link de acesso ao evento."}
      />
      <div className="container pt-6 lg:pt-24 pb-16 max-w-5xl">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/meus-ingressos")} className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Meu ingresso</p>
            <h1 className="font-display text-xl lg:text-3xl font-bold text-foreground truncate max-w-[240px] sm:max-w-none">
              {event.title}
            </h1>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-start">
          <section className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">{eventStart.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" })}</span>
                <span>•</span>
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">
                  {eventStart.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}
                  {eventEnd ? ` — ${eventEnd.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}` : ""}
                </span>
              </div>

              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{event.is_online ? "Evento Online" : [event.venue_name, event.venue_city, event.venue_state].filter(Boolean).join(", ") || "Local a confirmar"}</span>
              </div>

              {event.is_online && (
                <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-foreground">Link do evento online</p>
                  </div>
                  {onlineUrl ? (
                    <>
                      <p className="break-all text-sm text-muted-foreground bg-background rounded-lg border border-border px-3 py-2">
                        {onlineUrl}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild className="gap-2">
                          <a href={onlineUrl} target="_blank" rel="noopener noreferrer">
                            Abrir link <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button variant="outline" className="gap-2" onClick={handleCopyLink} disabled={copying}>
                          <Copy className="h-4 w-4" />
                          {copying ? "Copiando..." : "Copiar link"}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      O produtor ainda não disponibilizou o link de acesso. Assim que estiver cadastrado, ele aparecerá aqui.
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <Button variant="outline" className="gap-2" onClick={handleDownloadPDF}>
                  <Download className="h-4 w-4" />
                  Baixar PDF
                </Button>
                <Button variant="ghost" className="gap-2" onClick={() => navigate("/meus-ingressos")}>
                  Voltar para a lista
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Compartilhar acesso</p>
                  <h2 className="font-display text-lg font-semibold text-foreground">Página pública do evento</h2>
                </div>
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <a href={eventUrl || `/eventos/${event.slug}`} target={eventUrl ? "_blank" : undefined} rel={eventUrl ? "noopener noreferrer" : undefined}>
                    Ver evento <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Guarde esta página para consultar o QR Code, imprimir o ingresso e acessar o link do evento online quando necessário.
              </p>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Resumo</p>
                  <p className="font-display text-lg font-semibold text-foreground">{ticket.ticket_tiers?.name || "Ingresso"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="font-semibold text-foreground">
                    {ticket.ticket_tiers?.price != null ? formatBRL(ticket.ticket_tiers.price) : "Gratuito"}
                  </p>
                </div>
              </div>

              <TicketDownloadCard {...ticketDownloadData} />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}