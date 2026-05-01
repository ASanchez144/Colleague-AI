# State — Sebas.ai (2026-04-30)

## Current phase
Fase 6 — Conversations + Messages conectado a Supabase (completed)

## What works
- Landing page (738-line monolith, functional)
- Firebase Auth legacy removed from App.tsx routing (src/firebase.ts kept, not deleted)
- Dashboard reads Supabase, filtered by currentOrganization.id — leads, conversations, appointments, agents, knowledge count, integrations
- **Leads CRUD — /leads route — list, create, edit, status change, notes, filter by status, multi-tenant**
- **Conversations + Messages — /conversations route — list, detail, messages, status change, internal message, filter by status + channel, multi-tenant**
- Express server (webhook, email via Resend, routing engine)
- Pipeline orchestrator (template clone + adapt)
- 5 bot templates structured
- i18n (ES/EN)
- Vercel deploy config
- Supabase Auth (Google OAuth) — AuthContext, Login, Register, ProtectedRoute
- OrganizationContext — multi-tenant base, org list + current org + role
- OrganizationSwitcher in dashboard header

## What is new (Fase 6)
- src/lib/conversationsQueries.ts — fetchConversations, fetchConversationById, fetchMessages, updateConversation, updateConversationStatus, createInternalMessage — all filtered by organization_id
- src/pages/Conversations.tsx — master-detail: list + filters + detail + messages thread + status change + internal message form
- src/App.tsx — /conversations route added (ProtectedRoute + RequireOrganization)
- src/pages/Dashboard.tsx — "Ver todas →" link to /conversations in conversations stat card

## What is mock / not connected
- Conversations/Messages require real rows in DB (seed.sql data visible if running Supabase local or remote with seed applied)
- No appointments CRUD — read-only (Fase 7)
- 18/23 Stitch screens not implemented
- /org-debug still exists (DEV ONLY, remove before production)
- No WhatsApp real, no IA real, no Stripe

## Known issues
- Landing.tsx = 738-line monolith (refactor in future phase)
- **npm run build PASSES** — confirmed at Fase 6
- tsc --noEmit fails with ~25 errors — all pre-existing (Landing.tsx key props, templates/02-03). Zero new errors from Fase 6 files.
- Bundle JS ~1.4 MB (optimize with code splitting in future)
- 1 npm vuln moderate (node-domexception deprecated)
- /org-debug is dev-only, must be removed or gated before production

## Rutas disponibles
- / → Landing
- /login → Login (Supabase OAuth)
- /register → Register (Supabase OAuth)
- /app → Dashboard (ProtectedRoute + RequireOrganization) ← Fase 4
- /dashboardroot → Dashboard (ProtectedRoute + RequireOrganization) ← Fase 4 migrated
- /leads → Leads CRUD (ProtectedRoute + RequireOrganization) ← Fase 5
- /conversations → Conversations + Messages (ProtectedRoute + RequireOrganization) ← Fase 6
- /org-debug → OrganizationDebug (DEV ONLY, ProtectedRoute guarded)

## Branch
feature/v2-functional-dashboard
