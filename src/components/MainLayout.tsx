import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
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

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {!hideNavbar && <Navbar />}
      <main className="pb-20 lg:pb-0 overflow-x-hidden">
        <Outlet />
      </main>
      {!isLoggedInArea && <Footer />}
    </div>
  );
}
