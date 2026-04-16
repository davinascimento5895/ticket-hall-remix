import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { validateCheckin } from "@/lib/api-checkin";
import {
  playSuccess, playWarning, playError,
  vibrateSuccess, vibrateError,
  isSoundEnabled, toggleSound,
} from "@/lib/audio-feedback";
import { Html5Qrcode } from "html5-qrcode";
import { Volume2, VolumeX, Search, History, CheckCircle2, AlertTriangle, XCircle, ChevronLeft, ClipboardList, ArrowRightLeft, CalendarDays, Clock, MapPin, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StaffPortalHeader } from "@/components/staff/StaffPortalHeader";
import { format, isPast, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

function getEventBadge(start: string, end: string) {
  const now = new Date();
  const s = new Date(start);
  const e = new Date(end);
  if (isPast(e)) return { label: "ENCERRADO", variant: "secondary" as const };
  if (isWithinInterval(now, { start: s, end: e })) return { label: "EM ANDAMENTO", variant: "default" as const };
  return { label: "EM BREVE", variant: "outline" as const };
}

type ScanResult = "success" | "already_used" | "invalid_qr" | "not_found" | "inactive" | "wrong_list" | "error" | "rate_limited" | "config_error" | "unauthorized";

interface FeedbackState {
  result: ScanResult;
  message: string;
  attendeeName?: string;
  attendeeEmail?: string;
  tierName?: string;
  checkedInAt?: string;
}

interface HistoryEntry {
  id: string;
  name: string;
  time: string;
  result: ScanResult;
}

interface TicketRow {
  id: string;
  attendee_name: string | null;
  attendee_email: string | null;
  status: string | null;
  tier_id: string | null;
  order_id: string | null;
  ticket_tiers: { name: string } | null;
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${local.slice(0, 2)}***@${domain}`;
}

function normalizeSearchText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s@.-]/g, "")
    .trim();
}

const SCANNER_ID = "staff-qr-reader";

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  producer: "Produtor",
  staff: "Equipe",
  buyer: "Comprador",
};

export default function StaffCheckinScreen() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user, session, loading, signOut, profile, allRoles, role, switchRole } = useAuth();
  const navigate = useNavigate();

  // Event info
  const [event, setEvent] = useState<{
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    venue_name: string | null;
    venue_city: string | null;
    cover_image_url: string | null;
    status: string | null;
    doors_open_time: string | null;
  } | null>(null);
  const [staffCheckinListId, setStaffCheckinListId] = useState<string | null>(null);
  const [staffCheckinListName, setStaffCheckinListName] = useState<string | null>(null);
  const [staffCheckinListActive, setStaffCheckinListActive] = useState<boolean | null>(null);

  // Counters
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);

  // Scanner
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;
  const debounceRef = useRef(false);

  // Feedback — use ref to avoid scanner lifecycle dependency
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // History
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Manual search
  const [manualOpen, setManualOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TicketRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [confirmTicket, setConfirmTicket] = useState<TicketRow | null>(null);
  const searchRequestRef = useRef(0);

  useEffect(() => {
    if (!eventId) return;
    const storageKey = `staff-checkin-instructions-hidden:${eventId}`;
    setShowInstructions(localStorage.getItem(storageKey) !== "1");
  }, [eventId]);

  const setInstructionsVisible = useCallback((visible: boolean) => {
    if (!eventId) return;
    const storageKey = `staff-checkin-instructions-hidden:${eventId}`;
    if (visible) localStorage.removeItem(storageKey);
    else localStorage.setItem(storageKey, "1");
    setShowInstructions(visible);
  }, [eventId]);

  // History drawer
  const [historyOpen, setHistoryOpen] = useState(false);

  // ─── Fetch counters ───
  const fetchCounters = useCallback(async () => {
    if (!eventId) return;
    const [{ count: total }, { count: checked }] = await Promise.all([
      supabase.from("tickets").select("*", { count: "exact", head: true }).eq("event_id", eventId).in("status", ["active", "used"]),
      supabase.from("tickets").select("*", { count: "exact", head: true }).eq("event_id", eventId).eq("status", "used"),
    ]);
    setTotalTickets(total || 0);
    setCheckedInCount(checked || 0);
  }, [eventId]);

  // ─── Fetch event + counters + realtime ───
  useEffect(() => {
    if (loading || !user || !eventId) return;

    setStaffCheckinListId(null);
    setStaffCheckinListName(null);
    setStaffCheckinListActive(null);

    supabase
      .from("events")
      .select("id, title, start_date, end_date, venue_name, venue_city, cover_image_url, status, doors_open_time")
      .eq("id", eventId)
      .single()
      .then(({ data }) => setEvent(data as any));

    // Fetch staff assignment to get assigned checkin_list_id
    if (user?.id) {
      supabase
        .from("event_staff")
        .select("checkin_list_id")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle()
        .then(async ({ data }) => {
          const nextListId = data?.checkin_list_id || null;
          setStaffCheckinListId(nextListId);

          if (!nextListId) {
            setStaffCheckinListName(null);
            setStaffCheckinListActive(null);
            return;
          }

          const { data: listData } = await supabase
            .from("checkin_lists")
            .select("name, is_active")
            .eq("id", nextListId)
            .maybeSingle();

          setStaffCheckinListName(listData?.name || null);
          setStaffCheckinListActive(listData?.is_active ?? null);
        });
    }

    fetchCounters();

    const channel = supabase
      .channel(`staff-tickets-${eventId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets", filter: `event_id=eq.${eventId}` }, () => fetchCounters())
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn("Realtime channel error for event:", eventId);
        }
      });

    return () => { 
      channel.unsubscribe().catch(() => {});
      supabase.removeChannel(channel).catch(() => {}); 
    };
  }, [user, loading, eventId, fetchCounters]);

  // ─── Show feedback (stable ref-based) ───
  const showFeedback = useCallback((result: ScanResult, message: string, attendeeName?: string, tierName?: string, checkedInAt?: string, attendeeEmail?: string) => {
    setFeedback({ result, message, attendeeName, attendeeEmail, tierName, checkedInAt });

    // Audio + haptic via ref to avoid stale closure
    if (soundRef.current) {
      if (result === "success") playSuccess();
      else if (result === "already_used") playWarning();
      else playError();
    }
    if (result === "success") vibrateSuccess();
    else vibrateError();

    // History
    const displayName = attendeeName?.trim() || attendeeEmail || "—";
    setHistory((prev) => [{
      id: crypto.randomUUID(),
      name: displayName,
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "America/Sao_Paulo" }),
      result,
    }, ...prev].slice(0, 50));

    // Auto-dismiss
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => {
      setFeedback(null);
      // Resume scanner after feedback dismissed
      try { scannerRef.current?.resume(); } catch {}
    }, result === "success" ? 2000 : 3000);
  }, []);

  // ─── Handle QR scan ───
  const handleScanRef = useRef<(qr: string) => void>();
  handleScanRef.current = async (qrCode: string) => {
    if (debounceRef.current) return;
    debounceRef.current = true;

    if (!session?.access_token) {
      showFeedback("unauthorized", "Sessão expirada. Faça login novamente.");
      setTimeout(() => { debounceRef.current = false; }, 1500);
      return;
    }

    // Pause scanner (don't stop — keeps camera alive)
    try { scannerRef.current?.pause(true); } catch {}

    try {
      const result = await validateCheckin(
        { qrCode, scannedBy: user?.id, checkinListId: staffCheckinListId || undefined },
        session.access_token,
      );
      showFeedback(result.result as ScanResult, result.message, result.attendeeName, result.tierName, result.checkedInAt, result.attendeeEmail);
    } catch (err: any) {
      showFeedback("error", err?.message || "Erro desconhecido");
    }

    setTimeout(() => { debounceRef.current = false; }, 1500);
  };

  // ─── Scanner lifecycle (starts once, never restarts) ───
  useEffect(() => {
    if (loading || !user) return;

    let html5Qr: Html5Qrcode | null = null;
    let mounted = true;

    const start = async () => {
      // Wait for DOM element
      await new Promise((r) => setTimeout(r, 400));
      if (!mounted) return;

      html5Qr = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = html5Qr;

      try {
        await html5Qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
          (decodedText) => handleScanRef.current?.(decodedText),
          () => {},
        );
      } catch (err) {
        console.error("Camera error:", err);
      }
    };

    start();

    return () => {
      mounted = false;
      if (html5Qr?.isScanning) html5Qr.stop().catch(() => {});
      scannerRef.current = null;
    };
    // Only depends on user/loading — NOT feedback
  }, [loading, user]);

  // ─── Manual search ───
  const doSearch = useCallback(async (rawQuery = searchQuery) => {
    if (!eventId) return;

    const q = rawQuery.trim();
    if (!q) {
      searchRequestRef.current += 1;
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const requestId = ++searchRequestRef.current;
    setSearching(true);
    const safeQuery = q.replace(/[%_,]/g, "");

    // Search by name, email, order_id, or ticket id
    const orFilters = [
      `attendee_name.ilike.%${safeQuery}%`,
      `attendee_email.ilike.%${safeQuery}%`,
      `order_id.ilike.%${safeQuery}%`,
      `id.ilike.%${safeQuery}%`,
    ];

    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("id, attendee_name, attendee_email, status, tier_id, order_id, ticket_tiers(name)")
        .eq("event_id", eventId)
        .in("status", ["active", "used"])
        .or(orFilters.join(","))
        .limit(20);

      if (error) throw error;

      const normalizedQuery = normalizeSearchText(q);
      const rows = ((data as any[]) || []).filter((ticket) => {
        const searchable = normalizeSearchText([
          ticket.attendee_name,
          ticket.attendee_email,
          ticket.order_id,
          ticket.id,
        ].filter(Boolean).join(" "));

        return searchable.includes(normalizedQuery);
      });

      if (requestId !== searchRequestRef.current) return;
      setSearchResults(rows);
      setConfirmTicket(null);
    } catch (error) {
      if (requestId !== searchRequestRef.current) return;
      setSearchResults([]);
    } finally {
      if (requestId === searchRequestRef.current) {
        setSearching(false);
      }
    }
  }, [searchQuery, eventId]);

  useEffect(() => {
    if (!manualOpen) return;

    const q = searchQuery.trim();
    if (!q) {
      searchRequestRef.current += 1;
      setSearchResults([]);
      setConfirmTicket(null);
      setSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      void doSearch(q);
    }, 250);

    return () => clearTimeout(timer);
  }, [manualOpen, searchQuery, doSearch]);

  const handleManualCheckin = useCallback(async (ticket: TicketRow) => {
    setConfirmTicket(null);
    setManualOpen(false);

    if (!session?.access_token) {
      showFeedback("unauthorized", "Sessão expirada. Faça login novamente.");
      return;
    }

    if (ticket.status === "used") {
      showFeedback("already_used", "Ingresso já utilizado", ticket.attendee_name || undefined, undefined, undefined, ticket.attendee_email || undefined);
      return;
    }

    try {
      const { data: t } = await supabase.from("tickets").select("qr_code").eq("id", ticket.id).single();
      if (!t?.qr_code) {
        showFeedback("error", "QR code não encontrado para este ingresso");
        return;
      }
      const result = await validateCheckin(
        { qrCode: t.qr_code, scannedBy: user?.id, checkinListId: staffCheckinListId || undefined },
        session.access_token,
      );
      showFeedback(result.result as ScanResult, result.message, result.attendeeName, result.tierName, result.checkedInAt, result.attendeeEmail);
    } catch (err: any) {
      showFeedback("error", err?.message || "Erro ao validar ingresso");
    }
  }, [session, user, showFeedback]);

  // ─── Derived ───
  const pct = totalTickets > 0 ? Math.round((checkedInCount / totalTickets) * 100) : 0;
  const canSwitchToBuyer = allRoles.includes("buyer");
  const accountName = profile?.full_name || user?.email || "Usuário";
  const accountEmail = user?.email || profile?.full_name || null;
  const activeRoleLabel = role ? roleLabels[role] || role : "Equipe";
  const eventBadge = event ? getEventBadge(event.start_date, event.end_date) : null;
  const eventDateLabel = event ? format(new Date(event.start_date), "dd MMM yyyy", { locale: ptBR }) : "—";
  const eventTimeLabel = event ? format(new Date(event.start_date), "HH:mm", { locale: ptBR }) : "—";
  const venueLabel = event?.venue_name
    ? `${event.venue_name}${event.venue_city ? `, ${event.venue_city}` : ""}`
    : "Local não informado";
  const checkinListLabel = staffCheckinListName || (staffCheckinListId ? "Lista vinculada" : "Lista padrão");
  const checkinListStatusLabel = staffCheckinListActive === false ? "Lista inativa" : "Lista ativa";

  const handleSwitchToBuyer = () => {
    if (!canSwitchToBuyer) return;
    switchRole("buyer");
    navigate("/meus-ingressos");
  };

  const headerMetrics = [
    {
      label: "Entradas",
      value: String(checkedInCount),
      helper: `de ${totalTickets} válidas`,
    },
    {
      label: "Progresso",
      value: `${pct}%`,
      helper: pct > 0 ? "Sessão em andamento" : "Ainda sem check-ins", 
    },
    {
      label: "Lista",
      value: checkinListLabel,
      helper: checkinListStatusLabel,
    },
    {
      label: "Local",
      value: venueLabel,
      helper: event?.doors_open_time ? `Portas às ${event.doors_open_time}` : `${eventDateLabel} • ${eventTimeLabel}`,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col relative overflow-hidden">
      <StaffPortalHeader
        breadcrumb={[
          { label: "Portal da equipe", href: "/staff" },
          { label: "Eventos atribuídos", href: "/staff" },
          { label: "Check-in" },
        ]}
        eyebrow="Operação de acesso"
        title={event?.title || "Carregando evento..."}
        description="Leitura de QR em tempo real, com busca manual e histórico da sessão no mesmo fluxo."
        accountName={accountName}
        accountEmail={accountEmail}
        accountAvatarUrl={profile?.avatar_url}
        activeRoleLabel={activeRoleLabel}
        canSwitchToBuyer={canSwitchToBuyer}
        onSwitchToBuyer={handleSwitchToBuyer}
        onSignOut={signOut}
        actions={
          <Button type="button" variant="outline" onClick={() => navigate("/staff")} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Voltar aos eventos
          </Button>
        }
        metrics={headerMetrics}
      />

      <main className="flex-1 min-h-0">
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <Card className="border-border/80 bg-card/80 shadow-sm">
                <CardContent className="flex flex-col gap-3 p-4 sm:p-5 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Fluxo de entrada
                    </p>
                    <h2 className="mt-1 font-display text-lg font-semibold text-foreground sm:text-xl">
                      Leitor QR e busca manual
                    </h2>
                    <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
                      Confirme a pessoa antes de efetivar. O cabeçalho mostra a conta, o evento atual e a lista vinculada para checagem rápida.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {showInstructions ? (
                <Card className="border-border/80 bg-muted/15 shadow-sm">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Instruções para a equipe</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Fluxo rápido para check-in sem erro. A confirmação final sempre aparece antes de efetivar a busca manual.
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => setInstructionsVisible(false)}>
                        Ocultar
                      </Button>
                    </div>

                    <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                      <li>1. Aponte a câmera para o QR Code inteiro e aguarde o retorno na tela.</li>
                      <li>2. Se o ingresso falhar, use a busca manual por nome, e-mail ou código.</li>
                      <li>3. Em caso de "já utilizado", confirme documento com o participante.</li>
                      <li>4. Mantenha uma fila por vez para acelerar o check-in.</li>
                    </ul>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border/80 bg-card/75 shadow-sm">
                  <CardContent className="p-4 sm:p-5">
                    <Button variant="ghost" size="sm" className="h-8 px-3 text-xs" onClick={() => setInstructionsVisible(true)}>
                      <ClipboardList className="h-4 w-4 mr-2" /> Mostrar instruções
                    </Button>
                  </CardContent>
                </Card>
              )}

              {feedback && (
                <Card className={feedback.result === "success" ? "border-green-500/50 bg-green-500/5" : feedback.result === "already_used" ? "border-yellow-500/50 bg-yellow-500/5" : "border-destructive/50 bg-destructive/5"}>
                  <CardContent className="py-3 flex items-center gap-3">
                    {feedback.result === "success" ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                    ) : feedback.result === "already_used" ? (
                      <AlertTriangle className="h-6 w-6 text-yellow-500 shrink-0" />
                    ) : (
                      <XCircle className="h-6 w-6 text-destructive shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{feedback.message}</p>
                      {(feedback.attendeeName || feedback.attendeeEmail) && (
                        <p className="text-xs text-muted-foreground">
                          {feedback.attendeeName?.trim() || feedback.attendeeEmail || "Participante"}
                          {feedback.tierName ? ` · ${feedback.tierName}` : ""}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-border/80 bg-card/80 shadow-sm">
                <CardContent className="p-3 sm:p-4">
                  <div className={`relative mx-auto w-full max-w-sm aspect-square overflow-hidden rounded-xl border-2 border-primary/30 ${feedback ? "invisible" : "visible"}`}>
                    <div id={SCANNER_ID} className="w-full h-full" />
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                      <div className="absolute left-4 right-4 h-0.5 bg-primary/80 animate-[scan_2s_ease-in-out_infinite]" />
                    </div>
                  </div>

                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Centralize o QR dentro da moldura. O retorno aparece acima e o scanner retoma sozinho.
                  </p>
                </CardContent>
              </Card>

              <div className="sticky bottom-0 z-30 flex items-center justify-around gap-2 border-t border-border bg-card p-2" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
                <Button
                  variant={soundOn ? "default" : "outline"}
                  size="sm"
                  onClick={() => { const next = toggleSound(); setSoundOn(next); }}
                  className="flex-col h-auto gap-0.5 px-3 py-1.5"
                >
                  {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                  <span className="text-[10px]">Som</span>
                </Button>

                <Drawer open={manualOpen} onOpenChange={(open) => { setManualOpen(open); if (!open) { searchRequestRef.current += 1; setSearchResults([]); setConfirmTicket(null); setSearchQuery(""); setSearching(false); } }}>
                  <DrawerTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-col h-auto gap-0.5 px-3 py-1.5">
                      <Search className="h-5 w-5" />
                      <span className="text-[10px]">Manual</span>
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="max-h-[80dvh]">
                    <DrawerHeader>
                      <DrawerTitle>Busca Manual</DrawerTitle>
                    </DrawerHeader>
                    <div className="space-y-3 px-4 pb-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nome, e-mail, pedido ou código"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && doSearch()}
                          autoFocus
                        />
                        <Button onClick={() => doSearch()} disabled={searching} size="sm">
                          {searching ? "..." : "Buscar"}
                        </Button>
                      </div>

                      <p className="text-[11px] text-muted-foreground">
                        A busca é automática enquanto você digita. Toque em um resultado para abrir a confirmação.
                      </p>

                      <div className="max-h-52 space-y-2 overflow-y-auto">
                        {searchResults.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            className="w-full cursor-pointer rounded-lg border border-border p-2 text-left active:bg-muted/50"
                            onClick={() => setConfirmTicket(t)}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{t.attendee_name || "Sem nome"}</p>
                                <p className="text-xs text-muted-foreground">{t.attendee_email ? maskEmail(t.attendee_email) : "—"}</p>
                                <p className="text-xs text-muted-foreground">{(t as any).ticket_tiers?.name || "—"}</p>
                              </div>
                              <Badge variant={t.status === "used" ? "secondary" : "default"} className="text-[10px]">
                                {t.status === "used" ? "USADO" : "ATIVO"}
                              </Badge>
                            </div>
                          </button>
                        ))}

                        {!searching && searchQuery.trim() && searchResults.length === 0 && (
                          <p className="py-4 text-center text-sm text-muted-foreground">
                            Nenhum ingresso encontrado. Verifique nome, e-mail ou código.
                          </p>
                        )}
                      </div>
                    </div>
                  </DrawerContent>
                </Drawer>

                <Drawer open={historyOpen} onOpenChange={setHistoryOpen}>
                  <DrawerTrigger asChild>
                    <Button variant="outline" size="sm" className="relative flex-col h-auto gap-0.5 px-3 py-1.5">
                      <History className="h-5 w-5" />
                      <span className="text-[10px]">Histórico</span>
                      {history.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">
                          {history.length}
                        </span>
                      )}
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="max-h-[80dvh]">
                    <DrawerHeader>
                      <DrawerTitle>Histórico da Sessão</DrawerTitle>
                    </DrawerHeader>
                    <div className="max-h-72 space-y-1 overflow-y-auto px-4 pb-4">
                      {history.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">Nenhum scan ainda.</p>
                      ) : history.map((h) => (
                        <div key={h.id} className="flex items-center gap-2 border-b border-border py-1.5 last:border-0">
                          {h.result === "success" ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-accent" /> : h.result === "already_used" ? <AlertTriangle className="h-4 w-4 flex-shrink-0 text-warning" /> : <XCircle className="h-4 w-4 flex-shrink-0 text-destructive" />}
                          <p className="min-w-0 flex-1 truncate text-sm">{h.name}</p>
                          <span className="flex-shrink-0 text-xs text-muted-foreground">{h.time}</span>
                        </div>
                      ))}
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>

            <aside className="hidden space-y-4 xl:block xl:sticky xl:top-24">
              <Card className="overflow-hidden border-border/80 bg-card/80 shadow-sm">
                {event?.cover_image_url && (
                  <img src={event.cover_image_url} alt={event.title} className="h-36 w-full object-cover" loading="lazy" />
                )}
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Evento atual
                    </p>
                    {eventBadge && (
                      <Badge variant={eventBadge.variant} className="text-[10px] whitespace-nowrap">
                        {eventBadge.label}
                      </Badge>
                    )}
                  </div>

                  <h3 className="truncate text-base font-semibold text-foreground">
                    {event?.title || "Carregando..."}
                  </h3>

                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 shrink-0" />
                      {eventDateLabel}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 shrink-0" />
                      {eventTimeLabel}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">{venueLabel}</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">{checkinListLabel}</p>
                    <p>{checkinListStatusLabel}</p>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </main>

      <Dialog open={!!confirmTicket} onOpenChange={(open) => !open && setConfirmTicket(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar check-in</DialogTitle>
            <DialogDescription>
              Revise os dados do ingresso antes de efetivar. Essa etapa evita check-in errado por seleção acidental.
            </DialogDescription>
          </DialogHeader>

          {confirmTicket && (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="truncate text-sm font-semibold">{confirmTicket.attendee_name || "Sem nome"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {confirmTicket.attendee_email ? maskEmail(confirmTicket.attendee_email) : "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{(confirmTicket as any).ticket_tiers?.name || "Sem lote"}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={confirmTicket.status === "used" ? "secondary" : "default"} className="text-[10px]">
                    {confirmTicket.status === "used" ? "JÁ UTILIZADO" : "PRONTO PARA CHECK-IN"}
                  </Badge>
                </div>
              </div>

              {confirmTicket.status === "used" && (
                <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning-foreground">
                  Esse ingresso já foi validado anteriormente. O sistema vai bloquear nova entrada e mostrar o histórico original.
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTicket(null)}>Cancelar</Button>
            <Button onClick={() => confirmTicket && handleManualCheckin(confirmTicket)}>Confirmar check-in</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 15%; }
          50% { top: 85%; }
        }
        #${SCANNER_ID} video {
          object-fit: cover !important;
          border-radius: 0.75rem;
        }
      `}</style>
    </div>
  );
}
