import { useQuery } from "@tanstack/react-query";
import { Ticket, Calendar, MapPin, QrCode } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { QRCodeModal } from "@/components/QRCodeModal";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { getMyTickets } from "@/lib/api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MeusIngressos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [qrModal, setQrModal] = useState<{
    open: boolean;
    ticketId: string;
    qrCode: string;
    qrCodeImageUrl?: string | null;
    eventTitle: string;
    tierName: string;
    attendeeName?: string;
  }>({ open: false, ticketId: "", qrCode: "", eventTitle: "", tierName: "" });

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["my-tickets", user?.id],
    queryFn: () => getMyTickets(user!.id),
    enabled: !!user?.id,
  });

  const now = new Date();
  const upcoming = tickets?.filter((t: any) => new Date(t.events?.start_date) >= now && t.status === "active") || [];
  const past = tickets?.filter((t: any) => new Date(t.events?.start_date) < now || t.status === "used") || [];
  const transferred = tickets?.filter((t: any) => t.status === "transferred") || [];

  const renderTicket = (ticket: any) => (
    <div key={ticket.id} className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
      {ticket.events?.cover_image_url && (
        <img src={ticket.events.cover_image_url} alt="" className="w-20 h-20 rounded object-cover hidden sm:block" />
      )}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-semibold text-foreground truncate">{ticket.events?.title}</h3>
          <OrderStatusBadge status={ticket.status} />
        </div>
        <p className="text-sm text-muted-foreground">{ticket.ticket_tiers?.name}</p>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {ticket.events?.start_date && (
            <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(ticket.events.start_date).toLocaleDateString("pt-BR")}</span>
          )}
          {ticket.events?.venue_city && (
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{ticket.events.venue_city}</span>
          )}
        </div>
        {ticket.attendee_name && <p className="text-xs text-muted-foreground">Participante: {ticket.attendee_name}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() =>
            setQrModal({
              open: true,
              ticketId: ticket.id,
              qrCode: ticket.qr_code,
              qrCodeImageUrl: ticket.qr_code_image_url,
              eventTitle: ticket.events?.title || "",
              tierName: ticket.ticket_tiers?.name || "",
              attendeeName: ticket.attendee_name || undefined,
            })
          }
        >
          <QrCode className="h-4 w-4" /> QR Code
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16">
        <h1 className="font-display text-2xl font-bold mb-6">Meus Ingressos</h1>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : !tickets || tickets.length === 0 ? (
          <EmptyState
            icon={<Ticket className="h-12 w-12" />}
            title="Nenhum ingresso ainda"
            description="Quando você comprar ingressos, eles aparecerão aqui."
            actionLabel="Explorar eventos"
            onAction={() => navigate("/eventos")}
          />
        ) : (
          <Tabs defaultValue="upcoming">
            <TabsList>
              <TabsTrigger value="upcoming">Próximos ({upcoming.length})</TabsTrigger>
              <TabsTrigger value="past">Passados ({past.length})</TabsTrigger>
              <TabsTrigger value="transferred">Transferidos ({transferred.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="pt-4 space-y-3">
              {upcoming.length > 0 ? upcoming.map(renderTicket) : (
                <p className="text-sm text-muted-foreground py-8 text-center">Nenhum ingresso para eventos futuros.</p>
              )}
            </TabsContent>
            <TabsContent value="past" className="pt-4 space-y-3">
              {past.length > 0 ? past.map(renderTicket) : (
                <p className="text-sm text-muted-foreground py-8 text-center">Nenhum ingresso passado.</p>
              )}
            </TabsContent>
            <TabsContent value="transferred" className="pt-4 space-y-3">
              {transferred.length > 0 ? transferred.map(renderTicket) : (
                <p className="text-sm text-muted-foreground py-8 text-center">Nenhum ingresso transferido.</p>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
      <Footer />

      <QRCodeModal
        open={qrModal.open}
        onOpenChange={(open) => setQrModal((p) => ({ ...p, open }))}
        ticketId={qrModal.ticketId}
        qrCode={qrModal.qrCode}
        qrCodeImageUrl={qrModal.qrCodeImageUrl}
        eventTitle={qrModal.eventTitle}
        tierName={qrModal.tierName}
        attendeeName={qrModal.attendeeName}
      />
    </div>
  );
}
