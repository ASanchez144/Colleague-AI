# Brief estratégico para Claude: empresa lucrativa y automatizada con agentes IA

Fecha: 2026-04-27  
Repositorio: `ASanchez144/Colleague-AI`  
Objetivo: convertir este proyecto en una empresa rentable, operativa y automatizada, empezando con pocos clientes reales y sin sobreingeniería.

---

## 1. Resumen ejecutivo

Queremos construir una empresa que venda “empleados IA” para pequeños negocios. El canal principal será WhatsApp Business API oficial de Meta, no soluciones frágiles tipo WhatsApp Web/Baileys, porque el objetivo es cobrar a clientes reales y no depender de hacks que puedan romperse.

La propuesta comercial inicial es simple:

> “Te ponemos un empleado IA en WhatsApp que responde clientes, registra leads, agenda citas, consulta información del negocio y avisa a una persona humana cuando hace falta.”

No queremos vender una app compleja desde el día uno. Queremos vender resultado: menos mensajes sin responder, más reservas, más leads ordenados, menos caos operativo.

Primeros verticales previstos:

1. Gimnasio.
2. Tienda de drones.
3. Otros pequeños negocios con WhatsApp como canal principal: clínicas, talleres, academias, peluquerías, inmobiliarias, reformas, bares/restaurantes.

La empresa debe nacer como servicio productizado, no como SaaS puro desde el primer día. Primero se cobra por implementación + mensualidad. Luego se empaqueta como SaaS cuando sepamos qué se repite.

---

## 2. La cruda realidad

Esto no debe convertirse todavía en una plataforma enorme. El error sería construir durante meses un dashboard perfecto sin tener clientes pagando.

La ruta correcta:

1. Crear una base técnica fiable.
2. Onboardear 2 clientes reales.
3. Medir conversaciones, leads y reservas.
4. Cobrar mensualidad.
5. Automatizar solo lo que duela de verdad.
6. Convertir lo repetido en producto.

Lo importante ahora no es tener la arquitectura más bonita. Lo importante es que el negocio funcione con clientes reales sin que nosotros tengamos que estar apagando fuegos todos los días.

---

## 3. Producto inicial

### 3.1 Funciones mínimas del agente

El agente debe poder:

- Responder preguntas frecuentes del negocio.
- Capturar nombre, teléfono, necesidad/interés y urgencia.
- Registrar leads en base de datos.
- Crear o sugerir citas.
- Derivar a humano si detecta enfado, intención compleja, pago, reclamación o duda legal/sensible.
- Consultar una base de conocimiento del negocio.
- Mantener tono coherente con cada cliente.
- Registrar cada conversación para auditoría.

### 3.2 Panel mínimo

El panel privado debe mostrar:

- Conversaciones recientes.
- Leads capturados.
- Estado de cada lead: nuevo, contactado, reservado, perdido.
- Resumen de actividad.
- Configuración básica del negocio.
- Base de conocimiento editable.
- Botón para pausar/resumir agente.
- Bandeja de conversaciones que requieren humano.

### 3.3 Web pública

La web pública debe vender confianza, no humo.

Secciones mínimas:

- Hero: “Tu empleado IA para WhatsApp.”
- Problema: clientes sin responder, caos en reservas, oportunidades perdidas.
- Solución: agente IA entrenado con tu negocio.
- Casos de uso por vertical.
- Cómo funciona: conectar WhatsApp, cargar info, probar, activar.
- Precios orientativos.
- Demo/contacto.
- FAQ: preguntas frecuentes.

---

## 4. Modelo de negocio recomendado

### 4.1 No empezar como SaaS barato

No tiene sentido venderlo a 19 €/mes al principio. Requiere onboarding, ajuste, soporte y confianza.

Modelo inicial recomendado:

- Setup inicial: 300 € – 1.500 € según complejidad.
- Mensualidad: 99 € – 499 €/mes.
- Extra por volumen si hay muchas conversaciones.
- Posible comisión por lead/cita en sectores concretos.

