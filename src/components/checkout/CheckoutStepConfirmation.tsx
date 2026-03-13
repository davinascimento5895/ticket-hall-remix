import { Check, CalendarPlus, Download, Share2, Video, Mail, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateGoogleCalendarUrl, downloadICS } from "@/lib/calendar";
import { ShareSheet } from "@/components/ShareSheet";
import { TicketDownloadCard } from "./TicketDownloadCard";

interface CheckoutStepConfirmationProps {
  orderId?: string | null;
}

export function CheckoutStepConfirmation({ orderId }: CheckoutStepConfirmationProps) {
  const { data: order } = useQuery({
    queryKey: ["order-confirmation", orderId],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, events(title, start_date, end_date, venue_name, venue_address, venue_city, cover_image_url, slug, is_online, online_url)")
        .eq("id", orderId!)
        .single();
      return data;
    },
    enabled: !!orderId,
  });

  const { data: tickets } = useQuery({
    queryKey: ["order-tickets", orderId],
    queryFn: async () => {
      const { data } = await supabase
        .from("tickets")
        .select("id, qr_code, qr_code_image_url, attendee_name, attendee_cpf, ticket_tiers(name, price)")
        .eq("order_id", orderId!);
      return data;
    },
    enabled: !!orderId,
  });

  const event = order?.events as any;

  const handleAddToCalendar = (type: "google" | "ics") => {
    if (!event) return;
    const location = [event.venue_name, event.venue_address, event.venue_city].filter(Boolean).join(", ");
    const params = {
      title: event.title,
      startDate: event.start_date,
      endDate: event.end_date,
      location,
      description: `Ingresso adquirido via TicketHall. Pedido #${orderId?.slice(0, 8).toUpperCase()}`,
    };
    if (type === "google") {
      window.open(generateGoogleCalendarUrl(params), "_blank");
    } else {
      downloadICS(params);
    }
  };

  const fmt = (v: number) => `R$ ${Number(v).toFixed(2).replace(".", ",")}`;
  const orderCode = orderId?.slice(0, 8).toUpperCase() || "";
  const eventUrl = event?.slug ? `${window.location.origin}/eventos/${event.slug}` : "";

  return (
    <div className="space-y-8 py-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto">
          <Check className="h-8 w-8 text-success" />
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-bold">Pedido realizado com sucesso!</h2>
        {orderCode && (
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Nº do pedido</span>
            <span className="font-mono font-bold text-foreground">{orderCode}</span>
          </div>
        )}
      </div>

      {order && event && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Event summary card */}
          <div className="p-5 rounded-xl border border-border bg-card">
            <div className="flex flex-col sm:flex-row gap-4">
              {event.cover_image_url && (
                <img
                  src={event.cover_image_url}
                  alt=""
                  className="w-full sm:w-40 h-28 sm:h-24 rounded-lg object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="font-display font-semibold text-foreground text-lg leading-snug">{event.title}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <CalendarPlus className="h-3.5 w-3.5 shrink-0" />
                  {new Date(event.start_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                  {" • "}
                  {new Date(event.start_date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  {" > "}
                  {new Date(event.end_date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
                {event.is_online ? (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Video className="h-3.5 w-3.5 shrink-0" />
                    Evento Online
                  </p>
                ) : event.venue_name ? (
                  <p className="text-sm text-muted-foreground">
                    {event.venue_name}{event.venue_city ? `, ${event.venue_city}` : ""}
                  </p>
                ) : null}
              </div>
              {event.is_online && event.online_url && (
                <div className="sm:self-center shrink-0">
                  <Button asChild className="gap-2 w-full sm:w-auto">
                    <a href={event.online_url} target="_blank" rel="noopener noreferrer">
                      Acessar transmissão
                    </a>
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
              <ShareSheet url={eventUrl} title={event.title}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Compartilhar
                </Button>
              </ShareSheet>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-primary hover:text-primary"
                onClick={() => handleAddToCalendar("google")}
              >
                <CalendarPlus className="h-4 w-4" />
                Adicionar ao calendário
              </Button>
            </div>
          </div>

          {/* Ticket cards with QR codes */}
          {tickets && tickets.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Seus ingressos ({tickets.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {tickets.map((t: any, idx: number) => (
                  <TicketDownloadCard
                    key={t.id}
                    ticketId={t.id}
                    tierName={(t.ticket_tiers as any)?.name || "Ingresso"}
                    tierPrice={(t.ticket_tiers as any)?.price}
                    attendeeName={t.attendee_name}
                    attendeeCpf={t.attendee_cpf}
                    qrCode={t.qr_code || t.id}
                    qrCodeImageUrl={t.qr_code_image_url}
                    eventTitle={event.title}
                    eventDate={event.start_date}
                    eventEndDate={event.end_date}
                    venueName={event.venue_name}
                    venueAddress={event.venue_address}
                    venueCity={event.venue_city}
                    isOnline={event.is_online}
                    coverImageUrl={event.cover_image_url}
                    orderCode={orderCode}
                    purchaseDate={order.created_at}
                    paymentMethod={order.payment_method}
                    eventDescription={event.description}
                    index={idx}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Online event access instructions */}
          {event.is_online && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-5 text-center border-b border-border bg-muted/30">
                <h3 className="font-display font-semibold text-foreground">Como acessar seu evento</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Atente-se ao seu e-mail, você receberá todas as informações e atualizações por lá.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Video className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {event.online_url
                      ? "O link de acesso à transmissão está disponível acima. Acesse no horário do evento."
                      : "O link de acesso será disponibilizado antes do evento. Fique atento ao seu e-mail."}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Dúvidas? Acesse nossa{" "}
                    <Link to="/faq" className="text-primary hover:underline">Central de Ajuda</Link>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment summary */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{fmt(order.subtotal)}</span>
            </div>
            {order.platform_fee > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa</span>
                <span>{fmt(order.platform_fee)}</span>
              </div>
            )}
            {(order.discount_amount ?? 0) > 0 && (
              <div className="flex justify-between text-success">
                <span>Desconto</span>
                <span>-{fmt(order.discount_amount!)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold border-t border-border pt-2">
              <span>Total</span>
              <span>{fmt(order.total)}</span>
            </div>
          </div>

          {/* Calendar buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => handleAddToCalendar("google")}>
              <CalendarPlus className="h-4 w-4" /> Google Calendar
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => handleAddToCalendar("ics")}>
              <Download className="h-4 w-4" /> Apple / Outlook
            </Button>
          </div>
        </div>
      )}

      <p className="text-muted-foreground max-w-md mx-auto text-center">
        Seus ingressos foram gerados com sucesso. Você pode acessá-los na seção "Meus Ingressos".
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild>
          <Link to="/meus-ingressos">Ver meus ingressos</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/eventos">Explorar mais eventos</Link>
        </Button>
      </div>
    </div>
  );
}
