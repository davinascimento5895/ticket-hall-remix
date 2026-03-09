

# Auditoria — Financeiro & Promoters do Produtor

## O que está funcionando
- CRUD completo de contas a pagar/receber com filtros e confirmação de pagamento
- Fluxo de caixa com resumo (saldo líquido, pendente, confirmado)
- Conferência de eventos (receita bruta, taxas, reembolsos, líquido)
- Contas bancárias com gestão de conta padrão
- CRUD de promoters (cadastro, ativação/desativação, remoção)
- Comissões de promoters com aprovação individual e em lote
- Ranking de promoters agregado por evento
- Todas as rotas registradas corretamente no App.tsx
- Sidebar do produtor com links para Financeiro e Promoters

## Problemas Identificados

### 1. Falta UI para vincular promoter a evento (promoter_events)
A tabela `promoter_events` existe com `tracking_code`, `commission_type`, `commission_value`, mas **não existe nenhuma tela** para vincular um promoter a um evento específico e gerar o código de rastreio. O sistema "antigo" de Afiliados (`ProducerEventAffiliates`) usa a tabela `affiliates` — são dois sistemas paralelos desconectados. O ranking e comissões dependem de `promoter_events`, mas ninguém cria registros nessa tabela.

### 2. Duplicidade: Afiliados vs Promoters
`ProducerEventAffiliates` (tabela `affiliates`) e `ProducerPromoters` (tabela `promoters` + `promoter_events`) fazem a mesma coisa de formas diferentes. Precisa unificar — o fluxo correto é: cadastrar promoter → vincular a evento com tracking code → comissões são geradas automaticamente.

### 3. Comissões nunca são geradas automaticamente
Não existe trigger nem lógica no checkout que crie registros em `promoter_commissions` quando uma venda é feita via tracking code de promoter. O produtor teria que criar comissões manualmente. O fluxo esperado seria: comprador acessa via `?ref=CODE` → checkout registra o `tracking_code` no order → trigger/lógica cria comissão automática.

### 4. Tracking code não é capturado no checkout
O `EventDetail` e o `Checkout` não leem o `?ref=` da URL nem salvam o tracking code no pedido. A tabela `orders` não tem campo `tracking_code` ou `promoter_event_id`.

### 5. Tab "Afiliados" ausente no EventPanel
O `ProducerEventPanel` não inclui a tab de Afiliados/Promoters — só existe como rota legacy `/producer/events/:id/affiliates`. Deveria estar integrado ao painel do evento.

---

## Plano de Correções

### Correção 1 — Adicionar campos no orders + migration
Adicionar `promoter_event_id` (uuid nullable, FK para `promoter_events`) na tabela `orders` para rastrear qual promoter gerou a venda.

### Correção 2 — Capturar tracking code no fluxo de compra
- `EventDetail`: ler `?ref=` da URL e salvar no `CartContext` (novo campo `trackingCode`)
- `Checkout`: enviar `promoter_event_id` ao criar o order (buscar pelo tracking_code)

### Correção 3 — Gerar comissões automaticamente
Criar um database trigger `after INSERT or UPDATE on orders` que, quando `status = 'paid'` e `promoter_event_id IS NOT NULL`, insere um registro em `promoter_commissions` e atualiza `promoter_events` (revenue_generated, conversions).

### Correção 4 — UI para vincular promoter a evento
Adicionar uma tela dentro de `ProducerPromotersList` ou como sub-tab para vincular promoters a eventos, definir comissão e gerar tracking code. Remover a duplicidade com o sistema de `affiliates`.

### Correção 5 — Adicionar tab "Promoters" no EventPanel
Adicionar tab no `ProducerEventPanel` que mostra os promoters vinculados ao evento específico, com opção de vincular novos e ver desempenho.

### Correção 6 — Unificar Afiliados e Promoters
Deprecar a tabela `affiliates` em favor de `promoters` + `promoter_events`. Atualizar `ProducerEventAffiliates` para usar o novo sistema ou redirecionar para o novo fluxo.

