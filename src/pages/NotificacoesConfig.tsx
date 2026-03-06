import { useState, useEffect, useCallback } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, Smartphone, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
  const [prefs, setPrefs] = useState(defaultPrefs);
  const [loaded, setLoaded] = useState(false);

  // Load preferences from DB on mount
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setPrefs((prev) =>
            prev.map((p) => {
              const saved = data.find((d: any) => d.notification_type === p.id);
              if (saved) {
                return { ...p, email: saved.email ?? p.email, push: saved.push ?? p.push, sms: saved.sms ?? p.sms };
              }
              return p;
            })
          );
        }
        setLoaded(true);
      });
  }, [user?.id]);

  const persistPref = useCallback(async (id: string, channel: "email" | "push" | "sms", value: boolean) => {
    if (!user?.id) return;
    const { error } = await supabase
      .from("notification_preferences")
      .upsert(
        { user_id: user.id, notification_type: id, [channel]: value },
        { onConflict: "user_id,notification_type" }
      );
    if (error) {
      toast.error("Erro ao salvar preferência");
      console.error("notification_preferences upsert error:", error);
    }
  }, [user?.id]);

  const toggle = (id: string, channel: "email" | "push" | "sms") => {
    const pref = prefs.find((p) => p.id === id);
    if (!pref) return;
    const newValue = !pref[channel];
    setPrefs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [channel]: newValue } : p))
    );
    persistPref(id, channel, newValue);
    toast.success("Preferência atualizada");
  };

  return (
    <>
      <SEOHead title="Notificações" description="Configure suas preferências de notificação." />

      <div className="container pt-24 pb-16 max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold">Notificações</h1>
        </div>

        {/* Channel legend */}
        <div className="flex items-center gap-6 mb-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</span>
          <span className="flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5" /> Push</span>
          <span className="flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> SMS</span>
        </div>

        <div className="space-y-3">
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
      </div>

    </>
  );
}
