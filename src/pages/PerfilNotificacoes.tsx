import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";

interface NotifToggle {
  id: string;
  label: string;
  enabled: boolean;
}

export default function PerfilNotificacoes() {
  const navigate = useNavigate();
  const [toggles, setToggles] = useState<NotifToggle[]>([
    { id: "sms", label: "Receber notificações por SMS", enabled: false },
    { id: "push", label: "Receber notificações push", enabled: true },
    { id: "email", label: "Receber newsletter por e-mail", enabled: false },
  ]);

  const handleToggle = (id: string, checked: boolean) => {
    setToggles((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: checked } : t))
    );
  };

  return (
    <>
      <SEOHead title="Notificações | TicketHall" description="Configure suas notificações" />

      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4 flex items-center gap-3 md:hidden">
          <button onClick={() => navigate("/meu-perfil")} className="p-1" aria-label="Voltar">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-center flex-1 text-lg font-semibold font-[var(--font-display)]">
            Notificações
          </h1>
          <div className="w-6" />
        </div>

        <div className="max-w-lg mx-auto px-4 py-6 md:py-12 space-y-2">
          {toggles.map((toggle) => (
            <div
              key={toggle.id}
              className="flex items-center justify-between px-3 py-4 rounded-xl"
            >
              <span className="text-sm font-medium text-foreground">
                {toggle.label}
              </span>
              <Switch
                checked={toggle.enabled}
                onCheckedChange={(checked) => handleToggle(toggle.id, checked)}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
