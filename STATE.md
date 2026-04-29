# State — Sebas.ai (2026-04-29)

## Current phase
Fase 2 — Auth + Google OAuth (completed)

## What works
- Landing page (738-line monolith, functional)
- Firebase Auth (Google popup, hardcoded to 1 email) — /dashboardroot legacy route
- Dashboard (admin-only leads viewer from Firestore) — still on Firebase
- Express server (webhook, email via Resend, routing engine)
- Pipeline orchestrator (template clone + adapt)
- 5 bot templates structured
- i18n (ES/EN)
- Vercel deploy config

## What is new (Fase 2)
- src/vite-env.d.ts — fixes import.meta.env TypeScript errors
- src/contexts/AuthContext.tsx — Supabase Auth provider (user, session, loading, signInWithGoogle, signOut, refreshSession)
- src/pages/Login.tsx — login page with Google OAuth via Supabase
- src/pages/Register.tsx — register page with Google OAuth via Supabase
- src/components/ProtectedRoute.tsx — Supabase session guard, redirects to /login
- src/App.tsx — added /login, /register routes; wrapped with AuthProvider; Firebase guard kept for /dashboardroot

## What is mock / not connected
- Supabase client exists and AuthContext is wired, but Google OAuth requires Supabase project configured with Google provider
- Dashboard still reads Firestore, not Supabase
- /dashboardroot still uses Firebase auth guard (migration deferred to Fase 4)
- ProtectedRoute created but not yet applied to /dashboardroot
- No multi-tenant UI
- 20/23 Stitch screens not implemented
- Templates exist as structure, not SaaS product

## Known issues
- Landing.tsx = 738-line monolith (refactor in future phase)
- Dashboard hardcoded to single admin email via Firebase
- tsc --noEmit fails with ~33 errors (non-blocking — Vite build passes)
- Bundle JS ~1.2 MB (optimize with code splitting in future)
- 1 npm vuln moderate (node-domexception deprecated)

## Rutas disponibles
- / → Landing
- /login → Login (Supabase OAuth)
- /register → Register (Supabase OAuth)
- /dashboardroot → Dashboard (Firebase auth guard — legacy)

## Branch
feature/v2-functional-dashboard
