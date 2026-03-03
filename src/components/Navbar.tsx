import { useState, useEffect } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Menu, X, Bell, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TicketHallLogo } from "@/components/TicketHallLogo";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
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
  const [searchParams] = useSearchParams();

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
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="shrink-0">
            <TicketHallLogo size="md" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <Link key={l.href} to={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={openLogin}>Entrar</Button>
                <Button variant="default" size="sm" onClick={openRegister}>Criar Conta</Button>
              </>
            )}
          </div>

          <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileOpen && (
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
