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
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/98 backdrop-blur-lg border-t border-border"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      role="navigation"
      aria-label="Navegação principal"
    >
      <div className="flex items-end justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = item.href === "/" 
            ? location.pathname === "/" 
            : location.pathname.startsWith(item.href.split("?")[0]);
          const Icon = item.icon;

          // Cart button - highlighted center item
          if (item.isCart) {
            return (
              <Link
                key={item.href}
                to={item.href}
                className="relative flex flex-col items-center -mt-4"
                aria-label={`${item.label}${itemCount > 0 ? `, ${itemCount} itens` : ""}`}
              >
                <motion.div
                  whileTap={{ scale: 0.92 }}
                  className={cn(
                    "relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-200",
                    "bg-primary text-primary-foreground",
                    isActive && "ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                  )}
                >
                  <Icon className="h-6 w-6" strokeWidth={2} />
                  
                  {/* Cart badge */}
                  {itemCount > 0 && (
                    <span 
                      className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center px-1.5 text-[11px] font-bold bg-accent text-accent-foreground rounded-full shadow-md"
                      aria-hidden="true"
                    >
                      {itemCount > 99 ? "99+" : itemCount}
                    </span>
                  )}
                </motion.div>
                <span className="text-[10px] font-medium text-muted-foreground mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          // Regular nav items
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[56px] py-2 transition-colors touch-manipulation",
                "active:scale-95"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>
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
