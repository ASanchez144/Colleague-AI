# AI_HANDOFF_V2 — Continuidad del proyecto Sebas.ai / Colleague-AI

> Documento maestro de continuidad para agentes IA (Sonnet u otros).
> Última actualización: 2026-04-30 (Fase 5)
> Autores: Opus (Fase 0 + Fase 1 + Fase 1.1) + Sonnet (Fase 1.2 + 1.3 + Fase 2 + Fase 3 + Fase 4 + Fase 5)
> Siguiente agente: Sonnet (Fase 6 en adelante)

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
- **Auth:** Supabase Auth (Google OAuth, wired en AuthContext) ← Fase 2
- **Auth legacy:** Firebase (src/firebase.ts kept, no longer drives routing) ← removido de App.tsx en Fase 4
- **DB dashboard:** Supabase PostgreSQL — leads, conversations, appointments, agents, knowledge_items, integrations ← Fase 4
- **DB legacy:** Firestore (desconectado de Dashboard en Fase 4, src/firebase.ts kept)
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
- `Dashboard.tsx` (reescrito Fase 4 — Supabase, multi-tenant, currentOrganization, read-only + link to /leads)
- `Leads.tsx` (Fase 5 — CRUD completo: list, create, edit, filter, status change, notes)
- `Login.tsx` (Fase 2 — Supabase Google OAuth)
- `Register.tsx` (Fase 2 — Supabase Google OAuth)

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
| D007 | Firebase guard sigue en /dashboardroot hasta Fase 4 | Dashboard.tsx depende de Firebase User prop + Firestore |
| D008 | Google OAuth only en Fase 2 (sin email/password) | OAuth primero, evitar flujo email verification complejo |

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

---

## 6. Estado de Fase 2 (completada 2026-04-29)

### Archivos creados
| Archivo | Qué es |
|---|---|
| `src/vite-env.d.ts` | Triple-slash ref a `vite/client` — fix import.meta.env TS errors |
| `src/contexts/AuthContext.tsx` | Supabase Auth provider: user, session, loading, signInWithGoogle, signOut, refreshSession |
| `src/pages/Login.tsx` | Login page — Google OAuth via Supabase — diseño Stitch-inspired |
| `src/pages/Register.tsx` | Register page — Google OAuth via Supabase — diseño Stitch-inspired |
| `src/components/ProtectedRoute.tsx` | Guard: no Supabase session → redirect /login |

### Archivos modificados
| Archivo | Cambio |
|---|---|
| `src/App.tsx` | +AuthProvider wrapper, +/login, +/register routes; Firebase guard en /dashboardroot sin cambios |
| `STATE.md` | Actualizado a Fase 2 |
| `DECISIONS.md` | +D007, +D008 |
| `CHANGELOG_AI.md` | +Fase 2 entry |
| `docs/AI_HANDOFF_V2.md` | Este documento |

### Rutas disponibles post-Fase 2
| Ruta | Componente | Guard |
|---|---|---|
| `/` | Landing | ninguno |
| `/login` | Login | ninguno (redirige a /app tras OAuth) |
| `/register` | Register | ninguno (redirige a /app tras OAuth) |
| `/dashboardroot` | Dashboard | Firebase email === arturoeldeteruel@gmail.com |

### Estado de build (Fase 2)
- `npm run build`: PASS (pendiente confirmar post-escritura)
- `tsc --noEmit`: ~33 errores pre-existentes (no bloquean build)
- vite-env.d.ts resuelve la categoría import.meta.env

---

## 7b. Estado de Fase 3 (completada 2026-04-29)

### Archivos creados
| Archivo | Qué es |
|---|---|
| `src/types/organization.ts` | Tipo OrganizationWithMembership — par org + membership |
| `src/contexts/OrganizationContext.tsx` | OrganizationProvider + useOrganization hook — multi-tenant base |
| `src/components/OrganizationSwitcher.tsx` | Dropdown selector de org con rol badge |
| `src/components/RequireOrganization.tsx` | Guard: loading/error/sin-org antes de renderizar children |
| `src/pages/OrganizationDebug.tsx` | DEV ONLY — /org-debug — valida OrganizationContext |

