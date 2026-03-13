import { useState } from "react";
import { Printer, Download, Calendar, Clock, MapPin, Ticket, Hash, User, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateTicketPDF } from "@/lib/ticket-pdf";

export interface TicketDownloadData {
  ticketId: string;
  tierName: string;
  tierPrice?: number;
  attendeeName?: string;
  attendeeCpf?: string;
  qrCode: string;
  qrCodeImageUrl?: string | null;
  eventTitle: string;
  eventDate: string;
  eventEndDate?: string;
  venueName?: string;
  venueAddress?: string;
  venueCity?: string;
  venueState?: string;
  isOnline?: boolean;
  coverImageUrl?: string | null;
  orderCode: string;
  purchaseDate?: string;
  paymentMethod?: string;
  eventDescription?: string;
  index: number;
}

export function TicketDownloadCard(props: TicketDownloadData) {
  const {
    ticketId,
    tierName,
    tierPrice,
    attendeeName,
    attendeeCpf,
    qrCode,
    qrCodeImageUrl,
    eventTitle,
    eventDate,
    eventEndDate,
    venueName,
    venueAddress,
    venueCity,
    venueState,
    isOnline,
    orderCode,
    purchaseDate,
    index,
  } = props;

  const [downloading, setDownloading] = useState(false);

  const qrImageUrl =
    qrCodeImageUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`;

  const startDate = new Date(eventDate);
  const formattedDate = startDate.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const formattedTime = startDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = eventEndDate
    ? new Date(eventEndDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;

  const locationParts = isOnline
    ? ["Evento Online"]
    : [venueName, venueAddress, venueCity, venueState].filter(Boolean);
  const locationLine = locationParts.join(", ");

  const purchaseDateFormatted = purchaseDate
    ? new Date(purchaseDate).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      await generateTicketPDF(props);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-3 w-full" style={{ maxWidth: 440 }}>
      {/* Visual ticket preview card */}
      <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
        {/* Header accent bar */}
        <div className="h-2 bg-primary" />

        <div className="p-5 space-y-4">
          {/* Event title */}
          <div>
            <p className="font-display font-bold text-foreground text-lg leading-tight">
              {eventTitle}
            </p>
          </div>

          {/* Date, time, location row */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium">{formattedDate}</span>
              <span className="text-muted-foreground">•</span>
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium">
                {formattedTime}{endTime ? ` — ${endTime}` : ""}
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>{locationLine || "Local a definir"}</span>
            </div>
          </div>

          {/* Dashed divider */}
          <div className="border-t border-dashed border-border" />

          {/* Ticket info + QR */}
          <div className="flex gap-4 items-start">
            <div className="flex-1 min-w-0 space-y-3">
              {/* Tier & price */}
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Ingresso</p>
                <p className="font-display font-bold text-foreground">{tierName}</p>
                {tierPrice != null && tierPrice > 0 && (
                  <p className="text-foreground font-semibold">{fmt(tierPrice)}</p>
                )}
              </div>

              {/* Attendee */}
              {attendeeName && (
                <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Participante</p>
                  <p className="font-display font-semibold text-foreground text-sm">{attendeeName}</p>
                  {attendeeCpf && (
                    <p className="text-xs text-muted-foreground font-mono">{attendeeCpf}</p>
                  )}
                </div>
              )}
            </div>

            {/* QR code */}
            <div className="shrink-0 flex flex-col items-center gap-1.5">
              <div className="w-28 h-28 bg-card rounded-lg border border-border p-1.5 flex items-center justify-center">
                <img
                  src={qrImageUrl}
                  alt="QR Code"
                  className="w-full h-full object-contain"
                  crossOrigin="anonymous"
                />
              </div>
              <p className="text-[10px] font-mono text-muted-foreground tracking-wide">
                {ticketId.slice(0, 10).toUpperCase()}
              </p>
            </div>
          </div>

          {/* Dashed divider */}
          <div className="border-t border-dashed border-border" />

          {/* Purchase info footer */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Hash className="h-3 w-3" />
              <span>Pedido: {orderCode}</span>
            </div>
            {purchaseDateFormatted && (
              <span>Comprado em {purchaseDateFormatted}</span>
            )}
          </div>

          {/* Brand */}
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
              tickethall.com.br
            </p>
          </div>
        </div>
      </div>

      {/* Download PDF button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={handleDownloadPDF}
        disabled={downloading}
      >
        <Printer className="h-4 w-4" />
        {downloading ? "Gerando PDF..." : `Imprimir ingresso${index > 0 ? ` ${index + 1}` : ""}`}
      </Button>
    </div>
  );
}
