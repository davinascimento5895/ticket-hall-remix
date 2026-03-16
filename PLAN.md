# Plano: Perfil completo do comprador (edição ponta a ponta)

## Situação atual
- A página `EditarPerfil.tsx` já existe em `/meu-perfil/editar`, mas está incompleta
- Campos atualmente presentes: nome, sobrenome, data de nascimento, cidade, estado, categorias preferidas, avatar, contas vinculadas, email (read-only)
- Campos **faltantes** que o usuário pediu: CPF, telefone, CEP, endereço (rua), bairro, número, complemento
- A tabela `profiles` no banco SÓ tem: `full_name, cpf, phone, birth_date, city, state` (e campos de organizer/asaas). **Não tem** colunas de endereço (cep, street, neighborhood, address_number, complement)
- Os utilitários de máscara (`formatCPF`, `formatPhone`, `formatCEP`, `validateCPF`, `fetchAddress`) já existem
- O hook `useIBGEStates` já existe
- A funcionalidade de exclusão de conta já existe em `EditarPerfil.tsx`

## O que precisa ser feito

### 1. Adicionar colunas de endereço na tabela `profiles` (Supabase)
As colunas `cep`, `street`, `neighborhood`, `address_number`, `complement` **não existem** na tabela `profiles`. O usuário precisará executar uma migration SQL no Supabase:

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cep TEXT,
  ADD COLUMN IF NOT EXISTS street TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS address_number TEXT,
  ADD COLUMN IF NOT EXISTS complement TEXT;
```

### 2. Atualizar os types do Supabase (`src/integrations/supabase/types.ts`)
Adicionar as 5 novas colunas nos tipos `Row`, `Insert` e `Update` da tabela `profiles`.

### 3. Atualizar o `AuthContext.tsx`
- Adicionar as 5 novas colunas no `interface AuthContextType.profile`
- Atualizar o `select` em `fetchProfile` para incluir as novas colunas

### 4. Reescrever `EditarPerfil.tsx` com todos os campos solicitados
Reorganizar a página para incluir todos os campos pedidos, seguindo o padrão do `CheckoutStepBuyer`:

**Seção: Dados pessoais**
- Nome completo (campo único, não splitado em primeiro/sobrenome — alinhado com o resto do app)
- CPF (com máscara `formatCPF` + validação `validateCPF`)
- Data de nascimento (input type="date")
- Telefone (com máscara `formatPhone`)

**Seção: Endereço**
- CEP (com máscara `formatCEP` + auto-preenchimento via ViaCEP `fetchAddress`)
- Endereço (rua/av)
- Número
- Complemento
- Bairro
- Cidade
- Estado (select com `useIBGEStates`)

**Seção: Email** (read-only, já existe)

**Seção: Contas vinculadas** (já existe)

**Seção: Categorias preferidas** (já existe)

**Ações:**
- Botão "Salvar alterações" → faz `supabase.from("profiles").update({...})` com todos os campos
- "Excluir conta" (já existe com AlertDialog + edge function)

### 5. Atualizar auto-fill do `CheckoutStepBuyer.tsx`
O checkout já preenche `fullName, cpf, phone, birthDate, city, state` a partir do perfil. Com as novas colunas, adicionar auto-fill também para: `cep, street, neighborhood, addressNumber, complement`.

### 6. Salvar dados do checkout de volta no perfil (opcional mas valioso)
Quando o comprador fizer checkout e preencher seus dados pela primeira vez, salvar esses dados no perfil para futuros usos. Isso será feito no componente de checkout, após a compra ser confirmada.

## Arquivos que serão modificados
1. `src/integrations/supabase/types.ts` — tipos
2. `src/contexts/AuthContext.tsx` — profile interface + fetchProfile select
3. `src/pages/EditarPerfil.tsx` — reescrita completa
4. `src/components/checkout/CheckoutStepBuyer.tsx` — auto-fill expandido

## Arquivos que NÃO serão modificados
- Rotas (`App.tsx`) — a rota `/meu-perfil/editar` já existe
- `MeuPerfil.tsx` — já tem o botão de editar que navega para `/meu-perfil/editar`
- `Navbar.tsx` — dropdown já tem "Meu Perfil" (link indireto via MeuPerfil)
- Utilitários (`validators.ts`, `cep.ts`) — já têm tudo necessário
