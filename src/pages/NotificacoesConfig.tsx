import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, Smartphone, MessageSquare, CheckCircle2, Circle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getNotifications } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotifPref {
  id: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
  sms: boolean;
}

const defaultPrefs: NotifPref[] = [
  { id: "purchase", label: "Confirmação de compra", description: "Receba quando sua compra for confirmada", email: true, push: true, sms: false },
  { id: "reminder", label: "Lembrete de evento", description: "24h e 1h antes do evento começar", email: true, push: true, sms: true },
  { id: "promo", label: "Promoções e novidades", description: "Descontos e eventos recomendados", email: true, push: false, sms: false },
  { id: "transfer", label: "Transferência de ingresso", description: "Quando alguém transferir um ingresso para você", email: true, push: true, sms: false },
  { id: "refund", label: "Reembolso", description: "Atualizações sobre solicitações de reembolso", email: true, push: true, sms: false },
];

export default function NotificacoesConfig() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [prefs, setPrefs] = useState(defaultPrefs);
  const [loadedPrefs, setLoadedPrefs] = useState(false);
  const [prefsAvailable, setPrefsAvailable] = useState(true);

  const { data: notifications = [], isLoading: loadingNotifications } = useQuery({
    queryKey: ["notifications-page", user?.id],
    queryFn: () => getNotifications(user!.id, 50),
    enabled: !!user?.id,
    refetchInterval: 30_000,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-page", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
      toast({ title: "Todas as notificações foram marcadas como lidas" });
    },
    onError: () => {
      toast({ title: "Erro ao marcar notificações", variant: "destructive" });
    },
  });

  const markOneRead = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-page", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  // Load preferences from DB on mount
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data, error } = await supabase
        .from("notification_preferences" as any)
        .select("category, email, push, sms")
        .eq("user_id", user.id);

      if (error) {
        // Some environments may not have notification_preferences migrated yet.
        // In that case, keep inbox functional and hide channel preferences.
        setPrefsAvailable(false);
        setLoadedPrefs(true);
        return;
      }

      if (data && (data as any[]).length > 0) {
        const dbMap = new Map((data as any[]).map((r: any) => [r.category, r]));
        setPrefs((prev) =>
          prev.map((p) => {
            const row = dbMap.get(p.id);
            return row ? { ...p, email: row.email, push: row.push, sms: row.sms } : p;
          })
        );
      }
      setLoadedPrefs(true);
    })();
  }, [user?.id]);

  const persistPref = useCallback(async (category: string, channel: "email" | "push" | "sms", value: boolean) => {
    if (!user?.id) return;
    if (!prefsAvailable) {
      toast({ title: "Preferências indisponíveis neste ambiente", variant: "destructive" });
      return;
    }
    const pref = prefs.find((p) => p.id === category);
    if (!pref) return;
    const row = { user_id: user.id, category, email: pref.email, push: pref.push, sms: pref.sms, [channel]: value };
    const { error } = await supabase
      .from("notification_preferences" as any)
      .upsert(row as any, { onConflict: "user_id,category" });
    if (error) {
      toast({ title: "Erro ao salvar preferência", variant: "destructive" });
    }
  }, [user?.id, prefs, prefsAvailable]);

  const toggle = (id: string, channel: "email" | "push" | "sms") => {
    const pref = prefs.find((p) => p.id === id);
    if (!pref) return;
    const newValue = !pref[channel];
    setPrefs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [channel]: newValue } : p))
    );
    persistPref(id, channel, newValue);
    toast({ title: "Preferência atualizada" });
  };

  const unreadCount = useMemo(
    () => notifications.filter((notification: any) => !notification.is_read).length,
    [notifications]
  );

  const getActionForNotification = (notification: any) => {
    const data = (notification?.data ?? {}) as Record<string, any>;
    if (data.order_id) {
      return { label: "Ver pedido", onClick: () => navigate(`/pedido/${data.order_id}`) };
    }
    if (data.event_slug) {
      return { label: "Ver evento", onClick: () => navigate(`/eventos/${data.event_slug}`) };
    }
    if (String(notification?.type || "").includes("ticket")) {
      return { label: "Ver ingressos", onClick: () => navigate("/meus-ingressos") };
    }
    return { label: "Abrir conta", onClick: () => navigate("/meu-perfil") };
  };

  return (
    <>
      <SEOHead title="Notificações" description="Configure suas preferências de notificação." />

      <div className="container pt-24 pb-16 max-w-4xl space-y-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-primary" />
            <div>
              <h1 className="font-display text-2xl font-bold">Notificações</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {unreadCount > 0 ? `${unreadCount} não lidas` : "Você está em dia"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => markAllRead.mutate()}
            disabled={unreadCount === 0 || markAllRead.isPending}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" /> Marcar todas como lidas
          </Button>
        </div>

        {/* Inbox */}
        <section className="space-y-3">
          {loadingNotifications ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : notifications.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                Nenhuma notificação por enquanto.
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification: any) => {
              const action = getActionForNotification(notification);
              const isUnread = !notification.is_read;
              return (
                <Card
                  key={notification.id}
                  className={cn(
                    "border-border bg-card transition-colors",
                    isUnread && "bg-primary/5 border-primary/30"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isUnread ? (
                            <Circle className="h-3 w-3 fill-primary text-primary" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <p className="text-sm font-semibold text-foreground truncate">
                            {notification.title || "Atualização da sua conta"}
                          </p>
                        </div>
                        {notification.body && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{notification.body}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isUnread && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markOneRead.mutate(notification.id)}
                          >
                            Marcar lida
                          </Button>
                        )}
                        <Button size="sm" onClick={action.onClick}>{action.label}</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </section>

        {/* Preferences */}
        {!loadedPrefs ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : !prefsAvailable ? (
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-sm text-muted-foreground">
              Preferências de canal indisponíveis neste ambiente. Suas notificações continuam funcionando normalmente.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-6 mb-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</span>
              <span className="flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5" /> Push</span>
              <span className="flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> SMS</span>
            </div>
            {prefs.map((pref) => (
              <Card key={pref.id} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{pref.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{pref.description}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex flex-col items-center gap-1">
                        <Switch checked={pref.email} onCheckedChange={() => toggle(pref.id, "email")} />
                        <span className="text-[9px] text-muted-foreground">Email</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Switch checked={pref.push} onCheckedChange={() => toggle(pref.id, "push")} />
                        <span className="text-[9px] text-muted-foreground">Push</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Switch checked={pref.sms} onCheckedChange={() => toggle(pref.id, "sms")} />
                        <span className="text-[9px] text-muted-foreground">SMS</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
