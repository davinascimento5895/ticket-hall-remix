import { useRef, useState } from "react";
import { Download, Ticket, MapPin, Calendar, Clock, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";

interface TicketDownloadCardProps {
  ticketId: string;
  tierName: string;
  attendeeName?: string;
  attendeeCpf?: string;
  qrCode: string;
  qrCodeImageUrl?: string | null;
  eventTitle: string;
  eventDate: string;
  eventEndDate?: string;
  venueName?: string;
  venueCity?: string;
  isOnline?: boolean;
  coverImageUrl?: string | null;
  orderCode: string;
  index: number;
}

export function TicketDownloadCard({
  ticketId,
  tierName,
  attendeeName,
  attendeeCpf,
  qrCode,
  qrCodeImageUrl,
  eventTitle,
  eventDate,
  eventEndDate,
  venueName,
  venueCity,
  isOnline,
  coverImageUrl,
  orderCode,
  index,
}: TicketDownloadCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
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

  const location = isOnline
    ? "Evento Online"
    : [venueName, venueCity].filter(Boolean).join(", ");

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `ingresso-${ticketId.slice(0, 8)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // fallback: download QR only
      window.open(qrImageUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Printable ticket card */}
      <div
        ref={cardRef}
        className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm"
        style={{ maxWidth: 420 }}
      >
        {/* Top band with event image or gradient */}
        <div className="relative h-28 overflow-hidden bg-primary/10">
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt=""
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <p className="font-display font-bold text-foreground text-base leading-tight line-clamp-2">
              {eventTitle}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pt-3 pb-4 space-y-3">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-start gap-2">
              <Calendar className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Data</p>
                <p className="text-foreground font-medium text-xs">{formattedDate}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Horário</p>
                <p className="text-foreground font-medium text-xs">
                  {formattedTime}
                  {endTime ? ` — ${endTime}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Local</p>
                <p className="text-foreground font-medium text-xs line-clamp-2">{location || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Ticket className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Tipo</p>
                <p className="text-foreground font-medium text-xs">{tierName}</p>
              </div>
            </div>
          </div>

          {/* Dashed separator */}
          <div className="border-t border-dashed border-border" />

          {/* Attendee + QR row */}
          <div className="flex gap-4 items-start">
            {/* Left: attendee info */}
            <div className="flex-1 min-w-0 space-y-1.5">
              {attendeeName && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Titular</p>
                  <p className="text-foreground font-semibold text-sm truncate">{attendeeName}</p>
                </div>
              )}
              {attendeeCpf && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">CPF</p>
                  <p className="text-foreground text-xs font-mono">{attendeeCpf}</p>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Hash className="h-3 w-3 text-muted-foreground shrink-0" />
                <p className="text-[11px] text-muted-foreground font-mono">
                  {ticketId.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] text-muted-foreground">
                  Pedido: {orderCode}
                </p>
              </div>
            </div>

            {/* Right: QR code */}
            <div className="shrink-0 w-28 h-28 bg-card rounded-lg border border-border p-1.5 flex items-center justify-center">
              <img
                src={qrImageUrl}
                alt="QR Code"
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
              />
            </div>
          </div>

          {/* Footer brand */}
          <div className="text-center pt-1">
            <p className="text-[10px] text-muted-foreground tracking-wider">
              tickethall.com.br
            </p>
          </div>
        </div>
      </div>

      {/* Download button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={handleDownload}
        disabled={downloading}
      >
        <Download className="h-4 w-4" />
        {downloading ? "Gerando imagem..." : `Baixar ingresso ${index + 1}`}
      </Button>
    </div>
  );
}
