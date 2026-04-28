# AI_HANDOFF_V2 — Continuidad del proyecto Sebas.ai / Colleague-AI

> Documento maestro de continuidad para agentes IA (Sonnet u otros).
> Última actualización: 2026-04-28 (Fase 1.3)
> Autores: Opus (Fase 0 + Fase 1 + Fase 1.1) + Sonnet (Fase 1.2 + 1.3)
> Siguiente agente: Sonnet (Fase 2 en adelante)

---

## 1. Estado actual del proyecto

### Repo
- **Ruta local:** `D:\Documentos\Proyectos\00.- Agencia Agentes\Agencia`
- **Rama objetivo:** `feature/v2-functional-dashboard`
- **Remoto:** https://github.com/ASanchez144/Colleague-AI

> **NOTA DE RAMAS (2026-04-28):**
> El commit principal de Fase 1 (`48af23a feat(supabase): add multi-tenant data foundation`) está en `feature/v2-functional-dashboard`.
> Existe también la rama automática `claude/magical-chaum-90409d` con 1 commit extra (`.claude/settings.local.json` — permisos locales).
> Ese commit extra NO debe mergearse a `feature/v2-functional-dashboard`.
> Trabajar siempre desde `feature/v2-functional-dashboard`.

### Stack real (no lo que dice el PRD)
- **Frontend:** Vite + React 19 + react-router-dom 7 + Tailwind CSS 4
- **Auth actual:** Firebase Auth (Google popup, hardcoded a 1 email)
- **DB actual:** Firestore (solo leads)
- **DB futura:** Supabase PostgreSQL (schema definido, no conectado al dashboard)
- **Backend:** Express en puerto 3001 (webhook leads, email Resend, routing engine)
- **Pipeline:** `orchestrator.ts` (clona templates por cliente)
- **Templates:** 5 bot templates en `/templates/01-05`
- **Deploy:** Vercel (Vite build a `dist/`) — no configurar en este chat
- **Icons:** lucide-react | **Charts:** recharts | **Animations:** framer-motion
- **i18n:** LanguageContext custom (ES/EN)

### Fuente visual de referencia (Stitch)
- **Ruta local:** `D:\Documentos\Proyectos\00.- Agencia Agentes\Agencia\stitch_sebas.ai_tu_empleado_ia_para_whatsapp`
- **Contenido:** 23 carpetas, cada una con `code.html` + `screen.png`
- **PRD:** `arquitectura_y_prd_de_sebas.ai.md` dentro de esa carpeta
- **DESIGN.md:** en subcarpeta `modern_local_ai/`
- **NO usar Canva.** No depender del MCP de Stitch si la carpeta local existe.
- Leer directamente los HTML/PNG como referencia visual. No pegar HTML sin adaptar al stack real.

### Pantallas Stitch disponibles (23)
`landing_page`, `login`, `registration`, `pricing`, `request_a_demo`, `customer_dashboard`, `leads_management`, `appointments`, `conversations`, `knowledge_base`, `settings`, `billing_subscription`, `global_admin_dashboard`, `agent_configuration_admin_panel`, `organizations_list_admin_panel`, `organization_detail_dronex_store`, `templates_management_admin_panel`, `drone_store_dashboard_dronex_store`, `gym_dashboard_fitcenter_pro`, `privacy_policy`, `terms_of_service`, `cookie_policy`, `modern_local_ai` (DESIGN.md only)

### Pantallas implementadas
- `Landing.tsx` (738 líneas, monolito)
- `Dashboard.tsx` (230 líneas, admin-only leads viewer desde Firestore)

---

## 2. Visión del producto

Sebas.ai / Colleague-AI es una plataforma SaaS de "empleado IA" para pequeños negocios.

No es solo chatbot. No es solo WhatsApp. No es solo una landing bonita. No es solo una inbox.

La primera versión será WhatsApp-first. Pero la arquitectura debe ser multi-canal desde el modelo de datos:

- WhatsApp (Evolution API)
- Llamadas de voz (Retell/Twilio)
- Email
- Web chat (widget embebible)
- Formularios web
- Calendario
- CRM
- Automatizaciones internas
- Analítica
- Tareas operativas
- Derivación a humano
- Coordinación entre canales