### 4.2 Paquetes

#### Starter — 99 €/mes

Para negocios pequeños.

Incluye:

- WhatsApp IA básico.
- FAQ.
- Captura de leads.
- Resumen semanal.
- Soporte limitado.

Setup recomendado: 300 € – 500 €.

#### Pro — 249 €/mes

Para negocios con más volumen.

Incluye:

- Todo Starter.
- Agenda/citas.
- Integración con Google Calendar o similar.
- Panel de leads.
- Derivación a humano.
- Revisión mensual.

Setup recomendado: 700 € – 1.000 €.

#### Business — 499 €/mes+

Para negocios con procesos más serios.

Incluye:

- Todo Pro.
- Integraciones con CRM, hojas de cálculo, correo, calendario, sistemas internos.
- Automatizaciones específicas.
- Métricas avanzadas.
- Soporte prioritario.

Setup recomendado: 1.500 €+.

---

## 5. Arquitectura técnica propuesta

### 5.1 Principio clave

La arquitectura debe ser modular, multi-tenant y sencilla de operar. Multi-tenant significa que una misma aplicación soporta varios clientes separados de forma segura.

### 5.2 Stack recomendado

Frontend:

- Next.js o React.
- Tailwind CSS para diseño rápido y consistente.
- Panel privado separado de web pública.

Backend:

- Node.js/TypeScript o Python/FastAPI.
- API REST o tRPC según stack elegido.
- Webhooks para Meta WhatsApp Cloud API.

Base de datos:

- Supabase/PostgreSQL.
- Tablas separadas por cliente mediante `tenant_id`.

Automatización:

- n8n o Make.com al principio para integraciones rápidas.
- Migrar a código propio solo cuando el flujo esté validado.

IA:

- Modelo barato por defecto para conversación normal.
- Escalado a modelos superiores solo para tareas complejas.
- RAG para base de conocimiento. RAG significa Retrieval-Augmented Generation: recuperar información relevante antes de generar la respuesta.

Infraestructura:

- Vercel para frontend.
- Railway/Fly.io/Render/Supabase Edge Functions/Cloudflare Workers según simplicidad real.
- Cloudflare para DNS, dominio, protección y workers ligeros.

Canal:

- WhatsApp Business API oficial de Meta.
- Evitar Baileys/WhatsApp Web para producción.

---

## 6. Diseño de datos mínimo

Tablas recomendadas:

### tenants

Clientes/empresas.

Campos:

- id
- name
- vertical
- whatsapp_phone_id
- whatsapp_business_account_id
- status
- plan
- created_at

### users

Usuarios del panel.

Campos:

- id
- tenant_id
- email
- role: admin, owner, operator
- created_at

### conversations

Conversaciones de WhatsApp.

Campos:

- id
- tenant_id
- contact_phone
- contact_name
- status
- assigned_to
- last_message_at
- requires_human
- created_at

### messages

Mensajes entrantes y salientes.

Campos:

- id
- tenant_id
- conversation_id
- direction: inbound/outbound
- channel: whatsapp
- body
- metadata
- created_at

### leads

Leads capturados.

Campos:

- id
- tenant_id
- conversation_id
- name
- phone
- email
- interest
- urgency
- status
- notes
- created_at

### knowledge_items

Base de conocimiento de cada negocio.

Campos:

- id
- tenant_id
- title
- content
- category
- active
- created_at

### appointments

Citas/reservas.

Campos:

- id
- tenant_id
- lead_id
- start_time
- end_time
- status
- external_calendar_id
- created_at

### agent_events

Trazabilidad interna.

Campos:

- id
- tenant_id
- conversation_id
- event_type
- payload
- created_at

---

## 7. Flujo de WhatsApp recomendado

