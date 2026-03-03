

# TicketHall — Estágio 3: Plano de Implementação em Blocos

## Visão Geral

O projeto atual tem toda a UI construída com placeholders `PAYMENT_INTEGRATION_POINT` no checkout, QR codes, e payouts. As edge functions existentes (`send-ticket-email`, `generate-qr-code`, `calculate-producer-payout`) são stubs. O objetivo é tornar tudo funcional com o gateway Asaas, sem ter as chaves API ainda — preparando a infraestrutura completa para que, ao receber as chaves, tudo funcione de ponta a ponta.

---

## Bloco 1 — Fundação: Schema, Funções SQL e Utilitários

**Objetivo:** Preparar o banco de dados e utilitários compartilhados antes de qualquer lógica de pagamento.

**Tarefas:**
1. **Migração de schema** — Adicionar colunas faltantes:
   - `profiles`: `asaas_wallet_id`, `asaas_account_id`, `asaas_account_key`
   - `orders`: `asaas_payment_id`, `asaas_customer_id`, `net_amount`, `platform_fee_amount`, `installments`, `installment_value`, `chargeback_status`, `chargeback_reason`, `chargeback_notified_at`
   - Nova tabela `rate_limits` (key TEXT PK, count INT, expires_at TIMESTAMPTZ)

2. **Funções SQL atômicas:**
   - `reserve_tickets(p_tier_id, p_quantity, p_order_id)` com `FOR UPDATE` lock
   - `confirm_order_payment(p_order_id, p_asaas_payment, p_net_value)` — transação que atualiza orders, ticket_tiers, tickets, event_analytics
   - `apply_coupon(p_coupon_id, p_order_id)` com verificação atômica
   - `cleanup_expired_reservations()` para cron

3. **Índices de performance** — Todos os índices listados no prompt (events, orders, tickets, full-text search)

4. **Utilitários frontend:**
   - `src/lib/validators.ts`: `validateCPF()`, `formatCPF()`, `formatPhone()`
   - `src/lib/cep.ts`: `fetchAddress()` com debounce via ViaCEP
   - `src/lib/slug.ts`: `generateUniqueSlug()` usando supabase

---

## Bloco 2 — Edge Function de Pagamento (Asaas)

**Objetivo:** Criar a edge function central `create-payment` que cria cobranças no Asaas para PIX, cartão e boleto. Funciona como stub inteligente sem as chaves — retorna erros claros pedindo configuração.

**Tarefas:**
1. **`supabase/functions/create-payment/index.ts`** — Edge function que:
   - Recebe: `orderId`, `paymentMethod`, `creditCard?`, `installments?`
   - Busca order + event + producer profile (walletId)
   - Cria/busca customer Asaas do comprador
   - Cria cobrança com split (93%/7%)
   - Para PIX: busca QR code em chamada separada (`/pixQrCode`)
   - Para cartão: envia dados do cartão no checkout transparente
   - Para boleto: cria com vencimento 3 dias úteis
   - Salva IDs do Asaas na order
   - **Sem chaves:** retorna `{ error: "ASAAS_NOT_CONFIGURED" }` graciosamente

2. **`supabase/functions/asaas-webhook/index.ts`** — Webhook handler:
   - Valida `asaas-access-token` no header
   - Trata: `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_REFUNDED`, `CHARGEBACK_REQUESTED`, `PAYMENT_REPROVED_BY_RISK_ANALYSIS`
   - Chama `confirm_order_payment` via RPC
   - Dispara async: `send-ticket-email`, `generate-qr-codes`

3. **`supabase/functions/create-producer-account/index.ts`** — Cria subconta Asaas quando admin aprova produtor

4. **Secrets necessários** (a pedir depois): `ASAAS_API_KEY`, `ASAAS_BASE_URL`, `QR_SECRET`

---

## Bloco 3 — Checkout Real (Frontend)

**Objetivo:** Conectar a UI de checkout existente (`Checkout.tsx`) às edge functions reais.

**Tarefas:**
1. **Refatorar `Checkout.tsx`:**
   - Step 0 → Validar dados obrigatórios (nome, email, CPF com `validateCPF`)
   - Ao avançar para Step 1 → Chamar `createOrder` na API + `reserve_tickets` via RPC
   - PIX: chamar `create-payment`, exibir QR real (base64 image + copia-cola)
   - Cartão: adicionar campos de parcelamento, endereço do titular, chamar `create-payment`
   - Boleto: chamar `create-payment`, mostrar link PDF + código de barras
   - Realtime subscription em `orders` para detectar `status = 'paid'` → avançar para confirmação

2. **`src/lib/api-payment.ts`** — Novo módulo:
   - `createPayment(orderId, method, cardData?)` → invoca edge function
   - `getInstallmentOptions(total)` → calcula tabela de parcelas

3. **Countdown + expiração:** Conectar ao `expires_at` real da order (não só localStorage)

---

## Bloco 4 — QR Codes Seguros e Check-in Real

**Objetivo:** Substituir QR codes de placeholder por JWTs assinados com validação real.

