

# Audit: Event Panel Tabs — Issues and Fixes

## Summary of Findings

After reviewing all 11 tabs in the Producer Event Panel, here are the issues organized by severity.

---

## Critical Issues

### 1. Promoters tab: No way to create promoters
The Promoters tab references `supabase.from("promoters")` to list available promoters, but the global Promoters management page (`/producer/promoters`) was **removed from both the sidebar and routes**. The empty state says "Cadastre promoters primeiro em **Promoters** no menu lateral" — but that menu item no longer exists. **Producers have no way to create promoters**, making this tab completely broken.

**Fix**: Either (a) re-add the global Promoters route to the sidebar, or (b) embed the promoter creation/management (from `ProducerPromotersList`) directly inside the Promoters event tab, so producers can create promoters in-context.

### 2. Products tab: Only available when editing, not when creating
`EventProductsManager` is only rendered when `isEdit` is true (step 5). During event creation, it shows a placeholder saying "Salve o evento primeiro." This is correct behavior, but the step label "Produtos" still appears in the sidebar during creation, misleading users into thinking they can configure products.

**Fix**: Either hide step 5 entirely during creation, or show a clearer message explaining that products can be added after saving.

---

## UX / Consistency Issues

### 3. Redundant headers on Orders, Guestlist, Checkin, and Messages tabs
These tabs render their own `<Link to="/producer/events">Voltar</Link>` breadcrumb and duplicate the event title (e.g., "Pedidos — Event Name"). This is redundant because the Panel already shows the event header with title, status badge, and a "Voltar aos eventos" link. It wastes vertical space and creates visual noise.

**Affected tabs**: Orders, Guestlist, Check-in, Messages, Coupons (partially).

**Fix**: Remove the redundant back links and event title headers from these tab components since they're already shown by `ProducerEventPanel`.

### 4. Messages tab: Fake send functionality
The "Enviar mensagem" button creates a record but shows a toast saying "🚧 O envio de e-mails em massa será disponibilizado em breve." This is confusing — the button says "Enviar" but nothing actually sends.

**Fix**: Rename the button to "Salvar mensagem" or add a visible disclaimer banner explaining the feature is under development, similar to the product catalog disclaimer.

### 5. Staff tab: Email invite doesn't actually send emails
`inviteMutation` inserts into `producer_team_members` but there's no edge function or trigger to actually send an invitation email. The toast says "O staff receberá o convite por e-mail" but no email is sent.

**Fix**: Add a disclaimer or change the flow to clarify that the invite is just a record — or implement the actual email sending via an edge function.

### 6. Check-in tab: Online status is static
`const [isOnline] = useState(navigator.onLine)` — this is set once and never updates. If the user goes offline/online, the indicator won't change.

**Fix**: Use `useEffect` with `online`/`offline` event listeners to keep this reactive.

---

## Minor Issues

### 7. Tickets tab: Tax column always shows R$ 0,00
The "Taxa" column in the tier table hardcodes `fmt(0)`. This provides no useful information.

**Fix**: Calculate the actual platform fee or remove the column.

### 8. Financial tab: No link to global financial page
The event-level financial tab is self-contained but doesn't reference or link to the producer's global financial overview (`/producer/financial`).

**Fix**: Add a subtle link to the global financial page for cross-referencing.

### 9. Dashboard tab: "Última atualização" shows current time
`new Date().toLocaleString("pt-BR")` just shows when the page rendered, not when data was last fetched. This is misleading.

**Fix**: Use `dataUpdatedAt` from react-query to show actual data freshness.

---

## Tabs That Work Correctly
- **Dashboard**: Data queries, charts, metrics all properly wired.
- **Tickets**: Read-only view with stats, properly links to edit form.
- **Participants**: Filters, search, CSV export all functional.
- **Financial**: Summary cards, transaction history, filters, CSV export all functional.
- **Coupons**: Full CRUD with validation, tier filtering, toggle active/inactive.
- **Guestlist**: Add/remove/checkin guests works (aside from redundant header).
- **Staff**: Link generation, member management, access control all functional (aside from email issue).
- **Editar Evento**: Correctly redirects to the edit form.

---

## Proposed Implementation Plan

1. **Embed promoter management into the Promoters tab** — Add a sub-tab or section within `ProducerEventPromoters` that renders `ProducerPromotersList` directly, so producers can create promoters without needing a separate page.

2. **Remove redundant headers** from Orders, Guestlist, Check-in, Messages tabs — strip back links and duplicate titles since they're already in the Panel.

3. **Fix Check-in online status** — make it reactive with event listeners.

4. **Add disclaimers** to Messages send button and Staff email invite explaining these features are under development.

5. **Fix Tickets tax column** — remove the hardcoded zero or show actual platform fee.

6. **Fix Dashboard timestamp** — use react-query's `dataUpdatedAt`.

7. **Hide Products step during creation** or improve the placeholder message.