1. Cliente escribe por WhatsApp.
2. Meta envía webhook al backend.
3. Backend valida firma/token.
4. Se identifica `tenant_id` por `phone_number_id`.
5. Se guarda mensaje entrante.
6. Se carga contexto del negocio.
7. Se recupera conocimiento relevante.
8. Se decide:
   - responder automáticamente,
   - pedir dato faltante,
   - crear lead,
   - proponer cita,
   - derivar a humano.
9. Se envía respuesta por WhatsApp Cloud API.
10. Se guarda salida y evento.

---

## 8. Onboarding de clientes

### 8.1 Datos que hay que pedir a cada cliente

Formulario inicial:

- Nombre del negocio.
- Sector.
- Horario.
- Dirección.
- Servicios/productos.
- Precios si aplica.
- Preguntas frecuentes.
- Tono de comunicación.
- Cuándo debe derivar a humano.
- Quién recibe avisos.
- Calendario si hay citas.
- Promociones actuales.
- Políticas: cancelaciones, devoluciones, condiciones.

### 8.2 Método rápido para los 2 primeros clientes

No hace falta un onboarding perfecto.

Para los primeros clientes:

1. Reunión de 30-45 minutos.
2. Documento con preguntas clave.
3. Carga manual de conocimiento.
4. Prueba con 20 preguntas reales.
5. Activación controlada.
6. Revisión diaria durante la primera semana.

---

## 9. Diferenciación frente a Spoki, Manychat, WATI y similares

No competir solo en “tenemos WhatsApp automatizado”. Eso ya existe.

Diferenciación real:

- Servicio hecho para negocios pequeños españoles.
- Configuración rápida y humana.
- Agente más flexible que un chatbot de botones.
- Panel simple, no monstruoso.
- Automatizaciones conectadas con herramientas reales del negocio.
- Informes claros: leads, citas, oportunidades perdidas.
- Enfoque en cobrar por resultado y tranquilidad.

Posicionamiento:

> “No te damos una herramienta para que tú trabajes más. Te damos un empleado IA configurado para tu negocio.”

---

## 10. Roadmap recomendado

### Fase 0 — Decisión técnica

- Confirmar stack.
- Confirmar repo principal.
- Confirmar dominio/naming.
- Definir estructura de carpetas.
- Dejar `.env.example` claro.

### Fase 1 — MVP funcional

MVP significa Minimum Viable Product: producto mínimo viable.

Objetivo: una conversación real de WhatsApp que responda con conocimiento del negocio y registre leads.

Entregables:

- Webhook de WhatsApp.
- Envío de mensajes.
- Multi-tenant básico.
- Tabla de conversaciones.
- Tabla de leads.
- Panel simple.
- Base de conocimiento manual.

### Fase 2 — Primer cliente real

Objetivo: gimnasio.

Funciones:

- FAQ.
- Horarios.
- Tarifas.
- Captura de interesados.
- Aviso a humano.
- Resumen diario/semanal.

### Fase 3 — Segundo cliente real

Objetivo: tienda de drones.

Funciones:

- Preguntas sobre productos.
- Captura de leads.
- Derivación a humano en compras complejas.
- Posible integración con catálogo.

### Fase 4 — Automatización comercial

- Landing para captar demos.
- CRM simple.
- Secuencia de emails.
- Plantillas de onboarding.
- Contrato básico.
- Sistema de facturación.

### Fase 5 — Producto escalable

- Autoservicio parcial.
- Marketplace de plantillas por sector.
- Métricas avanzadas.
- Integraciones repetibles.
- Panel de administración interno.

---

## 11. Riesgos principales

### Riesgo 1: Meta/WhatsApp

La API oficial requiere configuración correcta, verificación y cumplimiento de políticas. No hay que subestimarlo.

Mitigación:

- Empezar con números de prueba.
- Documentar cada paso.
- Usar plantillas aprobadas cuando aplique.
- Mantener fallback humano.

### Riesgo 2: soporte infinito

