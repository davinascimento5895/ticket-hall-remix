import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const PageFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

export function MainLayout() {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const { pathname } = useLocation();
  const hideFooter = pathname.startsWith("/meu-perfil");

  // Bottom nav only shows for logged-in users on mobile
  const hasBottomNav = user && isMobile;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <main className={cn(
        "overflow-x-hidden",
        "pt-14 lg:pt-16",
        hasBottomNav ? "pb-20 lg:pb-0" : ""
      )}>
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
