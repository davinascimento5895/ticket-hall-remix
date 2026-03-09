

## Auditoria Geral — Inconsistências e Problemas Encontrados

### Problemas Críticos (Funcionalidade Quebrada)

**1. Filtro de preço na Busca é placeholder**
`Busca.tsx` linha 107-108: comentário explícito "Price filtering would need ticket_tiers join — skip for now, presets are UX placeholders". Os filtros de preço (até R$100, até R$200, a partir de R$200) aparecem na UI mas não fazem nada.
- **Fix**: Join `ticket_tiers` na query da busca para obter `min_price` por evento e filtrar client-side.

**2. Filtro "Maior avaliação" é placeholder**
`SearchFilters.tsx` tem opção "rating" no sort, mas não existe tabela de reviews/ratings no banco. Selecionar "Maior avaliação" não faz nada.
- **Fix**: Remover opção até implementar sistema de avaliações, ou implementar tabela `event_reviews`.

**3. Filtro "Ofertas" é frágil**
`Busca.tsx` linha 120-124: sort por "deals" apenas verifica se `category === "deals"`. Não há conceito real de "oferta" (ex: `original_price > price` nos tiers).
- **Fix**: Calcular ofertas reais baseado em `ticket_tiers.original_price` vs `price`.

**4. Cupom no BookingFlow é TODO**
`BookingFlow.tsx` linha 241: `onApplyCoupon={() => {/* TODO: validate coupon */}}`. O botão "Aplicar" cupom no novo fluxo de booking não faz absolutamente nada.
- **Fix**: Chamar `validateCoupon()` da API e atualizar o `discount` state.

**5. Parcelas no BookingSummaryStep sem juros corretos**
`BookingSummaryStep.tsx` linha 227-229: mostra `{n}x de {fmt(total / n)}` — divisão simples sem usar a função `getInstallmentOptions()` que já existe em `api-payment.ts` com cálculo de juros compostos após 3x.
- **Fix**: Usar `getInstallmentOptions(total)` para exibir parcelas corretas.

**6. Dois fluxos de checkout coexistem sem clareza**
Existe o `/checkout` (via carrinho) E o `BookingFlow` (via página do evento). O carrinho ainda aponta para `/checkout` (`Carrinho.tsx` linha 144), mas o `BookingFlow` cria orders diretamente. Se o usuário adiciona ao carrinho e vai pelo checkout antigo, funciona. Se clica "Comprar ingresso" no evento, usa o novo flow. Inconsistência de experiência.
- **Fix**: Decidir se mantém ambos ou migra tudo para o BookingFlow.

**7. `priceFrom` sempre 0 no EventCard**
`Eventos.tsx` linha 284 e `Busca.tsx` linha 264: `priceFrom={0}` está hardcoded. O card nunca mostra o preço real do evento.
- **Fix**: Fazer join com `ticket_tiers` para pegar `MIN(price)` por evento.

### Problemas Médios (UX/Lógica)

**8. Horário do evento calculado corretamente, mas edge case com UTC**
`Busca.tsx` `getTimeOfDay()` usa `getHours(new Date(dateStr))` — isso converte para horário local do browser, o que é correto. Porém, se o `start_date` no banco for UTC (e.g., `2026-03-10T23:00:00Z` = 20h BRT), o cálculo funciona. Apenas documentar que os timestamps no banco devem ser UTC.

**9. `MainLayout` esconde navbar para /evento/ mas rota é /eventos/:slug**
`MainLayout.tsx` linha 16: `"/evento/"` está na lista de paths escondidos, mas a rota real é `/eventos/:slug` (com "s"). O path `/evento/` nunca é usado.
- **Fix**: Corrigir para `/eventos/` (já coberto pelo `/eventos` na linha anterior, mas o `/evento/` é dead code).

**10. Admin `getAllEvents` usa foreign key que pode não existir**
`api-admin.ts` linha 60: `profiles!events_producer_id_fkey(full_name)`. Isso assume que existe uma foreign key nomeada `events_producer_id_fkey`, mas pelo schema mostrado, `events.producer_id` não tem FK declarada para profiles. Se a FK não existe no DB, essa query pode falhar silenciosamente.
- **Fix**: Verificar se a FK existe; se não, criar via migration.

