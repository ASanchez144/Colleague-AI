# Sebas.ai - Especificaciones Técnicas y Arquitectura (MVP)

## 1. Visión del Producto
Sebas.ai es un SaaS multi-tenant que proporciona un "Empleado IA" especializado para negocios locales (inicialmente tiendas de drones y gimnasios), integrado con WhatsApp. El enfoque es la simplicidad operativa y la captura de valor inmediata (leads, citas, FAQs).

## 2. Arquitectura del Sistema
- **Frontend:** Next.js 14+ (App Router), Tailwind CSS, Lucide Icons, Shadcn/UI.
- **Backend/BaaS:** Supabase (Auth, PostgreSQL, RLS, Storage).
- **IA:** Capa abstracta preparada para OpenAI (GPT-4o), Anthropic (Claude 3.5 Sonnet) y Google Gemini.
- **Automatización:** n8n como orquestador de flujos externos (WhatsApp -> AI -> Dashboard).
- **Pagos:** Stripe (Suscripciones Starter, Professional, Custom).

## 3. Modelo de Datos (PostgreSQL / Supabase)
- **`organizations`**: El corazón del multi-tenancy.
- **`users`**: Con roles `admin` y `client_user`.
- **`agents`**: Configuración específica por organización (prompt base, tono).
- **`conversations` & `messages`**: Historial completo de interacciones.
- **`leads` & `appointments`**: Datos estructurados extraídos por la IA.
- **`knowledge_items`**: Base de conocimiento (FAQs) para alimentar a la IA.

## 4. Estrategia Multi-tenant
- **Aislamiento:** Implementación estricta de **Row Level Security (RLS)** en Supabase.
- **Personalización:** Uso de plantillas (`drone_store`, `gym`) para pre-configurar prompts y campos de leads.

## 5. Hoja de Ruta de Implementación
1. **Fase 1 (Cimientos):** Landing Page, Sistema de Diseño, Auth.
2. **Fase 2 (Cliente):** Dashboard general, Gestión de Conversaciones y Leads.
3. **Fase 3 (Admin):** Panel de control global, gestión de organizaciones y plantillas.
4. **Fase 4 (IA & WhatsApp):** Simulación de flujo de mensajes (Mocked para MVP) y conexión conceptual con n8n.

## 6. Variables de Entorno
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=...
OPENAI_API_KEY=...
N8N_WEBHOOK_URL=...
```