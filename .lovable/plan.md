# TicketHall — Plano Mestre de Redesign & Implementação

## Documento de Referência
Business Case & Product Design Analysis completo fornecido pelo cliente em 2026-03-06.

---

## Design System Alvo (Novo)
- **Tema**: Dark-first (`#0d0d0d` base, `#1a1a1a`/`#1f1f1f`/`#2c2c2c` superfícies)
- **Cor principal (ação)**: Laranja `#ff472d` — CTAs, badges, ícones ativos, links, bordas de foco
- **Cor secundária (gamificação)**: Verde-lima `#bad900` — pontos, sucesso, confirmações
- **Texto principal**: Branco `#ffffff`
- **Texto secundário**: Cinza claro `#9ca3af`
- **Texto terciário (inativo)**: Cinza médio `#6b7280`
- **Tipografia**: Sora (display) + Inter (body) — já configurado
- **Border radius**: ~12-16px para cards, ~10px para inputs
- **Componentes**: Chips/Pills, Bottom Sheets, Cards com gradiente escuro, Toggle switches

---

## Gap Analysis — Existente vs Documento de Design

### ✅ JÁ IMPLEMENTADO
- Catálogo de eventos com filtros por categoria
- Detalhe do evento com descrição, data, local
- Fluxo de compra (carrinho → checkout → pagamento)
- Meus Ingressos (lista de ingressos ativos)
- QR Code por ingresso
- Transferência de ingresso
- Sistema de reembolso (RefundDialog)
- Cupons de desconto
- Fila virtual
- Certificados pós-evento
- Painel do produtor completo
- Painel admin completo
- Autenticação (login/registro com email)
- Notificações (NotificationBell)
- Blog
- Página do organizador
- LGPD/Privacidade
- Bottom navigation mobile
- Tema claro/escuro com transição animada

### ❌ FEATURES FALTANTES
1. **Onboarding** — 2-3 telas de boas-vindas com skip
2. **Detecção automática de cidade** — GPS
3. **Seletor de datas horizontal** — Barra scrollável no catálogo
4. **Top-10 / Ranking** — Seção editorial com badges numerados
5. **Filtro avançado (Bottom Sheet)** — Sort, range slider, gênero, horário
6. **Grid view toggle** — Lista/grade no catálogo
7. **Rating/Avaliação** — Estrelas + reviews de usuários (tabela + UI)
8. **Random/Discovery** — Evento aleatório
9. **Cast/Elenco** — Seção de artistas no detalhe
10. **Mapa de assentos** — Seleção visual interativa
11. **Sistema de pontos** — Fidelidade no checkout
12. **Favoritos** — Salvar eventos (tabela + UI)
13. **Ingressos arquivados** — Ativo/Arquivado com visual P&B
14. **Chat de suporte** — Bot + quick replies in-app
15. **Perfil completo** — Editar perfil, cidade, pagamentos, notificações
16. **Login OTP** — Código por email/telefone
17. **Login social** — Google, Apple
18. **Compartilhamento** — Share via link
19. **Notificações configuráveis** — SMS/Push/Email toggles
20. **Seções editoriais** — "Novo", "Semana", curadoria

### 🔄 PRECISA REDESIGN VISUAL
- Todas as páginas públicas (landing, catálogo, detalhe, checkout)
- Navbar → Dark-first com laranja
- Bottom Nav → Ícone ativo laranja
- Cards de evento → Fundo #1f1f1f, gradiente, badges
- Botões → Fill laranja, outline cinza
- Inputs → Fundo #1f1f1f, borda #3a3a3a
- Chips → Ativo laranja, inativo borda cinza
- Login/Registro → Redesign completo
- Meus Ingressos → Cards com barcode, ações
- Painéis Producer/Admin → Dark-first

---

## Fases de Implementação

### Fase 1 — Design System Foundation
- [ ] Atualizar index.css (CSS variables nova paleta)
- [ ] Atualizar tailwind.config.ts
- [ ] Atualizar componentes base (Button, Input, Card, Badge, Chips)
- [ ] Navbar dark-first com laranja
- [ ] Bottom Nav com laranja
- [ ] AuthModal redesign dark-first

### Fase 2 — Páginas Públicas (Buyer UX)
- [ ] Landing page redesign
- [ ] Catálogo (seletor datas, chips, banner, Top-10)
- [ ] Detalhe do evento (reviews, cast, CTA fixo)
- [ ] Meus Ingressos (ativo/arquivado, barcode, reembolso)
- [ ] Checkout redesign

### Fase 3 — Features Novas (Prioridade Alta)
- [ ] Favoritos (tabela + UI)
- [ ] Rating/Reviews (tabela + UI)
- [ ] Filtro avançado (Bottom Sheet com Drawer)
- [ ] Grid view toggle
- [ ] Compartilhamento social
- [ ] Perfil completo do usuário
- [ ] Ingressos arquivados

### Fase 4 — Features Avançadas
- [ ] Random/Discovery
- [ ] Sistema de pontos/fidelidade
- [ ] Chat de suporte in-app
- [ ] Onboarding (2-3 telas)
- [ ] Detecção de cidade
- [ ] Notificações configuráveis
- [ ] Login OTP + Social

### Fase 5 — Painéis (Producer/Admin)
- [ ] Redesign dark-first dos dashboards
- [ ] Consistência com novo design system

---

## Infraestrutura Backend (Plano Anterior — Mantido)

### Bloco 1 — Schema & SQL Functions
- Funções atômicas: reserve_tickets, confirm_order_payment, apply_coupon
- Índices de performance

### Bloco 2 — Edge Functions de Pagamento (Asaas)
- create-payment, asaas-webhook, create-producer-account
- Secrets: ASAAS_API_KEY, ASAAS_BASE_URL, QR_SECRET

### Bloco 3 — Checkout Real
- Conectar UI ao create-payment
- PIX, Cartão, Boleto

### Bloco 4 — QR Codes Seguros + Check-in
- JWT assinado, validate-checkin

### Bloco 5 — Transferência + Cancelamento
- transfer-ticket, cancel-event

### Bloco 6 — Cron Jobs
- cleanup_expired_reservations, event-reminders

### Bloco 7 — Segurança & LGPD
- Rate limiting, consents, data requests
