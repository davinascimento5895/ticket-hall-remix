# Plano Master - Sistema de Certificados TicketHall

## 🎯 VISÃO GERAL
Sistema completo de emissão de certificados com 4 templates profissionais, personalização total, upload de design próprio, múltiplos signatários e verificação pública.

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### FASE 1: DESIGN E TEMPLATES (Prioridade: ALTA)
- [ ] **Template 1: Executive** - Design corporativo elegante (azul marinho + dourado)
- [ ] **Template 2: Modern** - Design minimalista clean (branco + laranja TicketHall)
- [ ] **Template 3: Academic** - Design formal acadêmico (verde escuro + ouro)
- [ ] **Template 4: Creative** - Design ousado criativo (roxo + coral)
- [ ] Sistema de temas com 2 cores parametrizáveis
- [ ] CSS custom properties para cada template
- [ ] Preview responsivo A4 horizontal

### FASE 2: BACKEND E BANCO (Prioridade: ALTA)
- [ ] Migration com novas tabelas
- [ ] Tabela `certificate_templates` (metadados dos templates)
- [ ] Tabela `certificate_signers` (múltiplos signatários)
- [ ] Coluna `custom_background_url` em events
- [ ] Coluna `selected_template` em events
- [ ] Coluna `certificate_text_config` JSONB em events
- [ ] Edge Function `generate-certificate-pdf` atualizada
- [ ] Edge Function `verify-certificate-public` (pública)
- [ ] Função RPC `add_linkedin_certificate`

### FASE 3: FRONTEND - PAINEL DO PRODUTOR (Prioridade: ALTA)
- [ ] Nova aba "Certificados" no ProducerEventPanel
- [ ] Sub-tabs: Configurar | Emitidos | Preview
- [ ] Seletor de template com thumbnails
- [ ] Color pickers (cor primária + cor secundária)
- [ ] Checkboxes de campos: nome, sobrenome, cpf, data, local, carga horária, etc
- [ ] Texto personalizado com templates pré-definidos
- [ ] Contador de caracteres em tempo real
- [ ] Upload de background com crop A4 horizontal
- [ ] Gestão de signatários (adicionar/remover)
- [ ] Lista de certificados emitidos com status
- [ ] Botão de reemissão

### FASE 4: PREVIEW EM TEMPO REAL (Prioridade: ALTA)
- [ ] Componente CertificatePreview otimizado
- [ ] Debounce nas alterações (500ms)
- [ ] Memoização do componente
- [ ] Renderização condicional por template
- [ ] Atualização suave sem flickering

### FASE 5: PDF E QR CODE (Prioridade: MÉDIA)
- [ ] Geração de PDF server-side
- [ ] QR Code dinâmico apontando para verificação
- [ ] Logo TicketHall no canto inferior
- [ ] Formato A4 landscape garantido
- [ ] Suporte a background customizado

### FASE 6: LINKEDIN (Prioridade: MÉDIA)
- [ ] Botão "Adicionar ao LinkedIn" na página de certificados
- [ ] Meta tags Open Graph para compartilhamento
- [ ] Formato compatível com LinkedIn Add to Profile

### FASE 7: PÁGINA PÚBLICA DE VERIFICAÇÃO (Prioridade: MÉDIA)
- [ ] Rota pública: /certificado/verificar/:code
- [ ] Busca por código
- [ ] Exibição segura (sem dados sensíveis)
- [ ] Status: Válido | Revogado | Não encontrado
- [ ] QR Code scanneável

### FASE 8: SEGURANÇA E LGPD (Prioridade: ALTA)
- [ ] RLS policies revisadas
- [ ] Máscara de CPF (***.XXX.XXX-XX)
- [ ] Opt-out do participante
- [ ] Anonimização em logs
- [ ] Rate limiting na verificação pública

### FASE 9: TESTES E INTEGRAÇÃO (Prioridade: ALTA)
- [ ] Teste de mesa: fluxo completo produtor
- [ ] Teste de mesa: fluxo completo participante
- [ ] Teste de edge cases
- [ ] Validação de responsividade
- [ ] Check de performance (Lighthouse)

---

## 🎨 ESPECIFICAÇÃO DOS TEMPLATES

