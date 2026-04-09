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
import { LogOut, Volume2, VolumeX, Search, History, CheckCircle2, AlertTriangle, XCircle, ChevronLeft, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

export default function StaffCheckinScreen() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Event info
  const [event, setEvent] = useState<{ title: string } | null>(null);
  const [staffCheckinListId, setStaffCheckinListId] = useState<string | null>(null);

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

    supabase.from("events").select("title").eq("id", eventId).single().then(({ data }) => setEvent(data));

    // Fetch staff assignment to get assigned checkin_list_id
    if (user?.id) {
      supabase
        .from("event_staff")
        .select("checkin_list_id")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => setStaffCheckinListId(data?.checkin_list_id || null));
    }

    fetchCounters();

    const channel = supabase
      .channel(`staff-tickets-${eventId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets", filter: `event_id=eq.${eventId}` }, () => fetchCounters())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, loading, eventId, fetchCounters]);

  // ─── Show feedback (stable ref-based) ───
  const showFeedback = useCallback((result: ScanResult, message: string, attendeeName?: string, tierName?: string, checkedInAt?: string) => {
    setFeedback({ result, message, attendeeName, tierName, checkedInAt });

    // Audio + haptic via ref to avoid stale closure
    if (soundRef.current) {
      if (result === "success") playSuccess();
      else if (result === "already_used") playWarning();
      else playError();
    }
    if (result === "success") vibrateSuccess();
    else vibrateError();

    // History
    setHistory((prev) => [{
      id: crypto.randomUUID(),
      name: attendeeName || "—",
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

    // Pause scanner (don't stop — keeps camera alive)
    try { scannerRef.current?.pause(true); } catch {}

    try {
      const result = await validateCheckin({ qrCode, scannedBy: user?.id, checkinListId: staffCheckinListId || undefined });
      showFeedback(result.result as ScanResult, result.message, result.attendeeName, result.tierName, result.checkedInAt);
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

    if (ticket.status === "used") {
      showFeedback("already_used", "Ingresso já utilizado", ticket.attendee_name || undefined);
      return;
    }

    try {
      const { data: t } = await supabase.from("tickets").select("qr_code").eq("id", ticket.id).single();
      if (!t?.qr_code) {
        showFeedback("error", "QR code não encontrado para este ingresso");
        return;
      }
      const result = await validateCheckin({ qrCode: t.qr_code, scannedBy: user?.id, checkinListId: staffCheckinListId || undefined });
      showFeedback(result.result as ScanResult, result.message, result.attendeeName, result.tierName, result.checkedInAt);
    } catch (err: any) {
      showFeedback("error", err?.message || "Erro ao validar ingresso");
    }
  }, [user, showFeedback]);

  // ─── Derived ───
  const pct = totalTickets > 0 ? Math.round((checkedInCount / totalTickets) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col relative overflow-hidden">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-3 py-2 border-b border-border bg-card">
        <button onClick={() => navigate("/staff")} className="p-1" aria-label="Voltar">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 text-center min-w-0 px-1">
          <p className="text-sm font-semibold truncate font-[family-name:var(--font-display)]">
            {event?.title || "Carregando..."}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8" aria-label="Sair">
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      {/* ── Counters ── */}
      <div className="px-4 py-2 bg-card border-b border-border">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            <strong>{checkedInCount}</strong> entradas
          </span>
          <span className="text-muted-foreground">🎟 {totalTickets} total</span>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={pct} className="h-2 flex-1" />
          <span className="text-xs font-medium text-muted-foreground w-10 text-right">{pct}%</span>
        </div>
      </div>

      {/* ── Instruções rápidas ── */}
      {showInstructions ? (
        <section className="px-4 py-3 border-b border-border bg-muted/20">
          <div className="flex items-start gap-2">
            <ClipboardList className="h-4 w-4 mt-0.5 text-primary" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">Instruções para a equipe</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Fluxo rápido para check-in sem erro. A confirmação final sempre aparece antes de efetivar a busca manual.
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => setInstructionsVisible(false)}>
                  Ocultar
                </Button>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>1. Aponte a câmera para o QR Code inteiro e aguarde o retorno na tela.</li>
                <li>2. Se o ingresso falhar, use a busca manual por nome, e-mail ou código.</li>
                <li>3. Em caso de "já utilizado", confirme documento com o participante.</li>
                <li>4. Mantenha uma fila por vez para acelerar o check-in.</li>
              </ul>
            </div>
          </div>
        </section>
      ) : (
        <div className="px-4 py-2 border-b border-border bg-muted/10">
          <Button variant="ghost" size="sm" className="h-8 px-3 text-xs" onClick={() => setInstructionsVisible(true)}>
            <ClipboardList className="h-4 w-4 mr-2" /> Mostrar instruções
          </Button>
        </div>
      )}

      {/* ── Scanner area (always mounted, hidden behind feedback) ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-3 relative min-h-0">
        <div className={`w-full max-w-sm aspect-square relative rounded-xl overflow-hidden border-2 border-primary/30 ${feedback ? "invisible" : "visible"}`}>
          <div id={SCANNER_ID} className="w-full h-full" />
          {/* Corner markers */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
            <div className="absolute left-4 right-4 h-0.5 bg-primary/80 animate-[scan_2s_ease-in-out_infinite]" />
          </div>
        </div>

        {/* ── Feedback overlay ── */}
        {feedback && (
          <div
            className={`absolute inset-0 z-40 flex flex-col items-center justify-center p-6 animate-in fade-in duration-200
              ${feedback.result === "success" ? "bg-accent text-accent-foreground" : feedback.result === "already_used" || feedback.result === "rate_limited" ? "bg-warning text-warning-foreground" : "bg-destructive text-destructive-foreground"}`}
            onClick={() => {
              setFeedback(null);
              try { scannerRef.current?.resume(); } catch {}
            }}
          >
            {feedback.result === "success" ? <CheckCircle2 className="h-20 w-20" /> : feedback.result === "already_used" || feedback.result === "rate_limited" ? <AlertTriangle className="h-20 w-20" /> : <XCircle className="h-20 w-20" />}
            <h2 className="text-2xl font-bold mt-4 text-center font-[family-name:var(--font-display)]">
              {feedback.result === "success" ? "CHECK-IN OK" : feedback.result === "already_used" ? "JÁ UTILIZADO" : "INVÁLIDO"}
            </h2>
            {feedback.attendeeName && <p className="text-xl mt-2 font-semibold">{feedback.attendeeName}</p>}
            {feedback.tierName && <Badge variant="secondary" className="mt-2 text-sm">{feedback.tierName}</Badge>}
            <p className="mt-3 text-sm opacity-90 text-center">{feedback.message}</p>
              {feedback.checkedInAt && feedback.result === "already_used" && (
              <p className="mt-1 text-xs opacity-75">Check-in original: {new Date(feedback.checkedInAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}</p>
            )}
            <p className="mt-4 text-xs opacity-60">Toque para fechar</p>
          </div>
        )}
      </div>

      {/* ── Bottom controls ── */}
      <div className="sticky bottom-0 z-30 flex items-center justify-around p-2 border-t border-border bg-card" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
        <Button
          variant={soundOn ? "default" : "outline"}
          size="sm"
          onClick={() => { const next = toggleSound(); setSoundOn(next); }}
          className="flex-col h-auto py-1.5 px-3 gap-0.5"
        >
          {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          <span className="text-[10px]">Som</span>
        </Button>

        {/* Manual search */}
        <Drawer open={manualOpen} onOpenChange={(open) => { setManualOpen(open); if (!open) { searchRequestRef.current += 1; setSearchResults([]); setConfirmTicket(null); setSearchQuery(""); setSearching(false); } }}>
          <DrawerTrigger asChild>
            <Button variant="outline" size="sm" className="flex-col h-auto py-1.5 px-3 gap-0.5">
              <Search className="h-5 w-5" />
              <span className="text-[10px]">Manual</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[80dvh]">
            <DrawerHeader>
              <DrawerTitle>Busca Manual</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Nome, e-mail, pedido ou código"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doSearch()}
                  autoFocus
                />
                <Button onClick={() => doSearch()} disabled={searching} size="sm">{searching ? "..." : "Buscar"}</Button>
              </div>

              <p className="text-[11px] text-muted-foreground">
                A busca é automática enquanto você digita. Toque em um resultado para abrir a confirmação.
              </p>

              <div className="space-y-2 max-h-52 overflow-y-auto">
                {searchResults.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="w-full flex items-center justify-between p-2 rounded-lg border border-border text-left cursor-pointer active:bg-muted/50"
                    onClick={() => setConfirmTicket(t)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.attendee_name || "Sem nome"}</p>
                      <p className="text-xs text-muted-foreground">{t.attendee_email ? maskEmail(t.attendee_email) : "—"}</p>
                      <p className="text-xs text-muted-foreground">{(t as any).ticket_tiers?.name || "—"}</p>
                    </div>
                    <Badge variant={t.status === "used" ? "secondary" : "default"} className="text-[10px]">{t.status === "used" ? "USADO" : "ATIVO"}</Badge>
                  </button>
                ))}

                {!searching && searchQuery.trim() && searchResults.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nenhum ingresso encontrado. Verifique nome, e-mail ou código.
                  </p>
                )}
              </div>
            </div>
          </DrawerContent>
        </Drawer>

        {/* History */}
        <Drawer open={historyOpen} onOpenChange={setHistoryOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" size="sm" className="flex-col h-auto py-1.5 px-3 gap-0.5 relative">
              <History className="h-5 w-5" />
              <span className="text-[10px]">Histórico</span>
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] rounded-full h-4 w-4 flex items-center justify-center">{history.length}</span>
              )}
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[80dvh]">
            <DrawerHeader><DrawerTitle>Histórico da Sessão</DrawerTitle></DrawerHeader>
            <div className="px-4 pb-4 space-y-1 max-h-72 overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">Nenhum scan ainda.</p>
              ) : history.map((h) => (
                <div key={h.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                  {h.result === "success" ? <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" /> : h.result === "already_used" ? <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" /> : <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />}
                  <p className="text-sm truncate flex-1 min-w-0">{h.name}</p>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{h.time}</span>
                </div>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      </div>

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
                <p className="text-sm font-semibold truncate">{confirmTicket.attendee_name || "Sem nome"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {confirmTicket.attendee_email ? maskEmail(confirmTicket.attendee_email) : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{(confirmTicket as any).ticket_tiers?.name || "Sem lote"}</p>
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
