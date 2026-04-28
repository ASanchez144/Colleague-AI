# State — Sebas.ai (2026-04-28)

## Current phase
Fase 1 — Cimientos Supabase (completed)

## What works
- Landing page (738-line monolith, functional)
- Firebase Auth (Google popup, hardcoded to 1 email)
- Dashboard (admin-only leads viewer from Firestore)
- Express server (webhook, email via Resend, routing engine)
- Pipeline orchestrator (template clone + adapt)
- 5 bot templates structured
- i18n (ES/EN)
- Vercel deploy config

## What is new (Fase 1)
- supabase/migrations/001_initial_schema.sql — 14 tables, enums, indexes, RLS
- supabase/seed.sql — DroneX Store + FitCenter Pro mock data
- src/lib/supabase.ts — client (not yet connected to app)
- src/types/database.ts — full type definitions
- src/firebase.ts — migrated from JSON import to env vars
- .env.example — Supabase + Firebase vars

## What is mock / not connected
- Supabase client exists but app still uses Firebase
- Dashboard reads Firestore, not Supabase
- No login/register pages
- No multi-tenant UI
- 21/23 Stitch screens not implemented
- Templates exist as structure, not SaaS product

## Known issues
- Landing.tsx = 738-line monolith (refactor in future phase)
- Dashboard hardcoded to single admin email
- firebase-applet-config.json deleted from git index but firebase.ts now uses env vars
- @supabase/supabase-js not yet in package.json (install in Fase 2)

## Branch
feature/v2-functional-dashboard
