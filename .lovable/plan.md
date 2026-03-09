

# Auditoria de Bugs — Rodada 3

Encontrei **5 novos bugs**:

---

## Bug 1 — Pedidos gratuitos nao geram QR codes JWT (CRITICO)

Tanto no `Checkout.tsx` (linha 200) quanto no `BookingFlow.tsx` (linha 132), pedidos gratuitos chamam `confirm_order_payment` via RPC diretamente do cliente (usando o `supabase` do usuario, nao o `supabaseAdmin`). Diferente do `create-payment` edge function (que usa service role e depois chama `generate-qr-code`), esses fluxos **nunca** geram QR codes JWT para os tickets. Os tickets ficam com o hex aleatorio e o check-in vai falhar.

**Correcao:** Apos confirmar pedido gratuito, chamar a edge function `generate-qr-code` para cada ticket ativado, igual ao stub mode do `create-payment`.

---

## Bug 2 — `confirm_order_payment` RPC chamada com usuario anonimo falha silenciosamente (MEDIO)

O RPC `confirm_order_payment` e `SECURITY DEFINER`, entao funciona. Porem, a chamada subsequente para verificar tickets e fazer update em `ticket_tiers` usa o caller context. Como `orders` tem RLS que permite `buyers` fazer update apenas em pedidos `pending`, e o RPC ja muda o status para `paid`, a chamada funciona pois e SECURITY DEFINER. No entanto, o `Checkout.tsx` faz `await supabase.rpc("confirm_order_payment", ...)` com o client do usuario — se o RPC retornar `false` (pedido ja pago), o codigo ignora e segue mostrando confirmacao.

**Correcao:** Verificar o retorno do RPC e mostrar erro se retornar `false`.

---

## Bug 3 — `BookingFlow` nao gera QR codes no stub mode (CRITICO)

O `BookingFlow.tsx` chama `createPayment` que no stub mode agora gera QR codes. Porem, para pedidos gratuitos (linha 131-136), o fluxo contorna o `createPayment` completamente e chama `confirm_order_payment` diretamente — mesmo problema do Bug 1. Tickets gratuitos via BookingFlow nao tem QR valido.

**Correcao:** Mesma do Bug 1 — chamar `generate-qr-code` apos ativacao.

---

## Bug 4 — Realtime nao habilitado para tabela `orders` (MEDIO)

O `Checkout.tsx` (linha 56-76) cria um channel de realtime para escutar atualizacoes de `orders`, mas a tabela `orders` nao esta adicionada ao `supabase_realtime` publication. O subscription nunca vai receber eventos — o usuario fica esperando confirmacao de PIX/boleto para sempre.

**Correcao:** Criar migracao: `ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;`

---

## Bug 5 — `useFavorites` hook nao e estavel como prop (BAIXO)

Em `FavoriteButton.tsx`, `toggleFavorite` e passado como `toggleFavorite.mutate` do react-query. A funcao `mutate` nao e memorizada — cada render cria uma nova referencia. Isso nao causa crashes mas pode causar re-renders desnecessarios em listas longas de eventos.

**Correcao:** Usar `toggleFavorite.mutate` diretamente no handler em vez de expor como prop. Ja esta assim — baixa prioridade.

---

## Plano de Implementacao

### 1. Gerar QR codes para pedidos gratuitos
- Criar uma nova edge function `confirm-free-order` ou reutilizar `generate-qr-code`
- Em `Checkout.tsx` e `BookingFlow.tsx`, apos `confirm_order_payment` para pedidos gratuitos, chamar `supabase.functions.invoke("generate-qr-code", { body: { ticketId } })` para cada ticket
- Buscar os tickets ativados com `.select("id").eq("order_id", orderId).eq("status", "active")`

### 2. Habilitar realtime para `orders`
- Criar migracao SQL: `ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;`

### 3. Verificar retorno do `confirm_order_payment`
- Em ambos `Checkout.tsx` e `BookingFlow.tsx`, checar se `confirmed === false` e mostrar toast de erro

