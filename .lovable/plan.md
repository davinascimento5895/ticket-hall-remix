

# Varredura Completa — Problemas Restantes no TicketHall

## Status: Tudo que já foi corrigido
Auth profile (ensure-user-profile) ✓ | Banking UI (bank_accounts) ✓ | AdminSettings rota ✓ | Duplicate order fix ✓ | UNIQUE constraint promoter_events ✓ | Tabs Orders/Guestlist no EventPanel ✓ | Formulário cupons expandido ✓ | Tracking code no checkout ✓ | Comissões automáticas via trigger ✓ | Reversão de comissões no webhook ✓ | Dashboard parallelizado ✓ | AlertDialog em cupons ✓ | AlertDialog em promoters/guestlist ✓ | trackAffiliateClick removido ✓ | Reconciliação paginada ✓ | staleTime em promoters/guestlist/reconciliation ✓ | ResetPassword rota pública ✓

---

## Problemas Restantes (6 itens)

### 1. `staleTime` ausente em várias queries do producer
As seguintes páginas do producer ainda não têm `staleTime`, causando refetches a cada foco de janela:
- `ProducerDashboard` (query `producer-dashboard`)
- `ProducerEvents` (query `producer-events`)
- `ProducerEventCoupons` (queries `event-coupons`, `producer-event`)
- `ProducerEventCheckin` (queries `producer-event`, `event-tickets-checkin`)
- `ProducerCashFlow` (query `cash-flow`)
- `ProducerAccountsPayable` (query `financial-payable`)
- `ProducerAccountsReceivable` (query `financial-receivable`)
- `ProducerBankAccounts` (query `bank-accounts`)
- `ProducerPromoterCommissions` (queries `promoters`, `promoter-commissions`)
- `ProducerPromoterRanking` (queries `producer-events`, `promoter-ranking`)
- `ProducerEventPanel` (query `producer-event-panel`)
- `ProducerEventTicketsTab` (queries `event-tiers-tab`, `event-ticket-stats`)
- `ProducerSettings` (query `bank-accounts`)
- `ProducerInterestLists` (query `interest-lists`)

**Correção:** Adicionar `staleTime: 30_000` em todas essas queries.

### 2. Legacy affiliates API ainda existe em `api-producer.ts`
As funções `getEventAffiliates`, `createAffiliate`, `deleteAffiliate`, `toggleAffiliate` (linhas 360-398) ainda existem no `api-producer.ts`, escrevendo na tabela `affiliates` (sistema depreciado). Embora não sejam mais chamadas pelo EventDetail, o `ProducerEventAffiliates` pode ainda usá-las.

**Correção:** Verificar se `ProducerEventAffiliates` ainda importa essas funções. Se sim, atualizar para redirecionar para o novo sistema. Remover as funções legacy de `api-producer.ts`.

### 3. `sendBulkMessage` é stub — não envia e-mails
`api-producer.ts` linha 452: `sendBulkMessage` apenas marca como "queued" sem enviar nada. O TODO está documentado. Sem edge function nem integração de e-mail.

**Correção:** Esse é um gap conhecido mas de prioridade menor. Documentar como "em desenvolvimento" na UI para o produtor saber que mensagens não são entregues de fato.

### 4. `ProducerEventAffiliates` duplica funcionalidade com `ProducerEventPromoters`
A página de afiliados legada ainda existe e pode usar a tabela `affiliates`. O sistema novo usa `promoter_events`. Precisa redirecionar ou unificar.

**Correção:** Fazer `ProducerEventAffiliates` redirecionar para a tab Promoters do EventPanel.

### 5. Orders não têm policy de UPDATE pelo buyer
A tabela `orders` não tem RLS policy permitindo UPDATE pelo buyer. Quando o Checkout tenta `update({ status: "cancelled" })` ao detectar cupom inválido ou ingressos esgotados, a operação falha silenciosamente.

**Correção:** Adicionar RLS policy: "Buyers can update their pending orders" — `FOR UPDATE USING (auth.uid() = buyer_id AND status = 'pending')`.

### 6. `notifications` não permite INSERT por ninguém (exceto admin via has_role)
A tabela `notifications` não tem INSERT policy. O webhook usa service role key, então funciona. Porém, se alguma lógica client-side tentasse criar notificações, falharia. Atualmente não é problema, mas é uma inconsistência.

**Correção (baixa prioridade):** Manter como está — notificações devem ser criadas server-side.

---

## Plano de Implementação

### Batch 1 — staleTime global
Adicionar `staleTime: 30_000` em todas as queries de producer listadas no item 1 (14 arquivos, mudanças simples).

### Batch 2 — Cleanup legacy affiliates
1. Fazer `ProducerEventAffiliates` redirecionar para `/producer/events/:id/panel/promoters`
2. Remover `getEventAffiliates`, `createAffiliate`, `deleteAffiliate`, `toggleAffiliate` de `api-producer.ts`
3. Atualizar `sendBulkMessage` para mostrar toast "em desenvolvimento" na UI

### Batch 3 — RLS fix
4. Migration: adicionar RLS policy em `orders` para UPDATE por buyer em pedidos pending

