import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { LogOut, Flashlight, Volume2, VolumeX, Search, History, Undo2, CheckCircle2, AlertTriangle, XCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import logoWhite from "@/assets/logo-full-white.svg";
import logoBlack from "@/assets/logo-full-black.svg";

type ScanResult = "success" | "already_used" | "invalid_qr" | "not_found" | "inactive" | "wrong_list" | "error" | "rate_limited" | "config_error" | "unauthorized";

interface FeedbackState {
  result: ScanResult;
  message: string;
  attendeeName?: string;
  tierName?: string;
  checkedInAt?: string;
}

interface HistoryEntry {
  id: string;
  name: string;
  time: string;
  result: ScanResult;
  ticketId?: string;
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

export default function StaffCheckinScreen() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Event info
  const [event, setEvent] = useState<{ title: string; start_date: string; end_date: string } | null>(null);

  // Counters
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);

  // Scanner
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "staff-qr-reader";
  const [scannerReady, setScannerReady] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const debounceRef = useRef(false);

  // Feedback
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // History
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [undoTicketId, setUndoTicketId] = useState<string | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Manual search
  const [manualOpen, setManualOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TicketRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [confirmTicket, setConfirmTicket] = useState<TicketRow | null>(null);

  // History drawer
  const [historyOpen, setHistoryOpen] = useState(false);

  // ─── Fetch event & counters ───
  const fetchCounters = useCallback(async () => {
    if (!eventId) return;
    const { count: total } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .in("status", ["active", "used"]);

    const { count: checked } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "used");

    setTotalTickets(total || 0);
    setCheckedInCount(checked || 0);
  }, [eventId]);

  useEffect(() => {
    if (loading || !user || !eventId) return;
    // Fetch event
    supabase
      .from("events")
      .select("title, start_date, end_date")
      .eq("id", eventId)
      .single()
      .then(({ data }) => setEvent(data));

    fetchCounters();

    // Realtime subscription
    const channel = supabase
      .channel(`staff-tickets-${eventId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "tickets",
        filter: `event_id=eq.${eventId}`,
      }, () => {
        fetchCounters();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, loading, eventId, fetchCounters]);

  // ─── QR Scanner lifecycle ───
  useEffect(() => {
    if (loading || !user || feedback) return;
    let html5Qr: Html5Qrcode | null = null;

    const startScanner = async () => {
      html5Qr = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5Qr;

      try {
        await html5Qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
          (decodedText) => handleScan(decodedText),
          () => {},
        );
        setScannerReady(true);
      } catch (err) {
        console.error("Camera error:", err);
      }
    };

    // Small delay to ensure DOM element exists
    const t = setTimeout(startScanner, 300);
    return () => {
      clearTimeout(t);
      if (html5Qr?.isScanning) {
        html5Qr.stop().catch(() => {});
      }
      scannerRef.current = null;
      setScannerReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, feedback]);

  // ─── Handle QR scan ───
  const handleScan = useCallback(async (qrCode: string) => {
    if (debounceRef.current) return;
    debounceRef.current = true;

    // Pause scanner
    try { await scannerRef.current?.pause(true); } catch {}

    try {
      const result = await validateCheckin({ qrCode, scannedBy: user?.id });
      showFeedback(result.result as ScanResult, result.message, result.attendeeName, result.tierName, result.checkedInAt);
    } catch (err: any) {
      // Try parsing structured error
      let msg = err?.message || "Erro desconhecido";
      let result: ScanResult = "error";
      try {
        const parsed = JSON.parse(msg);
        if (parsed.result) result = parsed.result;
        if (parsed.message) msg = parsed.message;
      } catch {}
      showFeedback(result, msg);
    }

    // Debounce 1.5s
    setTimeout(() => { debounceRef.current = false; }, 1500);
  }, [user]);

  // ─── Show feedback overlay ───
  const showFeedback = useCallback((result: ScanResult, message: string, attendeeName?: string, tierName?: string, checkedInAt?: string) => {
    setFeedback({ result, message, attendeeName, tierName, checkedInAt });

    // Audio + haptic
    if (soundOn) {
      if (result === "success") playSuccess();
      else if (result === "already_used") playWarning();
      else playError();
    }
    if (result === "success") vibrateSuccess();
    else vibrateError();

    // Add to history
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      name: attendeeName || "—",
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      result,
    };
    setHistory((prev) => [entry, ...prev].slice(0, 50));

    // Undo for success
    if (result === "success") {
      // We don't have ticketId from validate-checkin response directly, but we can track via recent
      setUndoTicketId(null); // simplified — undo not available without ticketId in response
    }

    // Auto-dismiss
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => {
      setFeedback(null);
    }, result === "success" ? 2000 : 3000);
  }, [soundOn]);

  // ─── Manual search ───
  const doSearch = useCallback(async () => {
    if (!searchQuery.trim() || !eventId) return;
    setSearching(true);
    const q = searchQuery.trim();

    const { data } = await supabase
      .from("tickets")
      .select("id, attendee_name, attendee_email, status, tier_id, order_id, ticket_tiers(name)")
      .eq("event_id", eventId)
      .in("status", ["active", "used"])
      .or(`attendee_name.ilike.%${q}%,order_id.eq.${q.length === 36 ? q : "00000000-0000-0000-0000-000000000000"}`)
      .limit(20);

    setSearchResults((data as any[]) || []);
    setSearching(false);
  }, [searchQuery, eventId]);

  const handleManualCheckin = useCallback(async (ticket: TicketRow) => {
    setConfirmTicket(null);
    setManualOpen(false);

    if (ticket.status === "used") {
      showFeedback("already_used", "Ingresso já utilizado", ticket.attendee_name || undefined);
      return;
    }

    try {
      // Use the ticket ID approach — fetch qr_code then validate
      const { data: t } = await supabase
        .from("tickets")
        .select("qr_code")
        .eq("id", ticket.id)
        .single();

      if (!t?.qr_code) {
        showFeedback("error", "QR code não encontrado para este ingresso");
        return;
      }

      const result = await validateCheckin({ qrCode: t.qr_code, scannedBy: user?.id });
      showFeedback(result.result as ScanResult, result.message, result.attendeeName, result.tierName, result.checkedInAt);
    } catch (err: any) {
      showFeedback("error", err?.message || "Erro ao validar ingresso");
    }
  }, [user, showFeedback]);

  // ─── Toggle torch ───
  const toggleTorch = useCallback(async () => {
    try {
      const track = scannerRef.current?.getRunningTrackCameraCapabilities?.();
      if (track) {
        // @ts-ignore
        const videoTrack = scannerRef.current?.getState?.()?.camera?.track;
        if (videoTrack) {
          await videoTrack.applyConstraints({ advanced: [{ torch: !torchOn } as any] });
          setTorchOn(!torchOn);
        }
      }
    } catch {
      // Torch not supported
    }
  }, [torchOn]);

  // ─── Percentage ───
  const pct = totalTickets > 0 ? Math.round((checkedInCount / totalTickets) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // ─── Feedback overlay colors ───
  const feedbackConfig: Record<string, { bg: string; icon: React.ReactNode; textColor: string }> = {
    success: { bg: "bg-green-500", icon: <CheckCircle2 className="h-20 w-20" />, textColor: "text-white" },
    already_used: { bg: "bg-orange-500", icon: <AlertTriangle className="h-20 w-20" />, textColor: "text-white" },
    invalid_qr: { bg: "bg-destructive", icon: <XCircle className="h-20 w-20" />, textColor: "text-white" },
    not_found: { bg: "bg-destructive", icon: <XCircle className="h-20 w-20" />, textColor: "text-white" },
    inactive: { bg: "bg-destructive", icon: <XCircle className="h-20 w-20" />, textColor: "text-white" },
    wrong_list: { bg: "bg-destructive", icon: <XCircle className="h-20 w-20" />, textColor: "text-white" },
    error: { bg: "bg-destructive", icon: <XCircle className="h-20 w-20" />, textColor: "text-white" },
    rate_limited: { bg: "bg-orange-500", icon: <AlertTriangle className="h-20 w-20" />, textColor: "text-white" },
    config_error: { bg: "bg-destructive", icon: <XCircle className="h-20 w-20" />, textColor: "text-white" },
    unauthorized: { bg: "bg-destructive", icon: <XCircle className="h-20 w-20" />, textColor: "text-white" },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-3 py-2 border-b border-border bg-card">
        <button onClick={() => navigate("/staff")} className="p-1">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 text-center min-w-0">
          <p className="text-sm font-semibold truncate font-[family-name:var(--font-display)]">
            {event?.title || "..."}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8">
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      {/* ── Counters ── */}
      <div className="px-4 py-2 bg-card border-b border-border">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <strong>{checkedInCount}</strong> entradas
          </span>
          <span className="text-muted-foreground">
            🎟 {totalTickets} total
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={pct} className="h-2 flex-1" />
          <span className="text-xs font-medium text-muted-foreground w-10 text-right">{pct}%</span>
        </div>
      </div>

      {/* ── Scanner area ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
        {!feedback && (
          <div className="w-full max-w-sm aspect-square relative rounded-xl overflow-hidden border-2 border-primary/30">
            <div id={scannerContainerId} className="w-full h-full" />
            {/* Animated scanning frame */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
              {/* Scan line animation */}
              <div className="absolute left-4 right-4 h-0.5 bg-primary/80 animate-[scan_2s_ease-in-out_infinite]" />
            </div>
          </div>
        )}

        {/* ── Feedback overlay ── */}
        {feedback && (() => {
          const cfg = feedbackConfig[feedback.result] || feedbackConfig.error;
          return (
            <div
              className={`absolute inset-0 z-40 flex flex-col items-center justify-center ${cfg.bg} ${cfg.textColor} p-6 animate-in fade-in duration-200`}
              onClick={() => setFeedback(null)}
            >
              {cfg.icon}
              <h2 className="text-2xl font-bold mt-4 text-center font-[family-name:var(--font-display)]">
                {feedback.result === "success" ? "CHECK-IN OK" : feedback.result === "already_used" ? "JÁ UTILIZADO" : "INVÁLIDO"}
              </h2>
              {feedback.attendeeName && (
                <p className="text-xl mt-2 font-semibold">{feedback.attendeeName}</p>
              )}
              {feedback.tierName && (
                <Badge variant="secondary" className="mt-2 text-sm">{feedback.tierName}</Badge>
              )}
              <p className="mt-3 text-sm opacity-90 text-center">{feedback.message}</p>
              {feedback.checkedInAt && feedback.result === "already_used" && (
                <p className="mt-1 text-xs opacity-75">
                  Check-in original: {new Date(feedback.checkedInAt).toLocaleTimeString("pt-BR")}
                </p>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── Bottom controls ── */}
      <div className="sticky bottom-0 z-30 flex items-center justify-around p-3 border-t border-border bg-card safe-bottom">
        <Button
          variant={torchOn ? "default" : "outline"}
          size="sm"
          onClick={toggleTorch}
          className="flex-col h-auto py-2 px-3 gap-0.5"
        >
          <Flashlight className="h-5 w-5" />
          <span className="text-[10px]">Lanterna</span>
        </Button>

        <Button
          variant={soundOn ? "default" : "outline"}
          size="sm"
          onClick={() => {
            const next = toggleSound();
            setSoundOn(next);
          }}
          className="flex-col h-auto py-2 px-3 gap-0.5"
        >
          {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          <span className="text-[10px]">Som</span>
        </Button>

        {/* Manual search drawer */}
        <Drawer open={manualOpen} onOpenChange={setManualOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" size="sm" className="flex-col h-auto py-2 px-3 gap-0.5">
              <Search className="h-5 w-5" />
              <span className="text-[10px]">Manual</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>Busca Manual</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Nome ou código do pedido"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doSearch()}
                />
                <Button onClick={doSearch} disabled={searching} size="sm">
                  {searching ? "..." : "Buscar"}
                </Button>
              </div>

              {/* Confirm dialog */}
              {confirmTicket && (
                <div className="p-3 rounded-lg border border-primary bg-primary/5">
                  <p className="text-sm font-medium">
                    Confirmar check-in de <strong>{confirmTicket.attendee_name}</strong>?
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => handleManualCheckin(confirmTicket)}>
                      Confirmar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirmTicket(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 rounded-lg border border-border cursor-pointer hover:bg-muted/50"
                    onClick={() => setConfirmTicket(t)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.attendee_name || "Sem nome"}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.attendee_email ? maskEmail(t.attendee_email) : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(t as any).ticket_tiers?.name || "—"}
                      </p>
                    </div>
                    <Badge variant={t.status === "used" ? "secondary" : "default"} className="text-[10px]">
                      {t.status === "used" ? "USADO" : "ATIVO"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </DrawerContent>
        </Drawer>

        {/* History drawer */}
        <Drawer open={historyOpen} onOpenChange={setHistoryOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" size="sm" className="flex-col h-auto py-2 px-3 gap-0.5 relative">
              <History className="h-5 w-5" />
              <span className="text-[10px]">Histórico</span>
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] rounded-full h-4 w-4 flex items-center justify-center">
                  {history.length}
                </span>
              )}
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>Histórico da Sessão</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 space-y-2 max-h-80 overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">Nenhum scan ainda.</p>
              ) : (
                history.map((h) => (
                  <div key={h.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                    {h.result === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : h.result === "already_used" ? (
                      <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{h.name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{h.time}</span>
                  </div>
                ))
              )}
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Scan line animation keyframe */}
      <style>{`
        @keyframes scan {
          0%, 100% { top: 15%; }
          50% { top: 85%; }
        }
        #${scannerContainerId} video {
          object-fit: cover !important;
          border-radius: 0.75rem;
        }
        .safe-bottom {
          padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
}
