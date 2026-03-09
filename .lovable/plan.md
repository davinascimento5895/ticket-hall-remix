

## Análise Completa — Inconsistências e Melhorias do Site

Analisei o codebase completo, ignorando integrações externas (pagamento, APIs de email, analytics). Aqui está o relatório completo:

---

### 1. PERÍODO DO DIA — Já Implementado Corretamente ✓

O sistema **já calcula automaticamente** o período do dia baseado no horário de início do evento:

```typescript
// src/pages/Busca.tsx (linhas 33-39)
function getTimeOfDay(dateStr: string): string {
  const h = getHours(new Date(dateStr));
  if (h < 6) return "dawn";      // Madrugada (antes das 6h)
  if (h < 13) return "morning";  // Manhã (6h-13h)
  if (h < 18) return "afternoon"; // Tarde (13h-18h)
  return "evening";              // Noite (18h+)
}
```

Os filtros de busca (`SearchFilters.tsx`) também usam essa lógica:
- Manhã: 6h-13h
- Tarde: 13h-18h  
- Noite: 18h+
- Madrugada: antes das 6h

**Status:** Funcionando corretamente. O produtor **não** precisa informar isso manualmente.

---

### 2. FUNCIONALIDADES PLACEHOLDER (Prometem mas não entregam)

| Feature | Localização | Problema |
|---------|-------------|----------|
| **Mapa de Assentos** | `ProducerEventForm.tsx` + `BookingSeatMap.tsx` | O switch "Mapa de assentos" existe mas o mapa é **100% fake** — gera assentos dummy sem integração real com o BD |
| **Fila Virtual** | `FilaVirtual.tsx` + `manage-queue` | Funciona parcialmente, mas a lógica de **admissão automática** não está conectada a eventos reais |
| **Certificados** | `MeusCertificados.tsx` | A página existe mas `generate-certificate` edge function depende de templates não configurados |
| **Repasses Pendentes** | `AdminFinance.tsx:179` | Mostra "🚧 Em breve" — placeholder honesto |

---

### 3. INCONSISTÊNCIAS DE DADOS NO ADMIN

**3.1. Problema com `getAllUsers` — roleMap guarda apenas 1 role por usuário**

```typescript
// src/lib/api-admin.ts (linha 127)
(roles || []).forEach((r: any) => roleMap.set(r.user_id, r.role));
```

Se um usuário tem múltiplos roles (ex: admin + producer + buyer), o Map **sobrescreve** e mostra apenas o último. O usuário "Davi Nascimento" aparece como "buyer" quando na verdade é admin/producer/buyer.

**Fix:** Priorizar roles (admin > producer > buyer) ao mapear:

```typescript
const rolePriority = { admin: 1, producer: 2, buyer: 3 };
roles.sort((a, b) => (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99));
(roles || []).forEach((r: any) => {
  if (!roleMap.has(r.user_id)) roleMap.set(r.user_id, r.role);
});
```

---

### 4. DEAD CODE E INCONSISTÊNCIAS FUNCIONAIS

| Arquivo | Issue |
|---------|-------|
| `api-admin.ts:182` | `updateProducerStatus()` ainda existe mas a UI de aprovar/rejeitar produtores foi removida |
| `profiles.producer_status` | Campo ainda existe no BD mas não é usado em nenhum lugar relevante |

---

### 5. MAPA DE ASSENTOS — PRECISA DE ATENÇÃO

A feature **existe na UI** mas é um **fake completo**:

1. O produtor ativa "Mapa de assentos" no formulário
2. O `BookingSeatMap.tsx` gera um grid genérico de 8x12 assentos
3. **Nenhum assento é salvo no BD** — é gerado dinamicamente toda vez
4. A seleção de assento **não afeta nada** — não é vinculado ao ticket

**Opções:**
- A) Remover o toggle e esconder a feature até implementação real
- B) Marcar como "Em breve" igual ao repasse

---

### 6. FILA VIRTUAL — PARCIALMENTE FUNCIONAL

O sistema de fila existe (`virtual_queue` table + `manage-queue` edge function), mas:

1. A página `/fila/:slug` funciona
2. A admissão automática (`action: "process"`) só roda quando chamada manualmente
3. Não há trigger/cron que processe a fila automaticamente quando alguém sai

**Funciona para:** Evento manual onde o produtor processa a fila
**Não funciona para:** Fluxo automatizado tipo shows grandes

---

### 7. EVENTO SEM INGRESSOS CADASTRADOS

Se um produtor cria um evento mas não adiciona tiers de ingresso:
- A página do evento aparece sem preço
- O botão "Comprar ingresso" não faz nada útil

**Sugestão:** Validar no formulário que pelo menos 1 tier existe antes de publicar.

---

## Plano de Correções

### Correções Rápidas (implementar agora):

1. **Fix roleMap no Admin** — Priorizar admin > producer > buyer
2. **Remover dead code** — `updateProducerStatus()` e funções não usadas
3. **Mapa de assentos como placeholder** — Desabilitar toggle e mostrar "Em breve"
4. **Validação de tiers antes de publicar** — Exigir pelo menos 1 ingresso

### Melhorias Futuras (não implementar agora):

- Mapa de assentos real com persistência
- Certificados funcionais
- Fila virtual com processamento automático

---

### Arquivos a modificar:

- `src/lib/api-admin.ts` — Fix roleMap priority
- `src/pages/admin/AdminUsers.tsx` — Mostrar badge com role prioritário
- `src/pages/producer/ProducerEventForm.tsx` — Desabilitar mapa de assentos
- `src/lib/api-admin.ts` — Remover `updateProducerStatus`

