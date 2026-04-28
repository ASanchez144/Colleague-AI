-- ============================================================
-- Sebas.ai / Colleague-AI — Seed Data
-- DroneX Store + FitCenter Pro (mock data for development)
-- ============================================================
-- Run AFTER 001_initial_schema.sql
-- Uses fixed UUIDs for reproducibility and cross-references.
--
-- NOTE ON auth.users:
-- profiles.id references auth.users(id). In production, Supabase Auth
-- creates auth.users rows on signup. For dev seeding, we insert fake
-- auth.users rows directly. This only works with local Supabase
-- (supabase start) or when running as service_role.
-- All emails use @example.com (RFC 2606 reserved domain).
-- ============================================================

-- ============================================================
-- 0. Dev auth users (local development only)
-- ============================================================
-- These are fake users for seeding. In production, auth.users is
-- managed by Supabase Auth — never insert directly.

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, instance_id, aud, role) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@example.com',   crypt('password123', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000002', 'carlos@example.com',  crypt('password123', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000003', 'ana@example.com',     crypt('password123', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated');

-- ============================================================
-- 0b. Profiles (linked to auth.users above)
-- ============================================================

INSERT INTO profiles (id, email, full_name, phone) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@example.com',  'Admin Dev',     '+34600000001'),
('00000000-0000-0000-0000-000000000002', 'carlos@example.com', 'Carlos García', '+34600000002'),
('00000000-0000-0000-0000-000000000003', 'ana@example.com',    'Ana Martínez',  '+34600000003');

-- ============================================================
-- 0c. Organization members
-- ============================================================
-- admin@example.com is owner of both orgs (platform admin)
-- carlos@example.com is admin of DroneX
-- ana@example.com is admin of FitCenter
-- NOTE: org UUIDs reference section 1 below

