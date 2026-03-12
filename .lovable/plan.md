

# Correções Restantes — Auditoria Completa

Depois de revisar console logs, fluxo de checkout, perfil do produtor, confirmação e inbox, identifiquei as seguintes correções pendentes:

---

## 1. SupportChat — Warning de ref no console

O console mostra `Function components cannot be given refs` no `SupportChat.tsx`. O componente filho do `AnimatePresence` precisa de `forwardRef` ou o `motion.div` precisa ser reestruturado para evitar o warning.

**Correção:** Envolver o componente interno com `React.forwardRef` ou ajustar a estrutura do `AnimatePresence`.

---

## 2. Checkout — Step indicator mostra número errado para free orders (ainda parcialmente quebrado)

Na linha 349, a lógica `isFreeCart && i > 2 ? i : i + 1` exibe o número `3` para o step de Confirmação (index 3), mas o círculo deveria mostrar **3** (não 4). Porém, como `i === 3` e `3 > 2` é true, ele mostra `3` — na verdade está correto agora. **Verificado: OK.**

---

## 3. OrganizerProfile — Botão "Seguir" visível sem login (UX)

O botão "Seguir" aparece para visitantes não logados. Ao clicar, o erro é tratado silenciosamente no `onError`. Melhor prática: esconder o botão ou abrir o modal de login.

**Correção:** Condicionar a exibição do botão a `!!user`, ou ao clicar sem login, abrir o `AuthModal`.

---

## 4. ContactProducerModal — Não reseta estado ao reabrir

Quando o modal é fechado e reaberto, `showForm` permanece `true` se o usuário já tinha clicado "Falar com o organizador". Deveria resetar para a tela de FAQ ao reabrir.

**Correção:** Adicionar `useEffect` que reseta `showForm` para `false` quando `open` muda para `true`.

---

## 5. Checkout — Sidebar some na confirmação, mas dados do pedido podem não carregar

Na confirmação (`step === 3`), o `orderId` é usado para buscar dados. Se `clearCart()` limpa tudo antes do React renderizar a confirmação, o `orderId` ainda persiste no state (está OK). Porém, se o usuário der refresh na página de confirmação, o `orderId` se perde (state volátil) e ele é redirecionado para o carrinho vazio.

**Correção:** Salvar `orderId` em `sessionStorage` para sobreviver a refreshes. Na montagem, recuperar de lá se o state estiver vazio.

---

## 6. CheckoutStepBuyer — Validação de email do comprador ausente

O formulário valida CPF, CEP e telefone, mas não valida o formato do email antes de prosseguir.

**Correção:** Adicionar validação com o mesmo regex `EMAIL_REGEX` usado no `CheckoutStepData`.

---

## 7. Checkout — `billing_address` salvo fora do RPC (pode falhar com RLS)

Na linha 162, o código faz `supabase.from("orders").update({billing_address})`. A RLS de orders permite UPDATE apenas para `status = 'pending'` e `buyer_id = auth.uid()`. Isso deve funcionar, mas se o RPC já mudou o status para `'paid'` (free order), o update falha silenciosamente.

**Correção:** Para pedidos gratuitos, o RPC muda o status para `'paid'` na inserção, então o update do `billing_address` acontece ANTES do `confirm_order_payment`. Verificando: o RPC usa `CASE WHEN v_is_free THEN 'paid'`. Ou seja, o pedido já nasce com status `'paid'`, e a RLS exige `status = 'pending'` para UPDATE. **Bug confirmado: billing_address nunca é salvo em pedidos gratuitos.**

**Correção:** Salvar `billing_address` dentro do RPC, ou mover o update para antes da chamada RPC (impossível pois o order ainda não existe), ou alterar a RLS temporariamente. Melhor solução: adicionar `p_billing_address` como parâmetro do RPC.

---

## 8. ProducerInbox — Sem paginação

Se o produtor receber centenas de mensagens, todas são carregadas de uma vez. Não é crítico agora, mas deveria ter limit/offset ou infinite scroll.

**Correção (baixa prioridade):** Adicionar `.limit(50)` e botão "Carregar mais".

---

## Resumo de correções

| # | Problema | Severidade | Arquivo |
|---|----------|-----------|---------|
| 1 | SupportChat ref warning | Baixa | `SupportChat.tsx` |
| 2 | ~~Step indicator~~ | ~~OK~~ | — |
| 3 | Botão Seguir sem login | Média | `OrganizerProfile.tsx` |
| 4 | ContactModal não reseta | Baixa | `ContactProducerModal.tsx` |
| 5 | orderId perdido no refresh | Média | `Checkout.tsx` |
| 6 | Email do buyer sem validação | Média | `CheckoutStepBuyer.tsx` |
| 7 | billing_address não salva em free orders | Alta | `Checkout.tsx` + migration SQL |
| 8 | Inbox sem paginação | Baixa | `ProducerInbox.tsx` |

Total: **7 correções** (1 alta, 3 médias, 3 baixas).

