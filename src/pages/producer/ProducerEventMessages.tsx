import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
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
    queryFn: async () => {
      const { data } = await supabase.from("events").select("title").eq("id", id).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ["event-tiers-messages", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("ticket_tiers").select("id, name").eq("event_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["event-messages", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bulk_messages")
        .select("*")
        .eq("event_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Count recipients
  const { data: recipientCount = 0 } = useQuery({
    queryKey: ["recipient-count", id, tierFilter],
    queryFn: async () => {
      let query = supabase.from("tickets").select("attendee_email", { count: "exact", head: true }).eq("event_id", id!).eq("status", "active");
      if (tierFilter !== "all") query = query.eq("tier_id", tierFilter);
      const { count, error } = await query;
      if (error) return 0;
      return count || 0;
    },
    enabled: !!id,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const filter = tierFilter !== "all" ? { tier_ids: [tierFilter], status: "active" } : { status: "active" };
      const { error } = await supabase.from("bulk_messages").insert({
        event_id: id!,
        producer_id: user!.id,
        subject,
        body,
        recipient_filter: filter,
        recipients_count: recipientCount,
        status: "draft",
      });
      if (error) throw error;
      // BULK_MESSAGE_INTEGRATION_POINT — trigger edge function to send emails
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-messages"] });
      setSubject("");
      setBody("");
      toast({ title: "Mensagem salva como rascunho" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
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
            <Button onClick={() => sendMutation.mutate()} disabled={!subject || !body || sendMutation.isPending}>
              <Send className="h-4 w-4 mr-1" /> Salvar rascunho
            </Button>
            <p className="text-xs text-muted-foreground self-center">BULK_MESSAGE_INTEGRATION_POINT — O envio será processado por função em segundo plano.</p>
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
