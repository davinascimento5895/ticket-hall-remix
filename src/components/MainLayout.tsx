import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export function MainLayout() {
  const { user } = useAuth();
  const isMobile = useIsMobile();

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
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
