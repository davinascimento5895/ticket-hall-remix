

## Causa Raiz

**Bug principal: "Início" redireciona para `/meus-ingressos`**

Em `src/pages/Index.tsx` (linha 98-102), quando o usuário está logado com role `buyer`, a página `/` faz `<Navigate to="/meus-ingressos" replace />`. Ou seja, clicar em "Início" sempre redireciona para ingressos. Isso explica o comportamento relatado.

**Problema secundário: Navbar superior aparece em páginas que não deveria**

O `MainLayout.tsx` só esconde a navbar em paths listados em `loggedInPaths`. Páginas como `/eventos` e `/busca` não estão na lista, então mostram navbar + logo no mobile mesmo logado.

---

## Plano de Ação

### 1. Reestruturar as 5 tabs da navegação inferior

| Tab | Ícone | Label | Rota | Descrição |
|-----|-------|-------|------|-----------|
| Catálogo | `LayoutGrid` | Catálogo | `/eventos` | Lista de eventos (era "Início") |
| Pesquisar | `Search` | Pesquisar | `/busca` | Busca avançada |
| Carrinho | `ShoppingBag` | Carrinho | `/carrinho` | Botão central destacado |
| Ingressos | `Ticket` | Ingressos | `/meus-ingressos` | Meus ingressos |
| Perfil | `User` | Perfil | `/meu-perfil` | Configurações |

**Remover "Início" (`/`)** da barra inferior. Usuários logados não precisam da landing page.

### 2. Corrigir redirect da Index

Alterar `Index.tsx` para que buyers sejam redirecionados para `/eventos` (catálogo) em vez de `/meus-ingressos`.

### 3. Esconder navbar superior em TODAS as páginas mobile quando logado

Expandir `loggedInPaths` no `MainLayout.tsx` para incluir:
- `/eventos`
- `/busca`
- `/cidades`
- `/evento/`

Assim, no mobile logado, nenhuma página mostra a navbar superior com logo.

### 4. Atualizar `getActiveId` para novo mapeamento

```text
/eventos, /evento/*, /cidades  →  "catalog"
/busca                         →  "search"
/carrinho                      →  "cart"
/meus-ingressos, /meus-certificados  →  "tickets"
/meu-perfil/*                  →  "profile"
```

### 5. Arquivos a alterar

- **`src/components/MobileBottomNav.tsx`** — Novas 5 tabs, novo `getActiveId`, novos ícones
- **`src/pages/Index.tsx`** — Buyer redirect de `/meus-ingressos` para `/eventos`
- **`src/components/MainLayout.tsx`** — Expandir `loggedInPaths` para esconder navbar em todas as páginas mobile quando logado

