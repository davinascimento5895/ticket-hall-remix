import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SEOHead } from "@/components/SEOHead";
import { Ticket, Calendar, MapPin, QrCode, Send, Clock, Search, Archive, Download, Repeat, XCircle, CalendarPlus, Mail, ChevronRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { TicketDetailModal } from "@/components/TicketDetailModal";
import { TransferTicketModal } from "@/components/TransferTicketModal";
import { ResaleListingModal } from "@/components/ResaleListingModal";
import { RefundDialog } from "@/components/RefundDialog";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { getMyTickets } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { cancelResaleListing, getMyResaleListings } from "@/lib/api-resale";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { normalizeText } from "@/lib/search";
import { useToast } from "@/hooks/use-toast";
import { generateGoogleCalendarUrl } from "@/lib/calendar";

type TabId = "active" | "pending" | "cancelled" | "past" | "archived";

export default function MeusIngressos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("active");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [ticketDetailModal, setTicketDetailModal] = useState<{
    open: boolean;
    ticket: any;
  }>({ open: false, ticket: null });

  const [transferModal, setTransferModal] = useState<{
    open: boolean;
    ticketId: string;
    eventTitle: string;
    tierName: string;
  }>({ open: false, ticketId: "", eventTitle: "", tierName: "" });

  const [resaleModal, setResaleModal] = useState<{
    open: boolean;
    ticket: any;
  }>({ open: false, ticket: null });
  const [refundModal, setRefundModal] = useState<{open: boolean; order: any}>({ open: false, order: null });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: myResaleListings } = useQuery({
    queryKey: ["my-resale-listings", user?.id],
    queryFn: () => getMyResaleListings(user!.id),
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["my-tickets", user?.id],
    queryFn: () => getMyTickets(user!.id),
    enabled: !!user?.id,
  });

  const now = useMemo(() => new Date(), []);
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

  const handleCancelResale = async (listingId: string, ticketId: string) => {
    try {
      await cancelResaleListing(listingId, ticketId);
      toast({ title: "Revenda cancelada", description: "O ingresso voltou para sua conta." });
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["my-resale-listings"] });
      queryClient.invalidateQueries({ queryKey: ["resale-listings"] });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const renderTicket = (ticket: any) => {
    const isTransferable = ticket.status === "active" && ticket.ticket_tiers?.is_transferable !== false;
    const isResellable = ticket.status === "active" && ticket.ticket_tiers?.is_resellable !== false;
    const isForResale = ticket.is_for_resale === true;
    const activeListing = (myResaleListings || []).find((l: any) => l.ticket_id === ticket.id && l.status === "active");
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
            <img src={ticket.events.cover_image_url} alt={ticket.events?.title || "Evento"} className="w-full h-full object-cover" />
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
            {isForResale && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-accent text-accent-foreground">
                Em revenda — R$ {Number(ticket.resale_price || activeListing?.asking_price || 0).toFixed(2)}
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
              variant="default"
              size="sm"
              className="gap-1.5"
              onClick={() => setTicketDetailModal({ open: true, ticket })}
            >
              <Eye className="h-4 w-4" /> Ver ingresso
            </Button>
          )}
          {ticket.status === "active" && ticket.events?.start_date && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => {
                const ev = ticket.events;
                if (!ev) return;
                const location = [ev.venue_name, ev.venue_city].filter(Boolean).join(", ");
                const url = generateGoogleCalendarUrl({
                  title: ev.title,
                  startDate: ev.start_date,
                  endDate: ev.start_date,
                  location,
                });
                window.open(url, "_blank");
              }}
            >
              <CalendarPlus className="h-4 w-4" /> Calendário
            </Button>
          )}
          {ticket.status === "active" && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={async () => {
                try {
                  await supabase.functions.invoke("send-ticket-email", {
                    body: {
                      ticketId: ticket.id,
                      recipientEmail: ticket.attendee_email || user?.email,
                      eventTitle: ticket.events?.title,
                      tierName: ticket.ticket_tiers?.name,
                      qrCode: ticket.qr_code,
                    },
                  });
                  toast({ title: "E-mail enviado!", description: "Verifique sua caixa de entrada." });
                } catch {
                  toast({ title: "Erro ao enviar", variant: "destructive" });
                }
              }}
            >
              <Mail className="h-4 w-4" /> Reenviar
            </Button>
          )}
          {isTransferable && !isForResale && (
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
          {isResellable && !isForResale && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => setResaleModal({ open: true, ticket })}
            >
              <Repeat className="h-4 w-4" /> Revender
            </Button>
          )}
          {isForResale && activeListing && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-destructive"
              onClick={() => handleCancelResale(activeListing.id, ticket.id)}
            >
              <XCircle className="h-4 w-4" /> Cancelar Revenda
            </Button>
          )}
          {ticket.status === "active" && eventDate && (eventDate.getTime() - now.getTime()) > 7 * 24 * 60 * 60 * 1000 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={async () => {
                const { data: order } = await supabase
                  .from("orders")
                  .select("*")
                  .eq("id", ticket.order_id)
                  .single();
                if (order) {
                  setRefundModal({ open: true, order });
                }
              }}
            >
              <XCircle className="h-4 w-4" /> Solicitar reembolso
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
      <SEOHead title="Meus Ingressos" description="Gerencie seus ingressos na TicketHall." />
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
              className="pr-10 bg-muted/50 border-border"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Tabs - contained scroll */}
        <div className="flex border-b border-border mb-6 overflow-x-auto scrollbar-hide" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}
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
          <EmptyState
            icon={<Ticket className="h-12 w-12" />}
            title={getEmptyMessage()}
            description="Explore os eventos disponíveis e garanta seus ingressos."
            actionLabel="Encontrar eventos"
            onAction={() => navigate("/eventos")}
          />
        )}
      </div>

      <TicketDetailModal
        open={ticketDetailModal.open}
        onOpenChange={(open) => setTicketDetailModal((p) => ({ ...p, open }))}
        ticket={ticketDetailModal.ticket}
      />

      <TransferTicketModal
        open={transferModal.open}
        onOpenChange={(open) => setTransferModal((p) => ({ ...p, open }))}
        ticketId={transferModal.ticketId}
        eventTitle={transferModal.eventTitle}
        tierName={transferModal.tierName}
      />

      {resaleModal.ticket && (
        <ResaleListingModal
          open={resaleModal.open}
          onOpenChange={(open) => setResaleModal((p) => ({ ...p, open }))}
          ticket={resaleModal.ticket}
        />
      )}

      <RefundDialog
        open={refundModal.open}
        onOpenChange={(open) => setRefundModal((p) => ({ ...p, open }))}
        order={refundModal.order}
      />
    </>
  );
}
