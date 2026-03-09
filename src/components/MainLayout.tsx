import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      {/* Main content with bottom padding for mobile nav bar */}
      <main className="pb-20 md:pb-0 overflow-x-hidden">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
