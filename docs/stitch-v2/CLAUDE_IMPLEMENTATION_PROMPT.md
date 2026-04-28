# Claude Code Implementation Prompt — Stitch V2

Use this prompt inside Claude Code while working on branch `feature/v2-functional-dashboard`.

```text
Actúa como senior fullstack engineer, product designer, arquitecto SaaS y tech lead extremadamente cuidadoso.

Estás trabajando dentro del repositorio ASanchez144/Colleague-AI, en la rama feature/v2-functional-dashboard.

Tu objetivo NO es rehacer todo desde cero ni romper lo que ya funciona. Tu objetivo es convertir la página actual y el diseño de Stitch en una V2 funcional, profesional, mantenible y lista para seguir desarrollando.

CONTEXTO DEL PRODUCTO

El proyecto es una agencia/plataforma de agentes IA para pequeños negocios.

La idea no es crear solo un chatbot ni una simple bandeja de entrada de WhatsApp.

La visión real es construir un empleado IA capaz de sustituir o asistir a una o varias personas en tareas operativas de pequeños negocios:

- atención al cliente
- ventas
- agenda
- seguimiento
- registro de leads
- derivación a humano
- coordinación
- ejecución de tareas
- automatizaciones internas
- panel de control para el negocio

La primera versión debe estar pensada para pocos clientes iniciales, especialmente:

1. una tienda de drones
2. un gimnasio

Pero la arquitectura debe quedar preparada para añadir más clientes después sin reescribir la aplicación.

REFERENCIAS DE DISEÑO

Lee primero estos archivos:

- docs/stitch-v2/STITCH_EXPORT_INDEX.md
- docs/stitch-v2/arquitectura_y_prd_de_sebas.ai.md
- docs/stitch-v2/modern_local_ai_DESIGN.md

El ZIP original de Stitch incluía pantallas para:

- landing page
- login
- registro
- pricing
- request demo
- customer dashboard
- leads management
- appointments
- conversations
- global admin dashboard
- organizations list
- organization detail for DroneX Store
- agent configuration
- templates management
- knowledge base
- gym dashboard for FitCenter Pro
- drone store dashboard for DroneX Store
- billing subscription
- settings
- privacy policy
- terms of service
- cookie policy

IMPORTANTE SOBRE STITCH

Stitch es una referencia visual. No debes pegar HTML generado sin adaptar.

Debes traducir el diseño al stack real del repo:

- rutas reales
- componentes reales
- estilos existentes
- estructura actual
- datos mock claramente marcados como mock
- arquitectura mantenible

OBJETIVO DE ESTA SESIÓN

Quiero crear una V2 funcional sobre la base actual.

Antes de tocar código:

1. Inspecciona el repositorio completo.
2. Detecta framework, estructura, rutas, frontend, backend, estilos, configuración, package manager y estado actual.
3. Identifica qué página está ya bien diseñada.
4. Explica qué partes parecen solo visuales/mock y qué partes ya son funcionales.
5. No modifiques nada hasta tener un plan claro.

REGLAS IMPORTANTES

- No rompas lo que ya funciona.
- No borres archivos existentes sin justificarlo.
- No cambies el diseño visual principal salvo que sea necesario para hacerlo funcional.
- Conserva la estética actual si ya está bien.
- No metas complejidad innecesaria.
- No inventes integraciones falsas.
- No hardcodees datos sensibles.
- No añadas claves API, tokens ni secretos.
- No hagas refactors masivos sin necesidad.
- No cambies la arquitectura entera si no hace falta.
- Trabaja en pasos pequeños y verificables.
- Cada cambio debe tener una razón.
- Cada cambio debe poder probarse.

FLUJO DE TRABAJO OBLIGATORIO

Fase 1: Diagnóstico

Analiza el repositorio y responde con:

- stack detectado
- estructura del proyecto
- comandos disponibles
- páginas principales
- componentes importantes
- estado actual de funcionalidad
- riesgos técnicos
- archivos críticos que no debemos romper
- propuesta de rama actual si aplica
- recomendaciones antes de tocar código

Fase 2: Plan V2

Después del diagnóstico, crea un plan V2 con:

- objetivo de la V2
- funcionalidades mínimas
- funcionalidades que NO deben hacerse todavía
- cambios por archivo
- orden de implementación
- criterios de aceptación
- pruebas manuales
- pruebas automáticas si existen o si merece la pena añadirlas

Fase 3: Implementación incremental

Solo después del plan, empieza a implementar por bloques pequeños.

Cada bloque debe seguir esta estructura:

1. Qué vas a cambiar.
2. Por qué.
3. Qué archivos tocarás.
4. Cambio realizado.
5. Cómo probarlo.
6. Riesgos o cosas pendientes.

FUNCIONALIDADES PRIORITARIAS PARA LA V2

La V2 debe intentar dejar preparada o funcionando la base de:

1. Web pública profesional
   - landing page clara
   - propuesta de valor
   - secciones de confianza
   - casos de uso
   - CTA para demo/contacto
   - explicación de agente IA para negocios

2. Panel privado
   - estructura de dashboard
   - vista de conversaciones o actividad
   - vista de leads/clientes
   - vista de configuración del negocio
   - vista de integraciones, aunque inicialmente pueda estar mockeada de forma honesta

3. Multi-cliente / multi-tenant básico
   - no hardcodear solo un negocio
   - preparar datos para tienda de drones y gimnasio
   - separar configuración por negocio
   - evitar mezclar datos entre clientes

4. Agente IA / WhatsApp preparado
   - preparar estructura para WhatsApp Business API oficial de Meta
   - preparar webhook o capa futura si ya existe backend
   - dejar claro qué está implementado y qué queda pendiente
   - no simular falsamente que Meta ya está conectado si no lo está

5. Estado, trazabilidad y seguridad
   - logs básicos o estructura para logs
   - estados de conversación
   - handoff a humano
   - campos para seguimiento
   - estructura preparada para auditoría

6. Calidad de desarrollo
   - mantener componentes limpios
   - nombres claros
   - evitar duplicación
   - tipado si el stack lo permite
   - validaciones básicas
   - documentación mínima

DOCUMENTOS QUE QUIERO QUE CREES O ACTUALICES

Si no existen, crea estos archivos:

- AGENTS.md
- PROJECT.md
- REQUIREMENTS.md
- ROADMAP.md
- STATE.md
- DECISIONS.md
- CHANGELOG_AI.md

Contenido esperado:

AGENTS.md:
Reglas para futuros agentes IA trabajando en este repo.

PROJECT.md:
Visión del producto, clientes iniciales, arquitectura esperada y límites.

REQUIREMENTS.md:
Requisitos funcionales y no funcionales.

ROADMAP.md:
Fases: V1, V2, V3, futuro.

STATE.md:
Estado actual real del proyecto. Qué funciona, qué no, qué está mockeado.

DECISIONS.md:
Decisiones técnicas importantes y razones.

CHANGELOG_AI.md:
Registro de cambios hechos por agentes IA.

CRITERIOS DE ACEPTACIÓN DE LA V2

La V2 se considerará aceptable si:

- La app arranca correctamente.
- La página actual bien diseñada sigue viéndose bien.
- No se rompe navegación existente.
- Existe una estructura clara para web pública y panel privado.
- Hay datos o plantillas diferenciadas para tienda de drones y gimnasio.
- Lo mockeado está claramente marcado como mock.
- El código queda preparado para conectar WhatsApp Business API oficial.
- El dashboard tiene una base funcional, aunque no todo esté conectado todavía.
- Hay documentación suficiente para que otro agente o desarrollador continúe sin perder contexto.
- Hay instrucciones claras para ejecutar, probar y continuar.

ANTES DE PROGRAMAR

Primero responde solo con el diagnóstico del repositorio y el plan propuesto.

No empieces a modificar código hasta que yo apruebe el plan.
```
