

# Varredura Final — Problemas Restantes no TicketHall

## Status: O que já foi corrigido
- Auth profile via edge function `ensure-user-profile` -- OK
- ProducerSettings bancário usando `bank_accounts` -- OK
- AdminSettings rota registrada -- OK
- Checkout duplicate order on back -- OK
- UNIQUE constraint em `promoter_events(tracking_code, event_id)` -- OK
- Tabs Orders e Guestlist no EventPanel -- OK
- Formulário de cupons expandido (datas, valor mínimo, tiers) -- OK
- Tracking code capturado no checkout e EventDetail -- OK
- Comissões automáticas via trigger -- OK
- Reversão de comissões no webhook de reembolso -- OK
- Dashboard queries parallelizadas -- OK
- AlertDialog em cupons -- OK
- redirectTo de reset de senha corrigido -- OK

---

## Problemas Restantes (7 itens)

### 1. `trackAffiliateClick` ainda existe e é dead code
`src/lib/api.ts` linha ~261 contém `trackAffiliateClick()` que escreve na tabela `affiliates` (sistema legado). Ninguém chama mais essa função (EventDetail foi atualizado para usar `promoter_events`), mas a função e a tabela continuam existindo como código morto.

**Correção:** Remover a função `trackAffiliateClick` de `api.ts`.

### 2. Promoters List: delete sem confirmação
`ProducerPromotersList.tsx` linha 126 — o botão de deletar promoter chama `deleteMut.mutate(p.id)` diretamente, sem `AlertDialog` de confirmação. Um clique acidental remove permanentemente o promoter e todos seus vínculos.

**Correção:** Adicionar `AlertDialog` de confirmação antes de deletar, como já feito em `ProducerEventCoupons`.

### 3. Event Reconciliation sem paginação (risco de 1000 rows)
`getEventReconciliation` busca TODOS os orders de todos os eventos do produtor em uma única query. Produtores com muitos eventos/pedidos podem ultrapassar o limite de 1000 rows do Supabase, resultando em dados incompletos silenciosamente.

**Correção:** Paginar a query de orders na reconciliação, iterando com `.range()` até esgotar os resultados, ou agrupar no banco via RPC.

### 4. Falta `staleTime` nas queries do producer
As queries do painel do produtor (`producer-dashboard`, `event-coupons`, `promoters`, `promoter-events`, `event-reconciliation`, `bank-accounts`, `financial-transactions`) não definem `staleTime`, causando refetches desnecessários a cada foco de janela. As queries do admin já têm `staleTime: 30_000`.

**Correção:** Adicionar `staleTime: 30_000` nas queries principais do producer.

### 5. `AlterarSenha` não detecta fluxo de recovery
A página `/meu-perfil/alterar-senha` é usada tanto para alteração manual de senha quanto como destino do link de recovery por e-mail. Porém, ela está dentro de `ProtectedRoute`, o que significa que se o usuário não estiver logado e clicar no link de recovery, será redirecionado para login. Além disso, o `AlterarSenha` não verifica se há um token `type=recovery` na URL hash — ele simplesmente mostra o formulário.

**Correção:** Criar uma rota pública `/reset-password` (fora do `ProtectedRoute`) que detecta o token de recovery via `supabase.auth.onAuthStateChange` com evento `PASSWORD_RECOVERY`, e então permite a alteração. Manter `/meu-perfil/alterar-senha` para alteração manual quando logado.

### 6. ProducerEventPromoters: delete sem confirmação
`ProducerEventPromoters.tsx` — o botão de remover vínculo promoter-evento provavelmente não tem `AlertDialog` (preciso confirmar, mas o padrão do código sugere que não).

**Correção:** Adicionar `AlertDialog` de confirmação.

### 7. Guest list delete sem confirmação
`ProducerEventGuestlist.tsx` — remover convidados da guest list provavelmente não pede confirmação.

**Correção:** Adicionar `AlertDialog` de confirmação.

---

## Plano de Implementação

### Batch 1 — Segurança e Integridade
1. Adicionar `AlertDialog` em `ProducerPromotersList` (delete promoter)
2. Adicionar `AlertDialog` em `ProducerEventPromoters` (remover vínculo)
3. Remover `trackAffiliateClick` de `api.ts` (dead code)

### Batch 2 — Robustez
4. Paginar reconciliação de eventos (loop com `.range()`)
5. Adicionar `staleTime: 30_000` nas queries do producer

### Batch 3 — Auth Recovery
6. Criar rota pública `/reset-password` com detecção de token recovery
7. Atualizar `AuthModal.handleForgotPassword` para `redirectTo: /reset-password`

