# Roadmap — Sebas.ai

## Fase 1 — Cimientos Supabase (completed)
- [x] Define multi-tenant schema (14 tables)
- [x] RLS policies per organization
- [x] Seed data: DroneX Store + FitCenter Pro
- [x] TypeScript types mirroring schema
- [x] Supabase client (src/lib/supabase.ts)
- [x] Firebase decoupled from JSON config to env vars
- [x] .env.example with Supabase + Firebase vars
- [x] Project documentation

## Fase 2 — Auth + Layout + Router
- [ ] Install @supabase/supabase-js
- [ ] Supabase Auth (Google OAuth)
- [ ] App shell: sidebar layout, route placeholders
- [ ] Login / Register pages (from Stitch)
- [ ] Protected routes with org context
- [ ] Migrate from Firebase Auth (keep parallel until stable)

## Fase 3 — Client Dashboard
- [ ] Customer dashboard overview
- [ ] Conversations view (read from Supabase)
- [ ] Leads management
- [ ] Appointments view
- [ ] Knowledge base editor
- [ ] Settings page

## Fase 4 — Admin Panel
- [ ] Global admin dashboard
- [ ] Organizations CRUD
- [ ] Agent configuration
- [ ] Templates management

## Fase 5 — AI + Channels
- [ ] WhatsApp integration via Evolution API
- [ ] AI response pipeline (Supabase to agent to response)
- [ ] Voice call channel (Retell/Twilio)
- [ ] Email channel
- [ ] Web chat widget

## Fase 6 — Billing + Polish
- [ ] Stripe integration
- [ ] Billing/subscription pages
- [ ] Legal pages
- [ ] Landing refactor
- [ ] Pricing page
- [ ] Vertical dashboards (DroneX, FitCenter)

## Not planned yet
- n8n automation orchestration
- CRM integrations
- Mobile app
- Multi-language AI agents