### Template 1: Executive
```
Aesthetic: Corporativo elegante, inspirado em diplomas de Ivy League
Typography: Playfair Display (títulos) + Source Sans Pro (corpo)
Layout: Bordas ornamentadas douradas, selo de cera simulado
Cores default: #1a365d (azul marinho) + #c9a227 (dourado)
```

### Template 2: Modern  
```
Aesthetic: Minimalista, whitespace generoso, tipografia bold
Typography: Space Grotesk (títulos) + Inter (corpo)
Layout: Assimétrico, linhas geométricas sutis
Cores default: #ffffff (branco) + #ea580b (laranja TicketHall)
```

### Template 3: Academic
```
Aesthetic: Tradicional acadêmico, serifas clássicas
Typography: Cormorant Garamond (títulos) + Lora (corpo)
Layout: Simétrico, brasão/escudo decorativo
Cores default: #064e3b (verde escuro) + #d4af37 (ouro)
```

### Template 4: Creative
```
Aesthetic: Bold, gradientes suaves, formas orgânicas
Typography: Clash Display (títulos) + Satoshi (corpo)
Layout: Diagonal flow, elementos flutuantes
Cores default: #581c87 (roxo) + #f97316 (coral)
```

---

## 🛡️ REGRAS DE NEGÓCIO LGPD

1. **Coleta de Dados:**
   - CPF: Opcional, com checkbox de consentimento
   - Nome: Obrigatório, mas pode ser "nome social"
   - Opt-out: Participante pode recusar certificado

2. **Exposição Pública:**
   - Página de verificação: MOSTRA apenas nome + evento + data + status
   - NÃO MOSTRA: CPF, email, código completo do ticket
   - QR Code: Link direto para verificação (sem dados embutidos)

3. **Retenção:**
   - Certificados: Armazenados indefinidamente
   - Dados pessoais: Anonimizados após 5 anos (configurável)
   - Logs de verificação: 90 dias

4. **Direitos do Titular:**
   - Download do próprio certificado
   - Solicitação de correção de dados
   - Revogação de consentimento (opt-out)

---

## 🔧 ARQUITETURA TÉCNICA

### Estrutura de Arquivos
```
src/
├── components/
│   └── certificates/
│       ├── CertificatePreview.tsx      # Preview em tempo real
│       ├── TemplateSelector.tsx        # Grid de templates
│       ├── ColorConfigurator.tsx       # Color pickers
│       ├── FieldConfigurator.tsx       # Checkboxes de campos
│       ├── TextConfigurator.tsx        # Editor de texto
│       ├── SignersManager.tsx          # Gestão de signatários
│       ├── BackgroundUploader.tsx      # Upload com crop
│       └── QRCodeDisplay.tsx           # QR do certificado
├── pages/
│   ├── producer/
│   │   └── ProducerEventCertificates.tsx  # Aba principal
│   └── public/
│       └── VerifyCertificate.tsx       # Verificação pública
├── lib/
│   └── certificates/
│       ├── templates.ts                # Definições dos 4 templates
│       ├── textPresets.ts              # Templates de texto
│       └── validation.ts               # Validações LGPD
└── integrations/
    └── supabase/
        └── types.ts                    # Types atualizados
```

### Edge Functions
```
supabase/functions/
├── generate-certificate-pdf/           # Gerar PDF
├── verify-certificate-public/          # Verificação pública
└── generate-certificate-qr/            # QR Code dinâmico
```

---

## ✅ CRITÉRIOS DE ACEITAÇÃO

1. Produtor consegue escolher entre 4 templates visuais distintos
2. Cores são parametrizáveis em tempo real (preview atualiza)
3. Upload de design próprio funciona com validação A4 horizontal
4. Múltiplos signatários podem ser adicionados
5. Participante pode adicionar ao LinkedIn
6. Verificação pública não expõe dados sensíveis
7. QR Code no PDF funciona para verificação rápida
8. Performance: preview atualiza em < 500ms
9. RLS protege todos os dados sensíveis
10. Código passa em audit de segurança básico

---

## 🚀 ORDEM DE IMPLEMENTAÇÃO

1. **Semana 1:** Backend + Banco (foundation)
2. **Semana 2:** Templates + Preview (core visual)
3. **Semana 3:** Upload + Signatários (features avançadas)
4. **Semana 4:** LinkedIn + QR + Verificação pública (integrações)
5. **Semana 5:** Testes + LGPD + Otimizações (polimento)