**Canales definidos en schema:** `whatsapp`, `voice_call`, `email`, `web_chat`, `form`, `manual`

La arquitectura NUNCA debe quedar acoplada a un solo canal.

La idea real del producto: un agente IA capaz de sustituir o asistir a una o varias personas en tareas operativas de pequeños negocios (atención al cliente, ventas, cualificación de leads, agenda de citas, seguimiento comercial, derivación a humano, respuestas frecuentes, coordinación interna, automatización, auditoría, panel de control).

---

## 3. Clientes iniciales

### DroneX Store
- Sector: tienda de drones | Ciudad: Madrid | Slug: `dronex-store`
- Template: `01-whatsapp-agent`
- Necesidades: consultas de productos, presupuestos, reparaciones, disponibilidad, cursos/formación, seguimiento de interesados, derivación a humano cuando haya venta compleja
- Datos seed: 3 conversaciones, 3 leads, 2 citas, 5 knowledge items, 2 integraciones, 2 automations

### FitCenter Pro
- Sector: gimnasio | Ciudad: Sevilla | Slug: `fitcenter-pro`
- Template: `01-whatsapp-agent`
- Necesidades: información de tarifas, altas, visitas, reservas/citas, clases, dudas frecuentes, seguimiento de leads, derivación a humano
- Datos seed: 3 conversaciones, 3 leads, 2 citas, 5 knowledge items, 2 integraciones, 1 automation

> Ambos deben estar como organizaciones en Supabase (`seed.sql`), no hardcodeados en componentes.

---

## 4. Decisiones técnicas tomadas

| ID | Decisión | Razón |
|---|---|---|
| D001 | Mantener Vite + React 19. No migrar a Next.js | Ya funciona, Vercel lo soporta, no SSR needed |
| D002 | Migrar Firebase a Supabase progresivamente | No romper app actual. Firebase queda hasta que Supabase Auth esté listo |
| D003 | Arquitectura multi-canal desde día 1 | `channel_type` enum en todas las tablas, config en JSONB |
| D004 | RLS para multi-tenancy | Aislamiento a nivel DB, no app-level filtering |
| D005 | UUIDs fijos en seed | Reproducibilidad, cross-references, debugging |
| D006 | Firebase config desde env vars | No secretos en repo, build no rompe sin JSON |

**Decisiones NO tomadas (fuera de scope de este chat):**
- No se ha decidido usar Vercel como deploy definitivo
- No se ha configurado Cloudflare
- No se ha tocado infraestructura (servidor/VPS)
- No se ha decidido proveedor de IA definitivo
- No se ha conectado Stripe
- No se ha conectado WhatsApp real

**Glosario:**
- **RLS** = Row Level Security: seguridad por fila en base de datos
- **OAuth** = Open Authorization: login con proveedores como Google
- **CRUD** = Create, Read, Update, Delete

---

## 5. Estado de Fase 1 (completada)

### Archivos creados
| Archivo | Líneas | Qué es |
|---|---|---|
| `supabase/migrations/001_initial_schema.sql` | 522 | 14 tablas, 10 enums, indexes, triggers updated_at, RLS completo |
| `supabase/seed.sql` | 251 | DroneX + FitCenter: auth.users dev, profiles, org_members, orgs, agents, channels, convos, msgs, leads, appointments, KB, integraciones, automations, tasks, audit_logs |
| `src/lib/supabase.ts` | 29 | Cliente Supabase tipado (no conectado a app) |
| `src/types/database.ts` | 361 | Tipos TS para 14 tablas + Database interface |
| `AGENTS.md` | 23 | Guidelines para agentes IA |
| `PROJECT.md` | 39 | Overview del proyecto |
| `REQUIREMENTS.md` | 38 | Requisitos MVP |
| `ROADMAP.md` | 54 | Roadmap por fases |
| `STATE.md` | 39 | Estado actual del sistema |
| `DECISIONS.md` | 31 | Decisiones arquitectónicas |
| `CHANGELOG_AI.md` | 25 | Log de cambios por IA |