Si cada cliente exige flujos únicos, el negocio se vuelve consultoría caótica.

Mitigación:

- Plantillas por sector.
- Límites claros por plan.
- Cobrar setup.
- Cobrar cambios extra.

### Riesgo 3: alucinaciones de IA

El agente puede inventar información si no se controla.

Mitigación:

- Base de conocimiento cerrada.
- Respuestas con incertidumbre: “no tengo ese dato, te paso con una persona”.
- Guardrails. Guardrails son límites y reglas de seguridad para controlar el comportamiento del agente.
- Logs y revisión.

### Riesgo 4: construir demasiado

El mayor riesgo ahora es perder meses construyendo una plataforma enorme sin ventas.

Mitigación:

- Vender primero.
- Construir solo lo que desbloquee ventas o reduzca soporte.

---

## 12. Reglas para Claude y ChatGPT trabajando juntos

Claude debe actuar como senior fullstack engineer y arquitecto SaaS.

ChatGPT debe actuar como product strategist, crítico de negocio, arquitecto funcional y copiloto de ejecución.

Reglas:

1. No romper funcionalidades existentes.
2. Antes de cambiar código, explicar el objetivo del cambio.
3. Crear commits pequeños y legibles.
4. Documentar decisiones en `/docs`.
5. Mantener `.env.example` actualizado.
6. No meter claves ni secretos en GitHub.
7. Priorizar producción real sobre demos bonitas.
8. Si hay duda entre complejidad y simplicidad, elegir simplicidad.
9. Todo debe estar preparado para varios clientes, aunque solo usemos dos al principio.
10. Cada avance debe acercarnos a vender o atender mejor a clientes reales.

---

## 13. Próximo prompt para Claude

Copia y pega esto en Claude:

```text
Actúa como senior fullstack engineer, arquitecto SaaS y CTO pragmático. Lee este documento completo y revisa el repositorio actual. Tu misión es convertir este proyecto en una base real para una empresa rentable de agentes IA para pequeños negocios, empezando por WhatsApp Business API oficial de Meta.

No quiero sobreingeniería. Quiero una arquitectura limpia, multi-tenant, mantenible y lista para los dos primeros clientes: un gimnasio y una tienda de drones.

Primero haz un diagnóstico del repositorio:
1. Qué hay ahora.
2. Qué sirve.
3. Qué sobra.
4. Qué falta.
5. Qué riesgos ves.

Después propón un plan de ejecución por fases con commits pequeños.

Prioridades técnicas:
- Web pública.
- Panel privado.
- Panel admin.
- WhatsApp Cloud API webhook.
- Base de datos multi-tenant.
- Registro de conversaciones, mensajes y leads.
- Base de conocimiento por cliente.
- Derivación a humano.
- Configuración por cliente.
- `.env.example` completo.
- Documentación en `/docs`.

Reglas:
- No rompas lo existente.
- No inventes secretos.
- No metas claves en el repo.
- Si algo no está claro, toma una decisión razonable y documenta la suposición.
- Prioriza que funcione con clientes reales antes que hacerlo perfecto.

Al final dame:
- Plan de cambios.
- Estructura de carpetas recomendada.
- Primeros archivos a tocar.
- Comandos para ejecutar localmente.
- Qué necesita ChatGPT revisar contigo antes de implementar.
```

---

## 14. Decisión recomendada ahora

La decisión sensata es:

1. Usar este repo como base de trabajo si es el correcto.
2. Crear rama de desarrollo.
3. Pedir a Claude diagnóstico del código real.
4. No tocar WhatsApp en producción hasta tener webhook, logs y base de datos claros.
5. Empezar con el gimnasio porque el caso de uso es más repetible: horarios, tarifas, citas, clases, leads.

La empresa puede ser lucrativa, pero solo si se mantiene simple: vender instalación + mensualidad, resolver un problema real y no disfrazar una consultoría caótica como SaaS.
