

# Auditoria Completa — TicketHall: Plano Estrategico Pre-Lancamento

Revisao sistematica de todo o codebase, organizada por area, com classificacao de severidade.

---

## 1. AREA DO USUARIO FINAL (Buyer)

### BUGS / CRITICOS

| # | Problema | Severidade | Detalhe |
|---|---------|-----------|---------|
| 1.1 | **Carrinho nao protege checkout sem login** | Alta | O botao "Finalizar compra" em `Carrinho.tsx` (linha 166) e um `<Link to="/checkout">` direto. Se o usuario nao esta logado, o `ProtectedRoute` redireciona para `/?login=true`, mas apos login ele vai para a home (nao volta ao checkout). O carrinho pode expirar nesse tempo. | 
| 1.2 | **Carrinho aceita itens de 1 evento por vez, mas nao valida no checkout** | Media | Se o usuario manipula localStorage, pode enviar itens de eventos diferentes. O `Checkout.tsx` (linha 93) usa `items[0]?.eventId` — itens de outros eventos sao ignorados silenciosamente. |
| 1.3 | **Download de ingresso so funciona se `qr_code_image_url` existir** | Media | Em `MeusIngressos.tsx` linha 260, o botao "Baixar" so aparece se `ticket.qr_code_image_url` estiver preenchido. A edge function `generate-qr-code` precisa estar sendo chamada em algum momento. Verificar se o QR e gerado ao confirmar pagamento. |
| 1.4 | **Pagina de Favoritos nao esta no MobileBottomNav** | Baixa | Nao ha acesso direto a favoritos no menu mobile logado. O usuario precisa ir pelo perfil. |

### PLACEHOLDERS / INCOMPLETOS

| # | Problema | Severidade |
|---|---------|-----------|
| 1.5 | **Analytics placeholders vazios** | Baixa | `trackEvent`, `trackPageView`, `trackPurchase` em `api.ts` sao funcoes vazias. Nao afeta funcionalidade, mas nao ha tracking algum. |
| 1.6 | **SupportChat e um chatbot offline com respostas hardcoded** | Baixa | Funciona como FAQ interativo, mas o usuario pode esperar suporte humano. Considerar remover ou adicionar disclaimer "Assistente automatizado". |
| 1.7 | **Pagina de Metodos de Pagamento (`MetodosPagamento.tsx`) e placeholder** | Media | Rota existe mas precisa verificar se tem conteudo funcional ou e apenas UI. |

---

## 2. FLUXO DE COMPRA (Checkout)

### BUGS / CRITICOS

| # | Problema | Severidade |
|---|---------|-----------|
| 2.1 | **Stub mode do pagamento confirma cartao sem gateway** | Alta | `create-payment/index.ts` linha 169-240: quando Asaas nao esta configurado, cartao de credito e confirmado automaticamente (RPC `confirm_order_payment` e chamado). Isso cria ingressos reais sem cobranca. Para lancamento, se o gateway nao estiver pronto, pelo menos bloquear pagamento por cartao no stub mode e so permitir PIX/boleto com aviso. |
| 2.2 | **Pedido expira em 15 min mas nao ha feedback visual antes de expirar** | Baixa | O `CountdownTimer` existe no checkout, mas se o usuario sai da pagina e volta, o pedido pode ter expirado sem feedback. |
| 2.3 | **Sem rota para recuperar pedido pendente** | Media | Se o usuario fecha o navegador durante pagamento PIX, nao ha como voltar ao pedido. Falta rota `/pedido/:id` ou similar. |

---

## 3. AREA DO PRODUTOR

### BUGS / CRITICOS

| # | Problema | Severidade |
|---|---------|-----------|
| 3.1 | **ProducerEventForm tem 1221 linhas num unico arquivo** | Baixa | Nao e bug, mas aumenta risco de regressao. Considerar refatorar em sub-componentes menores. |
| 3.2 | **ProducerEventReconciliation nao e acessivel como rota independente** | Media | Existe como tab dentro de `ProducerFinancial`, mas o nome do arquivo sugere que deveria ser acessivel por evento tambem. Verificar se faz sentido ter rota `/producer/events/:id/reconciliation`. |
| 3.3 | **Triggers do banco nao existem no DB atual** | CRITICO | A nota `<db-triggers>: There are no triggers in the database` significa que: (1) `handle_new_user` nao cria perfil/role automaticamente; (2) `update_updated_at_column` nao atualiza timestamps; (3) `handle_promoter_commission` nao processa comissoes; (4) `increment_list_submissions` nao conta submissions. As FUNCOES existem mas os TRIGGERS que as chamam nao foram criados! |

### PLACEHOLDERS / INCOMPLETOS

| # | Problema | Severidade |
|---|---------|-----------|
| 3.4 | **EmbedSnippetGenerator existe mas nao e acessivel** | Baixa | O componente existe, mas nao ha link no painel do produtor para gerar embed de venda. |
| 3.5 | **Relatorios de evento (`ProducerEventReports`)** | Media | Rota existe como legacy `/producer/events/:id/reports` mas nao esta no EventPanel como tab. Verificar se esta completo. |

