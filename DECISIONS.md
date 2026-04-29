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
