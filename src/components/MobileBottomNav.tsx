import { Link, useLocation } from "react-router-dom";
import { Home, Search, Ticket, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Início" },
  { href: "/eventos", icon: Search, label: "Eventos" },
  { href: "/meus-ingressos", icon: Ticket, label: "Ingressos" },
  { href: "/meu-perfil", icon: User, label: "Perfil" },
];

export function MobileBottomNav() {
  const { user, role } = useAuth();
  const location = useLocation();

  if (!user) return null;

  // Don't show on admin/producer panels
  if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/producer")) return null;

  const profileHref = role === "admin" ? "/admin/dashboard" : role === "producer" ? "/producer/dashboard" : "/meus-ingressos";

  const items = navItems.map((item) =>
    item.href === "/meu-perfil" ? { ...item, href: profileHref } : item
  );

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border">
      <div className="flex items-center justify-around h-14">
        {items.map((item) => {
          const active = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
