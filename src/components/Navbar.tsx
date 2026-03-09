import { useState, useEffect } from "react";
import { Link, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, ShoppingBag, Search } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TicketHallLogo } from "@/components/TicketHallLogo";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const { user, profile, role, signOut } = useAuth();
  const { itemCount } = useCart();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Check if we're in admin/producer area (they use sidebar navigation)
  const isAdminOrProducer = location.pathname.startsWith("/admin") || location.pathname.startsWith("/producer");

  useEffect(() => {
    if (searchParams.get("login") === "true") {
      setAuthOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  const links = [
    { label: "Eventos", href: "/eventos" },
    { label: "Produtores", href: "/produtores" },
    { label: "Blog", href: "/blog" },
  ];

  const openLogin = () => { setAuthTab("login"); setAuthOpen(true); };
  const openRegister = () => { setAuthTab("register"); setAuthOpen(true); };

  const dashboardLink = role === "admin" ? "/admin/dashboard" : role === "producer" ? "/producer/dashboard" : "/meus-ingressos";

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
          scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border" : "bg-transparent"
        )}
      >
        <div className="container flex h-14 md:h-16 items-center justify-between">
          <Link to="/" className="shrink-0">
            <TicketHallLogo size="md" className="hidden md:block" />
            <TicketHallLogo size="sm" className="md:hidden" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <Link key={l.href} to={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <AnimatedThemeToggler />
            {user ? (
              <div className="flex items-center gap-1">
                <Link 
                  to="/carrinho" 
                  className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`Carrinho${itemCount > 0 ? `, ${itemCount} itens` : ""}`}
                >
                  <ShoppingBag className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold bg-primary text-primary-foreground rounded-full">
                      {itemCount > 99 ? "99+" : itemCount}
                    </span>
                  )}
                </Link>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <User className="h-4 w-4" />
                      <span className="max-w-[120px] truncate">{profile?.full_name || "Minha Conta"}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to={dashboardLink}>Meu Painel</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/meus-ingressos">Meus Ingressos</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/notificacoes">Notificações</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" /> Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Link 
                  to="/carrinho" 
                  className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`Carrinho${itemCount > 0 ? `, ${itemCount} itens` : ""}`}
                >
                  <ShoppingBag className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold bg-primary text-primary-foreground rounded-full">
                      {itemCount > 99 ? "99+" : itemCount}
                    </span>
                  )}
                </Link>
                <Button variant="ghost" size="sm" onClick={openLogin}>Entrar</Button>
                <Button variant="default" size="sm" onClick={openRegister}>Criar Conta</Button>
              </>
            )}
          </div>

          {/* Mobile Header - Simplified (no hamburger for regular users) */}
          <div className="md:hidden flex items-center gap-1">
            <AnimatedThemeToggler />
            {user && <NotificationBell />}
            
            {/* Only show hamburger for admin/producer areas */}
            {isAdminOrProducer && (
              <button className="text-foreground p-2" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}
            
            {/* Show login button for non-logged users on mobile */}
            {!user && !isAdminOrProducer && (
              <Button variant="default" size="sm" className="text-xs px-3 h-8" onClick={openLogin}>
                Entrar
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Menu - Only for admin/producer */}
        {mobileOpen && isAdminOrProducer && (
          <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border animate-fade-in">
            <div className="container py-4 space-y-3">
              {links.map((l) => (
                <Link key={l.href} to={l.href} className="block text-sm font-medium text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>
                  {l.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link to={dashboardLink} className="block text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>Meu Painel</Link>
                  <Link to="/meus-ingressos" className="block text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>Meus Ingressos</Link>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-destructive" onClick={() => { signOut(); setMobileOpen(false); }}>
                    <LogOut className="h-4 w-4 mr-2" /> Sair
                  </Button>
                </>
              ) : (
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => { openLogin(); setMobileOpen(false); }}>Entrar</Button>
                  <Button variant="default" size="sm" className="flex-1" onClick={() => { openRegister(); setMobileOpen(false); }}>Criar Conta</Button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultTab={authTab} />
    </>
  );
}
