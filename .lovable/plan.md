

# Auditoria de Bugs — Rodada 4

Encontrei **15 bugs** de severidades variadas:

---

## Bug 1 — SQL Injection nas buscas via `ilike` (CRITICO)

Em `Busca.tsx` (linha 64) e `SearchBar.tsx` (linha 95), a query do usuario e interpolada diretamente na string de filtro PostgREST:
```
`title.ilike.%${query}%,venue_city.ilike.%${query}%`
```
Se o usuario digitar caracteres especiais como `%`, `_`, `)`, ou `,`, o filtro PostgREST quebra ou retorna resultados inesperados. O mesmo ocorre em `api.ts` (linha 28).

**Correcao:** Sanitizar a query escapando `%`, `_`, e caracteres especiais do PostgREST antes de interpolar.

---

## Bug 2 — Transfer-ticket usa `listUsers` sem paginacao (CRITICO)

Em `transfer-ticket/index.ts` (linha 97), o codigo chama `supabase.auth.admin.listUsers({ perPage: 1000 })` para buscar o destinatario por email. Isso:
- Carrega ate 1000 usuarios na memoria a cada transferencia
- Falha silenciosamente se houver mais de 1000 usuarios (destinatario nao encontrado)
- E extremamente lento e ineficiente

**Correcao:** Usar `supabase.auth.admin.getUserByEmail(recipientEmail)` que e O(1) e nao tem limite de paginacao. A chamada redundante na linha 87-92 tambem deve ser removida.

---

## Bug 3 — `TicketTierCard` ignora `quantity_reserved` no calculo de disponibilidade (MEDIO)

Em `TicketTierCard.tsx` (linha 36), `available = quantityTotal - quantitySold` nao subtrai `quantity_reserved`. O `BookingTicketStep` faz corretamente (`quantity_reserved ?? 0`), mas o componente usado na pagina de detalhes do evento nao recebe e nao usa esse valor. Usuarios podem tentar comprar ingressos que ja estao reservados.

**Correcao:** Adicionar prop `quantityReserved` ao `TicketTierCard` e subtrair do calculo de disponibilidade. Passar o valor em `EventDetail.tsx`.

---

## Bug 4 — `RefundDialog` referencia tabela `refunds` inexistente via RLS do cliente (MEDIO)

O `RefundDialog` (linha 44-46, 71) faz queries diretamente na tabela `refunds` usando o client do usuario (produtor). A tabela existe no schema (`types.ts` confirma), mas se nao houver RLS policies que permitam o produtor inserir/ler refunds, as operacoes falham silenciosamente. Verificando as tabelas fornecidas, `refunds` nao aparece nas RLS policies listadas.

**Correcao:** Verificar e criar RLS policies para a tabela `refunds` que permitam produtores gerenciar reembolsos dos seus eventos e admins gerenciar todos.

---

## Bug 5 — `BookingFlow` calcula `platformFee` como percentual errado (MEDIO)

Em `BookingFlow.tsx` (linha 62):
```js
const platformFee = Math.round(subtotal * feePercent) / 100;
```
Se `feePercent = 7` e `subtotal = 100`, isso calcula `Math.round(100 * 7) / 100 = 7.00`. Parece correto, mas se `subtotal = 33`, calcula `Math.round(33 * 7) / 100 = 231/100 = 2.31`. O `CartContext` usa `price * quantity * feePercent / 100` que e o mesmo. Porem, o arredondamento difere — o `BookingFlow` arredonda o resultado inteiro enquanto o `CartContext` nao arredonda. Isso pode causar valores diferentes entre os dois fluxos de compra.

**Correcao:** Unificar o calculo de taxa em uma funcao utilitaria usada por ambos.

---

## Bug 6 — `EditarPerfil` nao atualiza o AuthContext apos salvar (MEDIO)

Em `EditarPerfil.tsx` (linha 86), apos salvar o perfil com sucesso, navega para `/meu-perfil` sem chamar `refetchRole()` ou atualizar o `profile` no AuthContext. O perfil antigo fica em cache ate o proximo reload da pagina.

**Correcao:** Chamar `refetchRole()` do AuthContext apos salvar com sucesso (isso ja busca profile e role juntos).

---

## Bug 7 — `Carrinho` AuthModal nao redireciona apos login via OAuth (MEDIO)

Em `Carrinho.tsx` (linha 182-188), o `AuthModal` tem `onOpenChange` que verifica se `user` existe apos fechar. Porem, apos login via OAuth, o usuario e redirecionado para `/auth/callback` e nunca volta ao carrinho automaticamente. O `redirectTo="/checkout"` passado ao `AuthModal` pode nao funcionar para OAuth (depende de como o callback esta configurado).

**Correcao:** Verificar que `AuthCallback.tsx` respeita o `redirectTo` stored antes do OAuth redirect.

---

## Bug 8 — `ProducerEventForm` nao deleta tiers removidos (MEDIO)

Em `ProducerEventForm.tsx` (linhas 304-323), ao salvar o evento editado, o codigo itera sobre `tiers[]` e cria/atualiza cada um. Porem, se o produtor **removeu** um tier (via `removeTier` na linha 218), o tier deletado do state local nao e deletado do banco. O tier antigo continua existindo no banco.

**Correcao:** Antes de iterar os tiers atuais, buscar os IDs existentes e deletar os que nao estao mais na lista.

