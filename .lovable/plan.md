

## Plano de Implementacao — Features Faltantes (15 novas funcionalidades)

Comparando o prompt atualizado com o que ja existe, **todas as 15 features listadas na secao "MISSING FEATURES"** sao novas. Nenhuma delas tem tabelas, tipos, API ou UI implementados.

Dado o volume, o plano esta dividido em **5 blocos sequenciais**, cada um entregavel de forma independente.

---

### Bloco 5 — Schema & Tipos (fundacao para tudo)

Criar todas as tabelas novas via migration + RLS + atualizar `types/index.ts`:

**Novas tabelas (10):**
- `checkout_questions` + `checkout_answers` (formulario customizado)
- `ticket_taxes_fees` (taxas do produtor)
- `capacity_groups` (pools de capacidade compartilhada) + coluna `capacity_group_id` em `ticket_tiers`
- `checkin_lists` + `checkin_scan_logs` (listas multiplas de check-in)
- `webhooks` + `webhook_deliveries` (webhooks de saida)
- `bulk_messages` (mensagens em massa)
- `refunds` (reembolsos) + colunas extras em `orders`
- `affiliates` (afiliados)
- `event_products` + `order_products` (produtos/complementos)
- `producer_team_members` (equipe do produtor)

**Modificacoes em tabelas existentes:**
- `ticket_tiers`: + `capacity_group_id`, `is_hidden_by_default`, `unlock_code`
- `orders`: + `refunded_amount`, `refund_reason`, `refunded_at`, `invoice_number`, `invoice_issued_at`, `invoice_pdf_url`, `billing_company_name`, `billing_cnpj`, `billing_address`
- `profiles`: + `organizer_slug`, `organizer_bio`, `organizer_logo_url`, `organizer_banner_url`, `organizer_website`, `organizer_instagram`, `organizer_facebook`

**RLS:** Cada tabela com policies adequadas (producer ve seus dados, admin ve tudo, buyers ve os proprios).

**Tipos:** Adicionar interfaces TS para todas as novas entidades.

---

### Bloco 6 — Checkout Avancado + Taxas + Capacidade + Produtos

**6.1 Custom Checkout Questions**
- UI no event editor: nova aba "Formulario" com builder de perguntas (text, select, checkbox, radio, date)
- Renderizar perguntas no checkout step 1 (por pedido ou por ingresso)
- Salvar respostas em `checkout_answers`
- API: CRUD em `checkout_questions`, insert `checkout_answers`

**6.2 Taxes & Fees**
- UI no event editor > form do lote: secao "Taxas e Encargos"
- Preview ao vivo do preco final (base + taxas = total para comprador)
- Integrar no calculo do carrinho/checkout
- API: CRUD em `ticket_taxes_fees`

**6.3 Capacity Groups**
- UI no event editor > aba "Ingressos": secao de grupos de capacidade acima dos lotes
- Selector para associar lote a grupo
- Logica de validacao: checar tanto `quantity_total` do lote quanto `capacity` do grupo
- Indicador visual na pagina do evento para lotes vinculados
- API: CRUD em `capacity_groups`

**6.4 Products / Add-ons**
- UI no event editor: nova aba "Produtos"
- Na pagina do evento: secao "Adicione ao seu ingresso" com cards de produtos
- No checkout: incluir produtos no resumo do pedido
- API: CRUD `event_products`, insert `order_products`

---

### Bloco 7 — Check-in Avancado + Reembolsos + Ingressos Ocultos

**7.1 Multiple Check-in Lists**
- UI em `/producer/events/:id/checkin`: lista de check-in lists com create/edit
- Cada lista com access_code unico e URL shareable
- Nova rota publica `/checkin/:access_code` — scanner QR sem login
- Tabela `checkin_scan_logs` com log completo de cada scan
- API: CRUD `checkin_lists`, insert `checkin_scan_logs`

