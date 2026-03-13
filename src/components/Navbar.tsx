import { useState, useEffect } from "react";
import { Link, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, ShoppingBag, Search, Plus, ArrowRightLeft } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TicketHallLogo } from "@/components/TicketHallLogo";
import { AuthModal } from "@/components/AuthModal";
import { BecomeProducerModal } from "@/components/BecomeProducerModal";
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
  const [navSearch, setNavSearch] = useState("");
  const [producerModalOpen, setProducerModalOpen] = useState(false);
  const { user, profile, role, allRoles, switchRole, signOut } = useAuth();
  const { itemCount } = useCart();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const handleCreateEvent = () => {
    if (role === "producer") {
      navigate("/producer/events/new");
    } else {
      setProducerModalOpen(true);
    }
  };

  const isAdminOrProducer = location.pathname.startsWith("/admin") || location.pathname.startsWith("/producer");
  const isLandingPage = location.pathname === "/";

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
    { label: "Revenda", href: "/revenda" },
    { label: "Produtores", href: "/produtores" },
    { label: "Blog", href: "/blog" },
  ];

  const openLogin = () => { setAuthTab("login"); setAuthOpen(true); };
  const openRegister = () => { setAuthTab("register"); setAuthOpen(true); };

  const handleNavSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/busca?q=${encodeURIComponent(navSearch.trim())}`);
      setNavSearch("");
    }
  };

  const roleLabels: Record<string, string> = {
    admin: "Administrador",
    producer: "Produtor",
    staff: "Equipe",
    buyer: "Comprador",
  };

  const roleDashboardLinks: Record<string, string> = {
    admin: "/admin/dashboard",
    producer: "/producer/dashboard",
    staff: "/staff",
    buyer: "/meus-ingressos",
  };

  const switchableRoles = allRoles.filter((r) => r !== role);

  const dashboardLink = role ? roleDashboardLinks[role] : "/meus-ingressos";

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
          scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border" : "bg-transparent"
        )}
      >
        <div className="container flex h-14 lg:h-16 items-center justify-between">
          <Link to="/" className="shrink-0">
            <TicketHallLogo size="md" className="hidden lg:block" />
            <TicketHallLogo size="sm" className="lg:hidden" />
          </Link>

          {/* Desktop Navigation — visible at lg+ */}
          <nav className="hidden lg:flex items-center gap-6">
            {(scrolled || !isLandingPage) && !isAdminOrProducer && (
              <form onSubmit={handleNavSearch} className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="h-8 w-[180px] pl-8 pr-3 text-sm rounded-full bg-muted/50 border-transparent focus:border-border focus:bg-background transition-all"
                />
              </form>
            )}
            {links.map((l) => (
              <Link key={l.href} to={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions — visible at lg+ */}
          <div className="hidden lg:flex items-center gap-2">
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
                      <span className="max-w-[120px] truncate">{profile?.full_name || "Minha Conta"} — {roleLabels[role || "buyer"]}</span>
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
                      <Link to="/meus-pedidos">Meus Pedidos</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/favoritos">Favoritos</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/notificacoes">Notificações</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleCreateEvent}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar evento
                    </DropdownMenuItem>
                    {switchableRoles.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        {switchableRoles.map((r) => (
                          <DropdownMenuItem
                            key={r}
                            onClick={() => {
                              switchRole(r);
                              navigate(roleDashboardLinks[r]);
                            }}
                          >
                            <ArrowRightLeft className="h-4 w-4 mr-2" />
                            Alterar para {roleLabels[r]}
                          </DropdownMenuItem>
                        ))}
                      </>
                    )}
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
                <Button variant="outline" size="sm" onClick={handleCreateEvent} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Crie seu evento
                </Button>
                <Button variant="ghost" size="sm" onClick={openLogin}>Entrar</Button>
                <Button variant="default" size="sm" onClick={openRegister}>Criar Conta</Button>
              </>
            )}
          </div>

          {/* Mobile/Tablet Header — visible below lg */}
          <div className="lg:hidden flex items-center gap-1">
            <AnimatedThemeToggler />

            {/* Cart icon for logged-out users on mobile */}
            {!user && !isAdminOrProducer && (
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
            )}

            {user && <NotificationBell />}

            {!user && !isAdminOrProducer && (
              <Button variant="default" size="sm" className="text-xs px-3 h-8" onClick={openLogin}>
                Entrar
              </Button>
            )}

            {/* Hamburger menu — always visible on mobile */}
            <button className="lg:hidden text-foreground p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu — logged-out users */}
        {mobileOpen && !user && !isAdminOrProducer && (
          <div className="lg:hidden bg-background/95 backdrop-blur-xl border-b border-border animate-fade-in">
            <div className="container py-4 space-y-1">
              <Link
                to="/"
                className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground py-2.5 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Início
              </Link>
              {links.map((l) => (
                <Link
                  key={l.href}
                  to={l.href}
                  className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground py-2.5 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              <div className="border-t border-border my-2" />
              <button
                className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground py-2.5 w-full transition-colors"
                onClick={() => { handleCreateEvent(); setMobileOpen(false); }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crie seu evento
              </button>
              <div className="flex gap-3 pt-3">
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => { openLogin(); setMobileOpen(false); }}>Entrar</Button>
                <Button variant="default" size="sm" className="flex-1" onClick={() => { openRegister(); setMobileOpen(false); }}>Criar Conta</Button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Menu — logged-in users (buyer / admin / producer) */}
        {mobileOpen && user && (
          <div className="lg:hidden bg-background/95 backdrop-blur-xl border-b border-border animate-fade-in">
            <div className="container py-4 space-y-1">
              {links.map((l) => (
                <Link key={l.href} to={l.href} className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2.5 transition-colors" onClick={() => setMobileOpen(false)}>
                  {l.label}
                </Link>
              ))}
              <div className="border-t border-border my-2" />
              {isAdminOrProducer && (
                <Link to={dashboardLink} className="block text-sm font-medium py-2.5" onClick={() => setMobileOpen(false)}>Meu Painel</Link>
              )}
              <Link to="/meus-ingressos" className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2.5 transition-colors" onClick={() => setMobileOpen(false)}>Meus Ingressos</Link>
              <Link to="/meus-pedidos" className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2.5 transition-colors" onClick={() => setMobileOpen(false)}>Meus Pedidos</Link>
              <Link to="/favoritos" className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2.5 transition-colors" onClick={() => setMobileOpen(false)}>Favoritos</Link>
              <Link to="/meu-perfil" className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2.5 transition-colors" onClick={() => setMobileOpen(false)}>Meu Perfil</Link>
              {switchableRoles.length > 0 && (
                <>
                  <div className="border-t border-border my-2" />
                  {switchableRoles.map((r) => (
                    <button
                      key={r}
                      className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground py-2.5 w-full transition-colors"
                      onClick={() => { switchRole(r); navigate(roleDashboardLinks[r]); setMobileOpen(false); }}
                    >
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Alterar para {roleLabels[r]}
                    </button>
                  ))}
                </>
              )}
              <div className="border-t border-border my-2" />
              <Button variant="ghost" size="sm" className="w-full justify-start text-destructive" onClick={() => { signOut(); setMobileOpen(false); }}>
                <LogOut className="h-4 w-4 mr-2" /> Sair
              </Button>
            </div>
          </div>
        )}
      </header>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultTab={authTab} />
      <BecomeProducerModal open={producerModalOpen} onOpenChange={setProducerModalOpen} />
    </>
  );
}