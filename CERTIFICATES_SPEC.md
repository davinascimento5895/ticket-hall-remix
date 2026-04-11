# Especificação Completa - Sistema de Certificados TicketHall

## 1. EDGE CASES TÉCNICOS

### 1.1 Check-in Revertido
**Problema:** Operador faz check-in errado e desfaz. Certificado já foi gerado.
**Solução:** 
- Manter certificado (participante efetivamente esteve no evento)
- Adicionar flag `revoked_at` para casos de fraude
- Log de auditoria mantém histórico

### 1.2 Transferência de Ingresso
**Problema:** Ticket transferido após certificado emitido para dono anterior.
**Solução:**
- Certificado pertence ao participante que fez check-in (owner_id no momento do check-in)
- Novo dono não recebe certificado automaticamente
- Sistema verifica `checked_in_at` e `owner_id` no momento da emissão

### 1.3 Colisão de Códigos
**Problema:** Dois certificados com mesmo código (improvável mas possível).
**Solução:**
- Usar UUID + timestamp + random
- Constraint UNIQUE no banco
- Retry com novo código em caso de colisão

### 1.4 Evento Cancelado
**Problema:** Evento cancelado após certificados emitidos.
**Solução:**
- Certificados permanecem válidos (participante compareceu)
- Adicionar flag `event_cancelled` no certificado se necessário
- Comunicação transparente com participantes

### 1.5 Mudança de Dados do Evento
**Problema:** Evento muda de data/local após certificados emitidos.
**Solução:**
- Snapshot dos dados no momento da emissão
- Certificado mostra dados do momento do evento
- Não atualizar certificados já emitidos

### 1.6 Carga Massiva
**Problema:** Evento com 10.000+ participantes fazendo check-in simultâneo.
**Solução:**
- Geração assíncrona via fila
- Batch processing para certificados em lote
- Rate limiting na edge function

### 1.7 Falha de Notificação
**Problema:** Notificação push/email falha após gerar certificado.
**Solução:**
- Retry automático (exponential backoff)
- Fila de notificações pendentes
- Participante pode ver certificado em "Meus Certificados" mesmo sem notificação

### 1.8 Participante Sem Nome
**Problema:** Perfil não tem nome completo no momento do check-in.
**Solução:**
- Usar "attendee_name" do ticket (coletado no checkout)
- Fallback: "Participante" + código
- Validação obrigatória no checkout se certificados estiverem ativos

## 2. PERSONALIZAÇÃO

### 2.1 Campos do Certificado (checkboxes)
```typescript
interface CertificateConfig {
  // Dados do Participante
  showParticipantName: boolean;      // Sempre true (obrigatório)
  showParticipantCPF: boolean;       // Com opção de máscara
  maskCPF: boolean;                  // Mostrar ***.456.789-**
  
  // Dados do Evento
  showEventTitle: boolean;           // Sempre true (obrigatório)
  showEventDate: boolean;            // Data de realização
  showEventTime: boolean;            // Horário
  showEventDuration: boolean;        // Duração em horas
  showEventLocation: boolean;        // Local/endereço
  showEventDescription: boolean;     // Descrição breve
  
  // Dados Adicionais
  showWorkload: boolean;             // Carga horária
  workloadHours: number;             // Quantas horas
  showProducerName: boolean;         // Nome do produtor/organizador
  showProducerSignature: boolean;    // Assinatura digital
  customText: string;                // Texto personalizado
  
  // Design
  template: 'default' | 'formal' | 'modern' | 'minimal';
  primaryColor: string;              // Cor do tema
  showLogo: boolean;                 // Logo do evento
  backgroundImage: string | null;    // Background personalizado
}
```

### 2.2 Templates de Certificado
1. **Default** - Estilo TicketHall (laranja, moderno)
2. **Formal** - Estilo corporativo (azul escuro, serif)
3. **Modern** - Design clean (branco, sem bordas)
4. **Minimal** - Apenas texto essencial

### 2.3 Campos de Texto Personalizado
- Título do certificado (default: "CERTIFICADO DE PARTICIPAÇÃO")
- Texto introdutório (default: "Certificamos que")
- Texto de participação (default: "participou do evento")
- Texto de carga horária (default: "com carga horária de X horas")
- Assinatura (nome do responsável)
- Cargo do assinante

## 3. PRIVACIDADE E LGPD

### 3.1 Controle de Dados Sensíveis
- Checkbox para autorização de uso de dados no checkout
- Opção de não gerar certificado para participantes específicos
- Máscara automática de CPF (padrão: mostrar últimos 4 dígitos)

### 3.2 Revogação de Certificado
```typescript
interface CertificateRevocation {
  id: string;
  certificate_id: string;
  reason: 'fraud' | 'error' | 'refund' | 'other';
  reason_description: string;
  revoked_by: string;          // user_id do produtor
  revoked_at: string;
  notified_user: boolean;
}
```

### 3.3 Período de Disponibilidade
- Configurar por quanto tempo certificado fica disponível (padrão: indefinido)
- Download opcional após X dias

## 4. VALIDAÇÕES DE SEGURANÇA

### 4.1 Antes da Emissão
- [ ] Evento existe e está publicado
- [ ] Certificados estão habilitados
- [ ] Ticket está pago (status = 'paid')
- [ ] Check-in foi realizado
- [ ] Participante não optou por não receber
- [ ] Não existe certificado anterior para este ticket

### 4.2 Validação do Código
- Formato: CERT-{4 chars}-{8 chars}-{timestamp}
- Case insensitive na verificação
- Prevenir brute force (rate limiting)

## 5. FLUXOS DE EMERGÊNCIA

### 5.1 Reemissão em Massa
- Evento teve problema e precisa reemitir todos os certificados
- Preservar códigos originais ou gerar novos
- Notificar participantes sobre atualização

### 5.2 Correção de Dados
- Nome do participante errado no certificado
- Permissão do produtor para editar e reemitir
- Manter histórico de versões

## 6. MÉTRICAS E MONITORAMENTO

### 6.1 Métricas Importantes
- Taxa de emissão automática vs manual
- Tempo médio entre check-in e emissão
- Downloads de certificados
- Verificações de autenticidade
- Taxa de revogação

### 6.2 Alertas
- Falha emissão em massa (> 5% de erro)
- Colisão de códigos detectada
- Spike de requisições suspeitas

## 7. IMPLEMENTAÇÃO FASEADA

### Fase 1 (Atual) - MVP
- Emissão automática no check-in
- PDF básico com dados essenciais
- Verificação online
- Painel de gestão

### Fase 2 - Personalização
- Configuração de campos visíveis
- Preview do certificado
- Templates básicos
- Carga horária

### Fase 3 - Avançado
- Upload de logo/background
- Assinatura digital
- Revogação
- Relatórios analíticos
- Integração com LinkedIn

### Fase 4 - Enterprise
- Múltiplos signatários
- Validação blockchain
- API pública de verificação
- White-label