INSERT INTO organization_members (organization_id, profile_id, role, joined_at) VALUES
('a1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'owner',  now()),
('a1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'owner',  now()),
('a1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'admin',  now()),
('a1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'admin',  now());

-- ============================================================
-- 1. Organizations
-- ============================================================

INSERT INTO organizations (id, name, slug, sector, template_id, website, phone, email, address, subscription, settings) VALUES
(
  'a1000000-0000-0000-0000-000000000001',
  'DroneX Store',
  'dronex-store',
  'drone_store',
  '01-whatsapp-agent',
  'https://dronexstore.es',
  '+34612345001',
  'info@dronexstore.es',
  'Calle Gran Vía 42, Madrid',
  'professional',
  '{"features": ["whatsapp", "leads", "appointments", "knowledge_base"], "branding": {"primary_color": "#1E40AF", "accent_color": "#60A5FA"}}'
),
(
  'a1000000-0000-0000-0000-000000000002',
  'FitCenter Pro',
  'fitcenter-pro',
  'gym',
  '01-whatsapp-agent',
  'https://fitcenterpro.es',
  '+34612345002',
  'hola@fitcenterpro.es',
  'Avenida de la Constitución 15, Sevilla',
  'starter',
  '{"features": ["whatsapp", "leads", "appointments"], "branding": {"primary_color": "#059669", "accent_color": "#34D399"}}'
);

-- ============================================================
-- 2. Agents
-- ============================================================

INSERT INTO agents (id, organization_id, name, description, system_prompt, tone, channels, model_provider, model_name, settings) VALUES
(
  'b1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'DroneBot',
  'Asistente IA para DroneX Store — drones, accesorios, reparaciones',
  'Eres el asistente virtual de DroneX Store, una tienda especializada en drones en Madrid. Ayudas a clientes con información de productos, precios, disponibilidad, reparaciones y citas para demostraciones. Responde siempre en español, sé conciso y profesional. Si no sabes algo, di que consultarás con el equipo.',
  'professional',
  '{whatsapp,web_chat}',
  'anthropic',
  'claude-sonnet-4-20250514',
  '{"max_tokens": 500, "greeting": "¡Hola! Soy el asistente de DroneX Store. ¿En qué puedo ayudarte?"}'
),
(
  'b1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000002',
  'FitBot',
  'Asistente IA para FitCenter Pro — horarios, clases, membresías',
  'Eres el asistente virtual de FitCenter Pro, un gimnasio en Sevilla. Ayudas con horarios de clases, disponibilidad, membresías, reservas de sesiones con entrenador personal y preguntas frecuentes. Tono cercano y motivador. Responde en español.',
  'friendly',
  '{whatsapp}',
  'anthropic',
  'claude-sonnet-4-20250514',
  '{"max_tokens": 400, "greeting": "¡Hola! Soy el asistente de FitCenter Pro 💪 ¿Qué necesitas?"}'
);

-- ============================================================
-- 3. Channels
-- ============================================================

INSERT INTO channels (id, organization_id, agent_id, type, name, config, is_active) VALUES
(
  'c1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000001',
  'whatsapp',
  'WhatsApp Principal DroneX',
  '{"phone": "+34612345001", "provider": "evolution_api", "instance_name": "dronex-wa"}',
  true
),
(
  'c1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000001',
  'web_chat',
  'Web Chat DroneX',
  '{"widget_color": "#1E40AF", "position": "bottom-right"}',
  false
),
(
  'c1000000-0000-0000-0000-000000000003',
  'a1000000-0000-0000-0000-000000000002',
  'b1000000-0000-0000-0000-000000000002',
  'whatsapp',
  'WhatsApp FitCenter',
  '{"phone": "+34612345002", "provider": "evolution_api", "instance_name": "fitcenter-wa"}',
  true
);

-- ============================================================
-- 4. Conversations (mock)
-- ============================================================

INSERT INTO conversations (id, organization_id, channel_id, agent_id, contact_name, contact_phone, channel_type, status, subject, last_message_at) VALUES
-- DroneX conversations
('d1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Carlos García', '+34666111001', 'whatsapp', 'active', 'Consulta DJI Mini 4 Pro', now() - interval '10 minutes'),
('d1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'María López', '+34666111002', 'whatsapp', 'resolved', 'Reparación hélice rota', now() - interval '2 hours'),
('d1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Pedro Ruiz', '+34666111003', 'whatsapp', 'waiting', 'Presupuesto filmación aérea', now() - interval '1 day'),
-- FitCenter conversations
('d1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000002', 'Ana Martínez', '+34666222001', 'whatsapp', 'active', 'Horarios yoga', now() - interval '5 minutes'),
('d1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000002', 'Javier Sánchez', '+34666222002', 'whatsapp', 'resolved', 'Reserva entrenador personal', now() - interval '3 hours'),
('d1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000002', 'Laura Fernández', '+34666222003', 'whatsapp', 'active', 'Precios membresía', now() - interval '30 minutes');

-- ============================================================
-- 5. Messages (mock)
-- ============================================================

INSERT INTO messages (id, conversation_id, organization_id, role, content, channel_type) VALUES
-- Carlos → DroneX (DJI Mini 4 Pro)
('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'user', 'Hola, ¿tenéis el DJI Mini 4 Pro en stock?', 'whatsapp'),
('e1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'assistant', '¡Hola Carlos! Sí, tenemos el DJI Mini 4 Pro disponible. Tenemos el pack estándar a 799€ y el Fly More Combo a 1.049€. ¿Te interesa alguno en particular?', 'whatsapp'),
('e1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'user', 'El Fly More Combo, ¿puedo pasar a verlo mañana?', 'whatsapp'),
('e1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'assistant', 'Por supuesto. ¿Te va bien a las 11:00 o prefieres por la tarde? Podemos hacerte una demostración en la tienda.', 'whatsapp'),

-- María → DroneX (reparación)
('e1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'user', 'Se me ha roto una hélice del Mavic Air 2. ¿Tenéis repuestos?', 'whatsapp'),
('e1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'assistant', '¡Hola María! Sí, tenemos hélices de repuesto para el Mavic Air 2 a 12€ el par. También ofrecemos servicio de instalación gratuito si pasas por la tienda. ¿Quieres reservar una cita?', 'whatsapp'),
('e1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'user', 'Perfecto, paso esta tarde. Gracias.', 'whatsapp'),

-- Ana → FitCenter (yoga)
('e1000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'user', 'Buenas, ¿a qué hora son las clases de yoga?', 'whatsapp'),
('e1000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'assistant', '¡Hola Ana! 💪 Las clases de yoga son: Lunes y Miércoles a las 9:00 y 19:00, Viernes a las 10:00. ¿Quieres que te reserve plaza en alguna?', 'whatsapp'),

-- Javier → FitCenter (entrenador)
('e1000000-0000-0000-0000-000000000010', 'd1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'user', 'Quiero reservar sesión con entrenador personal para el jueves', 'whatsapp'),
('e1000000-0000-0000-0000-000000000011', 'd1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'assistant', '¡Genial Javier! Tenemos disponibilidad el jueves a las 10:00, 12:00 y 17:00. Sesión de 1h con David (fuerza) o Marta (funcional). ¿Qué prefieres?', 'whatsapp'),
('e1000000-0000-0000-0000-000000000012', 'd1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'user', 'A las 17:00 con David, porfa.', 'whatsapp'),
('e1000000-0000-0000-0000-000000000013', 'd1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'assistant', 'Reservado: Jueves 17:00 con David (sesión de fuerza). Te llegará un recordatorio el miércoles. ¡A tope! 💪', 'whatsapp'),

-- Laura → FitCenter (membresía)
('e1000000-0000-0000-0000-000000000014', 'd1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002', 'user', 'Hola, ¿qué precios tenéis de membresía?', 'whatsapp'),
('e1000000-0000-0000-0000-000000000015', 'd1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002', 'assistant', '¡Hola Laura! Nuestros planes: Básico (sala + vestuarios) 29€/mes, Plus (+ clases grupales) 45€/mes, Premium (+ entrenador personal 2x/mes) 69€/mes. Matrícula gratuita si te apuntas esta semana. ¿Quieres venir a conocernos?', 'whatsapp');

-- ============================================================
-- 6. Leads (mock)
-- ============================================================

INSERT INTO leads (id, organization_id, conversation_id, channel_type, name, email, phone, company, source, status, score, notes, custom_fields) VALUES
-- DroneX leads
('f1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'whatsapp', 'Carlos García', 'carlos.garcia@example.com', '+34666111001', NULL, 'whatsapp', 'qualified', 75, 'Interesado en DJI Mini 4 Pro Fly More Combo. Cita mañana 11:00.', '{"product_interest": "DJI Mini 4 Pro", "budget": "1000-1500€"}'),
('f1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000003', 'whatsapp', 'Pedro Ruiz', 'pedro.ruiz@example.com', '+34666111003', 'Producciones Ruiz', 'whatsapp', 'proposal', 90, 'Productora audiovisual, necesita presupuesto para filmación aérea profesional.', '{"service_interest": "filmación aérea", "budget": "5000€+", "company_type": "productora"}'),
('f1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', NULL, 'form', 'Elena Torres', 'elena.t@example.com', '+34666111004', NULL, 'web_form', 'new', 40, 'Formulario web: interesada en curso de pilotaje.', '{"interest": "curso_pilotaje"}'),
-- FitCenter leads
('f1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000006', 'whatsapp', 'Laura Fernández', 'laura.f@example.com', '+34666222003', NULL, 'whatsapp', 'contacted', 60, 'Preguntó por membresía. Ofrecer visita.', '{"plan_interest": "Plus", "referral_source": "Instagram"}'),
('f1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', NULL, 'form', 'Roberto Díaz', 'roberto.d@example.com', '+34666222004', NULL, 'web_form', 'new', 30, 'Formulario web: quiere info de clases grupales.', '{"class_interest": "spinning,yoga"}'),
('f1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000004', 'whatsapp', 'Ana Martínez', 'ana.m@example.com', '+34666222001', NULL, 'whatsapp', 'qualified', 70, 'Interesada en yoga. Alta probabilidad de conversión.', '{"class_interest": "yoga", "schedule_preference": "mañanas"}');

-- ============================================================
-- 7. Appointments (mock)
-- ============================================================

INSERT INTO appointments (id, organization_id, lead_id, conversation_id, channel_type, title, description, start_time, end_time, status, location, attendee_name, attendee_phone, attendee_email) VALUES
-- DroneX appointments
('aa100000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'whatsapp', 'Demo DJI Mini 4 Pro — Carlos García', 'Demostración del DJI Mini 4 Pro Fly More Combo en tienda', now() + interval '1 day' + interval '11 hours', now() + interval '1 day' + interval '12 hours', 'scheduled', 'Tienda DroneX — Gran Vía 42', 'Carlos García', '+34666111001', 'carlos.garcia@example.com'),
('aa100000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000003', 'whatsapp', 'Presupuesto filmación — Pedro Ruiz', 'Reunión presupuesto filmación aérea con Producciones Ruiz', now() + interval '3 days' + interval '10 hours', now() + interval '3 days' + interval '11 hours', 'confirmed', 'Videollamada', 'Pedro Ruiz', '+34666111003', 'pedro.ruiz@example.com'),
-- FitCenter appointments
('aa100000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', NULL, 'd1000000-0000-0000-0000-000000000005', 'whatsapp', 'Entrenamiento personal — Javier Sánchez', 'Sesión de fuerza con David, 1h', now() + interval '2 days' + interval '17 hours', now() + interval '2 days' + interval '18 hours', 'confirmed', 'Sala PT — FitCenter Pro', 'Javier Sánchez', '+34666222002', NULL),
('aa100000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000004', NULL, 'manual', 'Visita guiada — Laura Fernández', 'Tour por las instalaciones + prueba clase', now() + interval '2 days' + interval '10 hours', now() + interval '2 days' + interval '11 hours', 'scheduled', 'Recepción FitCenter Pro', 'Laura Fernández', '+34666222003', 'laura.f@example.com');

-- ============================================================
-- 8. Knowledge items (mock)
-- ============================================================

INSERT INTO knowledge_items (id, organization_id, agent_id, category, question, answer, tags) VALUES
-- DroneX knowledge
('bb100000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'faq', '¿Cuál es el horario de la tienda?', 'Lunes a Viernes de 10:00 a 20:00, Sábados de 10:00 a 14:00. Domingos cerrado.', '{horario,tienda}'),
('bb100000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'faq', '¿Hacéis reparaciones?', 'Sí, reparamos todas las marcas. Diagnóstico gratuito, presupuesto en 24h. Traelo a tienda o envío con recogida.', '{reparaciones,servicio}'),
('bb100000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'product', NULL, 'DJI Mini 4 Pro: 249g, grabación 4K HDR, detección obstáculos omnidireccional, 34min autonomía. Pack estándar 799€, Fly More Combo 1.049€. Ideal para principiantes y creadores de contenido.', '{dji,mini4pro,producto}'),
('bb100000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'policy', '¿Cuál es la política de devolución?', '14 días naturales para devolución sin uso. Producto defectuoso: garantía de 2 años. Reparaciones: garantía 3 meses sobre la reparación.', '{devolución,garantía,política}'),
('bb100000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'faq', '¿Necesito licencia para volar drones?', 'Drones <250g (como DJI Mini 4 Pro) no requieren licencia en España en categoría abierta A1. Para drones más pesados necesitas certificado A1/A3 de AESA. Te ayudamos con el trámite.', '{licencia,regulación,aesa}'),

-- FitCenter knowledge
('bb100000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'faq', '¿Cuál es el horario del gimnasio?', 'Lunes a Viernes de 7:00 a 22:00, Sábados de 9:00 a 14:00, Domingos de 9:00 a 13:00.', '{horario,gym}'),
('bb100000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'faq', '¿Qué clases grupales ofrecéis?', 'Spinning, Yoga, Pilates, CrossFit, Zumba, Body Pump, Boxeo Fitness. Consulta horarios actualizados en recepción o pregúntame.', '{clases,actividades}'),
('bb100000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'faq', '¿Cuánto cuesta la membresía?', 'Básico: 29€/mes (sala + vestuarios). Plus: 45€/mes (+ clases grupales). Premium: 69€/mes (+ 2 sesiones/mes entrenador personal). Matrícula gratuita en promoción.', '{precios,membresía,planes}'),
('bb100000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'policy', '¿Puedo cancelar mi membresía?', 'Puedes cancelar con 30 días de antelación sin penalización. Permanencia mínima: 1 mes. Trámite en recepción o enviando email a hola@fitcenterpro.es.', '{cancelación,baja,política}'),
('bb100000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'faq', '¿Ofrecéis entrenamiento personal?', 'Sí. Sesiones de 1h con entrenadores certificados: David (fuerza/hipertrofia) y Marta (funcional/pérdida de peso). Precio: 35€/sesión suelta, incluido en plan Premium (2 sesiones/mes).', '{entrenador,personal,pt}');

-- ============================================================
-- 9. Integrations (mock)
-- ============================================================

INSERT INTO integrations (id, organization_id, provider, type, config, status) VALUES
-- DroneX
('cc100000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'evolution_api', 'whatsapp', '{"instance": "dronex-wa", "base_url": "http://localhost:8080", "api_key": "mock-key-dronex"}', 'active'),
('cc100000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'stripe', NULL, '{"customer_id": "cus_mock_dronex", "subscription_id": "sub_mock_dronex"}', 'active'),
-- FitCenter
('cc100000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'evolution_api', 'whatsapp', '{"instance": "fitcenter-wa", "base_url": "http://localhost:8080", "api_key": "mock-key-fitcenter"}', 'active'),
('cc100000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'google_calendar', NULL, '{"calendar_id": "fitcenterpro@example.com"}', 'inactive');

-- ============================================================
-- 10. Automations (mock)
-- ============================================================

INSERT INTO automations (id, organization_id, name, description, trigger_type, trigger_config, action_type, action_config, channel_types, is_active) VALUES
('dd100000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Auto-lead desde WhatsApp', 'Crea lead automáticamente cuando un nuevo contacto escribe por WhatsApp', 'new_message', '{"condition": "first_message_from_contact"}', 'create_lead', '{"default_status": "new", "default_source": "whatsapp"}', '{whatsapp}', true),
('dd100000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Notificar admin — lead caliente', 'Email al admin cuando un lead supera score 80', 'new_lead', '{"condition": "score >= 80"}', 'notify_email', '{"to": "info@dronexstore.es", "subject": "Lead caliente: {{lead.name}}"}', '{}', true),
('dd100000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'Recordatorio cita — 24h antes', 'Envía recordatorio por WhatsApp 24h antes de la cita', 'schedule', '{"cron": "0 * * * *", "condition": "appointment.start_time - now() <= 24h"}', 'send_message', '{"template": "Hola {{appointment.attendee_name}}, te recordamos tu cita mañana a las {{appointment.start_time}}. ¡Te esperamos!"}', '{whatsapp}', true);

-- ============================================================
-- 11. Tasks (mock)
-- ============================================================

INSERT INTO tasks (id, organization_id, lead_id, title, description, status, priority, due_date) VALUES
('ee100000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000002', 'Preparar presupuesto filmación aérea', 'Pedro Ruiz necesita presupuesto para filmación profesional con drones. Incluir precios por hora y paquetes.', 'in_progress', 'high', now() + interval '2 days'),
('ee100000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000003', 'Contactar Elena Torres — curso pilotaje', 'Vino por formulario web. Enviar info del curso de pilotaje de drones.', 'pending', 'medium', now() + interval '3 days'),
('ee100000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000004', 'Seguimiento Laura — visita guiada', 'Confirmar visita guiada y preparar oferta personalizada plan Plus.', 'pending', 'medium', now() + interval '1 day');

-- ============================================================
-- 12. Audit logs (sample)
-- ============================================================

INSERT INTO audit_logs (organization_id, action, resource_type, resource_id, changes) VALUES
('a1000000-0000-0000-0000-000000000001', 'lead.created', 'lead', 'f1000000-0000-0000-0000-000000000001', '{"source": "whatsapp_auto"}'),
('a1000000-0000-0000-0000-000000000001', 'appointment.created', 'appointment', 'aa100000-0000-0000-0000-000000000001', '{"created_by": "agent"}'),
('a1000000-0000-0000-0000-000000000002', 'lead.status_changed', 'lead', 'f1000000-0000-0000-0000-000000000006', '{"before": {"status": "new"}, "after": {"status": "qualified"}}');

-- ============================================================
-- Done. Schema + seed loaded.
-- ============================================================
