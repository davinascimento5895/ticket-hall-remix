import { Calendar, MapPin, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { cn } from "@/lib/utils";

interface TicketCardProps {
  id: string;
  eventTitle: string;
  tierName: string;
  status: string;
  startDate?: string;
  venueCity?: string;
  coverImageUrl?: string;
  attendeeName?: string;
  qrCode: string;
  onShowQR: () => void;
  className?: string;
}

export function TicketCard({
  eventTitle,
  tierName,
  status,
  startDate,
  venueCity,
  coverImageUrl,
  attendeeName,
  onShowQR,
  className,
}: TicketCardProps) {
  return (
    <div className={cn("flex items-start gap-4 p-4 rounded-lg border border-border bg-card", className)}>
      {coverImageUrl && (
        <img src={coverImageUrl} alt={eventTitle} className="w-20 h-20 rounded object-cover hidden sm:block" />
      )}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-semibold text-foreground truncate">{eventTitle}</h3>
          <OrderStatusBadge status={status} />
        </div>
        <p className="text-sm text-muted-foreground">{tierName}</p>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {startDate && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(startDate).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
            </span>
          )}
          {venueCity && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {venueCity}
            </span>
          )}
        </div>
        {attendeeName && <p className="text-xs text-muted-foreground">Participante: {attendeeName}</p>}
      </div>
      <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={onShowQR}>
        <QrCode className="h-4 w-4" /> QR Code
      </Button>
    </div>
  );
}
