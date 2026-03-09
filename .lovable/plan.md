
## Problema Identificado

O fluxo de **se tornar produtor** está completamente incompleto:

1. **Botões mortos**: "Criar minha conta de produtor" e "Começar a vender grátis" na página `/produtores` não têm `onClick`
2. **Sem formulário de solicitação**: Não existe forma do usuário solicitar ser produtor
3. **Admin sem gestão**: Não há tela para admin aprovar/rejeitar solicitações pendentes
4. **Perfil sem opção**: O perfil do usuário não mostra opção de "Quero ser produtor"

---

## Solução Proposta

### 1. Modal de Solicitação para Produtor
Criar um componente `BecomeProducerModal` que:
- Pede CPF e telefone (dados necessários para o Asaas)
- Atualiza `producer_status` para `pending` no perfil
- Mostra mensagem de "aguardando aprovação"

### 2. Página de Produtores Funcional
Atualizar `src/pages/Produtores.tsx`:
- Botões abrem o modal de auth (se não logado)
- Após login, abrem o modal de solicitação
- Se já é produtor, redirecionam para `/producer/dashboard`

### 3. Perfil do Usuário com Status
Atualizar `src/pages/MeuPerfil.tsx`:
- Mostrar card "Quero ser produtor" se `producer_status` é `null`
- Mostrar "Aguardando aprovação" se `pending`
- Mostrar link para painel se `approved`

### 4. Admin: Gestão de Solicitações
Atualizar `src/pages/admin/AdminProducers.tsx`:
- Listar solicitações pendentes em destaque
- Botões de Aprovar/Rejeitar em cada solicitação
- Ao aprovar, chamar edge function `create-producer-account`

---

## Estrutura de Arquivos

```text
src/
├── components/
│   └── BecomeProducerModal.tsx  ← NOVO
├── pages/
│   ├── Produtores.tsx           ← MODIFICAR
│   ├── MeuPerfil.tsx            ← MODIFICAR
│   └── admin/
│       └── AdminProducers.tsx   ← MODIFICAR
└── lib/
    └── api-admin.ts             ← ADICIONAR: getPendingProducers()
```

---

## Fluxo do Usuário

```text
┌─────────────────────────────────────────────────────────────┐
│  Usuário não logado clica "Criar conta de produtor"         │
│                          ↓                                  │
│  Abre AuthModal (tab: register)                             │
│                          ↓                                  │
│  Após criar conta, abre BecomeProducerModal                 │
│                          ↓                                  │
│  Preenche CPF + Telefone → producer_status = 'pending'      │
│                          ↓                                  │
│  Admin vê na lista → Aprovar/Rejeitar                       │
│                          ↓                                  │
│  Se aprovado → role 'producer' + acesso ao painel           │
└─────────────────────────────────────────────────────────────┘
```

---

## Detalhes Técnicos

**BecomeProducerModal**:
- Input CPF com máscara
- Input telefone com máscara
- Validação básica
- Atualiza `profiles.producer_status` para `pending`
- Atualiza `profiles.cpf` e `profiles.phone`

**Página Produtores**:
- Verifica se usuário está logado via `useAuth()`
- Se `role === 'producer'`, botão vira "Acessar painel"
- Se `producer_status === 'pending'`, mostra "Aguardando aprovação"
- Se não logado ou sem solicitação, abre fluxo de cadastro

**Admin Producers**:
- Query separada para `producer_status = 'pending'`
- Exibir seção "Solicitações Pendentes" no topo
- Botão "Aprovar" chama edge function `create-producer-account`
- Botão "Rejeitar" atualiza `producer_status = 'rejected'`
