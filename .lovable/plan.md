

# Auditoria End-to-End — Checkout, Perfil do Produtor e Confirmacao

Revisei todos os arquivos das tres implementacoes. Abaixo os problemas encontrados e o plano de correcao.

---

## Bugs e Problemas Encontrados

### 1. CheckoutStepBuyer — `profile` do AuthContext nao tem `birth_date`

O `AuthContext.fetchProfile` (linha 62) seleciona apenas `id, full_name, avatar_url, phone, cpf, producer_status, organizer_slug...` — **nao inclui `birth_date`**. O `CheckoutStepBuyer` (linha 46-50) busca o perfil separadamente via query, o que funciona, mas e redundante e poderia usar o profile do context se ele incluisse `birth_date`.

**Problema real:** No `CheckoutStepBuyer`, a query separada funciona, mas o campo `birth_date` vem como `string | null` do banco. Se vier `null`, o `<Input type="date">` mostra vazio (OK). Se vier como `"1990-05-15"`, funciona. **Nenhum bug critico aqui**, mas ha uma inconsistencia: o `AuthContext.profile` nao expoe `birth_date`, `city` nem `state` que sao usados no Buyer. A query duplicada resolve, mas e ineficiente.

**Correcao:** Adicionar `birth_date, city, state` ao select do `fetchProfile` no `AuthContext` e ao tipo `AuthContextType.profile`. Remover a query duplicada do `CheckoutStepBuyer`.

### 2. Confirmacao — `ticket_tiers` no select de tickets pode nao funcionar

No `CheckoutStepConfirmation` (linha 32), a query faz `.select("id, qr_code, qr_code_image_url, ticket_tiers(name)")`. O campo `ticket_tiers` e uma relacao via `tier_id` na tabela `tickets`. Preciso verificar se o nome da FK permite este join automatico. Na tabela `tickets`, a coluna se chama `tier_id` referenciando `ticket_tiers.id`, entao o Supabase automaticamente resolve `ticket_tiers(name)`. **Deve funcionar.**

### 3. OrganizerProfile — Contador de seguidores so visivel para o proprio produtor

A RLS de `producer_follows` permite SELECT apenas para:
- `auth.uid() = user_id` (o proprio seguidor)
- `auth.uid() = producer_id` (o proprio produtor)

O `followerCount` query (linha 69) usa `.select("id", { count: "exact", head: true }).eq("producer_id", profile.id)`. Se o usuario logado NAO for o produtor e NAO for um seguidor, ele nao consegue contar os seguidores. **Resultado: visitantes veem 0 seguidores sempre.**

**Correcao:** Adicionar uma policy SELECT publica para contagem, ou criar um RPC `get_follower_count(p_producer_id)` com SECURITY DEFINER.

### 4. OrganizerProfile — `isFollowing` query falha silenciosamente sem login

Se `user` for `null`, a query tem `enabled: !!profile?.id && !!user?.id` (correto, nao executa). Mas o botao "Seguir" aparece mesmo sem login e o `toggleFollow.mutate()` tenta executar, caindo no `onError`. **Funcional, mas UX poderia esconder o botao ou mostrar modal de login.**

### 5. ContactProducerModal — `profile` no AuthContext nao tem `full_name` tipado como obrigatorio

O `profile?.full_name` pode ser `null`. O modal faz `prev.name || profile?.full_name || ""` (linha 44), que funciona. **Sem bug.**

### 6. Checkout — Step indicator mostra numero errado para free orders

Para pedidos gratuitos, o step 2 (Pagamento) e pulado visualmente (`if (isFreeCart && i === 2) return null`), mas o step 3 (Confirmacao) ainda mostra o numero "4" no circulo. Deveria mostrar "3".

**Correcao:** Ajustar a numeracao dos steps quando `isFreeCart` for true.

### 7. Checkout — `items.length === 0 && step < 3` redireciona durante confirmacao

Se o `clearCart()` executar antes de `setStep(3)` no fluxo free (linha 269-270), ha uma race condition: `items` fica vazio e `step` ainda e 1, causando redirect para `/carrinho`. No codigo atual, `clearCart()` e chamado antes de `setStep(3)`. Como React batches state updates, ambos devem executar na mesma renderizacao. **Provavelmente OK no React 18 com automatic batching, mas e fragil.**

**Correcao:** Mover o `clearCart()` para depois do `setStep(3)`, ou usar um ref para controlar o redirect.

### 8. CheckoutStepConfirmation — `buyerEmail` query nao retorna email

A query `buyerEmail` (linha 39-51) busca `profiles.id` mas nunca usa o resultado para nada util. O email do comprador nao e exibido na confirmacao. **Codigo morto, pode ser removido.**

### 9. ProducerInbox — Sem realtime

A inbox nao atualiza automaticamente quando chega nova mensagem. O produtor precisa dar refresh. Nao e um bug, mas e uma melhoria importante.

---

## Plano de Correcao

### Bloco 1: AuthContext — Adicionar campos faltantes ao profile
- Adicionar `birth_date`, `city`, `state` ao select do `fetchProfile`
- Atualizar o tipo `AuthContextType.profile`
- Simplificar `CheckoutStepBuyer` para usar o profile do context

### Bloco 2: RLS de producer_follows — Corrigir contagem publica
- Migration SQL: Adicionar policy SELECT publica em `producer_follows` para permitir contagem (ou criar RPC)

### Bloco 3: Step indicator — Numeracao correta para free orders
- Calcular indice visual dinamicamente quando `isFreeCart`

### Bloco 4: Race condition clearCart/setStep
- Inverter a ordem: `setStep(3)` antes de `clearCart()`

### Bloco 5: Limpeza
- Remover query `buyerEmail` morta do `CheckoutStepConfirmation`

### Bloco 6: ProducerInbox realtime (opcional)
- Adicionar subscription realtime para `producer_messages`

---

## Resumo

| # | Problema | Severidade | Bloco |
|---|----------|-----------|-------|
| 1 | Profile sem birth_date/city/state | Baixa | 1 |
| 3 | Seguidores sempre 0 para visitantes | Alta | 2 |
| 6 | Numeracao errada nos steps free | Media | 3 |
| 7 | Race condition clearCart/setStep | Media | 4 |
| 8 | Query buyerEmail morta | Baixa | 5 |
| 9 | Inbox sem realtime | Baixa | 6 |

Total: 6 correcoes, nenhuma dependencia externa.

