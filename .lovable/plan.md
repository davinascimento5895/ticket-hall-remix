

# Auditoria de Bugs

Encontrei **6 bugs** de severidades variadas:

---

## Bug 1 — AuthModal nao reage a mudanca de `defaultTab` (MEDIO)

`AuthModal` usa `useState(defaultTab)` na linha 19. Quando a Navbar muda `authTab` entre "login" e "register", o state interno do modal nao atualiza porque `useState` so usa o valor inicial. Se o usuario clicar em "Entrar" e depois fechar e clicar em "Criar Conta", o modal continua mostrando a aba "login".

**Correcao:** Adicionar `useEffect` que sincroniza `tab` com `defaultTab` quando o modal abre.

---

## Bug 2 — PedidoRecuperacao navega durante render (MEDIO)

Linha 67-69 de `PedidoRecuperacao.tsx` chama `navigate()` diretamente no corpo do render. Isso viola as regras do React (side effects no render) e pode causar warnings ou loops.

**Correcao:** Essa pagina ja esta dentro de `<ProtectedRoute>`, que redireciona usuarios nao-logados. A verificacao redundante pode ser removida.

---

## Bug 3 — Checkout redireciona durante render (MEDIO)

Linha 261-264 de `Checkout.tsx` chama `navigate("/carrinho")` durante o render quando o carrinho esta vazio. Mesmo problema do Bug 2.

**Correcao:** Envolver em `useEffect` ou retornar `<Navigate>` do react-router.

---

## Bug 4 — `resale_listings` usa `as any` type casts (BAIXO)

Todas as chamadas em `api-resale.ts` usam `.from("resale_listings" as any)`. Os types ja existem no schema (confirmei no `types.ts`), entao os casts sao desnecessarios e escondem erros de tipo.

**Correcao:** Remover todos os `as any` das queries de `resale_listings`.

---

## Bug 5 — Hamburger menu nao aparece para usuarios logados fora do admin/producer (BAIXO)

Na Navbar, linha 213, o hamburger so aparece quando `!user || isAdminOrProducer`. Usuarios logados em paginas normais (ex: `/eventos`) nao tem acesso ao menu hamburger no mobile. Eles dependem exclusivamente do `MobileBottomNav`, mas esse menu nao tem links como "Blog", "Revenda", "Produtores", etc.

**Correcao:** Mostrar o hamburger para usuarios logados tambem, com links adicionais.

---

## Bug 6 — `PublicCheckin` nao tem scanner de camera funcional (BAIXO)

O `PublicCheckin.tsx` mostra apenas um placeholder "Scanner de camera (em breve)" na linha 149. Diferente do `ProducerEventCheckin` que tem scanner real, o checkin publico nao escaneia QR codes.

**Correcao:** Adicionar o mesmo scanner `Html5Qrcode` do `ProducerEventCheckin` usando `validateCheckin({ qrCode })`.

---

## Plano de implementacao

1. **AuthModal:** Adicionar `useEffect` para sincronizar `tab` com `defaultTab`
2. **PedidoRecuperacao:** Remover verificacao redundante de `!user` (ja coberta por `ProtectedRoute`)
3. **Checkout:** Trocar `navigate()` por `<Navigate>` do react-router
4. **api-resale.ts:** Remover todos os `as any` desnecessarios
5. **Navbar:** Adicionar hamburger para usuarios logados com links completos
6. **PublicCheckin:** Integrar scanner `Html5Qrcode` funcional

