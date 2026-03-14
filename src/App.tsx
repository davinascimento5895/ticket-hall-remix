import { lazy, Suspense, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { MainLayout } from "@/components/MainLayout";
// Public pages — lazy loaded
const Index = lazy(() => import("./pages/Index"));
const Produtores = lazy(() => import("./pages/Produtores"));
const Eventos = lazy(() => import("./pages/Eventos"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const EventBooking = lazy(() => import("./pages/EventBooking"));
const Carrinho = lazy(() => import("./pages/Carrinho"));
const Checkout = lazy(() => import("./pages/Checkout"));
const MeusIngressos = lazy(() => import("./pages/MeusIngressos"));
const MeusPedidos = lazy(() => import("./pages/MeusPedidos"));
const PublicCheckin = lazy(() => import("./pages/PublicCheckin"));
const OrganizerProfile = lazy(() => import("./pages/OrganizerProfile"));
const EmbedWidget = lazy(() => import("./pages/EmbedWidget"));
const Privacidade = lazy(() => import("./pages/Privacidade"));
const PoliticaPrivacidade = lazy(() => import("./pages/PoliticaPrivacidade"));
const TermosDeUso = lazy(() => import("./pages/TermosDeUso"));
const FilaVirtual = lazy(() => import("./pages/FilaVirtual"));
const MeusCertificados = lazy(() => import("./pages/MeusCertificados"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Changelog = lazy(() => import("./pages/Changelog"));
const NotificacoesConfig = lazy(() => import("./pages/NotificacoesConfig"));
const Cidades = lazy(() => import("./pages/Cidades"));
const Busca = lazy(() => import("./pages/Busca"));
const MeuPerfil = lazy(() => import("./pages/MeuPerfil"));
const EditarPerfil = lazy(() => import("./pages/EditarPerfil"));
const AlterarSenha = lazy(() => import("./pages/AlterarSenha"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PerfilCidade = lazy(() => import("./pages/PerfilCidade"));
const MetodosPagamento = lazy(() => import("./pages/MetodosPagamento"));
const PerfilNotificacoes = lazy(() => import("./pages/PerfilNotificacoes"));
const PerfilSuporte = lazy(() => import("./pages/PerfilSuporte"));
const Favoritos = lazy(() => import("./pages/Favoritos"));
const Revenda = lazy(() => import("./pages/Revenda"));
const RevendaCheckout = lazy(() => import("./pages/RevendaCheckout"));
const RevendaSucesso = lazy(() => import("./pages/RevendaSucesso"));
const PedidoRecuperacao = lazy(() => import("./pages/PedidoRecuperacao"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Global components — lazy loaded (import framer-motion)
const OnboardingFlow = lazy(() =>
  import("@/components/OnboardingFlow").then(m => ({ default: m.OnboardingFlow }))
);
const SupportChat = lazy(() =>
  import("@/components/SupportChat").then(m => ({ default: m.SupportChat }))
);

// Producer pages — lazy loaded
const ProducerLayout = lazy(() => import("./pages/producer/ProducerLayout"));
const ProducerDashboard = lazy(() => import("./pages/producer/ProducerDashboard"));
const ProducerEvents = lazy(() => import("./pages/producer/ProducerEvents"));
const ProducerEventForm = lazy(() => import("./pages/producer/ProducerEventForm"));
const ProducerEventPanel = lazy(() => import("./pages/producer/ProducerEventPanel"));
const ProducerEventDashboardTab = lazy(() => import("./pages/producer/ProducerEventDashboardTab"));
const ProducerEventTicketsTab = lazy(() => import("./pages/producer/ProducerEventTicketsTab"));
const ProducerEventParticipants = lazy(() => import("./pages/producer/ProducerEventParticipants"));
const ProducerEventFinancial = lazy(() => import("./pages/producer/ProducerEventFinancial"));
const ProducerEventReports = lazy(() => import("./pages/producer/ProducerEventReports"));
const ProducerEventOrders = lazy(() => import("./pages/producer/ProducerEventOrders"));
const ProducerEventCheckin = lazy(() => import("./pages/producer/ProducerEventCheckin"));
const ProducerEventGuestlist = lazy(() => import("./pages/producer/ProducerEventGuestlist"));
const ProducerEventCoupons = lazy(() => import("./pages/producer/ProducerEventCoupons"));
const ProducerSettings = lazy(() => import("./pages/producer/ProducerSettings"));
const ProducerEventAffiliates = lazy(() => import("./pages/producer/ProducerEventAffiliates"));
const ProducerEventPromoters = lazy(() => import("./pages/producer/ProducerEventPromoters"));
const ProducerEventMessages = lazy(() => import("./pages/producer/ProducerEventMessages"));
const ProducerInterestLists = lazy(() => import("./pages/producer/ProducerInterestLists"));
const ProducerInbox = lazy(() => import("./pages/producer/ProducerInbox"));
const ProducerInterestListForm = lazy(() => import("./pages/producer/ProducerInterestListForm"));
const ProducerFinancialPage = lazy(() => import("./pages/producer/ProducerFinancial"));
const ProducerPromoters = lazy(() => import("./pages/producer/ProducerPromoters"));
const InterestListPublic = lazy(() => import("./pages/InterestListPublic"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const FAQ = lazy(() => import("./pages/FAQ"));

// Admin pages — lazy loaded
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminEvents = lazy(() => import("./pages/admin/AdminEvents"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminProducers = lazy(() => import("./pages/admin/AdminProducers"));
const AdminProducerDetail = lazy(() => import("./pages/admin/AdminProducerDetail"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminFinance = lazy(() => import("./pages/admin/AdminFinance"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

// Staff pages — lazy loaded
const StaffEventList = lazy(() => import("./pages/staff/StaffEventList"));
const StaffCheckinScreen = lazy(() => import("./pages/staff/StaffCheckinScreen"));
const StaffJoin = lazy(() => import("./pages/staff/StaffJoin"));
const ProducerEventStaff = lazy(() => import("./pages/producer/ProducerEventStaff"));


const LazyFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const App = () => {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,   // 5 min — dados ficam "frescos" por 5 min
        gcTime: 15 * 60 * 1000,      // 15 min — cache mantido 15 min após desmontar
        refetchOnWindowFocus: false,  // não refaz fetch ao voltar à aba
        refetchOnMount: false,        // não refaz fetch se dados já em cache
        retry: 1,
      },
    },
  }));

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <CartProvider>
            <Suspense fallback={<LazyFallback />}>
            <Routes>
              {/* Pages with shared Navbar + Footer */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/produtores" element={<Produtores />} />
                <Route path="/eventos" element={<Eventos />} />
                <Route path="/eventos/:slug" element={<EventDetail />} />
                <Route path="/eventos/:slug/comprar" element={<EventBooking />} />
              <Route path="/carrinho" element={<Carrinho />} />
                <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="/pedido/:orderId" element={<ProtectedRoute><PedidoRecuperacao /></ProtectedRoute>} />
                <Route path="/meus-ingressos" element={<ProtectedRoute><MeusIngressos /></ProtectedRoute>} />
                <Route path="/meus-pedidos" element={<ProtectedRoute><MeusPedidos /></ProtectedRoute>} />
                <Route path="/organizador/:slug" element={<OrganizerProfile />} />
                <Route path="/minha-conta/privacidade" element={<ProtectedRoute><Privacidade /></ProtectedRoute>} />
                <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
                <Route path="/termos-de-uso" element={<TermosDeUso />} />
                <Route path="/meus-certificados" element={<ProtectedRoute><MeusCertificados /></ProtectedRoute>} />
                <Route path="/fila/:slug" element={<FilaVirtual />} />
                <Route path="/changelog" element={<Changelog />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/cidades" element={<Cidades />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/busca" element={<Busca />} />
                <Route path="/notificacoes" element={<NotificacoesConfig />} />
                <Route path="/meu-perfil" element={<ProtectedRoute><MeuPerfil /></ProtectedRoute>} />
                <Route path="/meu-perfil/editar" element={<ProtectedRoute><EditarPerfil /></ProtectedRoute>} />
                <Route path="/meu-perfil/alterar-senha" element={<ProtectedRoute><AlterarSenha /></ProtectedRoute>} />
                <Route path="/meu-perfil/cidade" element={<ProtectedRoute><PerfilCidade /></ProtectedRoute>} />
                <Route path="/meu-perfil/pagamento" element={<ProtectedRoute><MetodosPagamento /></ProtectedRoute>} />
                <Route path="/meu-perfil/notificacoes" element={<ProtectedRoute><PerfilNotificacoes /></ProtectedRoute>} />
                <Route path="/meu-perfil/suporte" element={<ProtectedRoute><PerfilSuporte /></ProtectedRoute>} />
                <Route path="/favoritos" element={<ProtectedRoute><Favoritos /></ProtectedRoute>} />
                <Route path="/revenda" element={<Revenda />} />
                <Route path="/revenda/:listingId" element={<RevendaCheckout />} />
                <Route path="/revenda/:listingId/sucesso" element={<ProtectedRoute><RevendaSucesso /></ProtectedRoute>} />
              </Route>

              {/* Standalone pages (no shared Navbar/Footer) */}
              <Route path="/checkin/:accessCode" element={<PublicCheckin />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/embed" element={<EmbedWidget />} />
              <Route path="/lista/:slug" element={<InterestListPublic />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Staff Portal (standalone, no MainLayout) */}
              <Route path="/staff" element={<ProtectedRoute allowedRoles={["staff", "admin", "producer"]}><StaffEventList /></ProtectedRoute>} />
              <Route path="/staff/checkin/:eventId" element={<ProtectedRoute allowedRoles={["staff", "admin", "producer"]}><StaffCheckinScreen /></ProtectedRoute>} />
              <Route path="/staff/join/:code" element={<StaffJoin />} />

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
                {/* Unified Event Panel */}
                <Route path="events/:id/panel" element={<ProducerEventPanel />}>
                  <Route index element={<ProducerEventDashboardTab />} />
                  <Route path="tickets" element={<ProducerEventTicketsTab />} />
                  <Route path="orders" element={<ProducerEventOrders />} />
                  <Route path="participants" element={<ProducerEventParticipants />} />
                  <Route path="guestlist" element={<ProducerEventGuestlist />} />
                  <Route path="checkin" element={<ProducerEventCheckin />} />
                  <Route path="financial" element={<ProducerEventFinancial />} />
                  <Route path="messages" element={<ProducerEventMessages />} />
                  <Route path="coupons" element={<ProducerEventCoupons />} />
                  <Route path="promoters" element={<ProducerEventPromoters />} />
                  <Route path="staff" element={<ProducerEventStaff />} />
                </Route>
                {/* Legacy direct routes (still work) */}
                <Route path="events/:id/reports" element={<ProducerEventReports />} />
                <Route path="events/:id/orders" element={<ProducerEventOrders />} />
                <Route path="events/:id/checkin" element={<ProducerEventCheckin />} />
                <Route path="events/:id/guestlist" element={<ProducerEventGuestlist />} />
                <Route path="events/:id/coupons" element={<ProducerEventCoupons />} />
                <Route path="events/:id/affiliates" element={<ProducerEventAffiliates />} />
                <Route path="events/:id/messages" element={<ProducerEventMessages />} />
                <Route path="inbox" element={<ProducerInbox />} />
                <Route path="interest-lists" element={<ProducerInterestLists />} />
                <Route path="interest-lists/new" element={<ProducerInterestListForm />} />
                <Route path="interest-lists/:id/edit" element={<ProducerInterestListForm />} />
                <Route path="financial" element={<ProducerFinancialPage />} />
                {/* Promoters page removed — promoters are managed per-event inside event panel */}
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
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="events" element={<AdminEvents />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="producers" element={<AdminProducers />} />
                <Route path="producers/:producerId" element={<AdminProducerDetail />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="finance" element={<AdminFinance />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            <MobileBottomNav />
            <Suspense fallback={null}>
              <OnboardingFlow />
            </Suspense>
            <Suspense fallback={null}>
              <SupportChat />
            </Suspense>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
