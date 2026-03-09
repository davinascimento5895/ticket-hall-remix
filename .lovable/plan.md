

# Varredura Completa — TicketHall

## PARTE 1: Bugs Críticos (Bloqueia Funcionalidade)

### 1.1 Trigger `on_auth_user_created` NÃO EXISTE
A function `handle_new_user()` existe, mas o trigger no `auth.users` **não foi aplicado** (Cloud não permite triggers em schemas reservados como `auth`). Isso significa que **nenhum novo usuário terá profile nem role `buyer` criados automaticamente**. O AuthContext consulta `profiles` e `user_roles` — sem eles, o usuário fica sem role/profile.

**Correção:** Mover a lógica para o lado do cliente. Após signup/login, verificar se `profiles` tem registro para o `user.id` e, se não, inserir profile + buyer role via edge function (usando service role key). Alternativa: usar a `become-producer` edge function como modelo e criar `ensure-user-profile`.

### 1.2 ProducerSettings "Bancário" salva em campos inexistentes
A aba "Bancário" do `ProducerSettings` tenta salvar `bank_pix_key`, `bank_name`, `bank_agency`, `bank_account` na tabela `profiles` — esses campos **não existem**. A tabela `bank_accounts` foi criada exatamente para isso, mas o Settings antigo não a usa.

**Correção:** Substituir a aba "Bancário" no ProducerSettings para usar a tabela `bank_accounts` (como já faz `ProducerBankAccounts`), ou redirecionar para `/producer/financial` tab "bank".

### 1.3 Admin Settings não está registrado no Router
`AdminSettings` existe como componente mas **não tem rota** no `App.tsx`. Não pode ser acessado.

**Correção:** Adicionar `<Route path="settings" element={<AdminSettings />} />` dentro do bloco admin.

---

## PARTE 2: Integrações Incompletas

### 2.1 Guestlist e Orders ausentes do Event Panel
As tabs Guestlist e Orders existem como páginas legacy (`/producer/events/:id/guestlist`, `/producer/events/:id/orders`) mas **não estão no EventPanel**. O produtor não tem acesso direto a elas pelo painel unificado.

**Correção:** Adicionar tabs "Pedidos" e "Guest List" ao `ProducerEventPanel` TABS array e registrar os sub-routes correspondentes.

### 2.2 Bulk Messages não envia e-mails
O `sendBulkMessage` em `api-producer.ts` apenas atualiza o status para "queued" localmente. Não existe edge function `send-bulk-message`. O toast já avisa "será disponibilizado em breve", mas precisa ser implementado.

**Correção:** Criar edge function `send-bulk-message` que lê destinatários da tabela `tickets` (por `event_id` + filtro de tier) e envia e-mails. Alternativamente, integrar com Resend/Mailgun — precisa de API key.

### 2.3 Coupons: formulário de criação incompleto
O formulário de criação de cupons (`ProducerEventCoupons`) só permite definir código, tipo de desconto, valor e limite de usos. **Faltam:** `valid_from`, `valid_until`, `min_order_value`, `applicable_tier_ids` — campos que o banco suporta e o carrinho valida.

**Correção:** Expandir o formulário para incluir data de início/fim, valor mínimo do pedido e seletor de tiers aplicáveis.

### 2.4 Affiliates (tabela legacy) ainda existe e é referenciada
A tabela `affiliates` ainda existe e `trackAffiliateClick` em `api.ts` escreve nela. Mas o novo sistema usa `promoter_events`. O `EventDetail` chama ambos (`trackAffiliateClick` + `setTrackingCode`), criando dados duplicados.

**Correção:** Remover chamada a `trackAffiliateClick` do `EventDetail`, atualizar para incrementar `clicks` em `promoter_events` (buscar pelo `tracking_code`). A tabela `affiliates` pode ser mantida como legacy read-only.

---

## PARTE 3: Gaps de UX/UI

### 3.1 Checkout "Voltar" do Step 1 recria order
Se o usuário clica "Voltar" no passo de pagamento (step 1 → step 0), o `handleCreateOrder` será chamado novamente ao avançar, criando um **novo pedido** sem cancelar o anterior. As reservas do pedido anterior ficam presas até expirar.

