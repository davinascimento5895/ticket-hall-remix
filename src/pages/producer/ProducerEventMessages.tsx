import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronDown, ChevronUp, Clock, Flame, Loader2, Mail, MailCheck, MailOpen, Search, Send, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createBulkMessage,
  getEventMessageRecipientCount,
  getEventMessages,
  getEventTiersBasic,
  getProducerEventBasic,
  sendBulkMessage,
} from "@/lib/api-producer";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

export default function ProducerEventMessages() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeInboxFilter, setActiveInboxFilter] = useState<"all" | "new" | "urgent" | "answered">("all");
  const [showBroadcastSection, setShowBroadcastSection] = useState(true);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [urgentOverrides, setUrgentOverrides] = useState<Record<string, boolean>>({});
  const [localRepliedIds, setLocalRepliedIds] = useState<Record<string, boolean>>({});

  const { data: event } = useQuery({
    queryKey: ["producer-event", id],
    queryFn: () => getProducerEventBasic(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ["event-tiers-messages", id],
    queryFn: () => getEventTiersBasic(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const { data: broadcasts = [], isLoading: isLoadingBroadcasts } = useQuery({
    queryKey: ["event-broadcast-messages", id],
    queryFn: () => getEventMessages(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const { data: inboxData = { rows: [], schemaFallback: false }, isLoading: isLoadingInbox, error: inboxError } = useQuery({
    queryKey: ["producer-event-inbox", user?.id, id],
    queryFn: async () => {
      const selectWithEventId = "id, producer_id, sender_id, sender_name, sender_email, subject, message, is_read, created_at, event_id, replied_at, is_urgent";
      const baseSelect = "id, producer_id, sender_id, sender_name, sender_email, subject, message, is_read, created_at";

      const { data, error } = await supabase
        .from("producer_messages")
        .select(selectWithEventId)
        .eq("producer_id", user!.id)
        .eq("event_id", id!)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!error) {
        return { rows: data || [], schemaFallback: false };
      }

      const needsFallback = /event_id/i.test(error.message || "");
      if (!needsFallback) throw error;

      const { data: legacyRows, error: legacyError } = await supabase
        .from("producer_messages")
        .select(baseSelect)
        .eq("producer_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (legacyError) throw legacyError;
      return {
        rows: (legacyRows || []).map((row: any) => ({ ...row, event_id: null, replied_at: null, is_urgent: null })),
        schemaFallback: true,
      };
    },
    enabled: !!id && !!user?.id,
    staleTime: 30_000,
  });

  const inboxMessages = useMemo(() => {
    if (!inboxData.schemaFallback) return inboxData.rows;
    // Compatibility mode: without event_id in DB, keep producer visibility instead of showing a false empty state.
    return inboxData.rows;
  }, [inboxData]);

  useRealtimeSubscription({
    table: "producer_messages",
    filter: `producer_id=eq.${user?.id}`,
    queryKey: ["producer-event-inbox", user?.id || "", id || ""],
    enabled: !!user?.id,
  });

  const { data: recipientCount = 0 } = useQuery({
    queryKey: ["recipient-count", id, tierFilter],
    queryFn: () => getEventMessageRecipientCount(id!, tierFilter),
    enabled: !!id,
    staleTime: 30_000,
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
      queryClient.invalidateQueries({ queryKey: ["producer-event-inbox", user?.id, id] });
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
      queryClient.invalidateQueries({ queryKey: ["producer-event-inbox", user?.id, id] });
      setSelectedConversation((prev: any) => (prev?.id === vars.messageId ? { ...prev, is_urgent: vars.value, isUrgent: vars.value } : prev));
      toast({ title: vars.value ? "Marcada como urgente" : "Urgência removida" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao atualizar urgência", description: err.message, variant: "destructive" });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConversation || !user || !replyText.trim()) return;

      const { error: notifErr } = await supabase.from("notifications").insert({
        user_id: selectedConversation.sender_id,
        type: "producer_reply",
        title: `Resposta: ${selectedConversation.subject}`,
        body: replyText.trim(),
        data: {
          producer_id: user.id,
          producer_name: profile?.full_name || "Produtor",
          event_id: id,
          original_message_id: selectedConversation.id,
        },
      });
      if (notifErr) throw notifErr;

      const payload = {
        producer_id: selectedConversation.sender_id,
        sender_id: user.id,
        sender_name: profile?.full_name || "Produtor",
        sender_email: user.email || "",
        event_id: id || null,
        subject: `Re: ${selectedConversation.subject}`,
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
        .eq("id", selectedConversation.id)
        .eq("producer_id", user.id);

      if (updateErr && /replied_at/i.test(updateErr.message || "")) {
        // Legacy schema without replied_at.
        setLocalRepliedIds((prev) => ({ ...prev, [selectedConversation.id]: true }));
      } else if (updateErr) {
        throw updateErr;
      }
    },
    onSuccess: () => {
      toast({ title: "Resposta enviada!" });
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ["producer-event-inbox", user?.id, id] });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const filter = tierFilter !== "all" ? { tier_ids: [tierFilter], status: "active" } : { status: "active" };
      await createBulkMessage({
        event_id: id!,
        producer_id: user!.id,
        subject,
        body,
        recipient_filter: filter,
        recipients_count: recipientCount,
        status: "draft",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-broadcast-messages", id] });
      setSubject("");
      setBody("");
      toast({ title: "Rascunho salvo" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const filter = tierFilter !== "all" ? { tier_ids: [tierFilter], status: "active" } : { status: "active" };
      const msg = await createBulkMessage({
        event_id: id!,
        producer_id: user!.id,
        subject,
        body,
        recipient_filter: filter,
        recipients_count: recipientCount,
        status: "draft",
      });
      await sendBulkMessage(msg.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-broadcast-messages", id] });
      setSubject("");
      setBody("");
      toast({ title: "Mensagem enviada!", description: `Notificação in-app enviada para ${recipientCount} participante(s).` });
    },
    onError: (err: any) => toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" }),
  });

  const conversationsWithMeta = useMemo(() => {
    return inboxMessages.map((msg: any) => {
      const combined = `${msg.subject || ""} ${msg.message || ""}`.toLowerCase();
      const autoUrgent = /(urgente|estorno|erro|cancel|problema|ajuda)/.test(combined);
      const overrideUrgent = urgentOverrides[msg.id];
      const isUrgent = typeof overrideUrgent === "boolean"
        ? overrideUrgent
        : (typeof msg.is_urgent === "boolean" ? msg.is_urgent : autoUrgent);
      const status = (msg.replied_at || localRepliedIds[msg.id]) ? "answered" : (isUrgent ? "urgent" : (!msg.is_read ? "new" : "open"));
      return { ...msg, status, isUrgent };
    });
  }, [inboxMessages, urgentOverrides, localRepliedIds]);

  const filteredConversations = useMemo(() => {
    return conversationsWithMeta.filter((msg: any) => {
      const matchesFilter = activeInboxFilter === "all" || msg.status === activeInboxFilter;
      const matchesSearch = !searchTerm.trim()
        || msg.sender_name?.toLowerCase().includes(searchTerm.toLowerCase())
        || msg.subject?.toLowerCase().includes(searchTerm.toLowerCase())
        || msg.message?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [conversationsWithMeta, activeInboxFilter, searchTerm]);

  useEffect(() => {
    if (!filteredConversations.length) {
      setSelectedConversation(null);
      return;
    }

    if (!selectedConversation) {
      setSelectedConversation(filteredConversations[0]);
      return;
    }

    const stillVisible = filteredConversations.some((msg: any) => msg.id === selectedConversation.id);
    if (!stillVisible) {
      setSelectedConversation(filteredConversations[0]);
    }
  }, [filteredConversations, selectedConversation]);

  const inboxCounts = useMemo(() => {
    const all = conversationsWithMeta.length;
    const newCount = conversationsWithMeta.filter((msg: any) => msg.status === "new").length;
    const urgentCount = conversationsWithMeta.filter((msg: any) => msg.status === "urgent").length;
    const answeredCount = conversationsWithMeta.filter((msg: any) => msg.status === "answered").length;
    return { all, newCount, urgentCount, answeredCount };
  }, [conversationsWithMeta]);

  const inboxUnreadCount = conversationsWithMeta.filter((msg: any) => !msg.is_read).length;

  const openConversation = (conversation: any) => {
    setSelectedConversation(conversation);
    if (!conversation.is_read) {
      markAsRead.mutate(conversation.id);
    }
  };

  const statusLabel = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      draft: { label: "Rascunho", variant: "secondary" },
      sending: { label: "Enviando", variant: "default" },
      sent: { label: "Enviado", variant: "outline" },
      failed: { label: "Falhou", variant: "destructive" },
    };
    const item = map[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={item.variant}>{item.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Eventos &gt; {event?.title || "Evento"} &gt; Mensagens</p>
            <h2 className="font-display text-xl font-semibold text-foreground">Inbox do evento</h2>
            <p className="text-xs text-muted-foreground">
              Apenas conversas diretas deste evento.
              {inboxUnreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">{inboxUnreadCount} não lida{inboxUnreadCount > 1 ? "s" : ""}</Badge>
              )}
            </p>
            {inboxError && (
              <p className="mt-2 text-xs text-destructive">Erro ao carregar mensagens: {(inboxError as Error).message}</p>
            )}
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/producer/inbox">Ir para Inbox Consolidada</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader className="space-y-3">
            <CardTitle className="text-base">Conversas do evento</CardTitle>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "all", label: "Todas", count: inboxCounts.all },
                { key: "new", label: "Não lidas", count: inboxCounts.newCount },
                { key: "urgent", label: "Urgentes", count: inboxCounts.urgentCount },
                { key: "answered", label: "Respondidas", count: inboxCounts.answeredCount },
              ].map((item) => (
                <Button
                  key={item.key}
                  type="button"
                  size="sm"
                  variant={activeInboxFilter === item.key ? "default" : "outline"}
                  onClick={() => setActiveInboxFilter(item.key as typeof activeInboxFilter)}
                  className="justify-between"
                >
                  <span>{item.label}</span>
                  <Badge variant="secondary" className="text-[10px]">{item.count}</Badge>
                </Button>
              ))}
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar conversa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingInbox ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : !filteredConversations.length ? (
              <p className="text-sm text-muted-foreground">Sem conversas para os filtros atuais.</p>
            ) : (
              <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                {filteredConversations.map((msg: any) => {
                  const isSelected = selectedConversation?.id === msg.id;
                  return (
                    <button
                      key={msg.id}
                      onClick={() => openConversation(msg)}
                      className={`w-full rounded-lg border p-3 text-left transition-all ${
                        isSelected
                          ? "border-primary/40 bg-primary/10"
                          : "border-border bg-card hover:border-primary/20 hover:bg-muted/30"
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
                      <div className="mt-2 flex items-center gap-1.5">
                        {msg.isUrgent && <Badge variant="destructive" className="text-[10px]">Urgente</Badge>}
                        {msg.status === "new" && <Badge className="text-[10px]">Novo</Badge>}
                        {msg.status === "answered" && <Badge variant="secondary" className="text-[10px]">Respondido</Badge>}
                        {!msg.is_read ? <Mail className="h-3.5 w-3.5 text-primary" /> : <MailCheck className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalhes da conversa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedConversation ? (
              <p className="text-sm text-muted-foreground">Selecione uma conversa para ver detalhes e responder.</p>
            ) : (
              <>
                <div className="space-y-2 rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{selectedConversation.subject}</p>
                    {!selectedConversation.is_read ? <Badge>Novo</Badge> : (selectedConversation.replied_at ? <Badge variant="secondary">Respondido</Badge> : <Badge variant="secondary">Lido</Badge>)}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span>{selectedConversation.sender_name}</span>
                    <span>•</span>
                    <span>{selectedConversation.sender_email}</span>
                    <span>•</span>
                    <Clock className="h-3.5 w-3.5" />
                    <span>{new Date(selectedConversation.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</span>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-foreground">
                  {selectedConversation.message}
                </div>

                <div className="space-y-2 rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-foreground">Dados da compra</p>
                  <p className="text-xs text-muted-foreground">
                    Contexto rápido do atendimento deste evento. Para detalhes completos do pedido, acesse a aba Pedidos.
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/producer/events/${id}/panel/orders`}>Abrir pedidos do evento</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedConversation.isUrgent ? "destructive" : "outline"}
                    onClick={() => toggleUrgency.mutate({ messageId: selectedConversation.id, value: !selectedConversation.isUrgent })}
                    disabled={toggleUrgency.isPending}
                  >
                    <Flame className="mr-1 h-3.5 w-3.5" />
                    {selectedConversation.isUrgent ? "Remover urgência" : "Marcar urgente"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Sua resposta</Label>
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escreva sua resposta..."
                    rows={4}
                    maxLength={2000}
                  />
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
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Comunicados do evento</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Envios em massa (não são conversas diretas).</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowBroadcastSection((prev) => !prev)}
            >
              {showBroadcastSection ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showBroadcastSection ? "Recolher" : "Expandir"}
            </Button>
          </div>
        </CardHeader>

        {showBroadcastSection && (
          <CardContent className="space-y-6">
            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Comunicados são enviados como notificações in-app para participantes desse evento.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Destinatários</Label>
                  <Select value={tierFilter} onValueChange={setTierFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os participantes</SelectItem>
                      {tiers.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">{recipientCount} destinatário(s)</p>
                </div>
                <div>
                  <Label>Assunto</Label>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Assunto do comunicado" />
                </div>
              </div>
              <div>
                <Label>Corpo da mensagem</Label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Escreva sua mensagem aqui..." rows={6} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => saveDraftMutation.mutate()} disabled={!subject || !body || saveDraftMutation.isPending}>
                  Salvar rascunho
                </Button>
                <Button onClick={() => sendMutation.mutate()} disabled={!subject || !body || sendMutation.isPending || recipientCount === 0}>
                  <Send className="mr-1 h-4 w-4" /> Enviar para {recipientCount} participante(s)
                </Button>
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-display font-semibold text-foreground">Histórico de comunicados</h3>
              {isLoadingBroadcasts ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : broadcasts.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    <MailOpen className="mx-auto mb-2 h-8 w-8 opacity-50" />Nenhum comunicado enviado.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {broadcasts.map((msg: any) => (
                    <Card key={msg.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">{msg.subject}</p>
                            <p className="line-clamp-1 text-xs text-muted-foreground">{msg.body}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {msg.recipients_count} destinatário(s) · {new Date(msg.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                            </p>
                          </div>
                          {statusLabel(msg.status)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
