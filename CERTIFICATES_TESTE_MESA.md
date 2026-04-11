# Teste de Mesa - Sistema de Certificados TicketHall

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### FASE 1: DESIGN E TEMPLATES ✅
- [x] **Template 1: Executive** - Design corporativo elegante (azul marinho + dourado)
- [x] **Template 2: Modern** - Design minimalista clean (branco + laranja TicketHall)
- [x] **Template 3: Academic** - Design formal acadêmico (verde escuro + ouro)
- [x] **Template 4: Creative** - Design ousado criativo (roxo + coral)
- [x] Sistema de temas com 2 cores parametrizáveis
- [x] CSS custom properties para cada template
- [x] Preview responsivo A4 horizontal

**Arquivos:**
- `src/lib/certificates/templates.ts` ✅
- `src/components/certificates/CertificatePreview.tsx` ✅

### FASE 2: BACKEND E BANCO ✅
- [x] Migration com novas tabelas
- [x] Tabela `certificate_templates` (metadados dos templates)
- [x] Tabela `certificate_signers` (múltiplos signatários)
- [x] Tabela `certificate_participant_prefs` (opt-out)
- [x] Coluna `custom_background_url` em events
- [x] Coluna `selected_template` em events
- [x] Coluna `certificate_text_config` JSONB em events
- [x] Coluna `certificate_colors` JSONB em events
- [x] Coluna `certificate_fields` JSONB em events
- [x] Edge Function `generate-certificate-pdf` atualizada
- [x] Edge Function `verify-certificate-public` (pública)
- [x] Edge Function `generate-certificate-qr`
- [x] Funções RPC (`revoke_certificate`, `is_certificate_valid`, etc.)

**Arquivos:**
- `supabase/migrations/20260410170000_certificate_system_enhanced.sql` ✅
- `supabase/functions/generate-certificate-pdf/index.ts` ✅
- `supabase/functions/verify-certificate-public/index.ts` ✅
- `supabase/functions/generate-certificate-qr/index.ts` ✅

### FASE 3: FRONTEND - COMPONENTES ✅
- [x] `TemplateSelector.tsx` - Grid de templates com preview
- [x] `ColorConfigurator.tsx` - Color pickers com presets
- [x] `FieldConfigurator.tsx` - Checkboxes de campos
- [x] `TextConfigurator.tsx` - Editor de texto com templates
- [x] `SignersManager.tsx` - Gestão de signatários (drag-drop)
- [x] `BackgroundUploader.tsx` - Upload com crop A4
- [x] `LinkedInIntegration.tsx` - Integração LinkedIn
- [x] `CertificatePreview.tsx` - Preview em tempo real
- [x] `QRCodeDisplay.tsx` - QR code dinâmico

**Arquivos:**
- `src/components/certificates/index.ts` ✅
- Todos os componentes individuais ✅

### FASE 4: FRONTEND - PÁGINAS ✅
- [x] `ProducerEventCertificates.tsx` - Aba completa no painel
  - [x] Tab "Configurar" com preview ao vivo
  - [x] Tab "Emitidos" com listagem
  - [x] Tab "Estatísticas" com analytics
  - [x] Auto-save (2s debounce)
  - [x] Undo support (Ctrl+Z)
- [x] `VerifyCertificate.tsx` - Verificação pública
  - [x] Busca por código
  - [x] QR code scanner
  - [x] LGPD compliance (dados mascarados)
  - [x] Share buttons
- [x] `MeusCertificados.tsx` - Lista do participante

**Arquivos:**
- `src/pages/producer/ProducerEventCertificates.tsx` ✅
- `src/pages/VerificarCertificado.tsx` ✅
- `src/pages/MeusCertificados.tsx` ✅

### FASE 5: ROTAS E INTEGRAÇÃO ✅
- [x] Rota `/producer/events/:id/panel/certificates` - Painel do produtor
- [x] Rota `/verificar-certificado` - Verificação pública
- [x] Rota `/meus-certificados` - Lista do participante
- [x] Integração com ProducerEventPanel

**Arquivos:**
- `src/App.tsx` ✅ (rotas configuradas)
- `src/pages/producer/ProducerEventPanel.tsx` ✅ (menu atualizado)

### FASE 6: SEGURANÇA E LGPD ✅
- [x] RLS policies revisadas
- [x] Máscara de CPF (***.XXX.XXX-XX)
- [x] Opt-out do participante
- [x] Dados sensíveis não expostos na verificação pública
- [x] Rate limiting nas edge functions
- [x] Rate limiting na verificação pública

### FASE 7: RECURSOS AVANÇADOS ✅
- [x] Múltiplos signatários (max 4)
- [x] Upload de background customizado
- [x] Integração LinkedIn (botão + meta tags)
- [x] QR Code no PDF
- [x] QR Code scanner na verificação
- [x] Revogação de certificados
- [x] Carga horária configurável

---

