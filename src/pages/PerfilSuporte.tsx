import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { ArrowLeft, Mail, MessageSquare, ExternalLink } from "lucide-react";

export default function PerfilSuporte() {
  const navigate = useNavigate();

  const options = [
    {
      id: "email",
      icon: Mail,
      label: "E-mail",
      description: "suporte@tickethall.com.br",
      action: () => window.open("mailto:suporte@tickethall.com.br"),
    },
    {
      id: "chat",
      icon: MessageSquare,
      label: "Chat de suporte",
      description: "Fale com nosso assistente",
      action: () => navigate("/"),
    },
    {
      id: "faq",
      icon: ExternalLink,
      label: "Perguntas frequentes",
      description: "Central de ajuda",
      action: () => navigate("/"),
    },
  ];

  return (
    <>
      <SEOHead title="Suporte | TicketHall" description="Central de suporte TicketHall" />

      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4 flex items-center gap-3 md:hidden">
          <button onClick={() => navigate("/meu-perfil")} className="p-1" aria-label="Voltar">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-center flex-1 text-lg font-semibold font-[var(--font-display)]">
            Suporte
          </h1>
          <div className="w-6" />
        </div>

        <div className="max-w-lg mx-auto px-4 py-6 md:py-12 space-y-2">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={opt.action}
                className="flex items-center gap-3 w-full px-4 py-4 rounded-xl hover:bg-muted/50 transition-colors text-left"
              >
                <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