---

## Bug 9 — `ProtectedRoute` permite acesso quando `role` e null e `allowedRoles` e definido (MEDIO)

Em `ProtectedRoute.tsx` (linha 23):
```js
if (allowedRoles && role && !allowedRoles.includes(role))
```
Se `role` for `null` (ainda carregando ou sem role), a condicao `role &&` e false, entao o componente renderiza os children sem verificar. Um usuario sem role (ou com role ainda carregando) pode acessar paginas de admin/producer momentaneamente.

**Correcao:** Adicionar check: se `allowedRoles` definido e `role` for null (apos loading=false), redirecionar.

---

## Bug 10 — `notifications` INSERT bloqueado por RLS (MEDIO)

A tabela `notifications` tem RLS mas **nao** tem policy de INSERT (conforme documentado: "Can't INSERT records"). Edge functions usam `service_role` entao funcionam, mas o `RefundDialog` (que roda no client) nao cria notificacoes. Porem, se algum fluxo futuro tentar inserir notificacoes do client, falhara silenciosamente. Nao e um bug ativo, mas e uma armadilha.

**Correcao:** Documentar que notificacoes so podem ser inseridas via service_role (edge functions).

---

## Bug 11 — `MeusIngressos` `now` recriado a cada render, invalida memoizacao (BAIXO)

Em `MeusIngressos.tsx` (linha 67), `const now = new Date()` e criado no corpo do componente. Como `now` e uma dependencia do `useMemo` na linha 115, o memo e recalculado a cada render (nova referencia de Date a cada vez).

**Correcao:** Usar `useMemo(() => new Date(), [])` ou `useRef(new Date()).current` para estabilizar.

---

## Bug 12 — `BookingFlow` nao tem listener realtime para pagamentos PIX/boleto (MEDIO)

O `Checkout.tsx` tem um channel realtime para escutar mudancas de status do pedido (linhas 52-79). O `BookingFlow` nao tem nenhum listener — apos criar um pagamento PIX/boleto, o usuario ve "Aguardando pagamento" e vai para a tela de confirmacao sem nunca receber a atualizacao.

**Correcao:** Adicionar subscription realtime no `BookingFlow` ou redirecionar o usuario para uma pagina de status do pedido.

---

## Bug 13 — `handleDeleteAccount` nao deleta a conta, so faz signOut (BAIXO)

Em `EditarPerfil.tsx` (linha 90-96), `handleDeleteAccount` apenas chama `signOut()` e mostra um toast dizendo "conta desativada". A conta nao e realmente excluida ou desativada no banco. O usuario pode fazer login novamente normalmente.

**Correcao:** Criar uma edge function `delete-account` que anonimiza os dados do perfil e/ou desativa a conta via `supabase.auth.admin.deleteUser()`.

---

## Bug 14 — Coupon discount pode exceder `total` no `BookingFlow` (BAIXO)

Em `BookingFlow.tsx` (linha 271), o desconto e limitado a `subtotal` (`Math.min(discountAmount, subtotal)`), mas a taxa de plataforma ja foi adicionada ao `total`. Se o desconto for igual ao subtotal, o total fica como apenas a `platformFee`, que pode nao ser a intencao. No `CartContext`, o `finalTotal = Math.max(0, total - discount)` inclui a taxa.

**Correcao:** Alinhar logica — se o ingresso e gratis pelo cupom, a taxa tambem deveria ser zero.

---

## Bug 15 — `EventDetail` view count nao e incrementado (BAIXO)

O evento tem campo `views_count` usado para ordenacao por popularidade, mas nenhum lugar no codigo incrementa esse contador quando um usuario visita a pagina de detalhes do evento.

**Correcao:** Adicionar chamada RPC ou update para incrementar `views_count` no `EventDetail` (com debounce por sessao para evitar inflacao).

---

## Plano de Implementacao

### Prioridade Alta (bugs criticos)
1. **SQL Injection nas buscas** — Criar funcao `sanitizePostgrestFilter()` e aplicar em `Busca.tsx`, `SearchBar.tsx` e `api.ts`
2. **Transfer-ticket listUsers** — Substituir `listUsers` por `getUserByEmail` na edge function
3. **TicketTierCard disponibilidade** — Adicionar prop `quantityReserved`, subtrair no calculo

### Prioridade Media
4. **RefundDialog RLS** — Criar migration com policies para tabela `refunds`
5. **BookingFlow platformFee** — Extrair calculo para `lib/utils` e unificar
6. **EditarPerfil sem refetch** — Chamar `refetchRole()` apos salvar
7. **ProducerEventForm nao deleta tiers** — Comparar IDs existentes e deletar removidos
8. **ProtectedRoute role null** — Adicionar check para role null com allowedRoles
9. **BookingFlow sem realtime** — Adicionar subscription ou redirecionar para pagina de status

### Prioridade Baixa
10. **MeusIngressos now instavel** — Estabilizar com useMemo
11. **handleDeleteAccount fake** — Criar edge function real de exclusao
12. **Coupon + platformFee** — Zerar taxa para pedidos 100% descontados
13. **EventDetail views_count** — Incrementar via RPC com debounce por sessao
14. **Carrinho OAuth redirect** — Verificar fluxo de callback
15. **notifications INSERT docs** — Documentar restricao