## 🧪 TESTE DE MESA - FLUXO PRODUTOR

### Cenário 1: Configuração Inicial

**Passo 1: Acesso à Aba**
```
1. Produtor acessa /producer/events/:id/panel
2. Clica em "Certificados" no menu lateral
3. Sistema verifica has_certificates
4. Se false: mostra tela de ativação
5. Se true: mostra tabs Configurar/Emitidos/Estatísticas
```
✅ **Status:** IMPLEMENTADO

**Passo 2: Ativação**
```
1. Produtor clica "Ativar Certificados"
2. Mutation update events.has_certificates = true
3. Toast: "Certificados ativados!"
4. Página recarrega com tabs disponíveis
```
✅ **Status:** IMPLEMENTADO

**Passo 3: Escolha de Template**
```
1. Produtor vê grid com 4 templates
2. Clica em "Modern"
3. Preview atualiza automaticamente (debounce 500ms)
4. Cores default aplicadas (branco + laranja)
```
✅ **Status:** IMPLEMENTADO

**Passo 4: Personalização de Cores**
```
1. Produtor abre ColorConfigurator
2. Muda cor primária para #2563eb (azul)
3. Preview atualiza em tempo real
4. Contrast ratio mostra "AAA" (acessível)
```
✅ **Status:** IMPLEMENTADO

**Passo 5: Seleção de Campos**
```
1. Produtor marca: nome, data, local, carga horária
2. Desmarca: CPF (privacidade)
3. Preview atualiza mostrando apenas campos selecionados
```
✅ **Status:** IMPLEMENTADO

**Passo 6: Configuração de Texto**
```
1. Produtor seleciona preset "Acadêmico"
2. Texto preenchido: "Certificamos a participação..."
3. Edita para personalizar
4. Contador de caracteres atualiza (85/100)
```
✅ **Status:** IMPLEMENTADO

**Passo 7: Adicionar Signatários**
```
1. Produtor adiciona signatário: "João Silva"
2. Cargo: "Diretor Executivo"
3. Faz upload de assinatura
4. Preview mostra área de assinatura
```
✅ **Status:** IMPLEMENTADO

**Passo 8: Upload de Background**
```
1. Produtor faz upload de imagem própria
2. Sistema valida aspect ratio A4 (297:210)
3. Se não conforme: mostra crop tool
4. Preview usa background customizado
```
✅ **Status:** IMPLEMENTADO

**Passo 9: Salvar Configuração**
```
1. Auto-save a cada 2s de inatividade
2. Ou produtor clica "Salvar Configuração"
3. Mutation atualiza events.certificate_config
4. Toast: "Configuração salva!"
```
✅ **Status:** IMPLEMENTADO

---

## 🧪 TESTE DE MESA - FLUXO PARTICIPANTE

### Cenário 2: Recebimento de Certificado

**Passo 1: Check-in no Evento**
```
1. Participante faz check-in via QR code
2. Sistema verifica:
   - Evento tem has_certificates = true
   - Participante não optou por não receber
   - Ticket está pago
3. Gera certificado automaticamente
4. Insere na tabela certificates
5. Envia notificação push
```
✅ **Status:** IMPLEMENTADO

**Passo 2: Notificação**
```
1. Participante recebe push: "Certificado disponível!"
2. Clica na notificação
3. Redirecionado para /meus-certificados
```
✅ **Status:** IMPLEMENTADO

**Passo 3: Visualização**
```
1. Participante vê lista de certificados
2. Card mostra: Evento, data, status "Válido"
3. Botões: Baixar PDF, Compartilhar, Ver detalhes
```
✅ **Status:** IMPLEMENTADO

**Passo 4: Download PDF**
```
1. Participante clica "Baixar PDF"
2. Sistema chama Edge Function generate-certificate-pdf
3. PDF gerado com:
   - Template selecionado pelo produtor
   - Cores configuradas
   - Background customizado (se houver)
   - QR code embutido
   - Logo TicketHall
4. Download iniciado
```
✅ **Status:** IMPLEMENTADO

**Passo 5: Compartilhar LinkedIn**
```
1. Participante clica "Adicionar ao LinkedIn"
2. Sistema gera URL compatível
3. Redireciona para LinkedIn com meta tags preenchidas
4. Post mostra: Evento, data, badge TicketHall
```
✅ **Status:** IMPLEMENTADO

---

## 🧪 TESTE DE MESA - VERIFICAÇÃO PÚBLICA

### Cenário 3: Empregador Verifica Certificado

**Passo 1: Acesso**
```
1. Empregador recebe PDF do candidato
2. Vê QR code ou código CERT-XXXX
3. Acessa /verificar-certificado
```
✅ **Status:** IMPLEMENTADO

**Passo 2: Busca por Código**
```
1. Empregador digita código: CERT-ABCD-12345678-XYZ
2. Clica "Verificar"
3. Sistema chama Edge Function verify-certificate-public
4. Rate limit: 30 req/min por IP
```
✅ **Status:** IMPLEMENTADO

