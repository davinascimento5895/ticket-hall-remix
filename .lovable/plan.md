

# Plano de Correcao — Auditoria Tecnica Completa (46 Issues)

A auditoria e precisa e bem fundamentada. Validei cada item contra o codigo-fonte. Abaixo, o plano de implementacao priorizado, agrupado em sprints executaveis.

---

## Sprint 1 — Seguranca Critica (C01-C10)

### 1.1 Adicionar autenticacao JWT em 10 edge functions (C03, C04)

Todas as funcoes listadas precisam verificar JWT do caller. Padrao a aplicar:

```text
FUNCAO                          TIPO AUTH
sync-offline-checkins           JWT operador + validar QR de cada scan
generate-qr-code                JWT + verificar que caller e dono do pedido ou admin
generate-certificate            JWT + verificar que caller e dono do ticket ou producer
calculate-producer-payout       JWT + verificar que caller e producer do evento ou admin
dispatch-webhook                JWT + verificar que caller e producer do webhook ou admin
manage-queue                    JWT (join/status: caller=userId, admit/expire: producer/admin)
validate-checkin                JWT operador (ja usa service_role, adicionar auth header)
event-reminders                 Service token interno (cron)
process-waitlist                Service token interno (cron)
send-ticket-email               Service token interno (chamado por outras functions)
```

Para funcoes de cron/internas: verificar header `Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}` em vez de JWT de usuario.

Para `sync-offline-checkins` especificamente: validar QR JWT de cada scan antes de marcar como usado (mesma logica do `validate-checkin`).

### 1.2 Remover fallback do QR_SECRET (C05)

Em `generate-qr-code`, `validate-checkin`, `transfer-ticket`, `purchase-resale`:
- Remover `|| "tickethall-dev-secret-change-me"`
- Lancar erro 500 se `QR_SECRET` nao definido
- Adicionar secret `QR_SECRET` via tool de secrets

### 1.3 Validacao server-side de precos (C02)

Criar funcao PL/pgSQL `create_order_validated` que:
- Recebe `tier_ids[]`, `quantities[]`, `coupon_id?`, `buyer_id`
- Calcula `subtotal` somando `ticket_tiers.price * quantity` do banco
- Calcula `platform_fee` usando `events.platform_fee_percent` do banco
- Aplica desconto do cupom server-side
- Retorna o `order` criado com valores corretos

Atualizar `Checkout.tsx` e `BookingFlow.tsx` para usar o RPC.

### 1.4 Webhook Asaas — tornar validacao obrigatoria (C07)

Em `asaas-webhook/index.ts`:
- Se `ASAAS_API_KEY` nao definida, retornar 500
- Implementar verificacao HMAC se Asaas suportar signature header

### 1.5 become-producer com aprovacao (C09)

- Mudar `producer_status` de `"approved"` para `"pending"`
- Nao inserir role `producer` imediatamente
- Criar notificacao para admins sobre nova solicitacao
- Criar endpoint de aprovacao no admin (ou fluxo no `AdminProducerDetail`)

### 1.6 generate-invoice — verificar ownership (C10)

Adicionar check: `WHERE buyer_id = callerId` ou verificar se caller e producer do evento ou admin.

### 1.7 BookingFlow — aplicar cupom via RPC (C08)

Chamar `apply_coupon` RPC no BookingFlow quando cupom aplicado, antes de criar pedido.

### 1.8 PCI DSS — dados de cartao (C06)

Documentar para fase 2 (requer SDK JavaScript do Asaas para tokenizacao no browser). Por ora: manter advertencia no checkout de que cartao de credito esta bloqueado em stub mode (ja implementado).

### 1.9 .env no .gitignore (C01)

Adicionar `.env` ao `.gitignore`. Nota: o historico git requer `git filter-branch` fora do escopo do Lovable. As chaves Supabase sao automaticamente gerenciadas pelo Lovable Cloud — a rotacao nao e necessaria para chaves publishable (anon key), mas deve ser feita para service role keys se expostas.