### Archivos modificados
| Archivo | Cambio |
|---|---|
| `src/App.tsx` | +OrganizationProvider, +/org-debug route (ProtectedRoute guarded) |
| `STATE.md` | Actualizado a Fase 3 |
| `DECISIONS.md` | +D009, +D010, +D011 |
| `CHANGELOG_AI.md` | +Fase 3 entry |
| `docs/AI_HANDOFF_V2.md` | Este documento |

### Rutas disponibles post-Fase 3
| Ruta | Componente | Guard |
|---|---|---|
| `/` | Landing | ninguno |
| `/login` | Login | ninguno |
| `/register` | Register | ninguno |
| `/org-debug` | OrganizationDebug | ProtectedRoute (DEV ONLY) |
| `/dashboardroot` | Dashboard | Firebase email guard (legacy) |

### OrganizationContext — API pública
```typescript
const {
  organizations,            // OrganizationWithMembership[]
  currentOrganization,      // Organization | null
  currentMembership,        // OrganizationMember | null
  currentRole,              // OrgRole | null ('owner'|'admin'|'member'|'viewer')
  loading,                  // boolean
  error,                    // string | null
  setCurrentOrganizationId, // (id: string) => void
  refreshOrganizations,     // () => Promise<void>
  isOwner,                  // boolean
  isAdmin,                  // boolean (true for owner + admin)
  isMember,                 // boolean (true if any role)
} = useOrganization();
```

### Provider tree (Fase 3)
```
AuthProvider
  OrganizationProvider
    LanguageProvider
      BrowserRouter
```

### Notas importantes
- OrganizationContext depende de `user` de AuthContext — re-fetches cuando cambia el usuario
- Org activa persiste en `localStorage` key `sebas_current_org_id`
- Auto-selecciona primera org si stored key no existe en membership list
- OrganizationSwitcher y RequireOrganization creados pero NO colocados en dashboard todavía — Fase 4
- /org-debug es temporal — eliminar o feature-flag antes de producción
- Dashboard sigue en Firestore — no tocado

---

## 7c. Estado de Fase 4 (completada 2026-04-29)

### Archivos creados
| Archivo | Qué es |
|---|---|
| `src/lib/dashboardQueries.ts` | fetchDashboardData(organizationId) — 6 parallel Supabase queries, returns DashboardData |

### Archivos modificados
| Archivo | Cambio |
|---|---|
| `src/pages/Dashboard.tsx` | Reescrito: no Firebase, no User prop. Lee Supabase via currentOrganization. OrganizationSwitcher en header. Stats + leads table + sidebar (integrations/knowledge/agents). Loading/error/empty states. Read-only. |
| `src/App.tsx` | Firebase onAuthStateChanged removed. /dashboardroot: ProtectedRoute > RequireOrganization > Dashboard. /app route added. |
| `STATE.md` | Actualizado a Fase 4 |
| `DECISIONS.md` | +D012, +D013 |
| `CHANGELOG_AI.md` | +Fase 4 entry |
| `docs/AI_HANDOFF_V2.md` | Este documento |

### Rutas disponibles post-Fase 4
| Ruta | Componente | Guard |
|---|---|---|
| `/` | Landing | ninguno |
| `/login` | Login | ninguno |
| `/register` | Register | ninguno |
| `/app` | Dashboard | ProtectedRoute + RequireOrganization |
| `/dashboardroot` | Dashboard | ProtectedRoute + RequireOrganization |
| `/org-debug` | OrganizationDebug | ProtectedRoute (DEV ONLY) |

### Dashboard — datos desde Supabase
- `leads` — filtrado por organization_id, orden desc created_at, limit 20
- `conversations` — filtrado por organization_id, orden desc last_message_at, limit 10
- `appointments` — filtrado por organization_id, orden asc start_time, limit 10
- `agents` — todos por organization_id
- `knowledge_items` — count solo (head:true), filtrado por organization_id
- `integrations` — todos por organization_id

