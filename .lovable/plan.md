

# Marketplace de Revenda de Ingressos — Plano Completo

## Visão Geral

Criar um marketplace interno de revenda onde usuários podem anunciar ingressos para venda e outros usuários podem comprá-los. A plataforma cobra **10% de taxa** sobre o valor de revenda. Na venda, o QR code antigo é invalidado e um novo é gerado para o comprador.

## Dados Existentes

O banco já tem:
- `tickets.is_for_resale` (boolean) e `tickets.resale_price` (numeric)
- `ticket_tiers.is_resellable` (boolean)
- Edge function `transfer-ticket` com lógica de invalidação de QR + geração de novo JWT

## Arquitetura

```text
┌──────────────────┐     ┌───────────────────┐     ┌──────────────────────┐
│  /revenda (público)│────▶│  resale_listings   │◀────│ MeusIngressos        │
│  Marketplace page │     │  (nova tabela)     │     │ "Anunciar Revenda"   │
└──────────────────┘     └───────────────────┘     └──────────────────────┘
         │                        │
         ▼                        ▼
┌──────────────────┐     ┌───────────────────┐
│  /revenda/:id     │────▶│  purchase-resale   │
│  Checkout revenda │     │  (edge function)   │
└──────────────────┘     └───────────────────┘
```

---

## Batch 1 — Database: tabela `resale_listings`

Nova tabela para controlar anúncios de revenda (separada dos tickets para queries performáticas e histórico):

```sql
CREATE TABLE public.resale_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id),
  seller_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES events(id),
  tier_id UUID NOT NULL REFERENCES ticket_tiers(id),
  asking_price NUMERIC NOT NULL,
  platform_fee_amount NUMERIC NOT NULL DEFAULT 0,
  seller_receives NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- active, sold, cancelled, expired
  buyer_id UUID,
  sold_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.resale_listings ENABLE ROW LEVEL SECURITY;
```

**RLS Policies:**
- SELECT: qualquer pessoa autenticada pode ver listings `active`
- INSERT: seller pode criar se `auth.uid() = seller_id`
- UPDATE: seller pode cancelar seus próprios listings
- Admin gerencia tudo

**Indexes:** `(event_id, status)` e `(seller_id)` para queries rápidas.

---

## Batch 2 — Edge Function `purchase-resale`

Operação atômica server-side que:

1. Verifica se o listing está `active` e não expirado
2. Verifica se o evento ainda não aconteceu
3. Calcula taxa de 10%: `platform_fee = asking_price * 0.10`, `seller_receives = asking_price * 0.90`
4. Cria um order no modelo existente com `payment_method` e status `pending`
5. Após pagamento confirmado (via webhook ou credit card imediato):
   - Marca listing como `sold`, seta `buyer_id` e `sold_at`
   - Invalida o QR code antigo do ticket
   - Gera novo QR code JWT para o comprador (mesma lógica do `transfer-ticket`)
   - Atualiza `owner_id` do ticket para o comprador
   - Limpa dados do titular antigo (`attendee_name`, `attendee_cpf`)
   - Marca `is_for_resale = false` no ticket
   - Cria notificações para vendedor e comprador
6. Se pagamento falha/expira, cancela o listing de volta para `active`

---

## Batch 3 — UI: Anunciar Ingresso para Revenda

Em `MeusIngressos.tsx`, adicionar botão **"Revender"** nos tickets ativos cujo tier tem `is_resellable = true`:

- Abre modal `ResaleListingModal` com:
  - Preço de venda (input numérico)
  - Cálculo em tempo real: "Você receberá R$ X (taxa de 10%)"
  - Data limite para venda (máx: início do evento)
  - Botão "Anunciar"
- Ao anunciar: insere na `resale_listings` e marca `tickets.is_for_resale = true`

---

## Batch 4 — UI: Página `/revenda` (Marketplace)

Página pública com:

- Lista de ingressos à venda agrupados por evento
- Filtros: busca por nome de evento, cidade, categoria
- Card de cada listing mostrando: nome do evento, data, local, tipo de ingresso, preço original vs preço de revenda, taxa da plataforma
- Botão "Comprar" que leva para checkout de revenda

---

## Batch 5 — UI: Checkout de Revenda `/revenda/:listingId`

Página protegida (ProtectedRoute) com:

- Resumo do ingresso sendo comprado
- Breakdown claro: preço + taxa plataforma = total
- Métodos de pagamento (PIX, cartão, boleto) — reutiliza `CheckoutStepPayment`
- Ao confirmar, chama edge function `purchase-resale`
- Aguarda confirmação de pagamento via realtime (mesmo padrão do checkout normal)

---

## Batch 6 — Cancelamento e Expiração

- Vendedor pode cancelar a qualquer momento via MeusIngressos (botão "Cancelar Revenda")
- Ao cancelar: atualiza listing para `cancelled`, marca `tickets.is_for_resale = false`
- Listings expirados (passa da `expires_at`): cron job ou check no fetch para ignorar
- Após data do evento: todos os listings ativos são automaticamente expirados

---

## Batch 7 — Termos de Uso e Política de Privacidade

Adicionar seção "Revenda de Ingressos" nos Termos de Uso (`TermosDeUso.tsx`) cobrindo:
- Taxa de 10% sobre valor de revenda cobrada do vendedor
- Invalidação do QR code antigo para prevenir fraudes
- Vendedor perde acesso ao ingresso após venda confirmada
- Prazo máximo de venda: até horário definido pelo vendedor (máx: início do evento)
- Plataforma não garante reembolso em revendas — é responsabilidade entre as partes
- Proibida revenda por valor superior ao valor original (anti-cambismo) — opcional, verificar regra

---

## Batch 8 — Navegação

- Adicionar link "Revenda" no `Navbar` e no `MobileBottomNav` (ou dentro do menu)
- Registrar rota `/revenda` e `/revenda/:listingId` no `App.tsx`

---

## Arquivos Novos
- `src/pages/Revenda.tsx` — marketplace page
- `src/pages/RevendaCheckout.tsx` — checkout de revenda
- `src/components/ResaleListingModal.tsx` — modal para anunciar
- `src/lib/api-resale.ts` — funções de API para resale
- `supabase/functions/purchase-resale/index.ts` — edge function
- Migration SQL para `resale_listings`

## Arquivos Modificados
- `src/pages/MeusIngressos.tsx` — botão Revender + Cancelar Revenda
- `src/App.tsx` — novas rotas
- `src/components/Navbar.tsx` — link Revenda
- `src/pages/TermosDeUso.tsx` — seção revenda
- `supabase/config.toml` — config para nova edge function