---

## Sprint 2 — Issues de Alta Prioridade (A01-A12)

### 2.1 Salvar respostas attendee no checkout (A01)

Em `Checkout.tsx`, adicionar filtro para chaves `attendee-` e salvar com `ticket_id`:
```
attendee-{tierId}-{qi}-{questionId} -> { order_id, question_id, ticket_id, answer }
```

### 2.2 Validar perguntas obrigatorias attendee (A02)

Em `CheckoutStepData.tsx`, adicionar loop para validar `attendeeQuestions` com `is_required` por participante.

### 2.3 Proteger dispatch-webhook contra SSRF (A04)

Adicionar auth + blocklist de IPs privados (10.x, 172.16-31.x, 192.168.x, 169.254.x, localhost, metadata endpoints).

### 2.4 QR code local — remover dependencia de api.qrserver.com (A06)

Usar biblioteca `qrcode` no Deno para gerar QR code como data URI em vez de enviar JWT para servico externo.

### 2.5 Protecao contra double-click (A10)

Adicionar `isAdding` state no `TicketTierCard`. Validar `maxPerOrder` no `CartContext.addItem`.

### 2.6 Bloquear checkout com itens indisponiveis (A11)

Em `Carrinho.tsx`, desabilitar botao de checkout quando `unavailableItems.length > 0`.

### 2.7 Idempotencia no webhook de refund (A12)

Verificar se `orders.status` ja e `refunded` antes de processar. Usar `payment_id + event_type` como idempotency key.

### 2.8 Unlock codes expostos (A08)

Nao enviar `unlock_code` na query do frontend. Mover logica de desbloqueio para RPC server-side.

### 2.9 Webhook — processar status faltantes do Asaas (A09)

Adicionar handlers para `PAYMENT_DELETED`, `PAYMENT_RESTORED`, `PAYMENT_REFUND_IN_PROGRESS`, etc.

---

## Sprint 3 — Issues de Media Prioridade (M01-M12)

### 3.1 Validacao de email (M02)
Usar regex ou `z.string().email()` em `CheckoutStepData`.

### 3.2 Race condition views/clicks (M03)
Criar RPC `increment_event_views(p_event_id)` e `increment_promoter_clicks(p_promoter_event_id)`.

### 3.3 Desconto de cupom por tier (M05)
Calcular desconto apenas sobre itens cujo `tierId` esta em `applicable_tier_ids`.

### 3.4 Produtos nao renderizam formulario de participante (M07)
Filtrar `items.filter(i => !i.tierId.startsWith("product-"))` antes de renderizar campos de attendee.

### 3.5 Timer de expiracao no frontend (M12)
Adicionar countdown baseado em `expires_at` do pedido em `CheckoutStepPayment`.

### 3.6 Validacao basica de cartao (M09)
Adicionar Luhn check, validacao de mes/ano futuro, CVV 3-4 digitos.

### 3.7 Padronizar getUser() (M06)
Substituir `getClaims()` por `getUser()` em `create-producer-account` e `purchase-resale`.

---

## Sprint 4 — Issues de Baixa Prioridade (B01-B12)

Remover codigo morto (B01, B02), adicionar paginacao admin (B07), mover `asaas_account_key` para tabela separada (B09), implementar download PDF (B10), exportacao CSV (B11), e solicitacao de reembolso pelo comprador (B12). Estes serao tratados em iteracoes futuras.

---

## Resumo de Escopo por Sprint

| Sprint | Issues | Estimativa |
|--------|--------|-----------|
| 1 | C01-C10 (seguranca) | ~15 arquivos, 2 migracoes |
| 2 | A01-A12 (alta prioridade) | ~12 arquivos |
| 3 | M01-M12 (media) | ~8 arquivos, 2 migracoes |
| 4 | B01-B12 (baixa) | Backlog futuro |

**Recomendacao:** Implementar Sprint 1 inteiro primeiro, pois contem todas as vulnerabilidades de seguranca criticas. Posso comecar imediatamente.

