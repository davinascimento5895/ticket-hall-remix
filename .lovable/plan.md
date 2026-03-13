
Diagnóstico do que está quebrando hoje no fluxo de pagamento (PIX + cartão):

1) Erro atual confirmado no banco
- A constraint `tickets_status_check` NÃO permite `reserved`, mas a função `reserve_tickets` insere ticket com status `reserved`.
- Isso explica exatamente o erro do print: `new row for relation "tickets" violates check constraint "tickets_status_check"`.

2) Outro erro estrutural que vai aparecer em seguida
- A tabela `orders` só aceita status: `pending | processing | paid | cancelled | refunded | expired`.
- A função de pagamento está gravando `awaiting_payment` (status inválido). Mesmo quando a cobrança é criada, o update pode falhar silenciosamente.

3) Fluxo de compra no modal do evento está incompleto/inconsistente
- No `BookingFlow`, quando PIX/Boleto é criado, a UI vai para “confirmação” sem exibir QR/código do boleto.
- Cartão no modal envia menos dados que o checkout completo (ex.: endereço/CEP), e validade está no formato `MM/AA` enquanto a integração espera ano consistente.

4) Dados do comprador não chegam com consistência para cobrança
- O pagamento usa CPF/telefone do perfil do usuário.
- Hoje há usuários com CPF/telefone nulos; isso tende a quebrar criação de cliente/cobrança no gateway (principalmente cartão).

5) Cancelamentos/expiração podem desalinhar estoque
- Em alguns eventos de webhook, tickets são cancelados sem reduzir `ticket_tiers.quantity_reserved`.
- Resultado: risco de estoque “preso”/inconsistente.

6) Cartão de débito
- Atualmente só existe caminho `credit_card` (crédito). Débito não está implementado no backend nem no frontend.

Plano de correção (ordem recomendada):

Fase 1 — Corrigir estado do banco (bloqueador principal)
- Ajustar constraint de `tickets.status` para incluir ao menos `reserved` (e `suspended` se continuar usando chargeback com suspensão).
- Parar de usar `awaiting_payment` em `orders.status` (usar `pending`/`processing`).
- Rodar limpeza de pedidos pendentes sem tickets (gerados por tentativas quebradas).

Fase 2 — Endurecer função de pagamento
- Validar antes de cobrar: pedido existe, pertence ao usuário, está pendente, não expirou e possui tickets reservados.
- Tratar erro de cada `update`/`rpc` (sem falha silenciosa).
- Retornar mensagem legível do gateway para o frontend (não só erro genérico).
- Ajustar fluxo de rate limit para leitura segura sem erro quando não existir registro.

Fase 3 — Unificar jornada do usuário para reduzir bugs
- Checkout completo (`/checkout`): persistir CPF/telefone/endereço no perfil antes do pagamento.
- Modal de evento (`BookingFlow`): alinhar com checkout completo (mesmas validações/dados) OU redirecionar para `/checkout`/`/pedido/:orderId` após criar pedido.
- Para PIX/Boleto no modal: mostrar QR/código ou redirecionar automaticamente para página de recuperação do pedido.
- Ajustar tela de confirmação para não mostrar “compra confirmada” quando ainda está aguardando pagamento.

Fase 4 — Corrigir consistência de estoque em webhook
- Em eventos de cancelamento/expiração/reprovação, decrementar `quantity_reserved` de forma atômica junto com cancelamento de tickets reservados.
- Garantir idempotência (processar o mesmo webhook sem efeito duplicado).

Fase 5 — Cobertura de testes ponta a ponta (obrigatória)
- Cenários mínimos:
  1. PIX: cria cobrança, mostra QR, confirma via webhook, ativa tickets.
  2. PIX expirado: pedido expira e reserva volta ao estoque.
  3. Boleto: gera link/código, mantém estado pendente correto.
  4. Cartão aprovado imediato: pedido pago + ticket ativo + QR.
  5. Cartão recusado: pedido não pago + feedback claro.
  6. Repetição de clique no pagar: idempotência sem criar cobrança duplicada.
- Validar também em `/meus-pedidos` e `/pedido/:orderId`.

Detalhes técnicos (implementação)
- Migrações:
  - Alterar check constraint de `tickets.status`.
  - Se optar por manter `suspended`, incluir no check; se não, trocar uso por `cancelled`.
- Backend functions:
  - `create-payment`: remover `awaiting_payment`, validar pré-condições, tratar erros de update/rpc, melhorar payload de erro.
  - `asaas-webhook`: normalizar caminhos de cancelamento para sempre liberar reserva.
- Frontend:
  - `Checkout.tsx` + `CheckoutStepBuyer.tsx`: persistência de dados do comprador para perfil.
  - `BookingFlow.tsx` + `BookingConfirmation.tsx`: corrigir estado “aguardando pagamento” e exibição/encaminhamento do PIX/Boleto.
  - `CheckoutStepPayment.tsx` / cartão: padronizar validade e dados obrigatórios.
