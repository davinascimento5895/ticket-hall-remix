import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MobileBottomNav } from "@/components/MobileBottomNav";
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
import ProducerEventAffiliates from "./pages/producer/ProducerEventAffiliates";
import ProducerEventMessages from "./pages/producer/ProducerEventMessages";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProducers from "./pages/admin/AdminProducers";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminFinance from "./pages/admin/AdminFinance";
import AdminSettings from "./pages/admin/AdminSettings";
import PublicCheckin from "./pages/PublicCheckin";
import OrganizerProfile from "./pages/OrganizerProfile";
import EmbedWidget from "./pages/EmbedWidget";
import Privacidade from "./pages/Privacidade";
import FilaVirtual from "./pages/FilaVirtual";
import MeusCertificados from "./pages/MeusCertificados";
import Changelog from "./pages/Changelog";
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
              <Route path="/checkin/:accessCode" element={<PublicCheckin />} />
              <Route path="/organizador/:slug" element={<OrganizerProfile />} />
              <Route path="/embed" element={<EmbedWidget />} />
              <Route path="/minha-conta/privacidade" element={<Privacidade />} />
              <Route path="/meus-certificados" element={<MeusCertificados />} />
              <Route path="/fila/:slug" element={<FilaVirtual />} />
              <Route path="/changelog" element={<Changelog />} />

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
                <Route path="events/:id/affiliates" element={<ProducerEventAffiliates />} />
                <Route path="events/:id/messages" element={<ProducerEventMessages />} />
                <Route path="settings" element={<ProducerSettings />} />
              </Route>

              {/* Admin Panel */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="events" element={<AdminEvents />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="producers" element={<AdminProducers />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="finance" element={<AdminFinance />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
            <MobileBottomNav />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
