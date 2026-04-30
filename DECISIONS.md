# Decisions Log — Sebas.ai

## D001 — Stay on Vite + React (2026-04-28)
**Context:** PRD from Stitch specifies Next.js 14 App Router. Current repo uses Vite + React 19.
**Decision:** Stay on Vite + React.
**Rationale:** Already working, Vercel supports it, no SSR needed for MVP, avoids migration cost.

## D002 — Migrate Firebase to Supabase progressively (2026-04-28)
**Context:** App uses Firebase Auth + Firestore. PRD specifies Supabase.
**Decision:** Progressive migration. Don't delete Firebase yet. Add Supabase in parallel.
**Rationale:** Don't break working app. Firebase stays for auth/Firestore until Supabase auth is wired.

## D003 — Multi-channel architecture from day 1 (2026-04-28)
**Context:** Product is WhatsApp-first but must support voice, email, web chat, forms, manual.
**Decision:** Schema uses channel_type enum everywhere. No WhatsApp-specific columns.
**Rationale:** Avoid costly refactor when adding new channels. Channel config lives in JSONB.

## D004 — RLS for multi-tenancy (2026-04-28)
**Context:** Need org-level isolation for SaaS.
**Decision:** Supabase RLS with user_org_ids() helper function.
**Rationale:** DB-level security, no app-level filtering bugs. Standard Supabase pattern.

## D005 — Fixed UUIDs in seed data (2026-04-28)
**Context:** Need reproducible test data for development.
**Decision:** Use fixed UUIDs (a1000000-..., b1000000-..., etc.) in seed.sql.
**Rationale:** Cross-reference integrity, easy to debug, deterministic test setup.

## D006 — Firebase config from env vars (2026-04-28)
**Context:** firebase-applet-config.json contained secrets and was deleted from git index. src/firebase.ts imported it directly.
**Decision:** Rewrite firebase.ts to read from VITE_FIREBASE_* env vars.
**Rationale:** No secrets in repo, build doesn't break if JSON file absent, standard Vite env pattern.

## D007 — Keep Firebase guard on /dashboardroot through Fase 3 (2026-04-29)
**Context:** Dashboard.tsx expects Firebase `User` prop and reads Firestore. Supabase Auth (AuthContext) is now available.
**Decision:** /dashboardroot keeps Firebase email guard. /login and /register use Supabase OAuth. ProtectedRoute exists but not yet applied to /dashboardroot.
**Rationale:** Don't break admin access to existing dashboard. Fase 4 will migrate /dashboardroot to ProtectedRoute + Supabase session.

## D008 — Google OAuth only for Fase 2 (no email/password) (2026-04-29)
**Context:** Stitch registration shows email/password fields + Google button.
**Decision:** Fase 2 implements Google OAuth only via Supabase. Email/password deferred to Fase 3.
**Rationale:** OAuth is simpler, avoids email verification flow complexity. Core auth pattern established first.

## D009 — OrganizationContext not coupled to WhatsApp (2026-04-29)
**Context:** Product starts WhatsApp-first but architecture must support voice_call, email, web_chat, form, manual.
**Decision:** OrganizationContext and all Fase 3 components have zero WhatsApp-specific logic.
**Rationale:** Organization = tenant. Channels are separate concerns configured per org, not baked into org provider.

## D010 — Current org persisted in localStorage (2026-04-29)
**Context:** User may have multiple org memberships. Need to remember active org across page refreshes.
**Decision:** Active org ID stored in localStorage under key `sebas_current_org_id`. Auto-selects first org if stored key not found in membership list.
**Rationale:** Simple UX — user doesn't re-select org on every load. No server round-trip needed.

## D012 — Dashboard reads Supabase only in Fase 4; no CRUD until Fase 5 (2026-04-29)
**Context:** Dashboard.tsx was reading Firestore with Firebase auth guard. Fase 4 migrates it to Supabase.
**Decision:** Dashboard reads Supabase via fetchDashboardData(currentOrganization.id). All writes (status changes, deletes) deferred to Fase 5.
**Rationale:** Unblock multi-tenant dashboard without introducing partial CRUD that could corrupt seed data or leave UI inconsistencies.

## D013 — Firebase auth removed from App.tsx routing in Fase 4 (2026-04-29)
**Context:** App.tsx had onAuthStateChanged + firebaseLoading gate blocking entire app render for all users.
**Decision:** Remove Firebase auth state from App.tsx. /dashboardroot now uses ProtectedRoute + RequireOrganization (Supabase-based).
**Rationale:** Firebase loading gate was blocking Supabase users. src/firebase.ts kept for now but no longer drives routing.

## D011 — /org-debug is DEV ONLY (2026-04-29)
**Context:** Need a way to validate OrganizationContext during development without touching Dashboard.
**Decision:** Temporary /org-debug page added, guarded by ProtectedRoute. Must be removed or feature-flagged before production.
**Rationale:** Isolates Fase 3 validation from Dashboard. No risk of leaking prod data if guarded by auth.

## D014 — Leads CRUD: organization_id on all queries, no service_role in frontend (2026-04-30)
**Context:** Fase 5 adds write operations (INSERT, UPDATE) to leads table from the frontend.
**Decision:** Every fetchLeads/createLead/updateLead call includes `.eq('organization_id', organizationId)`. Anon key only — no service_role key in frontend.
**Rationale:** Defense-in-depth for multi-tenancy. RLS enforces it at DB level; app-level filtering is an additional guard and documents intent clearly.

## D015 — Leads CRUD uses optimistic-update-then-reload pattern (2026-04-30)
**Context:** After updateLead, we could reload all leads or just patch the updated row locally.
**Decision:** For updateLead, we locally patch the leads array with the returned row (optimistic). For createLead, we do a full reload to get the server-assigned id/timestamps.
**Rationale:** Faster UX for edits (no full reload). Create gets a reload so all metadata (created_at, uuid) is fresh.
