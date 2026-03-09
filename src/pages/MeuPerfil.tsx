import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import {
  Pencil,
  Lock,
  MapPin,
  CreditCard,
  Bell,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface MenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
  href: string;
}

export default function MeuPerfil() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    toast.success("Você saiu da sua conta");
    navigate("/");
  };

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "?";

  const displayName = profile?.full_name || user?.email || "Usuário";
  const displayPhone = profile?.phone || user?.email || "";

  const menuItems: MenuItem[] = [
    { id: "password", icon: Lock, label: "Alterar senha", href: "/meu-perfil/alterar-senha" },
    { id: "city", icon: MapPin, label: "Cidade", href: "/meu-perfil/cidade" },
    { id: "payment", icon: CreditCard, label: "Métodos de pagamento", href: "/meu-perfil/pagamento" },
    { id: "notifications", icon: Bell, label: "Notificações", href: "/meu-perfil/notificacoes" },
    { id: "support", icon: HelpCircle, label: "Suporte", href: "/meu-perfil/suporte" },
  ];

  return (
    <>
      <SEOHead title="Meu Perfil | TicketHall" description="Gerencie seu perfil no TicketHall" />

      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4 md:hidden">
          <h1 className="text-center text-lg font-semibold font-[var(--font-display)]">
            Meu Perfil
          </h1>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block pt-8 pb-4 max-w-lg mx-auto px-4">
          <h1 className="text-2xl font-bold text-foreground font-[var(--font-display)]">
            Meu Perfil
          </h1>
        </div>

        <div className="max-w-lg mx-auto px-4 py-6 md:py-4 space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-border">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-muted text-muted-foreground text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">
                {displayName}
              </h2>
              <p className="text-sm text-muted-foreground truncate">
                {displayPhone}
              </p>
            </div>
            <button
              onClick={() => navigate("/meu-perfil/editar")}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-muted hover:bg-muted/80 transition-colors active:scale-95"
              aria-label="Editar perfil"
            >
              <Pencil className="h-4 w-4 text-foreground" />
            </button>
          </div>

          <Separator />

          {/* Menu Items */}
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.href)}
                  className="flex items-center gap-3 w-full px-3 py-4 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors text-left active:scale-[0.98]"
                >
                  <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 text-sm font-medium text-foreground">
                    {item.label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })}

            {/* Dark Theme Toggle — uses same animated circular transition as Navbar */}
            <div className="flex items-center gap-3 w-full px-3 py-2 rounded-xl">
              <span className="flex-1 text-sm font-medium text-foreground pl-8">
                Modo escuro
              </span>
              <AnimatedThemeToggler className="h-10 w-10" />
            </div>
          </div>

          <Separator />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full py-3 text-center text-destructive font-medium text-sm hover:underline active:opacity-70 transition-all"
          >
            Sair da conta
          </button>
        </div>
      </div>
    </>
  );
}