**Correção:** Se `orderId` já existe, pular a criação do order ao avançar novamente. Adicionar check `if (orderId) { setStep(1); return; }`.

### 3.2 Redirecionamento após reset de senha aponta para rota inexistente
O `handleForgotPassword` redireciona para `/reset-password`, mas essa rota não existe no router. Deveria ser `/meu-perfil/alterar-senha` ou um handler em `/auth/callback`.

**Correção:** Mudar redirectTo para `${window.location.origin}/meu-perfil/alterar-senha` ou criar rota `/reset-password`.

### 3.3 Falta confirmação antes de deletar (eventos, cupons, promoters)
Deletar promoters, cupons, e guest list entries não pede confirmação. Um clique acidental exclui permanentemente.

**Correção:** Adicionar `AlertDialog` de confirmação antes de mutações de delete.

### 3.4 Mobile: Event Panel tabs em dropdown oculta contexto
O EventPanel mobile usa dropdown para navegar entre tabs. Funciona, mas perde contexto visual. Alternativa: horizontal scroll com pills (já usada no ProducerEventPanel desktop).

---

## PARTE 4: Dados e Integridade

### 4.1 `promoter_events.tracking_code` precisa de UNIQUE constraint
Dois promoters vinculados ao mesmo evento poderiam ter o mesmo `tracking_code` acidentalmente. O Checkout busca por `tracking_code + event_id`, mas sem unique constraint, pode retornar ambíguo.

**Correção:** Migration `ALTER TABLE promoter_events ADD CONSTRAINT promoter_events_tracking_code_event_id_key UNIQUE (tracking_code, event_id);`

### 4.2 Falta FK em orders.promoter_event_id
A coluna existe mas a migration pode não ter aplicado o FK constraint.

**Verificação necessária.** Se não existir, adicionar `ALTER TABLE orders ADD CONSTRAINT orders_promoter_event_id_fkey FOREIGN KEY (promoter_event_id) REFERENCES promoter_events(id);`

### 4.3 Comissão não é revertida em reembolso
Quando um order é reembolsado (via `asaas-webhook` PAYMENT_REFUNDED), os registros de `promoter_commissions` não são cancelados e `promoter_events` stats não são decrementados.

**Correção:** No webhook de reembolso, atualizar `promoter_commissions` para `status = 'cancelled'` e decrementar `promoter_events.revenue_generated`, `conversions`, `commission_total`.

---

## PARTE 5: Performance e Robustez

### 5.1 Dashboard do produtor faz queries em cascata
`getProducerDashboardStats` faz 3 queries sequenciais. Poderia ser paralelizado com `Promise.all`.

### 5.2 Reconciliação de eventos não pagina
`getEventReconciliation` busca TODOS os orders de TODOS os eventos do produtor. Para produtores com muitos eventos, isso pode ultrapassar o limite de 1000 rows.

### 5.3 Falta `staleTime` em várias queries
Queries como `event-tiers-all`, `event-participants`, `event-financial-orders` não definem `staleTime`, causando refetches desnecessários.

---

## Plano de Implementação (ordenado por prioridade)

### Sprint 1 — Críticos
1. **Criar edge function `ensure-user-profile`** — chamada após login/signup para garantir profile + role
2. **Fix ProducerSettings bancário** — usar tabela `bank_accounts` em vez de campos inexistentes
3. **Adicionar rota AdminSettings** ao App.tsx
4. **Fix duplicate order on back** — skip `handleCreateOrder` se `orderId` já existe
5. **Adicionar UNIQUE constraint** em `promoter_events(tracking_code, event_id)`

### Sprint 2 — Integrações
6. **Adicionar tabs Orders e Guestlist** ao EventPanel
7. **Expandir formulário de cupons** (datas, valor mínimo, tiers)
8. **Unificar affiliate tracking** — remover `trackAffiliateClick`, incrementar clicks no `promoter_events`
9. **Fix redirectTo de reset de senha**
10. **Reverter comissões em reembolso** no webhook

### Sprint 3 — Polish
11. **Confirmação de delete** em ações destrutivas
12. **Paralelizar queries** do dashboard
13. **Paginar reconciliação** de eventos
14. **Adicionar staleTime** nas queries principais

