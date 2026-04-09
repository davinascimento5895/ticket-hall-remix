import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Archive,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Flame,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  Pencil,
  Search,
  Send,
  Trash2,
  User,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";

const QUICK_REPLIES_STORAGE_KEY = "producer:quick-replies";
const URGENCY_OVERRIDES_STORAGE_KEY = "producer:urgent-overrides";

const DEFAULT_QUICK_REPLIES = [
  "Obrigado pela mensagem. Vou validar com o time e retorno ainda hoje.",
  "Recebemos sua solicitação. Nosso suporte responde em até 2 horas úteis.",
  "Perfeito, conseguimos ajudar com isso. Me confirme seu número do pedido para avançarmos.",
];

export default function ProducerInbox() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "new" | "urgent" | "answered">("all");
  const [activeEventFilter, setActiveEventFilter] = useState<string>("all");

  const [quickReplies, setQuickReplies] = useState<string[]>(DEFAULT_QUICK_REPLIES);
  const [templateDraft, setTemplateDraft] = useState("");
  const [editingTemplateIndex, setEditingTemplateIndex] = useState<number | null>(null);
  const [selectedQuickReplyIndex, setSelectedQuickReplyIndex] = useState<number | null>(null);

  const [urgentOverrides, setUrgentOverrides] = useState<Record<string, boolean>>({});
  const [localRepliedIds, setLocalRepliedIds] = useState<Record<string, boolean>>({});
  const [templatesDrawerOpen, setTemplatesDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(QUICK_REPLIES_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
        setQuickReplies(parsed.length ? parsed : DEFAULT_QUICK_REPLIES);
      }
    } catch {
      // Ignore corrupted local storage payload.
    }

    try {
      const rawUrgency = localStorage.getItem(URGENCY_OVERRIDES_STORAGE_KEY);
      if (!rawUrgency) return;
      const parsedUrgency = JSON.parse(rawUrgency);
      if (parsedUrgency && typeof parsedUrgency === "object") {
        setUrgentOverrides(parsedUrgency as Record<string, boolean>);
      }
    } catch {
      // Ignore corrupted local storage payload.
    }
  }, []);

  useEffect(() => {
    // Aggregate localStorage writes into single effect (avoid blocking renders)
    try {
      localStorage.setItem(QUICK_REPLIES_STORAGE_KEY, JSON.stringify(quickReplies));
      localStorage.setItem(URGENCY_OVERRIDES_STORAGE_KEY, JSON.stringify(urgentOverrides));
    } catch {
      // Ignore storage limitations.
    }
  }, [quickReplies, urgentOverrides]);

  const { data: messages = [], isLoading, error: inboxError } = useQuery({
    queryKey: ["producer-inbox", user?.id],
    queryFn: async () => {
      const baseSelect = "id, producer_id, sender_id, sender_name, sender_email, subject, message, is_read, created_at";

      const { data, error } = await supabase
        .from("producer_messages")
        .select(`${baseSelect}, event_id, replied_at, is_urgent`)
        .eq("producer_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);

      let rows: any[] = data || [];

      if (error) {
        const needsFallback = /event_id|replied_at|is_urgent|producer_messages_event_id_fkey|relationship/i.test(error.message || "");
        if (!needsFallback) throw error;

        const { data: legacyData, error: legacyError } = await supabase
          .from("producer_messages")
          .select(baseSelect)
          .eq("producer_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(100);

        if (legacyError) throw legacyError;
        rows = (legacyData || []).map((msg: any) => ({
          ...msg,
          event_id: null,
          replied_at: null,
          is_urgent: null,
        }));
      }

      const eventIds = [...new Set(rows.map((row: any) => row.event_id).filter(Boolean))] as string[];
      const eventMap = new Map<string, { id: string; title: string; slug: string }>();

      if (eventIds.length > 0) {
        const { data: eventsData } = await supabase
          .from("events")
          .select("id, title, slug")
          .in("id", eventIds);

        (eventsData || []).forEach((event: any) => {
          eventMap.set(event.id, event);
        });
      }

      return rows.map((row: any) => ({
        ...row,
        event: row.event_id ? eventMap.get(row.event_id) || null : null,
      }));
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  useRealtimeSubscription({
    table: "producer_messages",
    filter: `producer_id=eq.${user?.id}`,
    queryKey: ["producer-inbox", user?.id || ""],
    enabled: !!user?.id,
  });

  const markAsRead = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("producer_messages")
        .update({ is_read: true })
        .eq("id", messageId)
        .eq("producer_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producer-inbox", user?.id] });
    },
  });

  const toggleUrgency = useMutation({
    mutationFn: async ({ messageId, value }: { messageId: string; value: boolean }) => {
      const { error } = await supabase
        .from("producer_messages")
        .update({ is_urgent: value })
        .eq("id", messageId)
        .eq("producer_id", user!.id);

      if (error && /is_urgent/i.test(error.message || "")) {
        return { legacy: true };
      }

      if (error) throw error;
      return { legacy: false };
    },
    onSuccess: (result, vars) => {
      if (result.legacy) {
        setUrgentOverrides((prev) => ({ ...prev, [vars.messageId]: vars.value }));
      }
      queryClient.invalidateQueries({ queryKey: ["producer-inbox", user?.id] });
      setSelectedMessage((prev: any) => (prev?.id === vars.messageId ? { ...prev, is_urgent: vars.value } : prev));
      toast({ title: vars.value ? "Marcada como urgente" : "Urgência removida" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao atualizar urgência", description: err.message, variant: "destructive" });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMessage || !user || !replyText.trim()) return;

      const { error: notifErr } = await supabase.from("notifications").insert({
        user_id: selectedMessage.sender_id,
        type: "producer_reply",
        title: `Resposta: ${selectedMessage.subject}`,
        body: replyText.trim(),
        data: {
          producer_id: user.id,
          producer_name: profile?.full_name || "Produtor",
          original_message_id: selectedMessage.id,
          event_id: selectedMessage.event_id || null,
        },
      });
      if (notifErr) throw notifErr;

      const payload = {
        producer_id: selectedMessage.sender_id,
        sender_id: user.id,
        sender_name: profile?.full_name || "Produtor",
        sender_email: user.email || "",
        event_id: selectedMessage.event_id || null,
        subject: `Re: ${selectedMessage.subject}`,
        message: replyText.trim(),
      };

      let { error: msgErr } = await supabase.from("producer_messages").insert(payload);
      if (msgErr && /event_id/i.test(msgErr.message || "")) {
        const { event_id: _ignored, ...legacyPayload } = payload;
        const legacyInsert = await supabase.from("producer_messages").insert(legacyPayload);
        msgErr = legacyInsert.error;
      }
      if (msgErr) throw msgErr;

      const replyTimestamp = new Date().toISOString();
      const { error: updateErr } = await supabase
        .from("producer_messages")
        .update({ replied_at: replyTimestamp })
        .eq("id", selectedMessage.id)
        .eq("producer_id", user.id);

      if (updateErr && /replied_at/i.test(updateErr.message || "")) {
        // Legacy schema without replied_at, keep UX responsive via local state.
        setLocalRepliedIds((prev) => ({ ...prev, [selectedMessage.id]: true }));
      } else if (updateErr) {
        throw updateErr;
      } else {
        setSelectedMessage((prev: any) => (prev?.id === selectedMessage.id ? { ...prev, replied_at: replyTimestamp } : prev));
      }
    },
    onSuccess: () => {
      toast({ title: "Resposta enviada!" });
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ["producer-inbox", user?.id] });
    },
    onError: (err: any) => toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" }),
  });

  const handleOpen = (msg: any) => {
    setSelectedMessage(msg);
    if (!msg.is_read) {
      markAsRead.mutate(msg.id);
    }
  };

  const unreadCount = messages.filter((m: any) => !m.is_read).length;

  const messagesWithMeta = useMemo(() => {
    return messages.map((msg: any) => {
      const combined = `${msg.subject || ""} ${msg.message || ""}`.toLowerCase();
      const autoUrgent = /(urgente|estorno|erro|cancel|problema|ajuda)/.test(combined);
      const overrideUrgent = urgentOverrides[msg.id];
      const isUrgent = typeof overrideUrgent === "boolean"
        ? overrideUrgent
        : (typeof msg.is_urgent === "boolean" ? msg.is_urgent : autoUrgent);

      const status = (msg.replied_at || localRepliedIds[msg.id])
        ? "answered"
        : (isUrgent ? "urgent" : (!msg.is_read ? "new" : "open"));

      return {
        ...msg,
        isUrgent,
        status,
      };
    });
  }, [messages, urgentOverrides, localRepliedIds]);

  const filteredMessages = useMemo(() => {
    return messagesWithMeta.filter((msg: any) => {
      const matchesFilter = activeFilter === "all" || msg.status === activeFilter;
      const eventKey = msg.event_id || "none";
      const matchesEvent = activeEventFilter === "all" || eventKey === activeEventFilter;
      const matchesSearch = searchTerm.trim().length === 0
        || msg.sender_name?.toLowerCase().includes(searchTerm.toLowerCase())
        || msg.subject?.toLowerCase().includes(searchTerm.toLowerCase())
        || msg.message?.toLowerCase().includes(searchTerm.toLowerCase())
        || msg.event?.title?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesEvent && matchesSearch;
    });
  }, [messagesWithMeta, activeFilter, activeEventFilter, searchTerm]);

  useEffect(() => {
    if (!filteredMessages.length) {
      setSelectedMessage(null);
      return;
    }

    if (!selectedMessage) {
      setSelectedMessage(filteredMessages[0]);
      return;
    }

    const stillVisible = filteredMessages.some((msg: any) => msg.id === selectedMessage.id);
    if (!stillVisible) {
      setSelectedMessage(filteredMessages[0]);
    }
  }, [filteredMessages, selectedMessage]);

  const counts = useMemo(() => {
    const all = messagesWithMeta.length;
    const newCount = messagesWithMeta.filter((msg: any) => msg.status === "new").length;
    const urgentCount = messagesWithMeta.filter((msg: any) => msg.status === "urgent").length;
    const answeredCount = messagesWithMeta.filter((msg: any) => msg.status === "answered").length;

    return { all, newCount, urgentCount, answeredCount };
  }, [messagesWithMeta]);

  const eventFilters = useMemo(() => {
    const grouped = new Map<string, { id: string; label: string; count: number }>();

    messagesWithMeta.forEach((msg: any) => {
      const key = msg.event_id || "none";
      const label = msg.event?.title || "Sem evento";
      const prev = grouped.get(key);
      if (prev) {
        prev.count += 1;
      } else {
        grouped.set(key, { id: key, label, count: 1 });
      }
    });

    return Array.from(grouped.values()).sort((a, b) => b.count - a.count);
  }, [messagesWithMeta]);

  const selectedMessageStatus = selectedMessage?.status as "new" | "urgent" | "answered" | "open" | undefined;

  const handleTemplateSubmit = () => {
    const trimmed = templateDraft.trim();
    if (!trimmed) return;

    if (editingTemplateIndex !== null) {
      setQuickReplies((prev) => prev.map((reply, idx) => (idx === editingTemplateIndex ? trimmed : reply)));
      setEditingTemplateIndex(null);
      toast({ title: "Modelo atualizado" });
    } else {
      setQuickReplies((prev) => [...prev, trimmed]);
      toast({ title: "Modelo adicionado" });
    }

    setTemplateDraft("");
  };

  const handleTemplateEdit = (index: number) => {
    setTemplateDraft(quickReplies[index]);
    setEditingTemplateIndex(index);
  };

  const handleTemplateDelete = (index: number) => {
    setQuickReplies((prev) => prev.filter((_, idx) => idx !== index));
    if (editingTemplateIndex === index) {
      setEditingTemplateIndex(null);
      setTemplateDraft("");
    }
    toast({ title: "Modelo removido" });
  };

  return (
    <>
      <SEOHead title="Mensagens — Produtor" />
      <div className="space-y-4">
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm md:p-5">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold text-foreground">Mensagens consolidadas</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Triagem unificada de todos os eventos.
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">{unreadCount} não lida{unreadCount > 1 ? "s" : ""}</Badge>
              )}
            </p>
            {inboxError && (
              <p className="mt-2 text-xs text-destructive">Erro ao carregar mensagens: {(inboxError as Error).message}</p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-20 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-12 w-12" />}
            title="Nenhuma mensagem"
            description="Quando compradores enviarem mensagens pelo seu perfil, elas aparecerão aqui."
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[220px_minmax(300px,420px)_minmax(0,1fr)]">
            <Card className="border-border/70">
              <CardContent className="space-y-2 p-3">
                <p className="px-2 py-1 text-xs uppercase tracking-wide text-muted-foreground">Categorias</p>
                {[
                  { key: "all", label: "Entrada", count: counts.all, icon: Inbox },
                  { key: "new", label: "Não lidas", count: counts.newCount, icon: Mail },
                  { key: "urgent", label: "Urgentes", count: counts.urgentCount, icon: AlertTriangle },
                  { key: "answered", label: "Respondidas", count: counts.answeredCount, icon: CheckCircle2 },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveFilter(item.key as typeof activeFilter)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                        activeFilter === item.key
                          ? "bg-primary/10 text-foreground"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </span>
                      <Badge variant="outline" className="text-[10px]">{item.count}</Badge>
                    </button>
                  );
                })}

              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardContent className="space-y-3 p-3">
                {!!eventFilters.length && (
                  <div className="space-y-2">
                    <p className="flex items-center gap-1.5 px-1 text-xs uppercase tracking-wide text-muted-foreground">
                      <Filter className="h-3.5 w-3.5" />
                      Eventos
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant={activeEventFilter === "all" ? "default" : "outline"}
                        onClick={() => setActiveEventFilter("all")}
                        className="h-7 rounded-full px-3 text-xs"
                      >
                        Todos
                      </Button>
                      {eventFilters.map((eventFilter) => (
                        <Button
                          key={eventFilter.id}
                          type="button"
                          size="sm"
                          variant={activeEventFilter === eventFilter.id ? "default" : "outline"}
                          onClick={() => setActiveEventFilter(eventFilter.id)}
                          className="h-7 max-w-[220px] rounded-full px-3 text-xs"
                          title={eventFilter.label}
                        >
                          <span className="truncate">{eventFilter.label} ({eventFilter.count})</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar mensagens..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="max-h-[62vh] space-y-2 overflow-y-auto pr-1">
                  {filteredMessages.map((msg: any) => {
                    const isSelected = selectedMessage?.id === msg.id;
                    return (
                      <button
                        key={msg.id}
                        onClick={() => handleOpen(msg)}
                        className={`w-full rounded-lg border p-3 text-left transition-all ${
                          isSelected
                            ? "border-primary/40 bg-primary/10"
                            : "border-border/70 bg-card hover:border-primary/20 hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{msg.sender_name}</p>
                            <p className="truncate text-xs text-muted-foreground">{msg.subject}</p>
                          </div>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>

                        <p className="mt-1 line-clamp-2 break-words text-xs text-muted-foreground">{msg.message}</p>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="max-w-[170px] truncate text-[10px]">
                            {msg.event?.title || "Sem evento"}
                          </Badge>
                          {msg.isUrgent && <Badge variant="destructive" className="text-[10px]">Urgente</Badge>}
                          {msg.status === "new" && <Badge className="text-[10px]">Novo</Badge>}
                          {msg.status === "answered" && <Badge variant="secondary" className="text-[10px]">Respondido</Badge>}
                          {!msg.is_read ? <Mail className="h-3.5 w-3.5 text-primary" /> : <MailOpen className="h-3.5 w-3.5 text-muted-foreground" />}
                        </div>
                      </button>
                    );
                  })}

                  {!filteredMessages.length && (
                    <div className="rounded-lg border border-dashed border-border/80 p-8 text-center text-sm text-muted-foreground">
                      Nenhuma conversa para os filtros atuais.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardContent className="flex h-full max-h-[70vh] flex-col p-4">
                {!selectedMessage ? (
                  <div className="flex h-full items-center justify-center text-center">
                    <div className="space-y-2">
                      <Archive className="mx-auto h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">Selecione uma conversa para ver detalhes.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="border-b border-border/70 pb-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="min-w-0 break-words font-display text-lg font-semibold text-foreground">{selectedMessage.subject}</p>
                        <div className="flex items-center gap-1">
                          {selectedMessageStatus === "urgent" && <Badge variant="destructive">Urgente</Badge>}
                          {selectedMessageStatus === "new" && <Badge>Novo</Badge>}
                          {selectedMessageStatus === "answered" && <Badge variant="secondary">Respondido</Badge>}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        <span className="truncate">{selectedMessage.sender_name}</span>
                        <span>•</span>
                        <span className="truncate">{selectedMessage.sender_email}</span>
                        <span>•</span>
                        <span className="truncate">{selectedMessage.event?.title || "Sem evento"}</span>
                        <span>•</span>
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(selectedMessage.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "America/Sao_Paulo",
                        })}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant={selectedMessage.isUrgent ? "destructive" : "outline"}
                          onClick={() => toggleUrgency.mutate({ messageId: selectedMessage.id, value: !selectedMessage.isUrgent })}
                          disabled={toggleUrgency.isPending}
                        >
                          <Flame className="mr-1 h-3.5 w-3.5" />
                          {selectedMessage.isUrgent ? "Remover urgência" : "Marcar urgente"}
                        </Button>
                        {!!selectedMessage.event_id && (
                          <Button asChild variant="outline" size="sm">
                            <Link to={`/producer/events/${selectedMessage.event_id}/panel/messages`}>
                              Abrir mensagens deste evento
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex-1 overflow-y-auto rounded-xl border border-border/70 bg-muted/20 p-3 text-sm leading-relaxed text-foreground">
                      <p className="break-words">{selectedMessage.message}</p>
                    </div>

                    <div className="mt-3 space-y-3 border-t border-border/70 pt-3">
                      <div className="flex justify-end">
                        {isMobile ? (
                          <Drawer open={templatesDrawerOpen} onOpenChange={setTemplatesDrawerOpen}>
                            <DrawerTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8"
                                title="Abrir modelos de resposta"
                              >
                                <span className="flex items-center gap-2">
                                  <Pencil className="h-4 w-4" />
                                  <span className="hidden sm:inline">Modelos</span>
                                </span>
                              </Button>
                            </DrawerTrigger>

                            <DrawerContent className="max-h-[80dvh]">
                              <DrawerHeader className="flex items-start justify-between gap-3">
                                <div>
                                  <DrawerTitle>Modelos de resposta</DrawerTitle>
                                  <p className="text-sm text-muted-foreground">Escolha um modelo para agilizar suas respostas.</p>
                                </div>
                                <DrawerClose asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <X className="h-4 w-4" />
                                  </Button>
                                </DrawerClose>
                              </DrawerHeader>

                              <div className="px-4 pb-6 space-y-4">
                                <div className="space-y-2">
                                  <Select
                                    value={selectedQuickReplyIndex === null ? "" : String(selectedQuickReplyIndex)}
                                    onValueChange={(val) => {
                                      const v = val === "" ? null : Number(val);
                                      setSelectedQuickReplyIndex(v);
                                      if (v !== null) setReplyText(quickReplies[v]);
                                    }}
                                  >
                                    <SelectTrigger className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 shadow-sm focus:ring-ring focus:ring-offset-2">
                                      <SelectValue placeholder="Selecionar modelo..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {quickReplies.map((template, index) => (
                                        <SelectItem
                                          key={index}
                                          value={String(index)}
                                          title={template}
                                          className="border-b border-slate-200 last:border-b-0 px-3 py-2 text-sm text-slate-800 hover:bg-slate-100"
                                        >
                                          {template.length > 80 ? template.slice(0, 80) + "…" : template}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-slate-600 hover:bg-slate-100"
                                      onClick={() => selectedQuickReplyIndex !== null && handleTemplateEdit(selectedQuickReplyIndex)}
                                      disabled={selectedQuickReplyIndex === null}
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>

                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-slate-600 hover:bg-slate-100"
                                      onClick={() => {
                                        if (selectedQuickReplyIndex !== null) {
                                          handleTemplateDelete(selectedQuickReplyIndex);
                                          setSelectedQuickReplyIndex(null);
                                        }
                                      }}
                                      disabled={selectedQuickReplyIndex === null}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>

                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 px-3 text-sm text-slate-800 hover:bg-slate-100"
                                      onClick={() => {
                                        if (selectedQuickReplyIndex !== null) {
                                          setReplyText(quickReplies[selectedQuickReplyIndex]);
                                          setTemplatesDrawerOpen(false);
                                        }
                                      }}
                                      disabled={selectedQuickReplyIndex === null}
                                    >
                                      Usar
                                    </Button>
                                  </div>

                                  <div className="flex gap-2">
                                    <Input
                                      value={templateDraft}
                                      onChange={(e) => setTemplateDraft(e.target.value)}
                                      placeholder="Criar ou editar modelo"
                                      className="h-8 text-xs"
                                    />
                                    <Button type="button" size="sm" className="h-8" onClick={handleTemplateSubmit} disabled={!templateDraft.trim()}>
                                      {editingTemplateIndex !== null ? "Salvar" : "Adicionar"}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </DrawerContent>
                          </Drawer>
                        ) : (
                          <Popover open={templatesDrawerOpen} onOpenChange={setTemplatesDrawerOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8"
                                title="Abrir modelos de resposta"
                              >
                                <span className="flex items-center gap-2">
                                  <Pencil className="h-4 w-4" />
                                  <span className="hidden sm:inline">Modelos</span>
                                </span>
                              </Button>
                            </PopoverTrigger>

                            <PopoverContent className="w-80 max-h-[60vh] overflow-y-auto">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold">Modelos de resposta</p>
                                  <p className="text-xs text-muted-foreground">Escolha um modelo para agilizar suas respostas.</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setTemplatesDrawerOpen(false)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="mt-4 space-y-4">
                                <div className="space-y-2">
                                  <Select
                                    value={selectedQuickReplyIndex === null ? "" : String(selectedQuickReplyIndex)}
                                    onValueChange={(val) => {
                                      const v = val === "" ? null : Number(val);
                                      setSelectedQuickReplyIndex(v);
                                      if (v !== null) setReplyText(quickReplies[v]);
                                    }}
                                  >
                                    <SelectTrigger className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 shadow-sm focus:ring-ring focus:ring-offset-2">
                                      <SelectValue placeholder="Selecionar modelo..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {quickReplies.map((template, index) => (
                                        <SelectItem
                                          key={index}
                                          value={String(index)}
                                          title={template}
                                          className="border-b border-slate-200 last:border-b-0 px-3 py-2 text-sm text-slate-800 hover:bg-slate-100"
                                        >
                                          {template.length > 80 ? template.slice(0, 80) + "…" : template}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-slate-600 hover:bg-slate-100"
                                      onClick={() => selectedQuickReplyIndex !== null && handleTemplateEdit(selectedQuickReplyIndex)}
                                      disabled={selectedQuickReplyIndex === null}
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>

                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-slate-600 hover:bg-slate-100"
                                      onClick={() => {
                                        if (selectedQuickReplyIndex !== null) {
                                          handleTemplateDelete(selectedQuickReplyIndex);
                                          setSelectedQuickReplyIndex(null);
                                        }
                                      }}
                                      disabled={selectedQuickReplyIndex === null}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>

                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 px-3 text-sm text-slate-800 hover:bg-slate-100"
                                      onClick={() => {
                                        if (selectedQuickReplyIndex !== null) {
                                          setReplyText(quickReplies[selectedQuickReplyIndex]);
                                          setTemplatesDrawerOpen(false);
                                        }
                                      }}
                                      disabled={selectedQuickReplyIndex === null}
                                    >
                                      Usar
                                    </Button>
                                  </div>

                                  <div className="flex gap-2">
                                    <Input
                                      value={templateDraft}
                                      onChange={(e) => setTemplateDraft(e.target.value)}
                                      placeholder="Criar ou editar modelo"
                                      className="h-8 text-xs"
                                    />
                                    <Button type="button" size="sm" className="h-8" onClick={handleTemplateSubmit} disabled={!templateDraft.trim()}>
                                      {editingTemplateIndex !== null ? "Salvar" : "Adicionar"}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs">Sua resposta</Label>
                          <Textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Escreva sua resposta..."
                            rows={4}
                            maxLength={2000}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1" onClick={() => setReplyText("")}>Limpar</Button>
                          <Button
                            className="flex-1"
                            onClick={() => replyMutation.mutate()}
                            disabled={!replyText.trim() || replyMutation.isPending}
                          >
                            {replyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Enviar resposta
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