**Passo 3: Resultado Válido**
```
1. Sistema retorna: valid = true
2. Mostra:
   - Evento: "Conferência de Tecnologia 2024"
   - Participante: "Maria S." (privacidade - só inicial do sobrenome)
   - Data: 15 de março de 2024
   - Carga horária: 8h
   - Status: "Válido" (badge verde)
   - NÃO mostra: CPF, email, código completo
```
✅ **Status:** IMPLEMENTADO - LGPD COMPLIANT

**Passo 4: Compartilhamento**
```
1. Empregador pode copiar link de verificação
2. Pode compartilhar nas redes sociais
3. Pode imprimir comprovante
```
✅ **Status:** IMPLEMENTADO

---

## 🧪 TESTE DE MESA - EDGE CASES

### Cenário 4: Revogação

**Passo 1: Revogação pelo Produtor**
```
1. Produtor vai em "Emitidos"
2. Encontra certificado de "João Silva"
3. Clica "Revogar"
4. Informa motivo: "Check-in incorreto"
5. Confirma
6. Sistema:
   - Atualiza revoked_at = now()
   - Atualiza revoked_reason
   - Notifica participante
```
✅ **Status:** IMPLEMENTADO

**Passo 2: Verificação de Certificado Revogado**
```
1. Empregador tenta verificar código revogado
2. Sistema retorna: valid = false, revoked = true
3. Mostra:
   - Status: "Revogado" (badge laranja)
   - Motivo: "Check-in incorreto"
   - Data de revogação
```
✅ **Status:** IMPLEMENTADO

### Cenário 5: Opt-out do Participante

**Passo 1: Participante Opta por Não Receber**
```
1. Participante acessa preferências de privacidade
2. Marca "Não quero receber certificados"
3. Sistema insere em certificate_participant_prefs
```
✅ **Status:** IMPLEMENTADO

**Passo 2: Check-in com Opt-out**
```
1. Participante faz check-in
2. Sistema verifica has_opted_out = true
3. NÃO gera certificado
4. Check-in prossegue normalmente
```
✅ **Status:** IMPLEMENTADO

### Cenário 6: Upload Inválido

**Passo 1: Upload de Imagem Não-A4**
```
1. Produtor faz upload de imagem 1920x1080
2. Sistema detecta aspect ratio incorreto
3. Mostra crop tool forçando A4 landscape
4. Produtor faz crop
5. Sistema valida: 297:210 aspect ratio ✓
```
✅ **Status:** IMPLEMENTADO

---

## 🔒 VERIFICAÇÃO DE SEGURANÇA

### RLS Policies
```sql
-- Certificate signers: Only producer can manage
Policy: "Producers can manage signers for their events"
✅ IMPLEMENTADO

-- Participant prefs: User manages own, producer can view
Policy: "Users can manage their own preferences"
Policy: "Producers can view preferences for their events"
✅ IMPLEMENTADO

-- Public verification: No auth needed, only non-sensitive data
Edge Function verify-certificate-public: Rate limited, filtered output
✅ IMPLEMENTADO
```

### LGPD Compliance
```
✅ CPF: Opcional com consentimento explícito
✅ Nome: Mascarado na verificação pública (inicial do sobrenome)
✅ Opt-out: Participante pode recusar certificado
✅ Dados sensíveis: Nunca expostos na API pública
✅ Retenção: Política definida (5 anos)
```

---

## 📊 MÉTRICAS E PERFORMANCE

### Performance Checklist
- [x] Preview usa debounce (500ms)
- [x] Componentes memoizados (React.memo)
- [x] Lazy loading de backgrounds
- [x] Virtualização para listas grandes
- [x] Otimização de imagens

### Rate Limiting
- [x] generate-certificate-pdf: 10 req/min por IP
- [x] verify-certificate-public: 30 req/min por IP
- [x] generate-certificate-qr: 50 req/min por IP

---

## 🎯 CONCLUSÃO

### Status Geral: ✅ 100% IMPLEMENTADO

Todos os requisitos foram implementados:

1. ✅ 4 templates únicos e parametrizáveis
2. ✅ Preview em tempo real com performance otimizada
3. ✅ Upload de design próprio com crop A4
4. ✅ Personalização completa (cores, campos, textos)
5. ✅ Múltiplos signatários
6. ✅ Integração LinkedIn
7. ✅ QR Code no PDF e scanner
8. ✅ Verificação pública LGPD-compliant
9. ✅ Revogação de certificados
10. ✅ Proteção RLS completa
11. ✅ Aba dedicada no painel do produtor

### Próximos Passos para Deploy:
1. Executar migration no Supabase
2. Deploy das Edge Functions
3. Verificar variáveis de ambiente
4. Teste end-to-end em staging
5. Deploy em produção

