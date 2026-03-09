import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Pencil,
  Lock,
  MapPin,
  CreditCard,
  Bell,
  HelpCircle,
  Moon,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

interface MenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
  href?: string;
  action?: () => void;
  trailing?: React.ReactNode;
}

export default function MeuPerfil() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [isDark, setIsDark] = useState(theme === "dark");

  const handleThemeToggle = (checked: boolean) => {
    setIsDark(checked);
    setTheme(checked ? "dark" : "light");
  };

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
    {
      id: "password",
      icon: Lock,
      label: "Alterar senha",
      href: "/meu-perfil/alterar-senha",
    },
    {
      id: "city",
      icon: MapPin,
      label: "Cidade",
      href: "/meu-perfil/cidade",
    },
    {
      id: "payment",
      icon: CreditCard,
      label: "Métodos de pagamento",
      href: "/meu-perfil/pagamento",
    },
    {
      id: "notifications",
      icon: Bell,
      label: "Notificações",
      href: "/meu-perfil/notificacoes",
    },
    {
      id: "support",
      icon: HelpCircle,
      label: "Suporte",
      href: "/meu-perfil/suporte",
    },
  ];

  return (
    <>
      <SEOHead
        title="Meu Perfil | TicketHall"
        description="Gerencie seu perfil no TicketHall"
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4 md:hidden">
          <h1 className="text-center text-lg font-semibold font-[var(--font-display)]">
            Meu Perfil
          </h1>
        </div>

        <div className="max-w-lg mx-auto px-4 py-6 md:py-12 space-y-6">
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
              className="flex items-center justify-center w-10 h-10 rounded-full bg-muted hover:bg-muted/80 transition-colors"
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
                  onClick={() => item.href && navigate(item.href)}
                  className="flex items-center gap-3 w-full px-3 py-4 rounded-xl hover:bg-muted/50 transition-colors text-left"
                >
                  <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 text-sm font-medium text-foreground">
                    {item.label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })}

            {/* Dark Theme Toggle */}
            <div className="flex items-center gap-3 w-full px-3 py-4 rounded-xl">
              <Moon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span className="flex-1 text-sm font-medium text-foreground">
                Modo escuro
              </span>
              <Switch
                checked={isDark}
                onCheckedChange={handleThemeToggle}
              />
            </div>
          </div>

          <Separator />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full py-3 text-center text-destructive font-medium text-sm hover:underline transition-colors"
          >
            Sair da conta
          </button>
        </div>
      </div>
    </>
  );
}
