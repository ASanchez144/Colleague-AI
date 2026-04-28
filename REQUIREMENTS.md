# Requirements — Sebas.ai MVP

## Core requirements
1. Multi-tenant SaaS — each organization isolated via RLS
2. WhatsApp-first but multi-channel (voice, email, web chat, forms, manual)
3. AI agent per organization with configurable prompt, tone, model
4. Lead capture + scoring from any channel
5. Appointment management
6. Knowledge base (FAQs) per organization
7. Conversation history with full message log
8. Dashboard per client organization
9. Global admin panel for platform management

## Screens (from Stitch designs — 23 total)

### Public
- Landing page, Login, Registration, Pricing, Request a demo
- Privacy policy, Terms of service, Cookie policy

### Client dashboard
- Customer dashboard (overview), Conversations, Leads management
- Appointments, Knowledge base, Settings, Billing/Subscription

### Admin panel
- Global admin dashboard, Organizations list, Organization detail
- Agent configuration, Templates management

### Vertical-specific
- DroneX Store dashboard, FitCenter Pro dashboard

## Data model
14 tables defined in supabase/migrations/001_initial_schema.sql:
organizations, profiles, organization_members, agents, channels, conversations, messages, leads, appointments, knowledge_items, integrations, automations, tasks, audit_logs

## Security
- Row Level Security (RLS) on all tenant tables
- org-scoped read for members, write for admin/owner
- No secrets in repo
