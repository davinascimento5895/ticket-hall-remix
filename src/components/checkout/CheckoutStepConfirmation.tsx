import { Check, CalendarPlus, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateGoogleCalendarUrl, downloadICS } from "@/lib/calendar";

interface CheckoutStepConfirmationProps {
  orderId?: string | null;
}

export function CheckoutStepConfirmation({ orderId }: CheckoutStepConfirmationProps) {
  const { data: order } = useQuery({
    queryKey: ["order-confirmation", orderId],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, events(title, start_date, end_date, venue_name, venue_address, venue_city, cover_image_url, slug)")
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
        .select("id, qr_code, qr_code_image_url, ticket_tiers(name)")
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

  return (
    <div className="text-center space-y-6 py-8">
      <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto">
        <Check className="h-8 w-8 text-success" />
      </div>
      <h2 className="font-display text-2xl font-bold">Pedido confirmado!</h2>
      {orderId && (
        <p className="text-sm text-muted-foreground font-mono">
          Pedido #{orderId.slice(0, 8).toUpperCase()}
        </p>
      )}

      {/* Order summary */}
      {order && event && (
        <div className="max-w-md mx-auto text-left space-y-4">
          <div className="p-4 rounded-lg border border-border bg-card space-y-3">
            <div className="flex items-start gap-3">
              {event.cover_image_url && (
                <img src={event.cover_image_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-foreground truncate">{event.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(event.start_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
                {event.venue_name && (
                  <p className="text-xs text-muted-foreground">{event.venue_name}{event.venue_city ? `, ${event.venue_city}` : ""}</p>
                )}
              </div>
            </div>

            {/* Tickets info */}
            {tickets && tickets.length > 0 && (
              <div className="border-t border-border pt-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ingressos ({tickets.length})</p>
                {tickets.map((t: any) => (
                  <p key={t.id} className="text-sm text-foreground">
                    {(t.ticket_tiers as any)?.name || "Ingresso"} — <span className="font-mono text-xs text-muted-foreground">#{t.id.slice(0, 8)}</span>
                  </p>
                ))}
              </div>
            )}

            {/* Payment summary */}
            <div className="border-t border-border pt-3 space-y-1 text-sm">
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
              <div className="flex justify-between font-semibold border-t border-border pt-1">
                <span>Total</span>
                <span>{fmt(order.total)}</span>
              </div>
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

      <p className="text-muted-foreground max-w-md mx-auto">
        Seus ingressos foram gerados com sucesso. Você pode acessá-los na seção
        "Meus Ingressos".
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
