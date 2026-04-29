# State — Sebas.ai (2026-04-29)

## Current phase
Fase 4 — Dashboard conectado a Supabase (completed)

## What works
- Landing page (738-line monolith, functional)
- Firebase Auth legacy removed from App.tsx routing (src/firebase.ts kept, not deleted)
- Dashboard reads Supabase, filtered by currentOrganization.id — leads, conversations, appointments, agents, knowledge count, integrations
- Express server (webhook, email via Resend, routing engine)
- Pipeline orchestrator (template clone + adapt)
- 5 bot templates structured
- i18n (ES/EN)
- Vercel deploy config
- Supabase Auth (Google OAuth) — AuthContext, Login, Register, ProtectedRoute
- OrganizationContext — multi-tenant base, org list + current org + role
- OrganizationSwitcher in dashboard header
- RequireOrganization wraps /dashboardroot and /app routes

## What is new (Fase 4)
- src/lib/dashboardQueries.ts — fetchDashboardData(organizationId) — parallel Supabase queries for leads, conversations, appointments, agents, knowledge count, integrations
- src/pages/Dashboard.tsx — rewritten: no Firebase, no User prop, reads Supabase via currentOrganization, shows loading/error/empty states, OrganizationSwitcher in header, read-only
- src/App.tsx — Firebase auth state removed, /dashboardroot guarded by ProtectedRoute + RequireOrganization, /app route added (OAuth redirect target), Dashboard receives no props

## What is mock / not connected
- Dashboard reads Supabase but requires real rows in DB (seed.sql data visible if running Supabase local or remote with seed applied)
- No CRUD in dashboard — read-only
- 20/23 Stitch screens not implemented
- /org-debug still exists (DEV ONLY, remove before production)

## Known issues
- Landing.tsx = 738-line monolith (refactor in future phase)
- **npm run build PASSES** as of Fase 3.5. Confirmed stable.
- tsc --noEmit fails with ~25 errors — all pre-existing (Landing.tsx key props, templates/02-03). Zero errors in Fase 4 files.
- Bundle JS ~1.2 MB (optimize with code splitting in future)
- 1 npm vuln moderate (node-domexception deprecated)
- /org-debug is dev-only, must be removed or gated before production

## Rutas disponibles
- / → Landing
- /login → Login (Supabase OAuth)
- /register → Register (Supabase OAuth)
- /app → Dashboard (ProtectedRoute + RequireOrganization) ← Fase 4
- /dashboardroot → Dashboard (ProtectedRoute + RequireOrganization) ← Fase 4 migrated
- /org-debug → OrganizationDebug (DEV ONLY, ProtectedRoute guarded)

## Branch
feature/v2-functional-dashboard
