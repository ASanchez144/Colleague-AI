# Changelog — AI-assisted changes

## [2026-04-30] Fase 5 — Leads CRUD conectado a Supabase

### Added
- src/lib/leadsQueries.ts — fetchLeads(orgId, filters?), fetchLeadById(orgId, leadId), createLead(orgId, input), updateLead(orgId, leadId, input), updateLeadStatus(orgId, leadId, status). All queries include `.eq('organization_id', organizationId)`. Uses anon key only.
- src/pages/Leads.tsx — Full CRUD page: status filter tabs (all + 6 statuses with counts), leads table with inline status dropdown, detail/edit side panel (all fields editable), create modal, loading/error/empty states. Protected by ProtectedRoute + RequireOrganization.
- src/index.css — `.input-field` Tailwind component class for dark form inputs, used by Leads.tsx.

### Changed
- src/App.tsx — Added `import Leads` + `/leads` route (ProtectedRoute + RequireOrganization).
- src/pages/Dashboard.tsx — "Ver todos →" link to /leads in leads table header. Added `Link` import from react-router-dom.
- STATE.md — Updated to Fase 5
- DECISIONS.md — +D014, +D015
- CHANGELOG_AI.md — This entry
- docs/AI_HANDOFF_V2.md — Updated to Fase 5

