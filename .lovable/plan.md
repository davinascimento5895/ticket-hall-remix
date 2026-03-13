

# Staff Check-in Portal — Plano de Implementação

## Visão Geral

Criar um portal dedicado para staff/operadores de check-in, com interface mobile-first otimizada para leitura de QR codes em eventos. O staff é vinculado a eventos pelo produtor via `producer_team_members` (role `checkin_staff`), e acessa uma experiência isolada do app principal.

## 1. Banco de Dados

### 1.1 Novo role na enum `app_role`
Adicionar `'staff'` à enum `app_role` existente para que o `ProtectedRoute` e o `AuthContext` reconheçam o novo tipo de usuário.

```sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';
```

### 1.2 Tabela `event_staff` (nova)
Vincula staff a eventos específicos, controlando acesso. Substituirá a dependência em `producer_team_members` para o fluxo do staff.

```sql
CREATE TABLE public.event_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  producer_id uuid NOT NULL,
  checkin_list_id uuid REFERENCES public.checkin_lists(id),
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.event_staff ENABLE ROW LEVEL SECURITY;
```

RLS:
- Producers podem gerenciar staff dos seus eventos
- Staff pode ver seus próprios registros
- Admins acesso total

### 1.3 Habilitar Realtime na tabela `tickets`
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
```

## 2. Fluxo do Produtor (atribuir staff)

Atualizar `TeamMembersManager` ou criar seção no painel do evento para:
- Quando o produtor convida alguém com role `checkin_staff`, o sistema cria a entrada em `user_roles` com role `staff` E vincula na `event_staff`
- Adicionar UI no painel do evento para associar membros da equipe a eventos específicos

## 3. Autenticação e Rotas

### 3.1 Atualizar `AuthContext`
- Incluir `'staff'` no tipo `AppRole`

### 3.2 Atualizar `ProtectedRoute`  
- Incluir `'staff'` nos `allowedRoles` aceitos

### 3.3 Novas rotas (standalone, sem MainLayout)
```
/staff → StaffEventList (seleção de evento)
/staff/checkin/:eventId → StaffCheckinScreen (tela principal)
```

## 4. Páginas do Staff

### 4.1 `StaffEventList` — Seleção de Evento
- Header minimalista: logo TicketHall + botão logout
- Lista eventos ativos do staff (query em `event_staff`)
- Cards com: nome, data, local, badge de status (EM ANDAMENTO / EM BREVE / ENCERRADO)
- Encerrados com opacidade reduzida, não clicáveis

### 4.2 `StaffCheckinScreen` — Tela Principal de Check-in
Layout mobile-first conforme especificação:

```text
┌─────────────────────────────────┐
│  [Logo]  Nome do Evento  [Sair] │
├─────────────────────────────────┤
│  ✅ 142 entradas  |  🎟 380 total│
│  ████████████░░░░  37%          │
├─────────────────────────────────┤
│                                 │
│     [ SCANNER QR - ~50% tela ]  │
│     moldura animada #ff472d     │
│                                 │
├─────────────────────────────────┤
│  [ RESULTADO FULLSCREEN ]       │
│  verde/amarelo/vermelho         │
├─────────────────────────────────┤
│  [🔦 Lanterna]  [🔊 Som]  [✍️] │
└─────────────────────────────────┘
```

**Scanner QR:**
- `html5-qrcode` (já instalado) com moldura animada
- Debounce de 1.5s entre leituras
- Suporte a lanterna (torch API)
- Pausa ao detectar QR, mostra feedback, retoma

**Feedback visual (poka-yoke):**
- VALID: tela verde fullscreen, ✅, nome + tier, 2s
- ALREADY_USED: tela laranja, ⚠️, horário original
- INVALID/CANCELLED: tela vermelha, ❌, mensagem de erro

**Feedback sonoro (Web Audio API):**
- VALID: bip agudo curto
- ALREADY_USED: dois bips médios
- INVALID: bip grave
- Toggle on/off persistido em localStorage

**Vibração:**
- VALID: 200ms
- ERRO: 500ms ou padrão [200, 100, 200]

**Check-in manual (bottom sheet):**
- Busca por nome ou código do pedido
- Email mascarado (jo***@gmail.com)
- Confirmação antes de executar
- Apenas participantes do evento atual

**Histórico da sessão (drawer lateral):**
- Últimos N scans da sessão
- Nome, hora, resultado (✅/⚠️/❌)
- Botão undo visível por 10s após check-in válido (reverte ticket de `used` para `active`)

**Contador em tempo real:**
- Supabase Realtime subscription na tabela `tickets` filtrado por `event_id`
- Total entradas / total ingressos / barra de progresso

## 5. Edge Function — Sem alterações

A edge function `validate-checkin` já suporta todo o fluxo necessário (validação JWT, check de status, registro de logs). O staff usará ela normalmente via `supabase.functions.invoke`.

## 6. Config

Adicionar ao `supabase/config.toml`:
```toml
[functions.validate-checkin]
verify_jwt = false
```
(Se ainda não configurado — a função já faz validação manual do JWT.)

## 7. Arquivos a Criar/Modificar

| Ação | Arquivo |
|------|---------|
| Criar | `src/pages/staff/StaffEventList.tsx` |
| Criar | `src/pages/staff/StaffCheckinScreen.tsx` |
| Criar | `src/lib/audio-feedback.ts` (Web Audio API helpers) |
| Modificar | `src/App.tsx` (adicionar rotas /staff) |
| Modificar | `src/contexts/AuthContext.tsx` (adicionar 'staff' ao tipo) |
| Modificar | `src/components/ProtectedRoute.tsx` (adicionar 'staff') |
| Migração | Nova tabela `event_staff`, enum update, realtime |

## 8. Segurança

- Staff só acessa eventos vinculados na `event_staff`
- RLS garante isolamento: staff vê apenas seus registros
- Autenticação obrigatória via Supabase Auth
- Sem acesso a rotas de produtor, admin ou comprador
- Interface isolada sem navbar/sidebar do app principal

