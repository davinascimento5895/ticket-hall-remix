import { Outlet, Link, useLocation } from "react-router-dom";
import { useEffect, Suspense, useMemo } from "react";
import {
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { TicketHallLogo } from "@/components/TicketHallLogo";
import { LayoutDashboard, CalendarDays, ClipboardList, Settings, LogOut, ExternalLink, DollarSign, Inbox, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/NotificationBell";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", url: "/producer/dashboard", icon: LayoutDashboard },
  { title: "Meus Eventos", url: "/producer/events", icon: CalendarDays },
  { title: "Financeiro", url: "/producer/financial", icon: DollarSign },
  { title: "Mensagens", url: "/producer/inbox", icon: Inbox },
  { title: "Listas de Interesse", url: "/producer/interest-lists", icon: ClipboardList },
  { title: "Configurações", url: "/producer/settings", icon: Settings },
];

const routeMeta = [
  { match: "/producer/dashboard", title: "Painel do Produtor", description: "Acompanhe receita, pedidos e evolução dos seus eventos." },
  { match: "/producer/events", title: "Gestão de Eventos", description: "Organize seus eventos, acompanhe lotes e acesse o painel operacional." },
  { match: "/producer/financial", title: "Financeiro", description: "Visualize transações, repasses e indicadores de faturamento." },
  { match: "/producer/inbox", title: "Mensagens", description: "Converse com participantes e mantenha sua operação alinhada." },
  { match: "/producer/interest-lists", title: "Listas de Interesse", description: "Gerencie audiências e campanhas para seus próximos lançamentos." },
  { match: "/producer/settings", title: "Configurações", description: "Ajuste preferências da conta e parâmetros do seu workspace." },
];

function ProducerSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, profile, allRoles, role, switchRole } = useAuth();
  const navigate = useNavigate();

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "P";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex h-full flex-col gap-3 bg-sidebar">
        {/* Brand */}
        <div className="p-4">
          <Link to="/producer/dashboard" className="flex items-center gap-2">
            {collapsed ? (
              <TicketHallLogo variant="symbol" size="sm" />
            ) : (
              <TicketHallLogo size="sm" />
            )}
          </Link>
        </div>

        {/* Navigation */}
        <SidebarGroup className="px-3">
          <SidebarGroupLabel className="text-[11px] uppercase tracking-[0.16em] text-sidebar-foreground/45 font-semibold">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/producer/dashboard"}
                      className="group rounded-xl border border-transparent px-2.5 py-2 hover:bg-sidebar-accent/70 hover:border-sidebar-border/70 transition-all"
                      activeClassName="bg-primary/10 text-primary border-primary/20 shadow-sm font-semibold"
                    >
                      <item.icon className="mr-2 h-4 w-4 transition-transform group-hover:scale-105" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        <div className="mt-auto">
          <div className="p-3 space-y-2.5">
            {!collapsed && (
              <div className="rounded-xl bg-sidebar-accent/30 p-2.5">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-3 cursor-pointer">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-sidebar-foreground truncate">
                          {profile?.full_name || "Produtor"}
                        </p>
                        <p className="text-[10px] text-sidebar-foreground/55">Perfil produtor</p>
                      </div>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top">
                    {allRoles.includes("buyer") && role !== "buyer" && (
                      <DropdownMenuItem onClick={() => { switchRole("buyer"); navigate("/"); }}>
                        Mudar para perfil de comprador
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start rounded-lg text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {!collapsed && "Sair"}
            </Button>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export default function ProducerLayout() {
  const location = useLocation();

  useEffect(() => {
    const savedDashTheme = localStorage.getItem("theme-dashboard");
    if (!savedDashTheme) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme-dashboard", "light");
    }
  }, []);

  const isProducerEventFormRoute = /^\/producer\/events\/(new|[^/]+\/edit)$/.test(location.pathname);
  const activeMeta = useMemo(() => {
    const sortedMeta = [...routeMeta].sort((a, b) => b.match.length - a.match.length);
    return sortedMeta.find((item) => location.pathname.startsWith(item.match)) || routeMeta[0];
  }, [location.pathname]);

  return (
    <SidebarProvider className="h-screen overflow-hidden bg-muted/20">
      <div className="h-full flex w-full bg-background overflow-hidden">
        <ProducerSidebar />
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Top bar */}
          <header className="h-16 flex items-center justify-between px-4 md:px-6 shrink-0 bg-background/75 backdrop-blur-lg">
            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-lg border border-border bg-card hover:bg-muted" />
              <Separator orientation="vertical" className="h-6" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{activeMeta.title}</p>
                <p className="hidden sm:block truncate text-xs text-muted-foreground">{activeMeta.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Ver site
              </Link>
              <Button variant="outline" size="sm" asChild className="hidden lg:inline-flex gap-1.5">
                <Link to="/producer/events/new">
                  <Sparkles className="h-3.5 w-3.5" />
                  Novo evento
                </Link>
              </Button>
              <NotificationBell />
              <AnimatedThemeToggler />
            </div>
          </header>

          {/* Content */}
          <main data-scroll-container className={cn(
            "flex-1 min-h-0 px-3 py-4 sm:px-4 md:px-6 md:py-6 lg:px-7",
            isProducerEventFormRoute ? "overflow-hidden" : "overflow-y-auto overscroll-contain",
          )}>
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[40vh]">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
              </div>
            }>
              {isProducerEventFormRoute ? (
                <Outlet />
              ) : (
                <div className="mx-auto w-full max-w-[1380px]">
                  <Outlet />
                </div>
              )}
            </Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
