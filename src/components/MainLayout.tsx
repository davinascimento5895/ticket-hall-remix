import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const loggedInPaths = [
  "/meus-ingressos",
  "/meus-certificados",
  "/carrinho",
  "/notificacoes",
  "/meu-perfil",
  "/eventos",
  "/busca",
  "/cidades",
];

export function MainLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  const isLoggedInArea = user && loggedInPaths.some((p) => location.pathname.startsWith(p));

  // Hide Navbar on mobile in logged-in areas (pages have their own headers)
  const hideNavbar = isMobile && isLoggedInArea;

  // Bottom nav only shows for logged-in users on mobile
  const hasBottomNav = user && isMobile;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {!hideNavbar && <Navbar />}
      <main className={cn("overflow-x-hidden", hasBottomNav ? "pb-20 lg:pb-0" : "")}>
        <Outlet />
      </main>
      {!isLoggedInArea && <Footer />}
    </div>
  );
}
