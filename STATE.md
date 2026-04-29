# State — Sebas.ai (2026-04-29)

## Current phase
Fase 3 — Multi-tenant + roles (completed)

## What works
- Landing page (738-line monolith, functional)
- Firebase Auth (Google popup, hardcoded to 1 email) — /dashboardroot legacy route
- Dashboard (admin-only leads viewer from Firestore) — still on Firebase
- Express server (webhook, email via Resend, routing engine)
- Pipeline orchestrator (template clone + adapt)
- 5 bot templates structured
- i18n (ES/EN)
- Vercel deploy config
- Supabase Auth (Google OAuth) — AuthContext, Login, Register, ProtectedRoute
- OrganizationContext — multi-tenant base, org list + current org + role

## What is new (Fase 3)
- src/types/organization.ts — OrganizationWithMembership type
- src/contexts/OrganizationContext.tsx — multi-tenant provider: organizations, currentOrganization, currentMembership, currentRole, loading, error, setCurrentOrganizationId, refreshOrganizations, isOwner, isAdmin, isMember
- src/components/OrganizationSwitcher.tsx — dropdown switcher, shows org name + role, no hardcoded data
- src/components/RequireOrganization.tsx — guard: loading/error/no-org states before rendering children
- src/pages/OrganizationDebug.tsx — DEV ONLY page at /org-debug, shows user + orgs + active org + role
- src/App.tsx — OrganizationProvider wraps app, /org-debug route added (ProtectedRoute guarded)

## What is mock / not connected
- OrganizationContext queries Supabase but requires real org_members rows for current user
- Dashboard still reads Firestore, not Supabase
- /dashboardroot still uses Firebase auth guard (migration deferred to Fase 4)
- ProtectedRoute not yet applied to /dashboardroot
- 20/23 Stitch screens not implemented
- OrganizationSwitcher not yet placed in any nav/dashboard UI
- RequireOrganization not yet wrapping any real feature routes

## Known issues
- Landing.tsx = 738-line monolith (refactor in future phase)
- Dashboard hardcoded to single admin email via Firebase
- **npm run build PASSES** as of Fase 3.5. Root cause was corrupted node_modules (multiple .mjs files missing from react-router, framer-motion, motion-dom, @reduxjs/toolkit). Fixed with full clean reinstall. `react-router` added as explicit dep with exact version pin.
- tsc --noEmit fails with ~25 errors — all pre-existing (Landing.tsx key props, templates/02-03). Zero errors in Fase 3 files. react-router-dom type errors gone after clean reinstall.
- Bundle JS ~1.2 MB (optimize with code splitting in future)
- 1 npm vuln moderate (node-domexception deprecated)
- /org-debug is dev-only, must be removed or gated before production

## Rutas disponibles
- / → Landing
- /login → Login (Supabase OAuth)
- /register → Register (Supabase OAuth)
- /org-debug → OrganizationDebug (DEV ONLY, ProtectedRoute guarded)
- /dashboardroot → Dashboard (Firebase auth guard — legacy)

## Branch
feature/v2-functional-dashboard
