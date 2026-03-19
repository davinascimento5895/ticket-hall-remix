import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Inbox, Mail, MailOpen, Clock, User, Send, Loader2, Search, AlertTriangle, CheckCircle2, Archive, Funnel } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { toast } from "@/hooks/use-toast";

export default function ProducerInbox() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "new" | "urgent" | "answered">("all");
  const [activeEventFilter, setActiveEventFilter] = useState<string>("all");

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["producer-inbox", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("producer_messages")
        .select("*, event:events!producer_messages_event_id_fkey(id, title, slug)")
        .eq("producer_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  // Realtime: auto-refresh when new messages arrive
  useRealtimeSubscription({
    table: "producer_messages",
    filter: `producer_id=eq.${user?.id}`,
    queryKey: ["producer-inbox", user?.id || ""],
    enabled: !!user?.id,
  });

  const markAsRead = useMutation({
    mutationFn: async (messageId: string) => {
      await supabase
        .from("producer_messages")
        .update({ is_read: true })
        .eq("id", messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producer-inbox"] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMessage || !user || !replyText.trim()) return;
      // Send a notification to the buyer
      const { error: notifErr } = await supabase.from("notifications").insert({
        user_id: selectedMessage.sender_id,
        type: "producer_reply",
        title: `Resposta: ${selectedMessage.subject}`,
        body: replyText.trim(),
        data: { producer_id: user.id, producer_name: profile?.full_name || "Produtor", original_message_id: selectedMessage.id },
      });
      if (notifErr) throw notifErr;
      // Also send as a producer_message back (with sender/producer swapped)
      const { error: msgErr } = await supabase.from("producer_messages").insert({
        producer_id: selectedMessage.sender_id,
        sender_id: user.id,
        sender_name: profile?.full_name || "Produtor",
        sender_email: user.email || "",
        event_id: selectedMessage.event_id || null,
        subject: `Re: ${selectedMessage.subject}`,
        message: replyText.trim(),
      });
      if (msgErr) throw msgErr;
    },
    onSuccess: () => {
      toast({ title: "Resposta enviada!" });
      setReplyText("");
      setShowReply(false);
    },
    onError: (err: any) => toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" }),
  });

  const handleOpen = (msg: any) => {
    setSelectedMessage(msg);
    setShowReply(true);
    setReplyText("");
    if (!msg.is_read) {
      markAsRead.mutate(msg.id);
    }
  };

  const unreadCount = messages.filter((m: any) => !m.is_read).length;

  const messagesWithMeta = useMemo(() => {
    return messages.map((msg: any) => {
      const combined = `${msg.subject || ""} ${msg.message || ""}`.toLowerCase();
      const isUrgent = /(urgente|estorno|erro|cancel|problema|ajuda)/.test(combined);
      const status = isUrgent ? "urgent" : (!msg.is_read ? "new" : "answered");

      return {
        ...msg,
        status,
      };
    });
  }, [messages]);

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

  const quickReplies = [
    "Obrigado pela mensagem. Vou validar com o time e retorno ainda hoje.",
    "Recebemos sua solicitação. Nosso suporte responde em até 2 horas úteis.",
    "Perfeito, conseguimos ajudar com isso. Me confirme seu número do pedido para avançarmos.",
  ];

  const selectedMessageStatus = selectedMessage?.status as "new" | "urgent" | "answered" | undefined;

  return (
    <>
      <SEOHead title="Mensagens — Produtor" />
      <div className="space-y-5">
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm md:p-5">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Mensagens consolidadas</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Triagem operacional unificada de todos os seus eventos, com filtros por status e por evento.
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">{unreadCount} não lida{unreadCount > 1 ? "s" : ""}</Badge>
              )}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-12 w-12" />}
            title="Nenhuma mensagem"
            description="Quando compradores enviarem mensagens pelo seu perfil, elas aparecerão aqui."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[220px_360px_minmax(0,1fr)]">
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
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      <Badge variant="outline" className="text-[10px]">{item.count}</Badge>
                    </button>
                  );
                })}

                <div className="rounded-lg border border-border/70 bg-muted/20 p-2 text-xs text-muted-foreground">
                  Priorize mensagens urgentes para manter SLA de atendimento e reputação da operação.
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardContent className="space-y-3 p-3">
                {!!eventFilters.length && (
                  <div className="space-y-2">
                    <p className="flex items-center gap-1.5 px-1 text-xs uppercase tracking-wide text-muted-foreground">
                      <Funnel className="h-3.5 w-3.5" />
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
                          className="h-7 rounded-full px-3 text-xs"
                        >
                          {eventFilter.label} ({eventFilter.count})
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

                        <p className="mt-1 truncate text-xs text-muted-foreground">{msg.message}</p>

                        <div className="mt-2 flex items-center gap-1.5">
                          <Badge variant="outline" className="max-w-[180px] truncate text-[10px]">
                            {msg.event?.title || "Sem evento"}
                          </Badge>
                          {msg.status === "urgent" && <Badge variant="destructive" className="text-[10px]">Urgente</Badge>}
                          {msg.status === "new" && <Badge variant="default" className="text-[10px]">Novo</Badge>}
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
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-display text-lg font-semibold text-foreground">{selectedMessage.subject}</p>
                        <div className="flex items-center gap-1">
                          {selectedMessageStatus === "urgent" && <Badge variant="destructive">Urgente</Badge>}
                          {selectedMessageStatus === "new" && <Badge>Novo</Badge>}
                          {selectedMessageStatus === "answered" && <Badge variant="secondary">Respondido</Badge>}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        {selectedMessage.sender_name}
                        <span>•</span>
                        {selectedMessage.sender_email}
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
                      {!!selectedMessage.event_id && (
                        <div className="mt-2">
                          <Button asChild variant="outline" size="sm">
                            <Link to={`/producer/events/${selectedMessage.event_id}/panel/messages`}>
                              Abrir mensagens deste evento
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex-1 overflow-y-auto rounded-xl border border-border/70 bg-muted/20 p-3 text-sm leading-relaxed text-foreground">
                      {selectedMessage.message}
                    </div>

                    <div className="mt-3 space-y-2 border-t border-border/70 pt-3">
                      <div className="flex flex-wrap gap-2">
                        {quickReplies.map((template, index) => (
                          <Button
                            key={index}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setReplyText(template)}
                            className="text-xs"
                          >
                            Modelo {index + 1}
                          </Button>
                        ))}
                      </div>

                      {showReply && (
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
                      )}
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