### Notas importantes
- src/firebase.ts NO eliminado — kept per D002 (progresiva)
- Firebase no importado en App.tsx ni Dashboard.tsx (Fase 4)
- Dashboard es 100% read-only en Fase 4 — CRUD llega en Fase 5
- /org-debug temporal — eliminar antes de producción

---

## 7d. Estado de Fase 5 (completada 2026-04-30)

### Archivos creados
| Archivo | Qué es |
|---|---|
| `src/lib/leadsQueries.ts` | fetchLeads, fetchLeadById, createLead, updateLead, updateLeadStatus — todas con organization_id filter |
| `src/pages/Leads.tsx` | CRUD completo: lista con filtro por estado, modal crear lead, panel detalle/editar, quick status change |

### Archivos modificados
| Archivo | Cambio |
|---|---|
| `src/App.tsx` | +import Leads, +/leads route (ProtectedRoute + RequireOrganization) |
| `src/pages/Dashboard.tsx` | +Link import, +"Ver todos →" enlace a /leads en header de tabla leads |
| `src/index.css` | +.input-field utility class para inputs oscuros |
| `STATE.md` | Actualizado a Fase 5 |
| `DECISIONS.md` | +D014, +D015 |
| `CHANGELOG_AI.md` | +Fase 5 entry |
| `docs/AI_HANDOFF_V2.md` | Este documento |

### Rutas disponibles post-Fase 5
| Ruta | Componente | Guard |
|---|---|---|
| `/` | Landing | ninguno |
| `/login` | Login | ninguno |
| `/register` | Register | ninguno |
| `/app` | Dashboard | ProtectedRoute + RequireOrganization |
| `/dashboardroot` | Dashboard | ProtectedRoute + RequireOrganization |
| `/leads` | Leads | ProtectedRoute + RequireOrganization ← Fase 5 |
| `/org-debug` | OrganizationDebug | ProtectedRoute (DEV ONLY) |

### Leads CRUD — funcionalidad implementada
- **fetchLeads**: lista todos los leads de la org activa, orden desc created_at, filtro por status opcional
- **createLead**: insert con organization_id, status default 'new', channel_type default 'manual'
- **updateLead**: update con doble guard `.eq('id').eq('organization_id')`, retorna fila actualizada
- **updateLeadStatus**: wrapper de updateLead para cambio rápido de estado
- **UI**: filtro por estado (tabs con contadores), tabla con inline status dropdown, panel lateral detalle/edición completo, modal creación

### Multi-tenancy garantizada
- Todas las queries pasan `organizationId` leído de `useOrganization().currentOrganization.id`
- createLead: `organization_id = currentOrganization.id` hardcoded en insert
- updateLead/updateLeadStatus: `.eq('organization_id', organizationId)` en WHERE
- Anon key solamente — sin service_role en frontend

### Notas importantes
- Dashboard.tsx tiene "Ver todos →" que navega a /leads
- No hay delete de leads en Fase 5 (pospuesto por seguridad)
- /leads usa `useOrganization()` + `RequireOrganization` — cambia automáticamente si el usuario cambia de org en el switcher
- Conversations CRUD sigue pendiente (Fase 6)
- Appointments CRUD pendiente (Fase 7)

---

## 7. Estado de verificación — Fase 1.2 (completada 2026-04-28)

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
| `import.meta.env` sin types | `src/firebase.ts`, `src/lib/supabase.ts`, `src/pages/Landing.tsx` | **RESUELTO en Fase 2** con `src/vite-env.d.ts` |
| Props `key` en JSX | `src/pages/Landing.tsx:434,446,562,640` | `key` va en JSX, no en tipo del componente |
| Templates (02, 03) | `templates/02-voice-agent/`, `templates/03-text-processor/` | `export type` requerido con `isolatedModules` |

Limpiar en fase posterior. Vite build pasa — no bloquear Fase 3 por esto.

---

## 8. Riesgos actuales

