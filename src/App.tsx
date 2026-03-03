import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Produtores from "./pages/Produtores";
import Eventos from "./pages/Eventos";
import EventDetail from "./pages/EventDetail";
import Carrinho from "./pages/Carrinho";
import Checkout from "./pages/Checkout";
import MeusIngressos from "./pages/MeusIngressos";
import ProducerLayout from "./pages/producer/ProducerLayout";
import ProducerDashboard from "./pages/producer/ProducerDashboard";
import ProducerEvents from "./pages/producer/ProducerEvents";
import ProducerEventForm from "./pages/producer/ProducerEventForm";
import ProducerEventReports from "./pages/producer/ProducerEventReports";
import ProducerEventOrders from "./pages/producer/ProducerEventOrders";
import ProducerEventCheckin from "./pages/producer/ProducerEventCheckin";
import ProducerEventGuestlist from "./pages/producer/ProducerEventGuestlist";
import ProducerEventCoupons from "./pages/producer/ProducerEventCoupons";
import ProducerSettings from "./pages/producer/ProducerSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/produtores" element={<Produtores />} />
              <Route path="/eventos" element={<Eventos />} />
              <Route path="/eventos/:slug" element={<EventDetail />} />
              <Route path="/carrinho" element={<Carrinho />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/meus-ingressos" element={<MeusIngressos />} />

              {/* Producer Panel */}
              <Route
                path="/producer"
                element={
                  <ProtectedRoute allowedRoles={["producer", "admin"]}>
                    <ProducerLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<ProducerDashboard />} />
                <Route path="events" element={<ProducerEvents />} />
                <Route path="events/new" element={<ProducerEventForm />} />
                <Route path="events/:id/edit" element={<ProducerEventForm />} />
                <Route path="events/:id/reports" element={<ProducerEventReports />} />
                <Route path="events/:id/orders" element={<ProducerEventOrders />} />
                <Route path="events/:id/checkin" element={<ProducerEventCheckin />} />
                <Route path="events/:id/guestlist" element={<ProducerEventGuestlist />} />
                <Route path="events/:id/coupons" element={<ProducerEventCoupons />} />
                <Route path="settings" element={<ProducerSettings />} />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
