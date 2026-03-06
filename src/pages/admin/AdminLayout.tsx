import { Outlet, Link } from "react-router-dom";
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
import { LayoutDashboard, CalendarDays, Users, UserCheck, ShoppingCart, DollarSign, Settings, LogOut, ExternalLink, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/NotificationBell";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Eventos", url: "/admin/events", icon: CalendarDays },
  { title: "Usuários", url: "/admin/users", icon: Users },
  { title: "Produtores", url: "/admin/producers", icon: UserCheck },
  { title: "Pedidos", url: "/admin/orders", icon: ShoppingCart },
  { title: "Financeiro", url: "/admin/finance", icon: DollarSign },
  { title: "Configurações", url: "/admin/settings", icon: Settings },
];

function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, profile } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col h-full bg-sidebar">
        {/* Brand */}
        <div className="p-4 border-b border-sidebar-border">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            {collapsed ? (
              <div className="flex items-center justify-center w-full">
                <Shield className="h-5 w-5 text-primary" />
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <TicketHallLogo size="sm" />
                <Badge className="text-[10px] px-1.5 py-0 h-4 font-semibold bg-primary/15 text-primary border-primary/20 hover:bg-primary/20">
                  Admin
                </Badge>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-sidebar-foreground/40 font-semibold">
            Administração
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin/dashboard"}
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
              <div className="px-2 py-1.5">
                <p className="text-xs font-medium text-sidebar-foreground/70 truncate">
                  {profile?.full_name || "Administrador"}
                </p>
                <p className="text-[10px] text-sidebar-foreground/40">Administrador</p>
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

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
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
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
