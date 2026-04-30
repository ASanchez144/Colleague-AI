# State — Sebas.ai (2026-04-30)

## Current phase
Fase 5 — Leads CRUD conectado a Supabase (completed)

## What works
- Landing page (738-line monolith, functional)
- Firebase Auth legacy removed from App.tsx routing (src/firebase.ts kept, not deleted)
- Dashboard reads Supabase, filtered by currentOrganization.id — leads, conversations, appointments, agents, knowledge count, integrations
- **Leads CRUD — /leads route — list, create, edit, status change, notes, filter by status, multi-tenant**
- Express server (webhook, email via Resend, routing engine)
- Pipeline orchestrator (template clone + adapt)
- 5 bot templates structured
- i18n (ES/EN)
- Vercel deploy config
- Supabase Auth (Google OAuth) — AuthContext, Login, Register, ProtectedRoute
- OrganizationContext — multi-tenant base, org list + current org + role
- OrganizationSwitcher in dashboard header
- RequireOrganization wraps /dashboardroot, /app, /leads routes

## What is new (Fase 5)
- src/lib/leadsQueries.ts — fetchLeads, fetchLeadById, createLead, updateLead, updateLeadStatus — all filtered by organization_id
- src/pages/Leads.tsx — full CRUD: list + filter by status + create modal + detail/edit panel + quick status change in table
- src/App.tsx — /leads route added (ProtectedRoute + RequireOrganization)
- src/pages/Dashboard.tsx — "Ver todos →" link to /leads in leads table header
- src/index.css — .input-field utility class added

## What is mock / not connected
- Leads CRUD requires real rows in DB (seed.sql data visible if running Supabase local or remote with seed applied)
- No conversations CRUD — read-only (Fase 6)
- No appointments CRUD — read-only (Fase 7)
- 19/23 Stitch screens not implemented
- /org-debug still exists (DEV ONLY, remove before production)
- No WhatsApp real, no IA real, no Stripe

## Known issues
- Landing.tsx = 738-line monolith (refactor in future phase)
- **npm run build PASSES** — confirmed at Fase 5
- tsc --noEmit fails with ~25 errors — all pre-existing (Landing.tsx key props, templates/02-03). Zero new errors from Fase 5 files.
- Bundle JS ~1.2 MB (optimize with code splitting in future)
- 1 npm vuln moderate (node-domexception deprecated)
- /org-debug is dev-only, must be removed or gated before production

## Rutas disponibles
- / → Landing
- /login → Login (Supabase OAuth)
- /register → Register (Supabase OAuth)
- /app → Dashboard (ProtectedRoute + RequireOrganization) ← Fase 4
- /dashboardroot → Dashboard (ProtectedRoute + RequireOrganization) ← Fase 4 migrated
- /leads → Leads CRUD (ProtectedRoute + RequireOrganization) ← Fase 5
- /org-debug → OrganizationDebug (DEV ONLY, ProtectedRoute guarded)

## Branch
feature/v2-functional-dashboard