### Archivos modificados
| Archivo | Cambio |
|---|---|
| `src/firebase.ts` | JSON import eliminado, lee de `VITE_FIREBASE_*` env vars |
| `.env.example` | Supabase vars + Firebase vars + Gemini + App URL |
| `package.json` | `+@supabase/supabase-js: ^2.49.1` |
| `package-lock.json` | +107 líneas (nuevas deps) |

### Archivos eliminados del repo (secretos)
- `Secrets.txt` ✓
- `firebase-applet-config.json` ✓
- `id_rsa_artur/*` (4 archivos: claves privadas + known_hosts) ✓
- `qr_whatsapp.png` ✓
- `whatsapp-qr.png` ✓

### Archivos NO tocados (intencionalmente)
- `src/App.tsx` — router + auth guard actual
- `src/pages/Landing.tsx` — 738 líneas, monolito funcional
- `src/pages/Dashboard.tsx` — admin-only leads viewer
- `server/*` — Express API completa
- `pipeline/*` — orchestrator
- `templates/*` — 5 bot templates
- `infra/*` — deploy scripts
- `src/main.tsx` — entry point
- `src/index.css` — estilos globales

### Modelo de datos (14 tablas)
`organizations`, `profiles`, `organization_members`, `agents`, `channels`, `conversations`, `messages`, `leads`, `appointments`, `knowledge_items`, `integrations`, `automations`, `tasks`, `audit_logs`

### RLS implementado
- `user_org_ids()` — devuelve org IDs del usuario autenticado
- `user_is_org_admin(org_id)` — verifica admin/owner
- SELECT: miembros de org | INSERT/UPDATE/DELETE: admin/owner de org

---

## 6. Estado de verificación — Fase 1.2 (completada 2026-04-28)

| Check | Resultado |
|---|---|
| `npm install` | OK — 340 paquetes, 1 vuln moderada |
| `npm run build` (Vite) | **PASS** — 13.76s, sin errores |
| `tsc --noEmit` (lint) | **FAIL** — 33 errores (no bloquea Vite build) |
| package-lock.json | Actualizado correctamente |
| Secretos en árbol del repo | Eliminados ✓ |

### Errores TypeScript conocidos (`tsc --noEmit` falla — no bloquea build)

| Categoría | Archivos | Detalle |
|---|---|---|
| Módulos server-only no en package raíz | `server/index.ts`, `infra/mcp-server/index.ts` | `cors`, `uuid`, `nodemailer`, `resend`, `winston`, `@mcp/sdk` no instalados en el package.json del frontend |
| `import.meta.env` sin types | `src/firebase.ts`, `src/lib/supabase.ts`, `src/pages/Landing.tsx` | Falta `vite/client` en tsconfig `types` |
| Props `key` en JSX | `src/pages/Landing.tsx:434,446,562,640` | `key` va en JSX, no en tipo del componente |
| Templates (02, 03) | `templates/02-voice-agent/`, `templates/03-text-processor/` | `export type` requerido con `isolatedModules` |

Limpiar en fase posterior. Vite build pasa — no bloquear Fase 2 por esto.

### Warnings conocidos
- Bundle JS ~1.2 MB — no bloqueante, optimizar con code splitting más adelante
- 1 vulnerabilidad moderada npm (`node-domexception` deprecated) — `npm audit fix` cuando sea conveniente

---

## 7. Riesgos actuales

1. **Si secretos estuvieron en GitHub, deben considerarse comprometidos y rotarse.** Firebase API keys, SSH keys, cualquier token que haya estado commiteado.
2. **Firebase necesita `.env.local`** con `VITE_FIREBASE_*` vars para funcionar en local. Crear desde los valores que tenía `firebase-applet-config.json`.
3. **`seed.sql` con `auth.users` fake** — solo funciona en Supabase local (`supabase start`) o con `service_role`. En instancia remota, crear usuarios por Supabase Auth UI.
4. **No hacer migración completa Firebase → Supabase de golpe.** Progresiva.
5. **No conectar dashboard a Supabase hasta Fase 4.**
6. **Landing.tsx = 738 líneas monolito** — refactor en fase futura.
7. **Dashboard hardcoded a un solo email** — será reemplazado por auth Supabase.

---

## 8. Qué NO debe tocar el siguiente agente todavía

