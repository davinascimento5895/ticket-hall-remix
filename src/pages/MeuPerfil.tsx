import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { BecomeProducerModal } from "@/components/BecomeProducerModal";
import { Button } from "@/components/ui/button";
import { getMyOrders, getMyTickets } from "@/lib/api";
import {
  Pencil,
  Lock,
  CreditCard,
  Bell,
  HelpCircle,
  ChevronRight,
  Briefcase,
  CheckCircle2,
  Heart,
  CalendarDays,
  FileText,
  Ticket,
  Clock3,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface MenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
  href: string;
}

export default function MeuPerfil() {
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [producerModalOpen, setProducerModalOpen] = useState(false);

  const { data: tickets = [] } = useQuery({
    queryKey: ["my-tickets", user?.id],
    queryFn: () => getMyTickets(user!.id),
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: () => getMyOrders(user!.id),
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const handleLogout = async () => {
    await signOut();
    toast({ title: "Você saiu da sua conta" });
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

  const now = new Date();
  const upcomingTickets = tickets
    .filter((ticket: any) => {
      if (!ticket?.events?.start_date) return false;
      const eventDate = new Date(ticket.events.start_date);
      return ticket.status === "active" && eventDate >= now;
    })
    .sort(
      (a: any, b: any) =>
        new Date(a.events.start_date).getTime() - new Date(b.events.start_date).getTime()
    )
    .slice(0, 2);

  const activeTicketsCount = tickets.filter((ticket: any) => ticket.status === "active").length;
  const pendingOrdersCount = orders.filter((order: any) => order.status === "pending").length;
  const unreadStatus = pendingOrdersCount > 0 ? "Ação pendente" : "Tudo em dia";

  const menuItems: MenuItem[] = [
    { id: "password", icon: Lock, label: "Alterar senha", href: "/meu-perfil/alterar-senha" },
    { id: "payment", icon: CreditCard, label: "Métodos de pagamento", href: "/meu-perfil/pagamento" },
    { id: "notifications", icon: Bell, label: "Notificações", href: "/meu-perfil/notificacoes" },
    { id: "support", icon: HelpCircle, label: "Suporte", href: "/meu-perfil/suporte" },
    { id: "favoritos", icon: Heart, label: "Favoritos", href: "/favoritos" },
  ];

  const renderProducerCard = () => {
    if (role === "producer") {
      return (
        <button
          onClick={() => navigate("/producer/dashboard")}
          className="flex items-center gap-3 w-full p-4 rounded-xl border border-border bg-muted/30 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground">Conta de produtor ativa</p>
            <p className="text-xs text-muted-foreground">Acesse o painel de produtor</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      );
    }

    return (
      <button
        onClick={() => setProducerModalOpen(true)}
        className="flex items-center gap-3 w-full p-4 rounded-xl border border-border bg-primary/5 text-left hover:bg-primary/10 transition-colors"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
          <Briefcase className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">Quero ser produtor</p>
          <p className="text-xs text-muted-foreground">Crie e venda ingressos para seus eventos</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    );
  };

  return (
    <>
      <SEOHead title="Meu Perfil | TicketHall" description="Gerencie seu perfil no TicketHall" />

      <BecomeProducerModal
        open={producerModalOpen}
        onOpenChange={setProducerModalOpen}
      />

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

          {/* Quick status */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Status da conta</p>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-foreground">
                {unreadStatus}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate("/meus-ingressos")}
                className="text-left rounded-lg border border-border px-3 py-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Ticket className="h-3.5 w-3.5" />
                  Ingressos ativos
                </div>
                <p className="text-lg font-semibold text-foreground mt-1">{activeTicketsCount}</p>
              </button>
              <button
                onClick={() => navigate("/meus-pedidos")}
                className="text-left rounded-lg border border-border px-3 py-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <FileText className="h-3.5 w-3.5" />
                  Pedidos pendentes
                </div>
                <p className="text-lg font-semibold text-foreground mt-1">{pendingOrdersCount}</p>
              </button>
            </div>
          </div>

          {/* Upcoming events */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Próximos eventos</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/meus-ingressos")}>Ver todos</Button>
            </div>

            {upcomingTickets.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                Você ainda não tem eventos próximos.
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingTickets.map((ticket: any) => {
                  const eventDate = new Date(ticket.events.start_date);
                  return (
                    <button
                      key={ticket.id}
                      onClick={() => navigate("/meus-ingressos")}
                      className="w-full text-left rounded-lg border border-border px-3 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{ticket.events.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {eventDate.toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                            {" · "}
                            {eventDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            {ticket.events.venue_city ? ` · ${ticket.events.venue_city}` : ""}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Producer Status Card */}
          {renderProducerCard()}

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
