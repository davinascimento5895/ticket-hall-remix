

# Auditoria Completa — TicketHall

## Estado Atual

O projeto tem uma base sólida: schema completo no banco (events, ticket_tiers, orders, tickets, coupons, favorites, waitlist, certificates, checkin_lists, etc.), RPCs funcionais (`reserve_tickets`, `confirm_order_payment`, `apply_coupon`), edge functions para pagamento/checkin/transferência, e UI cobrindo landing, catálogo, detalhe, checkout, painel do produtor e admin.

---

## Problemas e Gaps Identificados

### 1. Rotas desprotegidas (bug real)
Páginas como `/meus-ingressos`, `/favoritos`, `/meu-perfil`, `/carrinho`, `/checkout` e `/meus-certificados` **não usam `ProtectedRoute`**. Qualquer pessoa pode acessar e o código quebra com `user` null. Apenas `/producer/*` e `/admin/*` estão protegidos.

### 2. Checkout sem exigir login
O Checkout e o BookingFlow verificam `user` no momento do pagamento mas deixam o usuário navegar pelo fluxo inteiro antes de mostrar um toast de erro. Deveria redirecionar para login antes de entrar no checkout.

### 3. Confirmação de email
Não há tratamento de fluxo pós-confirmação de email. Quando o usuário se cadastra e clica no link de confirmação, não há rota `/auth/callback` nem handling de token — o usuário fica perdido.

### 4. Evento criado sem validação de slug único
`ProducerEventForm` gera slug a partir do título mas não verifica se já existe no banco. Se colidir, o insert falha silenciosamente.

### 5. Upload de imagem de capa sem tratamento de erro robusto
O formulário do produtor faz upload para Storage, mas se o bucket `event-covers` não existir (não há criação automática), o upload falha.

### 6. Carrinho multi-evento
O `CartContext` permite itens de eventos diferentes no mesmo carrinho, mas o `Checkout` pega `items[0].eventId` e cria uma única order — os itens de outros eventos são ignorados silenciosamente.

### 7. Expiração do carrinho
O carrinho expira em 15min (localStorage), mas a reserva no banco é independente. Se o carrinho expirar no front mas o `cleanup_expired_reservations` não rodar, os tickets ficam em "reserved" para sempre. Não há cron configurado.

### 8. Console warnings
`SupportChat` tem um warning de ref em `AnimatePresence` — componente funcional sem `forwardRef`.

### 9. Tabela `favorites` — sem tabela visível no schema
O hook `useFavorites` e a página `Favoritos` fazem queries em `favorites`, mas esta tabela não aparece no `types.ts` gerado. Pode ser que exista no banco mas sem RLS adequado, ou pode falhar em runtime.

### 10. Tabela `reviews/ratings` — inexistente
`EventReviews` existe como componente mas não há tabela `reviews` no schema. Provavelmente renderiza vazio ou com dados mock.

### 11. Produtor sem aprovação
O fluxo `BecomeProducerModal` chama a edge function `become-producer` mas não valida se o status do produtor é `approved` antes de permitir criar eventos. Um produtor `pending` pode acessar `/producer/events/new`.

### 12. Sem página de FAQ dedicada
O footer tem link para "Perguntas Frequentes" mas não existe rota `/faq` — apenas FAQs na landing page.

---

## Plano de Correções (Priorizado)

### Fase A — Bugs Críticos (funcionalidade quebrada)

1. **Proteger rotas autenticadas** — Envolver `/meus-ingressos`, `/favoritos`, `/meu-perfil/*`, `/checkout`, `/meus-certificados` com `ProtectedRoute`
2. **Criar tabela `favorites`** se não existir (migration + RLS)
3. **Criar tabela `reviews`** (event_id, user_id, rating, comment, created_at) + RLS
4. **Validar slug único** no `ProducerEventForm` antes de salvar
5. **Criar Storage bucket `event-covers`** se não existir (migration)
6. **Bloquear carrinho multi-evento** — impedir adicionar itens de evento diferente do que já está no carrinho

### Fase B — UX Incompleta

7. **Redirecionar para login no checkout** — se não logado, abrir AuthModal e retornar ao checkout após login
8. **Verificar status do produtor** — bloquear criação de evento se `producer_status !== 'approved'`
9. **Criar rota `/faq`** ou scroll automático para seção FAQ na landing
10. **Fix SupportChat ref warning** — usar `forwardRef`
11. **Auth callback handling** — rota para processar confirmação de email

### Fase C — Robustez

12. **Cron para `cleanup_expired_reservations`** — agendar via pg_cron ou edge function scheduled
13. **Tratamento de erro consistente** — toast + fallback em todas as queries críticas

---

## Resumo

A estrutura da bilheteria (criar evento, tiers, compra, QR, check-in, transferência, reembolso, cupons) está toda mapeada em código e banco. Os maiores riscos são: **rotas sem proteção de auth** (crash em produção), **tabelas faltantes** (favorites/reviews), e **carrinho multi-evento** que gera pedidos incompletos. O resto são melhorias de robustez e UX.

Posso começar pela Fase A (bugs críticos) imediatamente.

