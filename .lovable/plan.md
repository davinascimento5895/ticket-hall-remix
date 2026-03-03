

## Status do Projeto vs. Mega-Prompt

### O que JÁ foi feito:
1. **Database** — Todas as 11 tabelas criadas com RLS policies
2. **Auth** — AuthContext, AuthModal (email/password), ProtectedRoute
3. **Landing page** (`/`) — Hero, trust bar, featured events, FAQ, footer
4. **`/produtores`** — Hero, fee comparison, features, calculator, steps
5. **`/eventos`** — Grid com mock data, search bar
6. **API layer** (`lib/api.ts`) — Funções para events, orders, tickets, coupons, waitlist, notifications
7. **Componentes base** — EventCard, StatsCard, FeeCalculator, Navbar, Footer, TicketHallLogo
8. **Design system** — Cores, tipografia, dark mode

### O que FALTA (em ordem de prioridade):

#### Bloco 1 — Páginas públicas restantes
- **`/eventos/:slug`** — Página de detalhe do evento (cover, tabs, ticket tiers, share, sticky CTA)
- **`/carrinho`** — Carrinho com CartContext, countdown 15min, cupom, resumo
- **`/checkout`** — Wizard 3 etapas (dados, pagamento placeholder, confirmação)
- **`/meus-ingressos`** — Dashboard do comprador com tabs e QR modal
- **`/transferir/:ticketId`** — Formulário de transferência
- **`/lista-de-espera/:eventId`** — Formulário de waitlist

#### Bloco 2 — Painel do Produtor
- **`/producer/dashboard`** — Métricas, pedidos recentes, ações rápidas
- **`/producer/events`** — Lista de eventos do produtor
- **`/producer/events/new`** e **`/producer/events/:id/edit`** — Wizard de criação/edição (5 etapas)
- **`/producer/events/:id/reports`** — Analytics com gráficos (recharts)
- **`/producer/events/:id/orders`** — Tabela de pedidos
- **`/producer/events/:id/checkin`** — Dashboard de check-in com QR scanner placeholder
- **`/producer/events/:id/guestlist`** — Gerenciador de lista de convidados
- **`/producer/events/:id/coupons`** — Gerenciador de cupons
- **`/producer/settings`** — Configurações do produtor

#### Bloco 3 — Painel Admin
- **`/admin/dashboard`** — Métricas da plataforma com gráficos
- **`/admin/events`** — Todos os eventos
- **`/admin/users`** — Gestão de usuários
- **`/admin/producers`** — Gestão de produtores (fila de aprovação)
- **`/admin/orders`** — Todos os pedidos
- **`/admin/finance`** — Dashboard financeiro
- **`/admin/settings`** — Configurações da plataforma

#### Bloco 4 — Componentes e infraestrutura
- **Componentes faltantes:** TicketCard, TicketTierCard, OrderStatusBadge, QRCodeModal, CountdownTimer, ProducerEventCard, DataTable, EmptyState, LoadingSkeleton, NotificationBell
- **CartContext** — Context + localStorage para carrinho
- **Edge Functions (stubs):** send-ticket-email, generate-qr-code, process-waitlist, sync-offline-checkins, calculate-producer-payout
- **Realtime subscriptions** — check-in, analytics, ticket availability, order status
- **SEO** — Meta tags dinâmicas por evento (og:image, JSON-LD)
- **Busca** — Filtros funcionais na `/eventos` (categoria, cidade, preço, data) com Supabase
- **Mobile** — Bottom nav bar para usuários logados, sticky CTA mobile

### Recomendação de próximo passo

O próximo bloco lógico é o **Bloco 1: Event Detail + Cart + Checkout + Meus Ingressos**, pois é o fluxo central de compra (core business flow). Isso inclui:

1. **Criar `/eventos/:slug`** — página de detalhe com cover image, tabs (Descrição, Ingressos, Local, Organizador), ticket tier cards com quantity selector, sticky CTA, share buttons, related events
2. **Criar CartContext** — estado do carrinho em localStorage com validação de disponibilidade
3. **Criar `/carrinho`** — lista de tickets, cupom, countdown 15min, resumo com taxa de 7%
4. **Criar `/checkout`** — wizard de 3 etapas com placeholders de pagamento
5. **Criar `/meus-ingressos`** — dashboard do comprador com QR modal
6. **Criar componentes:** TicketTierCard, TicketCard, QRCodeModal, CountdownTimer, OrderStatusBadge, EmptyState

Todos com textos em pt-BR, design limpo (sem gradientes exagerados), e chamadas via `lib/api.ts`.

Devo prosseguir com este bloco?

