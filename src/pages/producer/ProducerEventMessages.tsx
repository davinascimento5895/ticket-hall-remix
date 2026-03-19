import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Mail, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getProducerEventBasic,
  getEventTiersBasic,
  getEventMessages,
  getEventMessageRecipientCount,
  createBulkMessage,
  updateBulkMessageStatus,
  sendBulkMessage,
} from "@/lib/api-producer";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function ProducerEventMessages() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [tierFilter, setTierFilter] = useState("all");

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

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["event-messages", id],
    queryFn: () => getEventMessages(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  // Count recipients
  const { data: recipientCount = 0 } = useQuery({
    queryKey: ["recipient-count", id, tierFilter],
    queryFn: () => getEventMessageRecipientCount(id!, tierFilter),
    enabled: !!id,
    staleTime: 30_000,
  });

  const { data: inboxPreview = [] } = useQuery({
    queryKey: ["producer-inbox-preview", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("producer_messages")
        .select("id, sender_name, subject, message, is_read, created_at")
        .eq("producer_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const inboxUnreadCount = inboxPreview.filter((msg: any) => !msg.is_read).length;

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
      queryClient.invalidateQueries({ queryKey: ["event-messages"] });
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
      queryClient.invalidateQueries({ queryKey: ["event-messages"] });
      setSubject("");
      setBody("");
      toast({ title: "Mensagem enviada!", description: `Notificação in-app enviada para ${recipientCount} participante(s).` });
    },
    onError: (err: any) => toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" }),
  });

  const statusLabel = (s: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      draft: { label: "Rascunho", variant: "secondary" },
      sending: { label: "Enviando", variant: "default" },
      sent: { label: "Enviado", variant: "outline" },
      failed: { label: "Falhou", variant: "destructive" },
    };
    const m = map[s] || { label: s, variant: "secondary" as const };
    return <Badge variant={m.variant}>{m.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
        <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          As mensagens são enviadas como notificações in-app para os participantes. Eles receberão a notificação ao acessar a plataforma.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mensagens recebidas de compradores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Dúvidas enviadas pelo botão "Falar com produtor" entram na Caixa de Entrada do produtor, não no histórico de disparos em massa abaixo.
          </p>

          {inboxPreview.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma mensagem recebida recentemente.</p>
          ) : (
            <div className="space-y-2">
              {inboxPreview.map((msg: any) => (
                <div key={msg.id} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{msg.sender_name}</p>
                    {!msg.is_read && <Badge variant="default">Novo</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{msg.subject}</p>
                  <p className="text-xs text-muted-foreground truncate mt-1">{msg.message}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {inboxUnreadCount > 0 ? `${inboxUnreadCount} não lida(s) na sua caixa de entrada.` : "Sem mensagens não lidas no momento."}
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/producer/inbox">Abrir caixa de entrada</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Compose */}
      <Card>
        <CardHeader><CardTitle className="text-base">Nova mensagem</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <p className="text-xs text-muted-foreground mt-1">{recipientCount} destinatário(s)</p>
            </div>
            <div>
              <Label>Assunto</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Assunto do e-mail" />
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
              <Send className="h-4 w-4 mr-1" /> Enviar para {recipientCount} participante(s)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <div>
        <h3 className="font-display font-semibold text-foreground mb-3">Histórico</h3>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : messages.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground"><Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />Nenhuma mensagem enviada.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {messages.map((msg: any) => (
              <Card key={msg.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{msg.subject}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{msg.body}</p>
                      <p className="text-xs text-muted-foreground mt-1">
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
    </div>
  );
}
