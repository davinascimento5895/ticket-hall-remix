import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Main content with bottom padding for mobile nav bar */}
      <div className="pb-20 md:pb-0">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
