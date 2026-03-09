

# Análise de Features — O que Falta e o que Faz Sentido

## Geração e Validação

| Feature | Status | Faz sentido implementar? |
|---|---|---|
| E-ticket com QR Code | **Existe** — edge function `generate-qr-code`, `QRCodeModal` | -- |
| Transferência de ingressos | **Existe** — `TransferTicketModal`, edge function `transfer-ticket` | -- |
| Reimpressão de ingressos | **Não existe** — o QR é exibido em modal, mas não há botão de download/PDF | Sim — simples, basta gerar link de download da imagem QR |
| Cancelamento e reembolso | **Existe** — `RefundDialog` completo | -- |
| Validação offline | **Parcial** — `sync-offline-checkins` existe no backend, mas o client não armazena scans localmente quando offline | Baixa prioridade — requer PWA/service worker, complexo |
| Ingresso offline (sem internet) | **Não existe** — requer cache local do ticket + QR | Baixa prioridade — mesmo motivo acima |
| Check-in em tempo real | **Existe** — `ProducerEventCheckin` com scanner QR e busca manual | -- |
| Taxa de comparecimento | **Parcial** — `event_analytics.tickets_checked_in` existe mas não é exibida como % no dashboard do evento | Sim — dados já existem, falta só o cálculo e exibição |
| No-show por lote | **Não existe** — não há agrupamento de no-shows por tier/lote | Sim — dados existem (tickets com `status=active` mas sem `checked_in_at` pós-evento), falta a visualização |
| Certificados automáticos | **Existe** — `generate-certificate`, `MeusCertificados` | -- |

## Dashboard Admin

| Feature | Status | Faz sentido implementar? |
|---|---|---|
| Qtd de vendas por dia (gráfico) | **Parcial** — existe por mês, não por dia | Sim — o AdminDashboard já tem o gráfico de barras, basta adicionar granularidade diária |
| Método de pagamentos (gráfico) | **Parcial** — existe no dashboard do evento (`ProducerEventDashboardTab`), mas NÃO no AdminDashboard | Sim — replicar o PieChart que já existe no producer |
| Dias de semana com maiores receitas | **Não existe** | Não — dado muito granular, baixo ROI para a complexidade |
| Receita | **Existe** — GMV e Receita Plataforma em ambos dashboards | -- |
| Ticket médio | **Parcial** — existe no dashboard do evento, NÃO no AdminDashboard | Sim — uma divisão simples |
| Taxa de ocupação da casa | **Não existe** — precisa cruzar `tickets_sold` com `max_capacity` do evento | Sim — dados existem, falta a métrica |
| Comparativo de performance entre eventos | **Não existe** | Não agora — requer UI complexa de seleção multi-evento e normalização de dados |
| Heatmap de vendas por horário | **Não existe** | Não — complexidade alta (recharts heatmap custom), valor baixo |
| KPI dashboard customizável | **Não existe** | Não — requer drag-and-drop de widgets, estado persistido, muito complexo |

---

## Plano de Implementação — 5 Features que Fazem Sentido

### 1. Download/reimpressão de ingresso
Adicionar botão "Baixar QR Code" no card do ingresso em `MeusIngressos`. Usa a `qr_code_image_url` que já está salva no ticket para abrir download direto da imagem.

### 2. Taxa de comparecimento + No-show por lote
No `ProducerEventDashboardTab`, adicionar:
- Card "Taxa de Comparecimento" = `checked_in / total_sold * 100`
- Tabela de no-show por tier: tickets `active` sem `checked_in_at` agrupados por tier name
- Buscar `tickets` do evento com `checked_in_at` para calcular

### 3. Gráfico de vendas por dia no AdminDashboard
Substituir/complementar o gráfico "Receita por Mês" com toggle dia/mês. Os dados de `orders.created_at` já são buscados — basta agrupar por dia quando selecionado.

### 4. Método de pagamentos + Ticket médio no AdminDashboard
Adicionar ao `AdminDashboard`:
- PieChart de métodos de pagamento (replicar lógica do `ProducerEventDashboardTab`)
- Card "Ticket Médio" = totalGMV / totalOrders
- Buscar `payment_method` nos orders já filtrados por data

### 5. Taxa de ocupação no dashboard do evento
No `ProducerEventDashboardTab`, adicionar card "Ocupação" = `totalSold / max_capacity * 100`. Buscar `max_capacity` do evento (já disponível na query de evento).

### Arquivos afetados
- `src/pages/MeusIngressos.tsx` — botão download QR
- `src/pages/producer/ProducerEventDashboardTab.tsx` — taxa comparecimento, no-show, ocupação
- `src/pages/admin/AdminDashboard.tsx` — toggle dia/mês, payment methods pie, ticket médio
- `src/lib/api-admin.ts` — incluir `payment_method` na query de orders

