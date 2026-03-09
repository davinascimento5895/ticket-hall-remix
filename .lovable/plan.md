

## Auditoria Completa — Inconsistências Encontradas (Rodada 2)

Analisei novamente todo o codebase após as correções anteriores. Ignorando integrações externas (pagamento, Google, email) como solicitado. Segue o que encontrei:

---

### PRIORIDADE 1 — Bugs Funcionais

**1. Carrinho usa taxa fixa de 7% — ignora taxa individual do evento**
`src/contexts/CartContext.tsx` linha 132: `platformFee = subtotal * (config.platformFeePercent / 100)` usa sempre 7% fixo do `config.ts`. Como agora cada evento pode ter `platform_fee_percent` diferente (configurado pelo admin), o carrinho/checkout mostra a taxa errada. O `BookingFlow` já usa `event.platform_fee_percent`, mas o fluxo via carrinho (EventDetail → Carrinho → Checkout) não.
- **Fix**: O `CartItem` precisa carregar o `platformFeePercent` do evento. Calcular a taxa por item, não globalmente.

**2. Checkout free: `quantity_sold` é sobrescrito em vez de incrementado**
`src/pages/Checkout.tsx` linhas 164-167: para pedidos gratuitos, faz `update({ quantity_sold: item.quantity })` — isso **sobrescreve** o `quantity_sold` com a quantidade do pedido atual em vez de **incrementar**. Se já havia 50 vendidos e o pedido tem 2, fica 2 em vez de 52.
- **Fix**: Usar `quantity_sold: supabase.rpc` ou fazer incremento correto com a quantidade existente. Ou chamar a mesma lógica do `confirm_order_payment`.

**3. Carrinho permite itens de múltiplos eventos sem validação**
`src/contexts/CartContext.tsx`: não há validação. O `Checkout.tsx` usa `items[0]?.eventId` para criar a order. Se o usuário adicionar ingressos de 2 eventos diferentes, todos ficam no mesmo order com event_id errado.
- **Fix**: Ao adicionar item, verificar se já existe item de outro evento no carrinho. Se sim, limpar ou bloquear.

**4. `getFeaturedEvents` em `api.ts` não é mais usada**
A `Index.tsx` faz query inline (linhas 94-110) com join de `ticket_tiers`. A função `getFeaturedEvents()` em `api.ts` continua existindo sem join e sem filtro de data — dead code. Também não filtra eventos passados.
- **Fix**: Remover `getFeaturedEvents` ou atualizar para usar join. A Index.tsx deveria também filtrar `gte("end_date", now)`.

**5. `getFeaturedEvents` na Index.tsx não filtra eventos passados**
`src/pages/Index.tsx` linha 95-101: a query de featured events não tem `.gte("end_date", ...)`. Eventos destaque que já passaram continuam aparecendo na home.
- **Fix**: Adicionar `.gte("end_date", new Date().toISOString())`.

### PRIORIDADE 2 — Inconsistências de Lógica

**6. BookingFlow calcula taxa errada**
`src/components/booking/BookingFlow.tsx` linha 63: `const platformFee = Math.round(subtotal * feePercent) / 100` — a fórmula está errada. Se `feePercent = 7` e `subtotal = 100`, calcula `Math.round(100 * 7) / 100 = 7`. Funciona, mas se `subtotal = 33`, calcula `Math.round(33 * 7) / 100 = Math.round(231) / 100 = 2.31`. OK isso funciona. MAS se for um evento free (subtotal = 0) mas com `feePercent = 7`, a taxa é 0, correto. No entanto, o BookingFlow **não verifica se é free** para pular pagamento — ele sempre vai para "summary" com método de pagamento.
- **Fix**: Se `total === 0`, pular para confirmação direto no BookingFlow também (como já faz no Checkout).

