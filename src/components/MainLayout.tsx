import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

const loggedInPaths = [
  "/meus-ingressos",
  "/meus-certificados",
  "/carrinho",
  "/notificacoes",
  "/meu-perfil",
];

export function MainLayout() {
  const { user } = useAuth();
  const location = useLocation();

  // Hide footer on logged-in user pages
  const isLoggedInArea = user && loggedInPaths.some((p) => location.pathname.startsWith(p));

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <main className="pb-20 md:pb-0 overflow-x-hidden">
        <Outlet />
      </main>
      {!isLoggedInArea && <Footer />}
    </div>
  );
}
