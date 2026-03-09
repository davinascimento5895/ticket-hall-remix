import { Link, useLocation } from "react-router-dom";
import { Home, Search, Ticket, User, ShoppingBag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  isCart?: boolean;
}

const baseNavItems: NavItem[] = [
  { href: "/", icon: Home, label: "Início" },
  { href: "/eventos", icon: Search, label: "Eventos" },
  { href: "/carrinho", icon: ShoppingBag, label: "Carrinho", isCart: true },
  { href: "/meus-ingressos", icon: Ticket, label: "Ingressos" },
  { href: "/meu-perfil", icon: User, label: "Perfil" },
];

export function MobileBottomNav() {
  const { user, role } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();

  // Hide on admin/producer panels - they use sidebar
  if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/producer")) {
    return null;
  }

  // Hide on checkout flow for focused experience
  if (location.pathname.startsWith("/checkout")) {
    return null;
  }

  // Determine profile destination based on role
  const profileHref = !user 
    ? "/?login=true" 
    : role === "admin" 
      ? "/admin/dashboard" 
      : role === "producer" 
        ? "/producer/dashboard" 
        : "/meus-ingressos";

  const navItems = baseNavItems.map((item) =>
    item.href === "/meu-perfil" ? { ...item, href: profileHref } : item
  );

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      role="navigation"
      aria-label="Navegação principal"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = item.href === "/" 
            ? location.pathname === "/" 
            : location.pathname.startsWith(item.href.split("?")[0]);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors touch-manipulation",
                "active:scale-95"
              )}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.isCart && itemCount > 0 ? `${item.label}, ${itemCount} itens` : item.label}
            >
              <div
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                
                {/* Cart badge */}
                {item.isCart && itemCount > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold bg-accent text-accent-foreground rounded-full"
                    aria-hidden="true"
                  >
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
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