**7.2 Refunds**
- Modal de reembolso em order detail (producer + admin)
- Opcao: reembolso total ou parcial (por valor ou por ingresso)
- Historico de reembolsos por pedido
- Atualizar status do pedido e tickets afetados
- API: insert `refunds`, update `orders`

**7.3 Hidden Tickets (Pre-sale)**
- Toggle "Ocultar ate codigo" no form do lote (event editor)
- Na pagina do evento: link "Tenho um codigo de acesso" que revela lotes ocultos
- Logica separada de cupons (controla visibilidade, nao preco)

---

### Bloco 8 — Webhooks + Mensagens + Afiliados + Equipe

**8.1 Outgoing Webhooks**
- UI em ProducerSettings: aba "Integracoes" com CRUD de webhooks
- Selecao de event types (order.paid, ticket.checked_in, etc.)
- Edge function `dispatch-webhook` com HMAC-SHA256 signing + retry 3x
- Historico de entregas em `webhook_deliveries`
- Botao "Testar" que envia payload de exemplo

**8.2 Bulk Messaging**
- Nova rota `/producer/events/:id/messages`
- Compose: subject, body, filtro de destinatarios (por lote, status)
- Preview de contagem de destinatarios
- Edge function `send-bulk-message` (stub)
- API: CRUD `bulk_messages`

**8.3 Affiliates**
- Nova rota `/producer/events/:id/affiliates`
- CRUD de links de afiliado com codigo unico
- Logica: cookie `ref=CODE` (30 dias), link ao pedido na compra
- Dashboard de conversoes por afiliado
- API: CRUD `affiliates`, update on purchase

**8.4 Producer Team Members**
- UI em ProducerSettings: aba "Equipe"
- Convite por email com role (admin, manager, checkin_staff, reports_only)
- Matriz de permissoes aplicada nas rotas do producer
- API: CRUD `producer_team_members`

---

### Bloco 9 — Exportacao + Nota Fiscal + Widget + Pagina Publica

**9.1 Data Export**
- Botao "Exportar CSV" em todas as tabelas do producer e admin
- Edge function `export-data` que gera CSV server-side
- Tipos de export: participantes, pedidos, resumo financeiro, relatorio de cupons
- Incluir respostas de checkout questions como colunas extras

**9.2 Automatic Invoicing**
- Edge function `generate-invoice` (stub) — gera PDF apos pagamento
- Numeracao sequencial NF-{ANO}-{SEQ}
- Armazena PDF no Supabase Storage
- Botao "Baixar Nota Fiscal" em /meus-ingressos

**9.3 Embeddable Widget**
- Nova rota `/widget/:eventId` — layout minimal (sem navbar/footer)
- Renderiza selecao de ingressos + checkout inline
- Gera snippet de embed `<script>` no producer dashboard
- Opcoes de estilo (light/dark, largura)

**9.4 Producer Public Page**
- Nova rota `/organizador/:slug`
- Exibe logo, banner, bio, links sociais, grid de eventos publicados
- Link para esta pagina em cada pagina de evento
- Em ProducerSettings: secao "Minha Pagina Publica" para configurar slug, bio, logo, banner

---

### Resumo da Ordem de Execucao

| Bloco | Conteudo | Dependencias |
|-------|----------|-------------|
| 5 | Migration + RLS + Types | Nenhuma |
| 6 | Checkout questions, Taxas, Capacidade, Produtos | Bloco 5 |
| 7 | Check-in lists, Reembolsos, Hidden tickets | Bloco 5 |
| 8 | Webhooks, Mensagens, Afiliados, Equipe | Bloco 5 |
| 9 | Export, Nota fiscal, Widget, Pagina publica | Blocos 5-8 |

Blocos 6, 7 e 8 podem ser feitos em paralelo apos o Bloco 5. O Bloco 9 depende de todos os anteriores para ter dados completos para exportar.

Devo comecar pelo **Bloco 5** (migration de todas as tabelas novas + tipos)?

