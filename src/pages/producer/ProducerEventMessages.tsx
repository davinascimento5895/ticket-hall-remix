import { useState } from "react";
import { useParams } from "react-router-dom";
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
        status: "pending",
      });

      await sendBulkMessage(msg.id);
      // Nota: o envio real de e-mails está em desenvolvimento.
      // A mensagem será salva como "queued" para processamento futuro.
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-messages"] });
      setSubject("");
      setBody("");
      toast({ title: "Mensagem salva", description: "🚧 O envio de e-mails em massa será disponibilizado em breve. A mensagem foi salva como rascunho." });
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
      <div>
        <Link to="/producer/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <h1 className="font-display text-2xl font-bold">Mensagens — {event?.title || "..."}</h1>
      </div>

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
            <Button onClick={() => sendMutation.mutate()} disabled={!subject || !body || sendMutation.isPending || saveDraftMutation.isPending}>
              <Send className="h-4 w-4 mr-1" /> Enviar mensagem
            </Button>
            <Button variant="outline" onClick={() => saveDraftMutation.mutate()} disabled={!subject || !body || saveDraftMutation.isPending || sendMutation.isPending}>
              Salvar rascunho
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
                        {msg.recipients_count} destinatário(s) · {new Date(msg.created_at).toLocaleString("pt-BR")}
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
