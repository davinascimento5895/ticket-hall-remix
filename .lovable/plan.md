

## Auditoria Completa — Inconsistências Encontradas

Analisei todas as páginas (buyer, producer, admin), APIs, booking flow, e componentes. Ignorando integrações externas (pagamento, Google Maps) como solicitado. Segue a lista priorizada:

---

### PRIORIDADE 1 — Bugs e Funcionalidade Quebrada

**1. `priceFrom={0}` hardcoded na Index (featured events)**
`src/pages/Index.tsx` linha 190: os EventCards da home sempre mostram "A partir de Grátis" porque `priceFrom={0}` é fixo. Diferente de Eventos.tsx e Busca.tsx que já fazem o join com `ticket_tiers`.
- **Fix**: Buscar `ticket_tiers(price)` no `getFeaturedEvents()` ou no componente, e calcular `min_price` como já feito em Eventos.tsx.

**2. Storage bucket errado no upload de imagem do produtor**
`api-producer.ts` linha 346-353: `uploadEventImage()` usa bucket `"events"`, mas o bucket configurado no projeto é `"event-images"`. A função nunca é chamada atualmente (o form usa `supabase.storage.from("event-images")` diretamente na linha 143 do form), mas é dead code com bug.
- **Fix**: Corrigir para `"event-images"` ou remover a função morta.

**3. Edge function `send-bulk-message` não existe**
`api-producer.ts` linha 452 chama `supabase.functions.invoke("send-bulk-message")`, mas não existe nenhum arquivo em `supabase/functions/send-bulk-message/`. O produtor ao tentar enviar mensagem em massa vai receber erro 404.
- **Fix**: Criar edge function ou mostrar toast informando que funcionalidade ainda não está disponível.

**4. `getEventOrders` faz join com alias incorreto**
`api-producer.ts` linha 116: `profiles!orders_buyer_id_fkey(full_name, email:cpf)` — o campo `email:cpf` está renomeando `cpf` para `email`. Isso mostra o CPF do comprador no lugar do e-mail no dashboard do produtor. O campo `email` não existe na tabela `profiles`.
- **Fix**: Remover `email:cpf` (não existe campo email em profiles). Se precisar do e-mail, buscar de `auth.users` via edge function ou adicionar campo `email` ao profiles.

**5. Carrinho/Checkout não filtra eventos diferentes**
O checkout (linha 88) usa `items[0]?.eventId` para criar a order com um único `event_id`. Se o carrinho tiver itens de eventos diferentes, todos vão para uma order com o `event_id` do primeiro item. Os tickets dos outros eventos vão ficar com `event_id` errado na tabela `tickets`.
- **Fix**: Validar que todos os itens do carrinho são do mesmo evento, ou criar orders separadas por evento.

**6. `getEvents` não filtra eventos passados**
`api.ts` linha 32-36: não há filtro `gte("end_date", now)`. A página `/eventos` mostra eventos que já terminaram.
- **Fix**: Adicionar `.gte("end_date", new Date().toISOString())`.

### PRIORIDADE 2 — Inconsistências de UX/Lógica

**7. Horário do evento — faixa horária conforme solicitado**
`Busca.tsx` usa `getTimeOfDay()` com faixas: 5-12 manhã, 12-18 tarde, 18-24 noite, 0-5 madrugada. O usuário pediu: até 13h = manhã, 13-18 = tarde, 18+ = noite.
- **Fix**: Ajustar para `h < 13` = manhã, `13 <= h < 18` = tarde, `h >= 18` = noite. Remover "madrugada" ou manter como subcategoria.

**8. FAQ da home promete "12x sem juros"**
`Index.tsx` FAQ linha 73: "cartão de crédito em até 12x sem juros". Mas `api-payment.ts` configura juros a partir da 4a parcela (1.99%/mês). Informação enganosa.
- **Fix**: Alterar para "em até 3x sem juros" ou "em até 12x".

**9. Dois sistemas de busca coexistem**
`SearchBar` redireciona para `/busca?q=...` mas a página `/eventos` tem seu próprio sistema de busca inline. Usar a SearchBar na página de eventos redireciona para `/busca`, perdendo os filtros da página de eventos.
- **Fix**: Na página `/eventos`, o SearchBar deveria filtrar localmente em vez de redirecionar. Ou unificar ambas as experiências.

**10. Produtor não consegue configurar mapa de assentos**
O `BookingSeatMap` renderiza `event.seat_map_config` mas o `ProducerEventForm` não tem nenhum campo para configurar `has_seat_map` ou `seat_map_config`. O produtor não consegue ativar essa feature.
- **Fix**: Adicionar campos no step de configurações do form do produtor.

**11. Produtor não consegue ativar fila virtual/certificados/seguro**
`ProducerEventForm` não expõe os campos `has_virtual_queue`, `has_certificates`, `has_insurance_option`, `insurance_price`. Essas features existem no banco mas não têm UI de configuração.
- **Fix**: Adicionar toggles no step 5 (Configurações) do wizard de criação.

### PRIORIDADE 3 — Problemas Menores

**12. Admin "Receita Plataforma (7%)" hardcoded no label**
`AdminDashboard.tsx` linha 18: texto "Receita Plataforma (7%)" mas eventos podem ter `platform_fee_percent` diferente de 7%.
- **Fix**: Remover "(7%)" do label ou calcular a taxa média real.

**13. `getEventBySlug` retorna eventos não publicados**
`api.ts` linha 50-57: não filtra por `status`. Qualquer pessoa com o slug pode ver um evento em rascunho.
- **Fix**: Adicionar `.eq("status", "published")` (a RLS já protege, mas é boa prática).

**14. Booking date step é redundante para eventos de dia único**
O `BookingFlow` sempre mostra o step de data, mas para eventos de um dia só (`is_multi_day: false`), não faz sentido pedir para selecionar data.
- **Fix**: Pular step de data quando `is_multi_day !== true`.

**15. Category label raw no EventDetail**
`EventDetail.tsx` linha 194: mostra `event.category` direto (e.g., "shows"), não usa `getCategoryLabel()` como o EventCard.
- **Fix**: Usar `getCategoryLabel(event.category)`.

---

## Plano de Implementação

### Batch 1 — Fixes críticos
1. Buscar preço real nos featured events da home (Index.tsx + api.ts)
2. Filtrar eventos passados em getEvents (api.ts)
3. Corrigir faixas de horário (Busca.tsx): manhã <13h, tarde 13-18h, noite >=18h
4. Corrigir alias `email:cpf` no getEventOrders (api-producer.ts)
5. Corrigir bucket name no uploadEventImage (api-producer.ts)
6. Desabilitar sendBulkMessage com feedback (api-producer.ts)

### Batch 2 — Consistência UX
7. Corrigir FAQ "12x sem juros" → "até 12x" (Index.tsx)
8. Corrigir category label no EventDetail
9. Pular step de data no BookingFlow para eventos single-day
10. Validar carrinho single-event no Checkout

### Batch 3 — Features incompletas (UI de configuração)
11. Adicionar campos no ProducerEventForm: seat map, fila virtual, certificados, seguro
12. Corrigir/remover getEventBySlug sem filtro de status

### Arquivos alterados
- `src/pages/Index.tsx`
- `src/lib/api.ts`
- `src/pages/Busca.tsx`
- `src/lib/api-producer.ts`
- `src/pages/EventDetail.tsx`
- `src/components/booking/BookingFlow.tsx`
- `src/pages/Checkout.tsx`
- `src/pages/producer/ProducerEventForm.tsx`

