import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Inbox, Mail, MailOpen, Clock, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

export default function ProducerInbox() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["producer-inbox", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("producer_messages")
        .select("*")
        .eq("producer_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
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

  const handleOpen = (msg: any) => {
    setSelectedMessage(msg);
    if (!msg.is_read) {
      markAsRead.mutate(msg.id);
    }
  };

  const unreadCount = messages.filter((m: any) => !m.is_read).length;

  return (
    <>
      <SEOHead title="Mensagens — Produtor" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Mensagens</h1>
            <p className="text-sm text-muted-foreground">
              Mensagens recebidas dos compradores
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
          <div className="space-y-2">
            {messages.map((msg: any) => (
              <button
                key={msg.id}
                onClick={() => handleOpen(msg)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  msg.is_read
                    ? "border-border bg-card hover:bg-accent/50"
                    : "border-primary/30 bg-primary/5 hover:bg-primary/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {msg.is_read ? (
                      <MailOpen className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Mail className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium truncate ${msg.is_read ? "text-foreground" : "text-foreground font-semibold"}`}>
                        {msg.sender_name}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${msg.is_read ? "text-muted-foreground" : "text-foreground"}`}>
                      {msg.subject}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {msg.message}
                    </p>
                  </div>
                  {!msg.is_read && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Message detail dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedMessage && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-display">{selectedMessage.subject}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedMessage.sender_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedMessage.sender_email}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(selectedMessage.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                <div className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                  {selectedMessage.message}
                </div>

                <div className="flex gap-3 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      window.location.href = `mailto:${selectedMessage.sender_email}?subject=Re: ${selectedMessage.subject}`;
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Responder por e-mail
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