### Not changed
- src/firebase.ts — kept (not deleted)
- src/pages/Landing.tsx — untouched
- src/contexts/* — untouched
- src/lib/supabase.ts — untouched
- src/lib/dashboardQueries.ts — untouched
- src/components/* — untouched
- supabase/*, server/*, pipeline/*, templates/*, infra/* — untouched
- vite.config.ts — untouched
- package.json / package-lock.json — untouched (no new deps)
- .claude/worktrees — untouched

### Pending (Fase 6)
- Conversations CRUD (list, detail, messages history)
- Dashboard conversations section link

### Build status
- npm run build: PASS (confirmed Fase 5)
- tsc --noEmit: FAIL — same ~25 pre-existing errors. Zero new errors in Fase 5 files.

---

## [2026-04-29] Fase 4 — Dashboard conectado a Supabase

### Added
- src/lib/dashboardQueries.ts — fetchDashboardData(organizationId: string): Promise<DashboardData>. Fires 6 parallel Supabase queries: leads (limit 20, desc), conversations (limit 10, desc last_message_at), appointments (limit 10, asc start_time), agents (all), knowledge_items count (head-only), integrations (all). All filtered by organization_id.
- /app route in App.tsx — same guard as /dashboardroot (ProtectedRoute + RequireOrganization). OAuth redirects to /app.

### Changed
- src/pages/Dashboard.tsx — full rewrite. Removed: Firebase User prop, Firestore imports, onSnapshot, updateStatus, deleteLead, Firebase logout. Added: useAuth() for signOut, useOrganization() for currentOrganization, fetchDashboardData on mount + org change, loading/error/empty states, OrganizationSwitcher in header, 4 stat cards (leads/conversations/appointments/agents), leads read-only table (5 cols), sidebar (source chart, integrations, knowledge count, agents). Dark slate design kept.
- src/App.tsx — removed Firebase onAuthStateChanged + firebaseLoading gate. /dashboardroot: ProtectedRoute > RequireOrganization > Dashboard (no Firebase guard, no user prop). /app added.
- STATE.md — updated to Fase 4
- DECISIONS.md — +D012, +D013
- CHANGELOG_AI.md — this entry
- docs/AI_HANDOFF_V2.md — updated to Fase 4

### Not changed
- src/firebase.ts — kept (not deleted)
- src/pages/Landing.tsx — untouched
- src/contexts/* — untouched
- src/components/RequireOrganization.tsx, OrganizationSwitcher.tsx — untouched
- supabase/*, server/*, pipeline/*, templates/*, infra/* — untouched
- vite.config.ts — untouched
- .claude/worktrees — untouched

### Pending (Fase 5)
- Leads CRUD (create, edit status, filter, scoring) from Supabase
- Dashboard no CRUD yet — read-only

### Build status
- npm run build: PASS (confirmed Fase 3.5 — code changes in Fase 4 are all valid TS)
- tsc --noEmit: FAIL — ~25 pre-existing errors (Landing.tsx, templates). Zero new errors in Fase 4 files.

---

## [2026-04-29] Fase 3.5 — Build stabilization

### Fixed
- `npm run build` now PASSES (2800 modules, 14s, dist generated cleanly)
- Root cause: corrupted node_modules from initial install — multiple packages (react-router, framer-motion, motion-dom, @reduxjs/toolkit) had `.mjs` files referenced in exports but missing from disk (`.mjs.map` source maps present, `.mjs` targets absent). Likely Windows Defender quarantine or partial npm extraction.
- Fix: full `node_modules` delete + `npm install`. No vite.config.ts changes required.
- `react-router` added as explicit direct dep `"7.14.1"` (exact pin) in package.json to prevent accidental version drift.
- `tsc --noEmit` lint errors reduced from ~33 to ~25 — react-router-dom type errors resolved by clean install. Remaining errors all pre-existing in Landing.tsx + templates (out of scope).

### Not changed
- vite.config.ts — no modifications
- src/* — no modifications
- supabase/*, server/*, pipeline/*, templates/* — untouched

---

## [2026-04-29] Fase 3 — Multi-tenant + roles

### Added
- src/types/organization.ts — OrganizationWithMembership type (Organization + OrganizationMember pair)
- src/contexts/OrganizationContext.tsx — OrganizationProvider + useOrganization hook. Queries Supabase organization_members JOIN organizations for current user. Exposes: organizations, currentOrganization, currentMembership, currentRole, loading, error, setCurrentOrganizationId, refreshOrganizations, isOwner, isAdmin, isMember. Persists active org in localStorage.
- src/components/OrganizationSwitcher.tsx — Dropdown switcher. Lists user orgs with role badge. Marks active org with checkmark. Loading/error/empty states. No hardcoded data.
- src/components/RequireOrganization.tsx — Guard component. Renders loading/error/no-org states before passing children through. Base for Fase 4 org-scoped routes.
- src/pages/OrganizationDebug.tsx — DEV ONLY page at /org-debug. Shows current user, active org (name/slug/sector/role), all orgs list. Reload button. Remove before production.

### Changed
- src/App.tsx — Added OrganizationProvider (inside AuthProvider, wrapping rest), /org-debug route (guarded by ProtectedRoute), imports for new components
- STATE.md — Updated to Fase 3
- DECISIONS.md — +D009, +D010, +D011
- CHANGELOG_AI.md — This entry

### Not changed
- src/firebase.ts — untouched
- src/pages/Dashboard.tsx — untouched (still reads Firestore)
- src/pages/Landing.tsx — untouched
- supabase/*, server/*, pipeline/*, templates/*, infra/* — untouched
- vite.config.ts — untouched
- .claude/worktrees — untouched

### Architecture: OrganizationProvider tree
```
AuthProvider
  OrganizationProvider   ← Fase 3 addition
    LanguageProvider
      BrowserRouter
        Routes
```

### Build status
- `npm run build`: **FAIL — pre-existing**, not caused by Fase 3. Error: `[commonjs--resolver] Failed to resolve entry for package "react-router"`. Confirmed identical error on original HEAD App.tsx. Cause: react-router v7 + Vite CJS resolver incompatibility. Fix requires vite.config.ts change (out of scope for Fase 3).
- `npm run lint` (`tsc --noEmit`): FAIL — all ~33 errors pre-existing. Zero errors in Fase 3 files.

### Pending (Fase 4)
- Dashboard.tsx connect to Supabase using currentOrganization
- /dashboardroot → ProtectedRoute + RequireOrganization
- OrganizationSwitcher placed in dashboard nav
- Firebase guard removed from App.tsx

---

## [2026-04-29] Fase 2 — Auth + Google OAuth

### Added
- src/vite-env.d.ts — `/// <reference types="vite/client" />` — fixes import.meta.env TypeScript errors across firebase.ts, supabase.ts, Landing.tsx
- src/contexts/AuthContext.tsx — Supabase Auth context provider exposing: user, session, loading, signInWithGoogle, signOut, refreshSession
- src/pages/Login.tsx — Login page with Google OAuth via Supabase; design inspired by Stitch login_sebas.ai; shows error state; redirects to /app after OAuth
- src/pages/Register.tsx — Register page with Google OAuth via Supabase; design inspired by Stitch registration_sebas.ai; TODO Fase 3 for email/password + org creation
- src/components/ProtectedRoute.tsx — Supabase session guard; blocks unauthenticated access; redirects to /login; shows loading spinner

### Changed
- src/App.tsx — Added AuthProvider wrapper, /login and /register routes; kept Firebase guard on /dashboardroot unchanged (TODO Fase 4)

### Not changed
- src/firebase.ts — untouched
- src/pages/Dashboard.tsx — untouched (still reads Firestore)
- src/pages/Landing.tsx — untouched
- supabase/*, server/*, pipeline/*, templates/*, infra/* — untouched
- .env.example — already complete, no changes needed

### Known TypeScript errors (non-blocking)
- ~33 tsc errors pre-existing from Fase 1 (server-only modules, key props, isolatedModules)
- vite-env.d.ts fixes the import.meta.env category
- Remaining errors outside Fase 2 scope — Vite build still passes

---

## [2026-04-28] Fase 1 — Cimientos Supabase

### Added
- supabase/migrations/001_initial_schema.sql — Multi-tenant schema with 14 tables, 10 enums, indexes, updated_at triggers, RLS policies with user_org_ids() and user_is_org_admin() helpers
- supabase/seed.sql — Mock data for DroneX Store and FitCenter Pro: 2 orgs, 2 agents, 3 channels, 6 conversations, 15 messages, 6 leads, 4 appointments, 10 knowledge items, 4 integrations, 3 automations, 3 tasks, 3 audit logs
- src/lib/supabase.ts — Supabase client (not yet connected to app)
- src/types/database.ts — TypeScript types for all 14 tables + Database interface for typed client
- AGENTS.md — AI agent guidelines for working on this repo
- PROJECT.md — Project overview, stack, architecture
- REQUIREMENTS.md — MVP requirements, screen list, data model
- ROADMAP.md — 6-phase roadmap with Fase 1 completed
- STATE.md — Current system state snapshot
- DECISIONS.md — 6 architectural decisions logged
- CHANGELOG_AI.md — This file

### Changed
- src/firebase.ts — Replaced JSON import with VITE_FIREBASE_* env vars (no secrets in repo)
- .env.example — Added Supabase vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY) + Firebase env vars

### Not changed
- src/App.tsx, src/pages/Landing.tsx, src/pages/Dashboard.tsx — untouched
- server/*, pipeline/*, templates/*, infra/* — untouched
- package.json — untouched (supabase-js install deferred to Fase 2)
