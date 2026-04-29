# Changelog — AI-assisted changes

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
