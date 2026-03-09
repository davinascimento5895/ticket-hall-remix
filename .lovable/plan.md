

# Auditoria do Fluxo de Check-in do Comprador

## Diagnostico

Analisei todo o fluxo de ponta a ponta. Encontrei **2 bugs criticos** e **1 melhoria necessaria**:

### Bug 1 — Scanner do produtor chama funcao errada (CRITICO)

O scanner de QR no painel do produtor (`ProducerEventCheckin.tsx`, linha 73) passa o texto lido do QR code para `validateCheckinByTicketId({ ticketId: decodedText })`. Essa funcao tenta buscar um ticket pelo ID usando o JWT como se fosse um UUID — **sempre vai falhar**. Deveria chamar `validateCheckin({ qrCode: decodedText })` diretamente.

O mesmo problema existe no `PublicCheckin.tsx` (linha 57-58), que tambem usa `validateCheckinByTicketId` para check-in manual por lista — nesse caso esta correto porque passa o `ticket.id` real. Mas se integrar scanner la, tera o mesmo bug.

### Bug 2 — QR Code JWT nao e gerado no modo stub (CRITICO)

A funcao `generate-qr-code` (que gera o JWT assinado e atualiza o ticket) so e chamada pelo `asaas-webhook` apos confirmacao de pagamento real. No modo stub (sem Asaas configurado), o `confirm_order_payment` marca os tickets como "active", mas o `qr_code` permanece como hex aleatorio (`encode(gen_random_bytes(32), 'hex')`). Quando o usuario tenta mostrar o QR e o produtor escaneia, o `validate-checkin` rejeita porque nao e um JWT valido.

**Solucao:** Apos `confirm_order_payment` no stub mode, chamar `generate-qr-code` para cada ticket ativado.

### Melhoria — Botao de download sempre visivel

O botao "Baixar" so aparece se `qr_code_image_url` existir. Como o `QRCodeModal` ja tem fallback para `api.qrserver.com`, o download tambem deveria funcionar sempre.

---

## Plano de Implementacao

### 1. Corrigir scanner no ProducerEventCheckin
- Importar `validateCheckin` em vez de `validateCheckinByTicketId`
- Alterar o `checkinMutation` para chamar `validateCheckin({ qrCode })` quando escaneado via camera
- Manter `validateCheckinByTicketId` para check-in manual por lista (clique no botao)

### 2. Gerar QR codes no stub mode
- No `create-payment/index.ts`, apos chamar `confirm_order_payment` no stub mode, buscar tickets do pedido e chamar `generate-qr-code` para cada um

### 3. Botao "Baixar" sempre visivel
- Em `MeusIngressos.tsx`, remover a condicao `ticket.qr_code_image_url` do botao "Baixar" — usar o fallback do `api.qrserver.com` quando a URL nao existir

