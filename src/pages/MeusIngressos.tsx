import { useQuery } from "@tanstack/react-query";
import { Ticket, Calendar, MapPin, QrCode, Send, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { QRCodeModal } from "@/components/QRCodeModal";
import { TransferTicketModal } from "@/components/TransferTicketModal";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { getMyTickets } from "@/lib/api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function MeusIngressos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "transferred">("upcoming");
  const [qrModal, setQrModal] = useState<{
    open: boolean;
    ticketId: string;
    qrCode: string;
    qrCodeImageUrl?: string | null;
    eventTitle: string;
    tierName: string;
    attendeeName?: string;
  }>({ open: false, ticketId: "", qrCode: "", eventTitle: "", tierName: "" });

  const [transferModal, setTransferModal] = useState<{
    open: boolean;
    ticketId: string;
    eventTitle: string;
    tierName: string;
  }>({ open: false, ticketId: "", eventTitle: "", tierName: "" });

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["my-tickets", user?.id],
    queryFn: () => getMyTickets(user!.id),
    enabled: !!user?.id,
  });

  const now = new Date();
  const upcoming = tickets?.filter((t: any) => new Date(t.events?.start_date) >= now && t.status === "active") || [];
  const past = tickets?.filter((t: any) => new Date(t.events?.start_date) < now || t.status === "used") || [];
  const transferred = tickets?.filter((t: any) => t.status === "transferred") || [];

  const tabs = [
    { id: "upcoming" as const, label: "Ativos", count: upcoming.length },
    { id: "past" as const, label: "Arquivados", count: past.length },
    { id: "transferred" as const, label: "Transferidos", count: transferred.length },
  ];

  const currentTickets = activeTab === "upcoming" ? upcoming : activeTab === "past" ? past : transferred;
  const isPast = activeTab === "past";

  const renderTicket = (ticket: any) => {
    const isTransferable = ticket.status === "active" && ticket.ticket_tiers?.is_transferable !== false;
    const eventDate = ticket.events?.start_date ? new Date(ticket.events.start_date) : null;
    const isToday = eventDate && eventDate.toDateString() === now.toDateString();

    return (
      <div
        key={ticket.id}
        className={cn(
          "flex items-start gap-4 p-4 rounded-xl border bg-card transition-colors",
          isPast ? "border-border/50 opacity-70" : "border-border hover:border-primary/30"
        )}
      >
        {/* Event image */}
        <div className={cn(
          "w-20 h-20 rounded-lg overflow-hidden shrink-0 hidden sm:block",
          isPast && "grayscale"
        )}>
          {ticket.events?.cover_image_url ? (
            <img src={ticket.events.cover_image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <Ticket className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-foreground truncate">{ticket.events?.title}</h3>
            {isToday && !isPast && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-primary text-primary-foreground">
                Hoje
              </span>
            )}
            <OrderStatusBadge status={ticket.status} />
          </div>

          <p className="text-sm text-muted-foreground">{ticket.ticket_tiers?.name}</p>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {eventDate && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3 text-primary" />
                {eventDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            )}
            {eventDate && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3 text-primary" />
                {eventDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            {ticket.events?.venue_city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3 text-primary" />
                {ticket.events.venue_city}
              </span>
            )}
          </div>

          {ticket.attendee_name && (
            <p className="text-xs text-muted-foreground">Participante: {ticket.attendee_name}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 shrink-0">
          {ticket.status === "active" && (
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
          )}
          {isTransferable && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() =>
                setTransferModal({
                  open: true,
                  ticketId: ticket.id,
                  eventTitle: ticket.events?.title || "",
                  tierName: ticket.ticket_tiers?.name || "",
                })
              }
            >
              <Send className="h-4 w-4" /> Transferir
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
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
          <>
            {/* Custom underline tabs */}
            <div className="flex border-b border-border mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "pb-3 px-1 mr-6 text-sm font-medium transition-colors border-b-2",
                    activeTab === tab.id
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                  <span className={cn(
                    "ml-1.5 text-xs",
                    activeTab === tab.id ? "text-primary" : "text-muted-foreground"
                  )}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {currentTickets.length > 0 ? (
                currentTickets.map(renderTicket)
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  {activeTab === "upcoming" && "Nenhum ingresso para eventos futuros."}
                  {activeTab === "past" && "Nenhum ingresso passado."}
                  {activeTab === "transferred" && "Nenhum ingresso transferido."}
                </p>
              )}
            </div>
          </>
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

      <TransferTicketModal
        open={transferModal.open}
        onOpenChange={(open) => setTransferModal((p) => ({ ...p, open }))}
        ticketId={transferModal.ticketId}
        eventTitle={transferModal.eventTitle}
        tierName={transferModal.tierName}
      />
    </div>
  );
}