**7. `INTEGRATION_POINT` strings visíveis para usuários**
`src/pages/admin/AdminSettings.tsx` linha 51: mostra "EMAIL_TEMPLATE_INTEGRATION_POINT" para o admin. `src/pages/admin/AdminFinance.tsx` linha 97: mostra "PAYOUT_INTEGRATION_POINT".
- **Fix**: Substituir por mensagens amigáveis como "Em breve" ou "Funcionalidade em desenvolvimento".

**8. Evento rascunho visível no slug pelo produtor mas URL é pública**
`getEventBySlug` agora filtra `status = published`, mas o produtor acessando `/eventos/{slug}` do próprio evento em rascunho vai ver "Evento não encontrado". Isso pode confundir produtores testando.
- **Fix**: Se o usuário logado é o produtor do evento, permitir visualização mesmo em rascunho.

### PRIORIDADE 3 — Problemas Menores

**9. `MeusIngressos` não tem tab "reserved"**
Tickets com status `"reserved"` (pré-pagamento) não são categorizados — caem no else `active.push(ticket)` por default. Ficam misturados com tickets ativos.
- **Fix**: Tickets `reserved` deveriam aparecer em "Pendentes" junto com `pending`.

**10. Carrinho: cupom só valida para `items[0].eventId`**
`src/pages/Carrinho.tsx` linha 23: `const eventId = items[0].eventId` — se de alguma forma houver itens de eventos diferentes, o cupom validaria contra o evento errado.
- **Fix**: Ligado ao item 3. Após bloquear multi-evento no carrinho, esse problema se resolve.

**11. Admin `getAllEvents` join pode falhar**
`src/lib/api-admin.ts` linha 50: `profiles!events_producer_id_fkey(full_name)` — esse join depende de uma FK explícita entre `events.producer_id` e `profiles.id`. Se a FK não existir no schema, o query falha silenciosamente.
- **Fix**: Verificar se a FK existe. Se não, criar migration para adicionar.

**12. `SearchBar` na página `/eventos` redireciona para `/busca`**
A SearchBar na página de Eventos (linha 119-123) redireciona para `/busca?q=...` em vez de filtrar localmente. O usuário perde todos os filtros de data/categoria que tinha selecionado.
- **Fix**: Na página Eventos, usar o input local `search` ao invés do componente SearchBar que redireciona.

---

## Plano de Implementação

### Batch 1 — Bugs críticos
1. **Cart per-event fee**: Adicionar `platformFeePercent` ao `CartItem`, calcular taxa por item no CartContext
2. **Fix quantity_sold overwrite**: No Checkout free, usar incremento correto (ou chamar `confirm_order_payment` RPC)
3. **Single-event cart**: Validar no `addItem` que todos os itens são do mesmo evento
4. **Featured events past filter**: Adicionar `.gte("end_date")` na query da Index.tsx

### Batch 2 — Lógica
5. **BookingFlow free skip**: Se total === 0, pular pagamento e confirmar direto
6. **Integration point strings**: Substituir por mensagens amigáveis no AdminSettings e AdminFinance
7. **Reserved tickets in MeusIngressos**: Categorizar `reserved` como "Pendentes"

### Batch 3 — UX
8. **SearchBar redirect fix**: Na página Eventos, substituir SearchBar por Input local
9. **Remove dead `getFeaturedEvents`**: Limpar api.ts
10. **Producer preview rascunho**: Permitir visualização do próprio evento em rascunho

### Arquivos alterados
- `src/contexts/CartContext.tsx` — fee per item, single-event validation
- `src/pages/Checkout.tsx` — fix quantity_sold increment
- `src/pages/Index.tsx` — add end_date filter
- `src/components/booking/BookingFlow.tsx` — free event skip
- `src/pages/MeusIngressos.tsx` — reserved status handling
- `src/pages/admin/AdminSettings.tsx` — friendly messages
- `src/pages/admin/AdminFinance.tsx` — friendly messages
- `src/pages/Eventos.tsx` — local search instead of redirect
- `src/lib/api.ts` — remove dead function
- `src/pages/EventDetail.tsx` — producer preview logic

