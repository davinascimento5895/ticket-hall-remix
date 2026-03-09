

## Auditoria Completa — Rodada 4

Analisei o codebase completo novamente. Ignorando integrações externas (pagamento, email, analytics). Segue:

---

### BUG FUNCIONAL — BookingFlow calcula taxa errada

`src/components/booking/BookingFlow.tsx` linha 63:
```
const platformFee = Math.round(subtotal * feePercent) / 100;
```
Se `subtotal = 100` e `feePercent = 7`: `Math.round(100 * 7) / 100 = 7.00` — OK.
Se `subtotal = 150` e `feePercent = 7`: `Math.round(150 * 7) / 100 = Math.round(1050) / 100 = 10.50` — OK.
Se `subtotal = 33.50` e `feePercent = 5.5`: `Math.round(33.50 * 5.5) / 100 = Math.round(184.25) / 100 = 1.84` — ERRADO. Deveria ser `33.50 * 0.055 = 1.8425`.

A fórmula funciona por coincidência quando feePercent é inteiro, mas está **matematicamente errada**. A fórmula correta é: `Math.round(subtotal * feePercent / 100 * 100) / 100` ou simplesmente `subtotal * feePercent / 100`.

O CartContext faz certo: `i.price * i.quantity * feePercent / 100`.

**Fix**: Alterar para `const platformFee = Math.round(subtotal * feePercent) / 100;` → `const platformFee = Math.round(subtotal * feePercent * 100 / 100) / 100;`... Na verdade, a fórmula correta com arredondamento a 2 casas é:
```typescript
const platformFee = Math.round(subtotal * feePercent) / 100;
```
Wait — vou recalcular. `subtotal * feePercent` quando `feePercent=7` e `subtotal=100` dá `700`. Dividido por 100 = 7. OK. `subtotal=33.50, feePercent=5.5`: `33.50 * 5.5 = 184.25`. `/100 = 1.8425`. Com `Math.round`: `Math.round(184.25)/100 = 184/100 = 1.84`. O valor correto é `33.50 * 0.055 = 1.8425`, arredondado a 2 casas = `1.84`. Então está certo! A fórmula é equivalente a `Math.round(subtotal * feePercent) / 100` = `round(subtotal * feePercent / 100, 2)`. OK, meu erro — a fórmula está correta.

---

### INCONSISTÊNCIAS REAIS ENCONTRADAS

**1. EventDetail "Comprar ingresso" não muda para "Inscrever-se" quando grátis**
`src/pages/EventDetail.tsx` linhas 376 e 400: ambos os CTAs (sidebar e mobile) dizem "Comprar ingresso" fixo. O `EventCard` já faz a distinção, mas a página de detalhe do evento não.
- **Fix**: Verificar `lowestPrice === 0` e exibir "Inscrever-se" ao invés de "Comprar ingresso".

**2. `createOrder` em `api.ts` tem comment `PAYMENT_INTEGRATION_POINT` visível no código**
`src/lib/api.ts` linha 83: comment `PAYMENT_INTEGRATION_POINT` no código. Não é visível ao usuário, mas a função `createOrder` em `api.ts` **nem é usada** — o Checkout e o BookingFlow ambos criam orders diretamente via supabase inline. Dead code.
- **Fix**: Remover `createOrder` de `api.ts` (dead code).

**3. `getEventOrders` em `api-producer.ts` usa FK hint errado**
`src/lib/api-producer.ts` linha 117: `profiles!orders_buyer_id_fkey(full_name, cpf)` — depende de FK `orders.buyer_id → profiles.id`. Como `profiles.id` referencia `auth.users.id` e `orders.buyer_id` também, a FK entre eles pode não existir explicitamente. Se falhar, as ordens do produtor não mostram nome do comprador.
- **Fix**: Verificar no schema se a FK existe. Se não, o join silenciosamente falha.

**4. Carrinho: discount não é passado para o Checkout**
`src/pages/Carrinho.tsx` aplica cupom e calcula `discount`, mas quando o usuário clica "Finalizar compra" e vai para `/checkout`, o desconto **é perdido** — o Checkout não recebe o desconto do carrinho. O cupom precisa ser reaplicado no Checkout ou passado via contexto.
- **Fix**: Adicionar `discount` e `couponCode` ao CartContext, ou mover a lógica de cupom inteiramente para o Checkout.

**5. Carrinho: `finalTotal` é calculado mas o botão "Finalizar compra" linka direto sem usar**
`src/pages/Carrinho.tsx` linha 41: `const finalTotal = Math.max(0, total - discount)`. O valor mostrado é `finalTotal`, mas ao ir para o Checkout, `total` do CartContext (sem desconto) é usado. O usuário vê um preço no carrinho e outro diferente no checkout.
- **Fix**: Ligado ao item 4 acima.

**6. `api.ts` analytics functions são placeholders expostos**
`trackEvent`, `trackPageView`, `trackPurchase` são funções vazias que nunca fazem nada. Se algum componente chamar essas funções esperando analytics, nada acontece. Não é um bug, mas é dead code.
- **Fix**: Manter como estão (são placeholders intencionais para futura integração) ou remover se não são chamados em lugar nenhum.

**7. Maintenance mode não persiste**
`src/pages/admin/AdminSettings.tsx`: o toggle de "Modo Manutenção" usa `useState` local. Não salva em nenhum lugar. O admin ativa, recarrega a página, e volta a false.
- **Fix**: Persistir em uma tabela `platform_settings` ou usar um campo no banco. Ou marcar como "Em breve" se não for implementar agora.

**8. Products adicionados ao carrinho não têm `platformFeePercent`**
`src/pages/EventDetail.tsx` linhas 321-327: quando o usuário adiciona um produto ao carrinho, o `addItem` não inclui `platformFeePercent` nem `maxPerOrder`. Resultado: a taxa do produto cai no fallback de 7% (config), e o max quantity usa 10 default.
- **Fix**: Adicionar `platformFeePercent: event.platform_fee_percent ?? 7` e `maxPerOrder: p.max_per_order ?? 10` ao addItem de produtos.

---

## Plano de Implementação

1. **EventDetail CTA "Inscrever-se" para eventos grátis** — Verificar `lowestPrice === 0` nos botões sidebar e mobile
2. **Cupom do carrinho perdido no checkout** — Mover `couponCode` e `discount` para o CartContext para persistir entre páginas
3. **Products sem platformFeePercent** — Adicionar campos ao addItem de produtos no EventDetail
4. **Maintenance mode como placeholder honesto** — Mudar texto para "Em breve" ou persistir no banco
5. **Remover dead code** — `createOrder` em `api.ts`, analytics placeholders (opcional)

### Arquivos alterados
- `src/pages/EventDetail.tsx` — CTA dinâmico + product fee
- `src/contexts/CartContext.tsx` — couponCode + discount no contexto
- `src/pages/Carrinho.tsx` — usar discount do contexto
- `src/pages/Checkout.tsx` — aplicar discount do contexto na order
- `src/pages/admin/AdminSettings.tsx` — placeholder honesto para maintenance
- `src/lib/api.ts` — remover dead code

