import { useQuery } from "@tanstack/react-query";
import { Ticket, Calendar, MapPin, QrCode, Send, Clock, Search, Archive, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { QRCodeModal } from "@/components/QRCodeModal";
import { TransferTicketModal } from "@/components/TransferTicketModal";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { getMyTickets } from "@/lib/api";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { normalizeText } from "@/lib/search";

type TabId = "active" | "pending" | "cancelled" | "past" | "archived";

export default function MeusIngressos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("active");
  const [searchQuery, setSearchQuery] = useState("");
  
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
  const [archivedIds, setArchivedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("archived_tickets") || "[]");
    } catch { return []; }
  });

  const toggleArchive = (ticketId: string) => {
    setArchivedIds((prev) => {
      const next = prev.includes(ticketId) ? prev.filter((id) => id !== ticketId) : [...prev, ticketId];
      localStorage.setItem("archived_tickets", JSON.stringify(next));
      return next;
    });
  };

  // Categorize tickets
  const categorizedTickets = useMemo(() => {
    if (!tickets) return { active: [], pending: [], cancelled: [], past: [], archived: [] };

    const active: any[] = [];
    const pending: any[] = [];
    const cancelled: any[] = [];
    const past: any[] = [];
    const archived: any[] = [];

    for (const ticket of tickets) {
      if (archivedIds.includes(ticket.id)) {
        archived.push(ticket);
        continue;
      }

      const eventDate = ticket.events?.start_date ? new Date(ticket.events.start_date) : null;
      const isPastEvent = eventDate && eventDate < now;

      if (ticket.status === "cancelled" || ticket.status === "refunded") {
        cancelled.push(ticket);
      } else if (ticket.status === "pending" || ticket.status === "reserved") {
        pending.push(ticket);
      } else if (isPastEvent || ticket.status === "used") {
        past.push(ticket);
      } else if (ticket.status === "active") {
        active.push(ticket);
      } else {
        active.push(ticket);
      }
    }

    return { active, pending, cancelled, past, archived };
  }, [tickets, now, archivedIds]);

  // Filter by search query
  const filteredTickets = useMemo(() => {
    const ticketsForTab = categorizedTickets[activeTab];
    if (!searchQuery.trim()) return ticketsForTab;

    const normalizedQuery = normalizeText(searchQuery);
    
    return ticketsForTab.filter((ticket: any) => {
      const searchableFields = [
        ticket.events?.title,
        ticket.events?.venue_city,
        ticket.ticket_tiers?.name,
        ticket.attendee_name,
        ticket.attendee_email,
        ticket.qr_code,
        ticket.id,
        ticket.order_id,
      ].filter(Boolean);

      return searchableFields.some((field) =>
        normalizeText(String(field)).includes(normalizedQuery)
      );
    });
  }, [categorizedTickets, activeTab, searchQuery]);

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "active", label: "Ativos", count: categorizedTickets.active.length },
    { id: "pending", label: "Pendentes", count: categorizedTickets.pending.length },
    { id: "cancelled", label: "Cancelados", count: categorizedTickets.cancelled.length },
    { id: "past", label: "Encerrados", count: categorizedTickets.past.length },
    { id: "archived", label: "Arquivados", count: categorizedTickets.archived.length },
  ];

  const isPast = activeTab === "past" || activeTab === "cancelled" || activeTab === "archived";

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
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-semibold text-foreground truncate">{ticket.events?.title}</h3>
            {isToday && activeTab === "active" && (
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
          {ticket.status === "active" && ticket.qr_code_image_url && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => {
                const link = document.createElement("a");
                link.href = ticket.qr_code_image_url;
                link.download = `ingresso-${ticket.id.slice(0, 8)}.png`;
                link.target = "_blank";
                link.click();
              }}
            >
              <Download className="h-4 w-4" /> Baixar
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
          {(activeTab === "past" || activeTab === "archived") && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => toggleArchive(ticket.id)}
            >
              <Archive className="h-4 w-4" />
              {archivedIds.includes(ticket.id) ? "Desarquivar" : "Arquivar"}
            </Button>
          )}
        </div>
      </div>
    );
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case "active":
        return "Não há ingressos para próximos eventos";
      case "pending":
        return "Nenhum ingresso pendente de pagamento";
      case "cancelled":
        return "Nenhum ingresso cancelado";
      case "past":
        return "Nenhum ingresso de eventos passados";
      case "archived":
        return "Nenhum ingresso arquivado";
    }
  };

  return (
    <>
      <div className="container pt-4 lg:pt-24 pb-16">
        {/* Header with title and search */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h1 className="font-display text-2xl lg:text-3xl font-bold">Ingressos</h1>
          
          {/* Search bar */}
          <div className="relative w-full lg:w-80">
            <Input
              type="text"
              placeholder="Buscar pelo nome, email, ingresso ou pedido"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-16 bg-muted/50 border-border"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              onClick={() => {/* Search is automatic */}}
            >
              BUSCAR
            </Button>
          </div>
        </div>

        {/* Tabs - contained scroll */}
        <div className="flex border-b border-border mb-6 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "pb-3 px-1 mr-6 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                activeTab === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  "ml-1.5 text-xs",
                  activeTab === tab.id ? "text-primary" : "text-muted-foreground"
                )}>
                  ({tab.count})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : filteredTickets.length > 0 ? (
          <div className="space-y-3">
            {filteredTickets.map(renderTicket)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground mb-6">{getEmptyMessage()}</p>
            <Button onClick={() => navigate("/eventos")}>
              ENCONTRAR EVENTOS
            </Button>
          </div>
        )}
      </div>

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
    </>
  );
}
