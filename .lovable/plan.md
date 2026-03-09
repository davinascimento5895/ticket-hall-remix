

# Auditoria Geral — Estado Atual do TicketHall

## O que está funcionando

A base da bilheteria está sólida:
- **Criação de eventos** com formulário multi-step completo (tipo, informações, local, ingressos, formulário, produtos, configurações, revisão)
- **Tiers de ingressos** com tipos pagos/gratuitos/doação, códigos de desbloqueio, meia-entrada, visibilidade
- **Carrinho e Checkout** com timer de expiração, cupons de desconto, reserva atômica via RPC
- **Pedidos gratuitos** confirmados automaticamente via `confirm_order_payment`
- **Meus Ingressos** com tabs (ativos, pendentes, cancelados, encerrados, arquivados), QR Code, transferência
- **Favoritos** funcionando com tabela e RLS corretos
- **Reviews** funcionando com tabela `event_reviews` e RLS
- **Check-in** público via QR com listas de check-in
- **Painel do produtor** com dashboard, ingressos, participantes, financeiro, mensagens, cupons, afiliados
- **Painel admin** com dashboard, eventos, usuários, produtores, pedidos, financeiro
- **Rotas protegidas** para checkout, perfil, favoritos, certificados, ingressos
- **Slug único** com `generateUniqueSlug` para novos eventos
- **Limpeza de reservas** via cron `cleanup_expired_reservations`
- **FAQ** dedicada em `/faq`
- **Auth callback** em `/auth/callback`
- **Bloqueio de publicação** para produtores não aprovados

## Problemas Remanescentes

### 1. Console Warning: SupportChat forwardRef (ativo agora)
O `SupportChat` usa `motion.div` dentro de `AnimatePresence` sem `forwardRef`, gerando warning em toda página. Precisa converter o componente filho do `AnimatePresence` para usar `motion.div` com key, ou envolver em `forwardRef`.

### 2. Carrinho não protege contra multi-evento de forma clara
O `CartContext.addItem` silenciosamente descarta itens do evento anterior quando um novo evento é adicionado. O usuário perde itens sem feedback. Deveria mostrar um aviso/confirmação.

### 3. Checkout não redireciona para login proativamente
O `/checkout` está protegido via `ProtectedRoute`, mas o `/carrinho` não está. Um usuário não logado pode navegar no carrinho e clicar "Finalizar compra" — aí é redirecionado para login e perde o contexto. Melhor: mostrar aviso no carrinho.

### 4. Falta unique constraint em event_reviews
O `upsert` em `EventReviews` usa `onConflict: "user_id,event_id"`, mas não há unique constraint visível no schema para essa combinação. O upsert pode falhar.

### 5. Ticket `attendee_name/email/cpf` — campos não visíveis no types.ts
O checkout salva `attendee_name`, `attendee_email`, `attendee_cpf` nos tickets, mas esses campos podem não existir na tabela (truncado no schema). Se não existirem, o update silenciosamente falha.

### 6. `event-images` bucket existe mas código referencia `event-covers`
O storage bucket chama-se `event-images` (confirmado). O código usa `event-images` — OK, isso está correto.

### 7. Realtime no `orders` para checkout
O checkout escuta `postgres_changes` na tabela `orders`, mas a tabela não está adicionada ao `supabase_realtime` publication. O listener pode não receber atualizações de pagamento.

---

## Plano de Correções

### Correção 1 — Fix SupportChat forwardRef warning
Envolver o componente `motion.div` do chat em um wrapper com `forwardRef` para eliminar o warning.

### Correção 2 — Carrinho: feedback ao trocar de evento
No `CartContext.addItem`, quando `prev[0].eventId !== item.eventId`, mostrar toast avisando que o carrinho anterior foi limpo.

### Correção 3 — Carrinho: aviso de login antes do checkout
No `Carrinho.tsx`, se o usuário não está logado, mostrar mensagem junto ao botão "Finalizar compra" indicando que precisará fazer login.

### Correção 4 — Unique constraint para reviews
Criar migration adicionando `UNIQUE(user_id, event_id)` na tabela `event_reviews`.

### Correção 5 — Verificar/criar campos attendee em tickets
Criar migration para adicionar `attendee_name`, `attendee_email`, `attendee_cpf` na tabela `tickets` se não existirem.

### Correção 6 — Habilitar realtime para orders
Criar migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;`