**11. `ProtectedRoute` redireciona buyer para `/meus-ingressos`**
`ProtectedRoute.tsx` linha 34: quando buyer tenta acessar rota protegida (producer/admin), redireciona para `/meus-ingressos` — deveria ser `/eventos` para consistência com a nova navegação.
- **Fix**: Mudar redirectMap buyer para `/eventos`.

**12. Checkout antigo (`/checkout`) não protege contra produto com tierId "product-"**
Quando chama `reserve_tickets` com um tierId como `"product-abc123"`, o RPC vai falhar porque esse UUID não existe na tabela `ticket_tiers`. `Checkout.tsx` linha 100 itera sobre todos os items incluindo products.
- **Fix**: Filtrar items de produto antes de chamar `reserve_tickets`.

**13. Mapa "Em breve" no detalhe do evento**
`EventDetail.tsx` linha 347-349: seção de local mostra "Mapa em breve" como placeholder estático.
- **Fix**: Integrar Google Maps embed ou pelo menos um link para Google Maps.

### Problemas Menores (Polish)

**14. `Eventos.tsx` mostra `pt-24` padding top mesmo quando navbar está escondida**
Quando logado no mobile, a navbar é escondida mas a página ainda tem `pt-24`, criando espaço vazio excessivo no topo.
- **Fix**: Usar padding condicional ou reduzir para `pt-4` quando navbar está escondida.

**15. `MeusIngressos.tsx` também tem `pt-24`**
Mesmo problema — padding excessivo quando sem navbar.
- **Fix**: Mesma solução.

**16. `Carrinho.tsx` tem `pt-24` quando navbar pode estar escondida**
Repetição do mesmo problema.

**17. Cart `expiresAt` vem do CartContext mas não é persistido no banco**
O countdown timer do carrinho é local — se o usuário recarrega a página, perde o timer. Ingressos não são reservados até criar a order.
- Não é bug, mas é inconsistência com o conceito de "reserva de 15 min".

---

## Plano de Ação (Priorizado)

### Prioridade 1 — Funcionalidade quebrada
1. **Implementar filtro de preço real** — join ticket_tiers na busca, filtrar por min_price
2. **Corrigir cupom no BookingFlow** — chamar validateCoupon() real
3. **Corrigir parcelas no BookingSummaryStep** — usar getInstallmentOptions()
4. **Corrigir priceFrom nos EventCards** — buscar preço mínimo real dos tiers
5. **Remover ou desabilitar filtro "Maior avaliação"** até ter reviews

### Prioridade 2 — Consistência de navegação
6. **Corrigir ProtectedRoute** — buyer redirect para `/eventos`
7. **Remover dead code `/evento/`** do MainLayout
8. **Corrigir padding `pt-24`** em Eventos, MeusIngressos, Carrinho — usar condicional baseado em isMobile + user logado

### Prioridade 3 — Robustez
9. **Filtrar products antes de reserve_tickets** no Checkout antigo
10. **Verificar/criar FK events.producer_id → profiles.id** para queries admin
11. **Corrigir filtro "Ofertas"** para usar original_price vs price dos tiers

### Arquivos a alterar
- `src/pages/Busca.tsx` — filtro de preço real, remover/fix rating sort
- `src/pages/Eventos.tsx` — priceFrom real, padding condicional
- `src/components/booking/BookingFlow.tsx` — cupom funcional
- `src/components/booking/BookingSummaryStep.tsx` — parcelas com juros
- `src/components/SearchFilters.tsx` — remover opção rating ou renomear
- `src/components/ProtectedRoute.tsx` — redirect buyer → /eventos
- `src/components/MainLayout.tsx` — remover `/evento/` morto
- `src/pages/MeusIngressos.tsx` — padding condicional
- `src/pages/Carrinho.tsx` — padding condicional
- `src/pages/Checkout.tsx` — filtrar products do reserve_tickets
- Migration SQL — FK events.producer_id se necessário

