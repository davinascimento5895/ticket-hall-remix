import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TicketDownloadCard } from "@/components/checkout/TicketDownloadCard";

interface TicketDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: {
    id: string;
    qr_code: string;
    qr_code_image_url?: string | null;
    attendee_name?: string | null;
    attendee_cpf?: string | null;
    order_id?: string | null;
    events?: {
      title?: string;
      start_date?: string;
      end_date?: string;
      venue_name?: string;
      venue_city?: string;
      is_online?: boolean;
      cover_image_url?: string | null;
    };
    ticket_tiers?: {
      name?: string;
    };
  } | null;
}

export function TicketDetailModal({ open, onOpenChange, ticket }: TicketDetailModalProps) {
  if (!ticket) return null;

  const event = ticket.events;
  const orderCode = ticket.order_id?.slice(0, 8).toUpperCase() || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-center font-display">Seu Ingresso</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center pt-2">
          <TicketDownloadCard
            ticketId={ticket.id}
            tierName={ticket.ticket_tiers?.name || "Ingresso"}
            attendeeName={ticket.attendee_name || undefined}
            attendeeCpf={ticket.attendee_cpf || undefined}
            qrCode={ticket.qr_code || ticket.id}
            qrCodeImageUrl={ticket.qr_code_image_url}
            eventTitle={event?.title || "Evento"}
            eventDate={event?.start_date || new Date().toISOString()}
            eventEndDate={event?.end_date}
            venueName={event?.venue_name}
            venueCity={event?.venue_city}
            isOnline={event?.is_online}
            coverImageUrl={event?.cover_image_url}
            orderCode={orderCode}
            index={0}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
