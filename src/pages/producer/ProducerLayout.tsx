import { Outlet, Link } from "react-router-dom";
import { useEffect, Suspense } from "react";
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
import { LayoutDashboard, CalendarDays, ClipboardList, Settings, LogOut, ExternalLink } from "lucide-react";

const navItems = [
  { title: "Dashboard", url: "/producer/dashboard", icon: LayoutDashboard },
  { title: "Meus Eventos", url: "/producer/events", icon: CalendarDays },
  { title: "Listas de Interesse", url: "/producer/interest-lists", icon: ClipboardList },
  { title: "Configurações", url: "/producer/settings", icon: Settings },
];

function ProducerSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, profile } = useAuth();

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "P";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col h-full bg-sidebar">
        {/* Brand */}
        <div className="p-4 border-b border-sidebar-border">
          <Link to="/producer/dashboard" className="flex items-center gap-2">
            {collapsed ? (
              <TicketHallLogo variant="symbol" size="sm" />
            ) : (
              <TicketHallLogo size="sm" />
            )}
          </Link>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-sidebar-foreground/40 font-semibold">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/producer/dashboard"}
                      className="hover:bg-sidebar-accent/50 rounded-lg transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        <div className="mt-auto border-t border-sidebar-border">
          <div className="p-3 space-y-2">
            {!collapsed && (
              <div className="flex items-center gap-3 px-2 py-1.5">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {profile?.full_name || "Produtor"}
                  </p>
                  <p className="text-[10px] text-sidebar-foreground/40">Produtor</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-lg"
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
  useEffect(() => {
    const savedDashTheme = localStorage.getItem("theme-dashboard");
    if (!savedDashTheme) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme-dashboard", "light");
    }
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <ProducerSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-14 flex items-center justify-between border-b border-border px-4 shrink-0 bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-5" />
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Ver site</span>
              </Link>
            </div>
            <div className="flex items-center gap-1">
              <NotificationBell />
              <AnimatedThemeToggler />
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[40vh]">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
              </div>
            }>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