1. **Si secretos estuvieron en GitHub, deben considerarse comprometidos y rotarse.** Firebase API keys, SSH keys, cualquier token que haya estado commiteado.
2. **Firebase necesita `.env.local`** con `VITE_FIREBASE_*` vars para funcionar en local.
3. **Supabase necesita `.env.local`** con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. **Google OAuth requiere configuración en Supabase Dashboard:** Authentication → Providers → Google → habilitar + pegar Client ID + Secret de Google Cloud Console.
5. **OAuth redirect URL** debe estar en lista blanca de Supabase y en Google Cloud Console: `https://[proyecto].supabase.co/auth/v1/callback` + URL de producción.
6. **`seed.sql` con `auth.users` fake** — solo funciona en Supabase local (`supabase start`) o con `service_role`. En instancia remota, crear usuarios por Supabase Auth UI.
7. **No hacer migración completa Firebase → Supabase de golpe.** Progresiva.
8. **No conectar dashboard a Supabase hasta Fase 4.**
9. **Landing.tsx = 738 líneas monolito** — refactor en fase futura.
10. **Dashboard hardcoded a un solo email** — será reemplazado por auth Supabase en Fase 4.

---

## 9. Cómo configurar Google OAuth en Supabase (resumen operativo)

1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Crear proyecto o usar existente → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID → Web application
4. Authorized redirect URIs: `https://[tu-proyecto].supabase.co/auth/v1/callback`
5. Copiar Client ID + Client Secret
6. En Supabase Dashboard → Authentication → Providers → Google
7. Habilitar → pegar Client ID + Client Secret → Save
8. En Supabase Dashboard → Authentication → URL Configuration
9. Site URL: URL de producción (ej: `https://sebas.ai`) o `http://localhost:5173` para dev
10. Redirect URLs: añadir `http://localhost:5173/app` y la URL de producción
11. En `.env.local`: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` desde Project Settings → API

---

## 10. Qué NO debe tocar el siguiente agente todavía

- Dashboard conectado a Supabase (Fase 4)
- ProtectedRoute aplicado a /dashboardroot (Fase 4)
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

## 11. Fases futuras

| Fase | Nombre | Scope |
|---|---|---|
| **2** | Auth + Google OAuth ← **COMPLETADA** | Supabase Auth, AuthContext, Login, Register, ProtectedRoute |
| **3** | Multi-tenant + roles ← **COMPLETADA** | OrganizationContext, OrganizationSwitcher, RequireOrganization, /org-debug |
| **4** | Dashboard conectado ← **COMPLETADA** | /dashboardroot + /app → ProtectedRoute + RequireOrganization + Supabase; Dashboard reads currentOrganization |
| **5** | Leads CRUD ← **COMPLETADA** | /leads — listar, crear, editar, filtrar por estado, scoring, notas, multi-tenant |
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

## 12. Prompt corto para el siguiente agente

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

**Si estás en Fase 4:**
- Rama base: `feature/v2-functional-dashboard`.
- OrganizationContext ya existe en `src/contexts/OrganizationContext.tsx`.
- useOrganization() expone currentOrganization — úsalo para filtrar datos por org_id.
- RequireOrganization ya existe en `src/components/RequireOrganization.tsx` — úsalo para guardar rutas privadas.
- OrganizationSwitcher ya existe en `src/components/OrganizationSwitcher.tsx` — integrarlo en nav del dashboard.
- /org-debug es temporal — eliminarlo en Fase 4 o tras validación.
- Migrar /dashboardroot: reemplazar Firebase guard por ProtectedRoute + RequireOrganization.
- Dashboard.tsx debe leer datos de Supabase usando currentOrganization.id, no Firestore.
- No borres Firebase hasta que Dashboard.tsx esté completamente migrado.

**Stack:** Vite + React 19 + React Router 7 + Tailwind CSS 4 + TypeScript + Supabase Auth (Fase 2+) + Firebase (legacy, /dashboardroot solamente).

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
| `src/lib/supabase.ts` | Cliente Supabase |
| `src/contexts/AuthContext.tsx` | Auth provider Supabase |
| `src/components/ProtectedRoute.tsx` | Guard de rutas |
| `.env.example` | Variables de entorno necesarias |
| `stitch_.../arquitectura_y_prd_de_sebas.ai.md` | PRD original de Stitch |