- Auth/OAuth / Google OAuth
- Dashboard conectado a Supabase
- WhatsApp real
- Llamadas reales
- Stripe / billing
- IA real (OpenAI/Anthropic/Gemini en conversaciones)
- Server/VPS/Cloudflare / infraestructura / deploy
- `main` (rama git)
- Vercel (configuración)
- Migración completa Firebase → Supabase
- Reescritura total de la app
- Canva
- Push sin permiso
- shadcn/ui (no instalar todavía)

---

## 9. Fases futuras

| Fase | Nombre | Scope |
|---|---|---|
| **1.3** | Cerrar ramas + handoff ← **ACTUAL** | Crear este archivo, confirmar rama, preparar continuidad |
| 2 | Auth + Google OAuth | Supabase Auth, mantener Firebase en paralelo |
| 3 | Multi-tenant + roles | Organization selector, role-based access |
| 4 | Dashboard conectado | Dashboard.tsx lee de Supabase |
| 5 | Leads CRUD | Crear, editar, filtrar, scoring desde Supabase |
| 6 | Conversations + Messages | Vista conversaciones, historial mensajes |
| 7 | Appointments | Gestión de citas |
| 8 | Knowledge Base | Editor FAQ/productos por org |
| 9 | Agent Config | Configuración IA por org (prompt, tono, modelo) |
| 10 | Channel Adapters | WhatsApp-first, preparado para `voice_call`, `email`, `web_chat`, `form`, `manual` |
| 11 | Admin Interno | Panel global, gestión orgs, templates |
| 12 | Billing / Stripe | Suscripciones, facturación |
| **Infra** | Dominio + VPS + Cloudflare | **Otro chat — no tocar aquí** |

Cada fase debe:
- No romper lo anterior
- Pasar `npm run build`
- Actualizar `STATE.md` y `CHANGELOG_AI.md`
- Detenerse al completar
- No avanzar sin aprobación

---

## 10. Prompt corto para el siguiente agente

Lee este archivo antes de actuar.

Ejecuta **solo** la fase indicada por el usuario.

**Reglas:**
- Lee `docs/AI_HANDOFF_V2.md`, `AGENTS.md`, `PROJECT.md`, `DECISIONS.md`, `STATE.md` antes de empezar.
- No avances a la siguiente fase sin aprobación.
- No toques archivos fuera del scope de la fase.
- No hagas push.
- No uses Canva.
- No toques `main`.
- No metas secretos.
- No finjas integraciones reales.

**Al terminar cada fase reporta:**
- Archivos creados/modificados
- Resultado de `npm run build`
- Resultado de `npm run lint`
- `git diff --stat`
- Riesgos detectados
- Commit recomendado
- Detente.

**Si estás en Fase 2:**
- No empieces hasta que Fase 1.3 esté cerrada y aprobada.
- Rama base: `feature/v2-functional-dashboard`.
- Implementa Auth con Supabase. Mantén Firebase. No romper lo que funciona.

**Stack:** Vite + React 19 + React Router 7 + Tailwind CSS 4 + TypeScript + Supabase (futuro) + Firebase (temporal).

**Fuente visual:** `D:\Documentos\Proyectos\00.- Agencia Agentes\Agencia\stitch_sebas.ai_tu_empleado_ia_para_whatsapp` — usar `code.html` + `screen.png` por pantalla. No pegar HTML sin adaptar al stack real.

---

## Archivos de referencia clave

| Archivo | Para qué |
|---|---|
| `docs/AI_HANDOFF_V2.md` | Este documento — contexto completo |
| `AGENTS.md` | Reglas para agentes IA |
| `PROJECT.md` | Stack y arquitectura |
| `DECISIONS.md` | Decisiones tomadas y por qué |
| `ROADMAP.md` | Fases futuras |
| `STATE.md` | Estado actual del sistema |
| `REQUIREMENTS.md` | Requisitos MVP |
| `CHANGELOG_AI.md` | Historial de cambios por IA |
| `supabase/migrations/001_initial_schema.sql` | Schema completo |
| `supabase/seed.sql` | Datos mock |
| `src/types/database.ts` | Tipos TypeScript |
| `.env.example` | Variables de entorno necesarias |
| `stitch_.../arquitectura_y_prd_de_sebas.ai.md` | PRD original de Stitch |
