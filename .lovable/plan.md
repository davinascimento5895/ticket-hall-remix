

# Auditoria Completa + Benchmarking Competitivo — Rodada 5

Apos analise extensiva do codebase e benchmarking com Sympla, Eventbrite, Ingresse, Tickets.com e Yapsody, identifiquei **15 bugs/melhorias** divididos entre bugs reais, gaps criticos vs concorrentes e funcionalidades faltantes focadas exclusivamente em venda/compra de ingressos.

---

## BUGS ATIVOS

### 1. AuthCallback ignora redirectTo do carrinho (MEDIO)
O `AuthCallback.tsx` sempre redireciona para `/eventos` (linha 11). Quando o usuario faz login via Google no carrinho (que passa `redirectTo="/checkout"`), ele nunca retorna ao checkout — vai para `/eventos` e perde o fluxo de compra. Concorrentes como Sympla e Eventbrite preservam o carrinho apos OAuth.

**Correcao:** Salvar `redirectTo` no `sessionStorage` antes do OAuth e usa-lo no callback.

### 2. `send-ticket-email` e um stub — emails nunca sao enviados (CRITICO)
A edge function `send-ticket-email` (linha 17) apenas faz `console.log("send-ticket-email stub")`. Nenhum email de confirmacao e enviado apos compra. Todas as plataformas concorrentes enviam email com QR code imediatamente apos confirmacao. Esse e o gap mais critico vs concorrentes.

**Correcao:** Integrar com o servico de email do Lovable Cloud ou Resend para enviar emails transacionais com QR code e detalhes do pedido.

### 3. Waitlist existe no banco mas nao e acessivel pela UI do comprador (MEDIO)
A funcao `joinWaitlist` existe em `api.ts` e a tabela `waitlist` existe no schema, mas **nenhuma pagina** exibe um botao "Avisar quando disponivel" quando um tier esgota. O `TicketTierCard` mostra "Esgotado" sem opcao de waitlist. Sympla e Eventbrite oferecem notificacao automatica.

**Correcao:** Adicionar botao "Me avise" no `TicketTierCard` quando esgotado, que chama `joinWaitlist`.

### 4. Nao existe pagina "Meus Pedidos" / historico de compras (MEDIO)
O comprador so ve ingressos em `/meus-ingressos`, mas nao tem historico de pedidos (com status de pagamento, valores pagos, metodo, nota fiscal). Sympla e Eventbrite mostram historico completo de pedidos. O admin tem `/admin/orders`, mas o comprador nao.

**Correcao:** Criar pagina `/meus-pedidos` que lista pedidos do usuario com status, valor, metodo de pagamento e link para o ingresso.

### 5. Carrinho nao valida disponibilidade ao abrir (MEDIO)
O carrinho persiste em `localStorage`. Se o usuario adiciona ingressos, fecha o browser e volta horas depois, o carrinho mostra itens que podem ter esgotado. A validacao so ocorre no checkout (`reserve_tickets`), causando frustacao tardia.

**Correcao:** Ao montar `Carrinho.tsx`, fazer query para verificar disponibilidade atual e mostrar aviso/remover itens esgotados.

### 6. EventCard nao passa `eventId` — FavoriteButton nunca aparece no catalogo (MEDIO)
Em `Eventos.tsx` (linha 324-337), `EventCard` e chamado sem a prop `eventId`. O `EventCard` (linha 44-46) so renderiza `FavoriteButton` quando `eventId` existe. Resultado: o botao de favoritar nunca aparece na listagem de eventos, apenas no detalhe. Sympla mostra favorito diretamente no card.

**Correcao:** Passar `eventId={event.id}` no `EventCard` em `Eventos.tsx` e `Index.tsx`.

### 7. Desconto do cupom nao zera taxa quando total fica zero no CartContext (BAIXO)
No `CartContext` (linha 173-178), `platformFee` e calculado sobre o `subtotal` antes do desconto. Se um cupom cobre 100% do subtotal, o `finalTotal` fica como `platformFee` (ex: R$7 em vez de R$0). O `BookingFlow` ja corrigiu isso, mas o `CartContext` nao.

**Correcao:** Se `discount >= subtotal`, setar `platformFee = 0`.

---

## GAPS VS CONCORRENTES (Funcionalidades Faltantes)

### 8. Meia-entrada (half-price) nao e validada no checkout
O schema tem campos `half_price_enabled`, `half_price_quantity`, `half_price_doc_type` nos tiers. O `HalfPriceFields.tsx` existe. Mas no fluxo de compra real (`CheckoutStepData`), nao ha campo para o comprador declarar meia-entrada nem upload de documento comprobatorio. Sympla e Ingresse pedem isso no checkout.

