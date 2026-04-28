# Sebas.ai — Project Overview

## What
SaaS multi-tenant: "Empleado IA" for local businesses. WhatsApp-first but multi-channel architecture (voice, email, web chat, forms, manual).

## Who
Initial clients: DroneX Store (drones, Madrid), FitCenter Pro (gym, Sevilla).
Target: small/medium businesses needing AI-powered customer interaction.

## Stack (current)
- **Frontend:** Vite + React 19 + react-router-dom 7 + Tailwind CSS 4
- **Auth (legacy):** Firebase Auth (Google) — migration to Supabase planned
- **DB (legacy):** Firestore — migration to Supabase PostgreSQL planned
- **DB (new):** Supabase PostgreSQL — schema defined, not yet connected
- **Backend:** Express (port 3001) — webhooks, email (Resend), routing engine
- **Pipeline:** orchestrator.ts — clones templates per client
- **Deploy:** Vercel (Vite build)
- **Icons:** lucide-react | **Charts:** recharts | **Animations:** framer-motion
- **i18n:** custom LanguageContext (ES/EN)

## Architecture
```
[Landing/Dashboard SPA]  ->  [Express API :3001]  ->  [Pipeline]
         |                         |                      |
   Supabase (new)            Resend emails         /templates/01-05
   Firebase (legacy)         Lead routing          /clients/<slug>
```

## Channels supported (schema-level)
whatsapp, voice_call, email, web_chat, form, manual

## Key directories
- src/ — React SPA (Landing, Dashboard, firebase, i18n)
- server/ — Express API
- pipeline/ — orchestrator
- templates/ — 5 bot templates
- supabase/ — migrations + seed
- stitch_sebas.ai.../ — 23 Stitch design screens
- infra/ — deploy scripts