---

## 4. AREA ADMIN

### BUGS / CRITICOS

| # | Problema | Severidade |
|---|---------|-----------|
| 4.1 | **AdminProducerDetail nao tem botoes de aprovar/rejeitar** | Alta | A pagina mostra dados do produtor e lista de eventos, mas nao tem acoes de gestao (aprovar, rejeitar, suspender). As funcoes `approveProducer`, `rejectProducer` existem em `api-admin.ts` mas nao sao usadas na UI. |
| 4.2 | **AdminDashboard faz queries sem filtro de date range na analytics** | Baixa | `event_analytics` e sempre buscado sem filtro de data (linha 37 de api-admin.ts). O filtro de data so se aplica a events/orders, mas analytics mostra o total acumulado sempre. |
| 4.3 | **AdminUsers nao tem acao de promover/remover roles** | Media | A lista de usuarios mostra nome, CPF e role, mas nao permite alterar roles ou suspender usuarios. |

---

## 5. BANCO DE DADOS / BACKEND

### CRITICOS

| # | Problema | Severidade |
|---|---------|-----------|
| 5.1 | **TRIGGERS NAO CRIADOS** | CRITICO | Esta e a questao mais grave. As funcoes `handle_new_user`, `update_updated_at_column`, `handle_promoter_commission`, `increment_list_submissions` existem mas **nenhum trigger** esta registrado no banco. Isso significa: novos usuarios nao ganham profile/role automaticamente; timestamps de `updated_at` nao sao atualizados; comissoes de promoters nunca sao geradas; e submissions de listas de interesse nao contam. A edge function `ensure-user-profile` no AuthContext e um workaround parcial, mas nao e confiavel. |
| 5.2 | **Google OAuth pode nao estar habilitado** | Alta | `BecomeProducerModal` tem botao "Continuar com Google" (linha 286) e `AuthModal` provavelmente tambem. Se o provider Google nao esta configurado no auth settings do Lovable Cloud, vai dar erro. Precisa confirmar se esta habilitado. |
| 5.3 | **Tabela `resale_listings` usa `as any` em todas as queries** | Media | Toda query para `resale_listings` em `api-resale.ts` usa cast `as any` porque a tabela provavelmente nao esta nos types gerados. Funciona mas nao tem type-safety. |

---

## 6. LANDING PAGE E NAVEGACAO

| # | Problema | Severidade |
|---|---------|-----------|
| 6.1 | **Redirect de buyer logado pra /eventos impede acesso a landing** | Media | Em `Index.tsx` linha 114-121, se o usuario esta logado como buyer, e redirecionado para `/eventos` automaticamente. Nao tem como ver a landing page da plataforma enquanto logado. |
| 6.2 | **SEOHead nao esta em todas as paginas publicas** | Baixa | Algumas paginas (Produtores, Carrinho, Checkout) nao tem `SEOHead`. |
| 6.3 | **OnboardingFlow aparece para todos os visitantes, incluindo produtores** | Baixa | O onboarding e generico e mostra "Como comprar ingressos" mesmo para produtores. |

---

## 7. PLANO DE IMPLEMENTACAO PRIORIZADO

### Fase 1 — CRITICOS (Bloqueia lancamento)

1. **Criar TODOS os triggers do banco** — migration SQL para: `handle_new_user` on `auth.users`, `update_updated_at_column` on profiles/orders/events, `handle_promoter_commission` on orders, `increment_list_submissions` on interest_list_submissions
2. **Proteger checkout sem login** — Redirecionar do carrinho para AuthModal antes de ir ao checkout, preservando o contexto
3. **Bloquear stub mode para cartao** — No `create-payment`, quando Asaas nao esta configurado, so permitir PIX simulado ou retornar erro claro

### Fase 2 — ALTA PRIORIDADE

4. **Admin: botoes aprovar/rejeitar produtor** em `AdminProducerDetail.tsx`
5. **Admin: gestao de roles de usuario** em `AdminUsers.tsx`
6. **Verificar se Google OAuth esta habilitado** ou remover botao
7. **Gerar QR code image na confirmacao de pagamento** (garantir que `generate-qr-code` e chamado)

### Fase 3 — MEDIA PRIORIDADE

8. **Rota de recuperacao de pedido** `/pedido/:id` para PIX/boleto pendente
9. **Types corretos para resale_listings** (regenerar types ou adicionar manualmente)
10. **AdminUsers: adicionar acoes** (suspender, alterar role)
11. **Embed snippet acessivel no painel do produtor**
12. **SEOHead em todas as paginas publicas**

### Fase 4 — POLISH

13. **SupportChat: disclaimer de assistente automatizado**
14. **OnboardingFlow: condicionar ao role**
15. **Analytics: integrar tracking basico**
16. **Landing page acessivel para usuarios logados** (botao ou rota alternativa)

---

**Total de itens identificados: 25**
**Criticos (bloqueia lancamento): 4**
**Alta prioridade: 4**
**Media prioridade: 5**
**Baixa prioridade/Polish: 12**

