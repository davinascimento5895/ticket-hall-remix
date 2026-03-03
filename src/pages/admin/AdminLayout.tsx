import { Outlet, Link, useLocation } from "react-router-dom";
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
import { LayoutDashboard, CalendarDays, Users, UserCheck, ShoppingCart, DollarSign, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

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
  const { signOut } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        <div className="p-4 border-b border-sidebar-border">
          <Link to="/admin/dashboard">
            {collapsed ? (
              <span className="font-display font-bold text-sm text-sidebar-foreground">TH</span>
            ) : (
              <div className="flex items-center gap-2">
                <TicketHallLogo size="sm" />
                <span className="text-xs font-medium text-muted-foreground bg-destructive/15 text-destructive px-1.5 py-0.5 rounded">Admin</span>
              </div>
            )}
          </Link>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Administração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin/dashboard"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
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

        <div className="mt-auto p-4 border-t border-sidebar-border">
          <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/60 hover:text-destructive" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />{!collapsed && "Sair"}
          </Button>
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
          <header className="h-14 flex items-center border-b border-border px-4 shrink-0">
            <SidebarTrigger className="mr-4" />
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Voltar ao site</Link>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