**Correcao:** Adicionar selecao de meia-entrada no `CheckoutStepData` quando o tier permite, com upload de comprovante.

### 9. Nao ha confirmacao visual do numero de ingresso / e-ticket completo
Apos compra, a tela de confirmacao (`CheckoutStepConfirmation`) mostra apenas "Pedido confirmado!" com link para "Meus Ingressos". Concorrentes mostram um resumo completo com: QR code, numero do pedido, detalhes do evento, nome do participante e opcao de adicionar ao calendario (Google Calendar / Apple Calendar).

**Correcao:** Expandir `CheckoutStepConfirmation` com dados do pedido, QR preview e botao "Adicionar ao calendario".

### 10. Nao ha botao "Adicionar ao calendario" (Google/Apple/Outlook)
Nenhuma pagina do site oferece integracao com calendarios. Sympla, Eventbrite e Ingresse oferecem isso na confirmacao e nos ingressos. E uma funcionalidade essencial para reduzir no-shows.

**Correcao:** Adicionar botao "Adicionar ao calendario" em `CheckoutStepConfirmation` e `MeusIngressos`, gerando link ICS ou Google Calendar URL.

### 11. Sem paginacao no catalogo de eventos
`Eventos.tsx` carrega `limit: 50` e nao tem paginacao nem infinite scroll. Com o crescimento da base, usuarios nao conseguem ver eventos alem dos 50 primeiros. Todas as plataformas concorrentes tem paginacao ou scroll infinito.

**Correcao:** Implementar infinite scroll com `useInfiniteQuery` ou paginacao com botao "Carregar mais".

### 12. Nao ha pre-venda / vendas programadas
Sympla e Ingresse permitem que produtores configurem "vendas iniciam em DD/MM as HH:MM". O schema tem `sales_start_date` e `sales_end_date` nos tiers, mas o frontend ignora esses campos — todos os tiers visiveis sao compraveis imediatamente.

**Correcao:** No `TicketTierCard`, verificar `sales_start_date`/`sales_end_date` e mostrar countdown ou "Vendas em breve" quando aplicavel.

### 13. Sem mapa interativo do local (Google Maps embed)
A aba "Local" no `EventDetail` mostra apenas texto (nome, endereco, cidade). Sympla e Eventbrite embedam Google Maps. O schema tem `venue_lat`, `venue_lng`, `venue_address`.

**Correcao:** Adicionar embed de Google Maps na aba "Local" quando coordenadas estiverem disponiveis (usando iframe ou API).

### 14. Sem politica de reembolso visivel na pagina do evento
Embora o `RefundDialog` exista para o produtor, o comprador nao ve a politica de reembolso antes de comprar. Eventbrite mostra claramente "Refund Policy" na pagina do evento. O schema tem `refund_policy` na tabela `events`.

**Correcao:** Exibir politica de reembolso na aba "Sobre" ou "Ingressos" do `EventDetail`, se o evento tiver `refund_policy` preenchido.

### 15. Sem reenvio de ingresso por email
Se o usuario perder o email, ele pode acessar `/meus-ingressos`, mas nao ha botao "Reenviar por email" como Sympla/Eventbrite oferecem.

**Correcao:** Adicionar botao "Reenviar por email" em `MeusIngressos` que chama `send-ticket-email` (apos integracao real).

---

## Plano de Implementacao (Priorizado)

### Sprint 1 — Criticos para experiencia de compra
1. AuthCallback respeitar redirectTo (OAuth + carrinho)
2. EventCard passar eventId (favoritos no catalogo)
3. CartContext zerar taxa com cupom 100%
4. Waitlist UI no TicketTierCard
5. Validacao de disponibilidade ao abrir carrinho

### Sprint 2 — Paridade com concorrentes
6. Pre-venda / countdown nos tiers com sales_start_date
7. Confirmacao expandida (QR + detalhes + calendario)
8. Botao "Adicionar ao calendario" (ICS/Google)
9. Politica de reembolso visivel no EventDetail
10. Pagina "Meus Pedidos" (historico de compras)

### Sprint 3 — Qualidade de vida
11. Paginacao / infinite scroll no catalogo
12. Google Maps embed no local do evento
13. Meia-entrada no checkout com upload
14. Reenvio de ingresso por email
15. Integracao real do send-ticket-email (requer servico de email)