**Tarefas:**
1. **Refatorar `generate-qr-code/index.ts`:**
   - Gerar JWT assinado (HS256) com `{ tid, eid, oid, uid, v:1 }`
   - Gerar imagem via `api.qrserver.com`
   - Salvar `qr_code` e `qr_code_image_url` no ticket

2. **Nova edge function `validate-checkin/index.ts`:**
   - Verificar assinatura JWT
   - Verificar status do ticket no banco
   - Verificar owner_id (detectar QR de ingresso transferido)
   - Verificar allowed_tier_ids da checkin list
   - Marcar como `used` atomicamente (`WHERE status = 'active'`)
   - Registrar no `checkin_scan_logs`

3. **Atualizar `QRCodeModal.tsx`** — Renderizar imagem real do QR (base64 ou URL)

4. **Atualizar `ProducerEventCheckin.tsx`** — Usar `validate-checkin` em vez de update direto

---

## Bloco 5 — Transferência de Ingresso e Cancelamento de Evento

**Objetivo:** Implementar edge cases críticos de produto.

**Tarefas:**
1. **`supabase/functions/transfer-ticket/index.ts`:**
   - Validar que ticket é transferível e ativo
   - Buscar/criar conta do destinatário
   - Gerar novo QR code (invalidar antigo)
   - Atualizar `owner_id`, `transfer_history`
   - Notificar ambas as partes

2. **`supabase/functions/cancel-event/index.ts`:**
   - Buscar todas as orders pagas
   - Para cada: criar refund no Asaas + atualizar order
   - Atualizar event status para `cancelled`
   - Suspender todos os tickets

3. **UI de transferência** em `MeusIngressos.tsx` — Botão "Transferir" com modal de email

4. **Chargeback handling** no webhook Asaas — Suspender tickets + notificar admin

---

## Bloco 6 — Limpeza Automática e Cron Jobs

**Objetivo:** Automatizar expiração de reservas e lembretes.

**Tarefas:**
1. **Habilitar `pg_cron` e `pg_net`** via migração
2. **Registrar cron jobs:**
   - `cleanup_expired_reservations` — a cada 5 minutos
   - Lembretes 24h e 1h antes do evento (edge function via `pg_net`)
3. **Edge function `event-reminders/index.ts`** — Busca eventos próximos, envia notificações

---

## Bloco 7 — Segurança e LGPD

**Objetivo:** Rate limiting, compliance e hardening.

**Tarefas:**
1. **Rate limiting** — Tabela `rate_limits` + verificação nas edge functions de checkout e checkin
2. **LGPD:**
   - Tabelas `lgpd_consents` e `lgpd_data_requests`
   - Página `/minha-conta/privacidade` com exportação de dados e exclusão de conta
   - Checkbox de consentimento no cadastro
3. **RLS policies** para as novas tabelas
4. **Webhook auth** — Validar `asaas-access-token` em todas as requests

---

## Bloco 8 — Features Adicionais

**Objetivo:** Fila virtual, certificados, multi-day, meia-entrada, seguro.

**Tarefas:**
1. **Fila virtual** — Tabela `virtual_queue`, edge function de admissão, UI de espera
2. **Certificados** — Flag no evento, edge function de geração pós-checkin
3. **Multi-day** — Campo `valid_dates` nos tiers, validação no checkin
4. **Meia-entrada** — Campos de documento, verificação no checkin
5. **Seguro de ingresso** — Placeholder com toggle no checkout

---

## Ordem de Implementação Recomendada

```text
Bloco 1 (Schema + SQL)     ← Fundação, sem dependências
  ↓
Bloco 2 (Edge Functions)   ← Infra de pagamento (stub sem chaves)
  ↓
Bloco 3 (Checkout Frontend) ← Conecta UI às edge functions
  ↓
Bloco 4 (QR + Check-in)    ← Ingressos funcionais
  ↓
Bloco 5 (Transferência)    ← Edge cases de produto
  ↓
Bloco 6 (Cron Jobs)        ← Automação
  ↓
Bloco 7 (Segurança/LGPD)   ← Hardening
  ↓
Bloco 8 (Features extras)  ← Nice-to-have
```

## Sobre as Chaves API

Ao final do **Bloco 2**, vou solicitar as seguintes credenciais:
- `ASAAS_API_KEY` — Chave da conta raiz TicketHall no Asaas
- `ASAAS_BASE_URL` — `https://sandbox.asaas.com/api/v3` (sandbox) ou produção
- `QR_SECRET` — Chave secreta para assinar JWTs dos QR codes (posso gerar automaticamente)

Até lá, todas as edge functions funcionam com fallback gracioso retornando erro claro de configuração pendente. O checkout e o frontend serão testáveis com mocks.

## Escopo Total Estimado

- **12 migrações SQL** (schema + funções + índices + cron)
- **7 edge functions** novas/refatoradas
- **5 arquivos frontend** novos/refatorados
- **3 utilitários** (validators, CEP, slug)

