# Auditoria técnica do QR Code de check-in

## Escopo

Análise do fluxo de emissão, renderização, exportação e validação do QR Code de ingresso no TicketHall.

## Problema observado

O QR Code baixado diretamente do site estava sendo gerado a partir de um valor opaco de 64 caracteres hexadecimais, como `a403401abcb60a6943ecb3a9a4f00571b9484e00630982f5b62af3a5834165c4`. Esse payload não tem semântica de ingresso válido: ele não é um JWT assinado e também não corresponde ao UUID legado aceito pelo validador.

Na prática, isso fazia com que o scanner de check-in rejeitasse o código com erro de `invalid_qr` / `jwt_format_invalid`, porque a função `validate-checkin` espera apenas dois formatos:

- JWT HMAC-SHA256 com claim `tid`
- UUID legado bruto no formato `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

O QR Code de 64 hex não satisfaz nenhuma dessas condições.

## Causa raiz

O defeito não estava no serviço externo de imagem QR. A API `api.qrserver.com` é stateless e apenas rasteriza o texto recebido em `data=`. O erro estava na origem do payload passado para essa API.

Havia dois problemas encadeados:

1. A função SQL `reserve_tickets` estava criando ingressos com `qr_code = encode(gen_random_bytes(32), 'hex')`. Isso gera um marcador aleatório de 32 bytes em hex, mas não um token de ingresso com contrato de formato.
2. As telas de download e exportação estavam usando `ticket.qr_code` diretamente para montar a imagem do QR. Quando o registro ainda continha o placeholder hexadecimal, a UI propagava esse valor sem normalização e o usuário baixava exatamente esse payload inválido.

Em termos técnicos, o campo `tickets.qr_code` estava sendo tratado como se já fosse o identificador final do ingresso, mas na realidade continha um placeholder de persistência. Isso quebrou o contrato entre persistência, apresentação e validação.

## Efeito técnico

- O QR exportado no site codificava um payload inválido para check-in.
- A função `validate-checkin` recusava o scan por incompatibilidade de formato.
- O erro aparecia como falha de autenticação/validação ou QR adulterado, embora o problema real fosse um payload mal gerado na camada de emissão.
- O usuário recebia uma imagem aparentemente válida, mas semanticamente incorreta para o fluxo de entrada.

## Solução proposta

A correção foi feita em três camadas.

### 1. Corrigir a origem do dado

A função de reserva passou a gerar um valor utilizável para tickets novos com `gen_random_uuid()::text` em vez do placeholder hexadecimal. Isso elimina a produção de QR opaco no momento da reserva.

### 2. Normalizar a renderização

Foi criado o helper compartilhado `resolveTicketQrCode()` para resolver payloads inválidos na camada de exibição. Quando o QR armazenado é um placeholder hex de 64 caracteres, a UI passa a usar o `ticketId` como fallback de renderização.

Esse helper foi aplicado nos pontos de saída do ingresso:

- cartão de download do ingresso
- geração de PDF
- reenvio de e-mail do ingresso

### 3. Manter o validador consistente

A função `validate-checkin` continua exigindo um JWT válido ou um UUID legado, o que preserva a integridade do check-in. Também foi adicionada instrumentação de observabilidade com `phase` e `requestId`, para identificar com precisão onde uma falha ocorre no pipeline.

## Resultado esperado após a correção

- Tickets novos deixam de nascer com QR hexadecimal inválido.
- A interface deixa de transformar placeholder em imagem QR exportável.
- Tickets legados com UUID continuam compatíveis com o fluxo de check-in.
- O backend continua recusando payloads realmente inválidos, mantendo a validação forte.

## Verificação executada

- teste unitário dedicado para resolução de QR: `src/test/ticket-qr.test.ts`
- build de produção do projeto com sucesso

## Risco residual

Ingressos, PDFs ou e-mails gerados antes da correção podem ainda conter o payload hexadecimal antigo. Esses artefatos históricos não são reescritos automaticamente; se precisarem continuar válidos, exigem regeneração ou migração específica.

## Arquivos envolvidos

- [supabase/migrations/20260303234846_3c902349-6914-423d-8778-31c26099660c.sql](supabase/migrations/20260303234846_3c902349-6914-423d-8778-31c26099660c.sql)
- [supabase/migrations/20260415240000_fix_ticket_qr_placeholder.sql](supabase/migrations/20260415240000_fix_ticket_qr_placeholder.sql)
- [supabase/functions/validate-checkin/index.ts](supabase/functions/validate-checkin/index.ts)
- [supabase/functions/_shared/checkin-qr.ts](supabase/functions/_shared/checkin-qr.ts)
- [src/lib/ticket-qr.ts](src/lib/ticket-qr.ts)
- [src/components/checkout/TicketDownloadCard.tsx](src/components/checkout/TicketDownloadCard.tsx)
- [src/lib/ticket-pdf.ts](src/lib/ticket-pdf.ts)
- [src/pages/MeusIngressos.tsx](src/pages/MeusIngressos.tsx)