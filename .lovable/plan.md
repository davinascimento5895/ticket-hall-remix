

## Problem

Currently, clicking "Crie seu evento" when not logged in opens the `BecomeProducerModal` which only asks for CPF and phone — but requires the user to already be authenticated. If they're not logged in, it just shows an error toast. This is a broken, confusing experience.

## Solution: Multi-step "Create Event" Modal

Replace the current `BecomeProducerModal` with a smart multi-step flow that handles the full journey in a single modal:

```text
┌─────────────────────────────────────────┐
│  User clicks "Crie seu evento"          │
│                                         │
│  ┌─ Not logged in? ──────────────────┐  │
│  │  Step 1: Auth (Login or Register) │  │
│  │  - Tab toggle: Entrar / Criar     │  │
│  │  - Google OAuth option            │  │
│  │  - On success → auto-advance      │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─ Logged in but not producer? ─────┐  │
│  │  Step 2: Producer activation      │  │
│  │  - CPF + Phone fields             │  │
│  │  - Calls become-producer function │  │
│  │  - On success → redirect to       │  │
│  │    /producer/events/new           │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─ Already a producer? ────────────┐   │
│  │  Skip modal entirely →           │   │
│  │  navigate(/producer/events/new)  │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Technical Changes

### 1. Rewrite `BecomeProducerModal.tsx`
- Add internal state machine with steps: `auth` → `producer-data`
- **Auth step**: Embed login/register forms inline (reuse the same pattern from `AuthModal` — email/password, Google OAuth, tab toggle)
- **Producer step**: CPF + Phone (current form), shown only after auth completes
- Auto-detect current state on open:
  - `!user` → start at `auth`
  - `user && role !== 'producer'` → start at `producer-data`
  - `user && role === 'producer'` → close modal, navigate directly
- Listen to `onAuthStateChange` inside the modal to detect when login/signup completes and auto-advance to step 2

### 2. Update `Navbar.tsx`
- `handleCreateEvent`: keep the same logic (already correct — opens modal or navigates)
- No structural changes needed

### 3. UX Details
- Step indicator (1/2 dots) so user knows progress
- Step 1 header: "Entre ou crie sua conta" / subtitle: "Para criar eventos, você precisa de uma conta."
- Step 2 header: "Complete seus dados de produtor" / subtitle: "Precisamos de algumas informações para ativar sua conta."
- After step 2 success → redirect to `/producer/events/new` (event creation form)
- Smooth transitions between steps

