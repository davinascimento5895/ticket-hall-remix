

# Análise de Ponta a Ponta — Marketplace de Revenda

## Bugs Encontrados

### Críticos

**1. `purchase-resale` não tem `verify_jwt = false` no config.toml**
O `config.toml` contém apenas `project_id`. Sem a entrada `[functions.purchase-resale] verify_jwt = false`, a edge function provavelmente falha na invocação porque o JWT é verificado antes do handler executar, mas o código já faz validação manual do token. Isso pode causar erro 401 ou deploy issues.

**2. Sem pagamento real — transferência direta sem cobrança**
O `purchase-resale` transfere o ticket imediatamente ao comprador sem integração de pagamento. O botão "Confirmar compra" simplesmente chama a edge function que move o ticket sem cobrar nada. O comprador recebe o ingresso de graça. Isso é o bug mais grave do fluxo — deveria integrar com o gateway de pagamento existente (Asaas) ou ao menos ter um fluxo de pending/confirmação.

**3. Race condition na compra concorrente**
Dois compradores podem clicar "Comprar" ao mesmo tempo. O código verifica `status = 'active'` na query e depois faz UPDATE com `WHERE status = 'active'`, mas entre o SELECT e o UPDATE outro processo pode completar a compra. Sem `FOR UPDATE` ou transaction, é possível vender o mesmo ticket duas vezes. O Supabase JS client não suporta `FOR UPDATE` — precisaria de uma database function.

### Intermediários

**4. Filtro de busca quebrado no `getResaleListings`**
A linha `.or('events.title.ilike.%${search}%', { foreignTable: "events" })` não funciona com PostgREST. O parâmetro `foreignTable` no `.or()` não é suportado dessa forma. A busca por nome de evento provavelmente retorna erro ou resultados incorretos.

**5. `original_price` não é validado no backend**
O anti-cambismo (preço <= original) é validado apenas no frontend (`ResaleListingModal`). Um usuário mal-intencionado pode chamar `createResaleListing` diretamente com qualquer `askingPrice`. A edge function `purchase-resale` também não valida isso.

**6. Sem validação de ticket duplicado**
Um usuário pode criar múltiplos listings para o mesmo ticket. A tabela `resale_listings` não tem constraint UNIQUE em `(ticket_id, status)` para status `active`. Embora o frontend marque `is_for_resale = true` e esconda o botão, a API permite duplicatas.

**7. Console warnings de refs**
Os logs mostram "Function components cannot be given refs" para `Skeleton` e `EmptyState` no `Revenda.tsx`. `EmptyState` recebe `icon={<Repeat className="h-12 w-12" />}` como ReactNode, mas o componente tenta verificar se é um componente e pode forçar ref. Não quebra funcionalidade mas polui o console.

### Leves

**8. `getMyTickets` não inclui `is_resellable` do tier**
A query de tickets em `api.ts` seleciona `ticket_tiers(name, price)` mas não inclui `is_resellable` nem `is_transferable`. No `MeusIngressos`, a condição `ticket.ticket_tiers?.is_resellable !== false` sempre será `true` porque o campo nunca é carregado — todos os tickets aparecem como revendáveis.

**9. Sem `staleTime` nas queries de revenda**
`resale-listings` e `my-resale-listings` não têm `staleTime`, causando refetch a cada foco de janela.

**10. Listagem pública sem filtro de evento expirado**
`getResaleListings` filtra por `expires_at > now()` mas não verifica se `events.start_date > now()`. Listings de eventos que já começaram mas cuja `expires_at` ainda não passou aparecem no marketplace.

**11. Seller UPDATE policy muito restritiva**
A policy `"Sellers can update their own listings"` tem `WITH CHECK (auth.uid() = seller_id)` mas não restringe quais campos podem ser alterados. Um seller poderia alterar `buyer_id`, `sold_at`, etc. via client — risco baixo mas inconsistente.

**12. `cancelResaleListing` não verifica ownership**
A função client-side faz UPDATE direto sem verificar se o caller é o seller. A RLS protege, mas se falhar silenciosamente o ticket fica marcado como `is_for_resale = true` para sempre.

---

## Plano de Correção

### Batch 1 — Críticos
1. Adicionar `[functions.purchase-resale] verify_jwt = false` ao config.toml — **não posso editar config.toml** (auto-gerenciado), mas a edge function precisa existir no deploy
2. Adicionar validação anti-cambismo no backend (edge function): rejeitar se `asking_price > original_price` no tier
3. Criar database function `purchase_resale_atomic` com `FOR UPDATE` para prevenir race condition
4. Documentar que pagamento real está pendente (placeholder) — ou integrar com Asaas

### Batch 2 — Intermediários
5. Corrigir filtro de busca: usar `ilike` direto na coluna do join ou filtrar client-side
6. Adicionar UNIQUE partial index: `CREATE UNIQUE INDEX ON resale_listings(ticket_id) WHERE status = 'active'`
7. Incluir `is_resellable, is_transferable` na query de `getMyTickets`

### Batch 3 — Leves
8. Adicionar `staleTime: 30_000` nas queries de revenda
9. Filtrar eventos já iniciados no `getResaleListings`
10. Corrigir ref warnings do EmptyState/Skeleton

