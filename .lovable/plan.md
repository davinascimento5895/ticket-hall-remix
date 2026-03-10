

# Plano de Implementacao — Issues Pendentes da Auditoria (sem dependencia de APIs externas)

## Escopo: 14 issues em 11 blocos de trabalho

---

## 1. C01 — .env no .gitignore
Adicionar `.env` e `tmp/` ao `.gitignore`. Adicionar `tmpclaude-*` tambem (B05/B06).

## 2. C02 + C08 — Migrar Checkout e BookingFlow para RPC `create_order_validated`
**Checkout.tsx (linha 112):** Substituir o `supabase.from("orders").insert(...)` direto pelo `supabase.rpc("create_order_validated", ...)`. O RPC ja calcula subtotal, platform_fee, discount e total server-side. Remover a chamada separada de `apply_coupon` (o RPC ja incrementa o cupom).

**BookingFlow.tsx (linha 99):** Mesmo tratamento — substituir insert direto por chamada ao RPC. Isso resolve C08 (cupom nao incrementado) automaticamente.

Ambos os fluxos continuam chamando `reserve_tickets` e `confirm_order_payment` apos o RPC.

## 3. A01 + A02 — Salvar respostas attendee + validar obrigatorias
**CheckoutStepData.tsx:**
- Linhas 173-189: Adicionar validacao de perguntas attendee obrigatorias (loop por item + qi + question).
- **Checkout.tsx linhas 188-197:** Adicionar filtro para chaves `attendee-*` e salvar com `ticket_id` na tabela `checkout_answers`.

## 4. A08 — Unlock codes protegidos server-side
Criar RPC `validate_unlock_code(p_event_id, p_code)` que retorna os tier IDs desbloqueados sem expor o campo `unlock_code`.
**EventDetail.tsx:** Remover `unlock_code` do select de tiers. Chamar RPC para validar codigo.

## 5. A10 — Protecao double-click no "Adicionar ao Carrinho"
**TicketTierCard.tsx:** Adicionar estado `isAdding` com timeout de 1s.
**CartContext.tsx `addItem`:** Validar `maxPerOrder` antes de somar quantidades.

## 6. A11 — Bloquear checkout com itens indisponiveis
**Carrinho.tsx linha 64:** Condicionar `navigate("/checkout")` a `unavailableItems.length === 0`. Desabilitar botao visualmente.

## 7. M02 — Validacao de email adequada
**CheckoutStepData.tsx linha 153:** Substituir `email.includes("@")` por regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.

## 8. M03 — RPCs atomicos para views/clicks
Criar duas RPCs: `increment_event_views(p_event_id)` e `increment_promoter_clicks(p_promoter_event_id)`.
**EventDetail.tsx:** Substituir read-then-write por chamadas RPC.

## 9. M05 — Desconto de cupom por tier aplicavel
**Carrinho.tsx linhas 90-93:** Quando `applicable_tier_ids` esta definido, calcular desconto apenas sobre o subtotal dos tiers aplicaveis, nao sobre o subtotal total. (O RPC server-side ja faz isso corretamente; este fix e para a exibicao no frontend.)

## 10. M07 — Filtrar produtos do formulario de participante
**CheckoutStepData.tsx linha 217:** Filtrar `items` para excluir itens com `tierId.startsWith("product-")` antes do loop de formulario de participante.

## 11. M09 — Validacao basica de cartao de credito
**CheckoutStepPayment.tsx linhas 66-70:** Adicionar validacao Luhn para numero do cartao, mes/ano futuro, CVV 3-4 digitos.

## 12. M12 — Timer de expiracao PIX/boleto no frontend
**CheckoutStepPayment.tsx:** Quando `awaitingPayment`, calcular tempo restante baseado no `expires_at` do pedido (15 min). Mostrar countdown e mensagem de expiracao quando timer zerar.

## 13. B01 + B02 — Remover codigo morto
Deletar 5 componentes de animacao nao utilizados + FeeCalculator.

## 14. B05 — Remover tmp/ do tracking
Ja coberto pelo item 1 (.gitignore).

---

## Resumo de arquivos modificados

| Arquivo | Issues |
|---------|--------|
| `.gitignore` | C01, B05, B06 |
| `src/pages/Checkout.tsx` | C02, A01 |
| `src/components/booking/BookingFlow.tsx` | C08 |
| `src/components/checkout/CheckoutStepData.tsx` | A02, M02, M07 |
| `src/pages/EventDetail.tsx` | A08, M03 |
| `src/components/TicketTierCard.tsx` | A10 |
| `src/contexts/CartContext.tsx` | A10 |
| `src/pages/Carrinho.tsx` | A11, M05 |
| `src/components/checkout/CheckoutStepPayment.tsx` | M09, M12 |
| Migration SQL | A08 (RPC unlock), M03 (RPCs increment) |
| Deletar 6 arquivos | B01, B02 |

## Issues NAO incluidas (dependem de integracao externa)
- C06 (SDK Asaas JS — PCI)
- A03 (BookingFlow completo — depende de redesign maior, pode ser feito parcialmente)
- A05 (Atomicidade completa — o RPC `create_order_validated` ja resolve a parte critica)
- A06 (QR code local — biblioteca Deno)
- A07 (Resend email)
- M08 (Trocar metodo pagamento — depende de cancel no Asaas)
- M10/M11 (stubs que precisam de email service)

