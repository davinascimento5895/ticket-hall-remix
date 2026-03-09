import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, Search, Ticket, User, ShoppingBag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  href: string;
  icon: React.ElementType;
  label: string;
  isCart?: boolean;
}

const baseNavItems: NavItem[] = [
  { id: "catalog", href: "/eventos", icon: LayoutGrid, label: "Catálogo" },
  { id: "search", href: "/busca", icon: Search, label: "Pesquisar" },
  { id: "cart", href: "/carrinho", icon: ShoppingBag, label: "Carrinho", isCart: true },
  { id: "tickets", href: "/meus-ingressos", icon: Ticket, label: "Ingressos" },
  { id: "profile", href: "/meu-perfil", icon: User, label: "Perfil" },
];

function getActiveId(pathname: string): string | null {
  if (pathname.startsWith("/busca")) return "search";
  if (pathname.startsWith("/meus-ingressos") || pathname.startsWith("/meus-certificados")) return "tickets";
  if (pathname.startsWith("/carrinho")) return "cart";
  if (pathname.startsWith("/meu-perfil") || pathname.startsWith("/notificacoes")) return "profile";
  if (pathname.startsWith("/eventos") || pathname.startsWith("/evento/") || pathname.startsWith("/cidades")) return "catalog";
  return null;
}

export function MobileBottomNav() {
  const { user, role } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();

  // Hide on admin/producer panels
  if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/producer")) {
    return null;
  }

  // Hide on checkout flow
  if (location.pathname.startsWith("/checkout")) {
    return null;
  }

  // Determine profile destination based on auth
  const profileHref = !user ? "/?login=true" : "/meu-perfil";

  const navItems = baseNavItems.map((item) =>
    item.id === "profile" ? { ...item, href: profileHref } : item
  );

  const activeId = getActiveId(location.pathname);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      role="navigation"
      aria-label="Navegação principal"
    >
      <div className="flex items-end justify-around h-[72px] px-1">
        {navItems.map((item) => {
          const isActive = activeId === item.id;
          const Icon = item.icon;

          // Cart - highlighted center button
          if (item.isCart) {
            return (
              <Link
                key={item.id}
                to={item.href}
                className="flex flex-col items-center -mt-5 flex-1 touch-manipulation"
                aria-label={`${item.label}${itemCount > 0 ? `, ${itemCount} itens` : ""}`}
              >
                <div
                  className={cn(
                    "relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg bg-primary text-primary-foreground transition-all",
                    isActive && "ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                  )}
                >
                  <Icon className="h-6 w-6" strokeWidth={2} />
                  {itemCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center px-1.5 text-[10px] font-bold bg-accent text-accent-foreground rounded-full shadow"
                      aria-hidden="true"
                    >
                      {itemCount > 99 ? "99+" : itemCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          // Regular nav items
          return (
            <Link
              key={item.id}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors touch-manipulation",
                "active:scale-95"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
