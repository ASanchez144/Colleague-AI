-- ============================================================
-- Sebas.ai / Colleague-AI — Initial Multi-tenant Schema
-- Migration: 001_initial_schema.sql
-- Date: 2026-04-28
-- ============================================================
-- Architecture: WhatsApp-first but multi-channel ready.
-- Channels: whatsapp, voice_call, email, web_chat, form, manual
-- Tenancy: organization-level isolation via RLS.
-- ============================================================

-- 0. Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Custom types
-- ============================================================

CREATE TYPE channel_type AS ENUM (
  'whatsapp',
  'voice_call',
  'email',
  'web_chat',
  'form',
  'manual'
);

CREATE TYPE org_role AS ENUM (
  'owner',
  'admin',
  'member',
  'viewer'
);

CREATE TYPE conversation_status AS ENUM (
  'active',
  'waiting',
  'resolved',
  'archived'
);

CREATE TYPE lead_status AS ENUM (
  'new',
  'contacted',
  'qualified',
  'proposal',
  'won',
  'lost'
);

CREATE TYPE appointment_status AS ENUM (
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TYPE message_role AS ENUM (
  'user',
  'assistant',
  'system'
);

CREATE TYPE integration_status AS ENUM (
  'active',
  'inactive',
  'error'
);

CREATE TYPE task_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'cancelled'
);

CREATE TYPE task_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

CREATE TYPE subscription_tier AS ENUM (
  'free',
  'starter',
  'professional',
  'custom'
);

-- 2. Tables
-- ============================================================

-- 2.1 Organizations
-- ============================================================
CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  sector        TEXT,                          -- e.g. 'drone_store', 'gym'
  template_id   TEXT,                          -- maps to /templates/<id>
  logo_url      TEXT,
  website       TEXT,
  phone         TEXT,
  email         TEXT,
  address       TEXT,
  timezone      TEXT DEFAULT 'Europe/Madrid',
  locale        TEXT DEFAULT 'es',
  subscription  subscription_tier DEFAULT 'free',
  settings      JSONB DEFAULT '{}',            -- org-level feature flags
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 2.2 Profiles (linked to auth.users)
-- ============================================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  avatar_url    TEXT,
  phone         TEXT,
  locale        TEXT DEFAULT 'es',
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 2.3 Organization members (join table)
-- ============================================================
CREATE TABLE organization_members (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role            org_role DEFAULT 'member',
  invited_at      TIMESTAMPTZ DEFAULT now(),
  joined_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (organization_id, profile_id)
);

-- 2.4 Agents (AI config per org)
-- ============================================================
CREATE TABLE agents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,                -- e.g. 'Sebas', 'DroneBot'
  description     TEXT,
  system_prompt   TEXT,                         -- base prompt
  tone            TEXT DEFAULT 'professional',  -- professional, casual, friendly
  language        TEXT DEFAULT 'es',
  model_provider  TEXT DEFAULT 'anthropic',     -- anthropic, openai, google, ollama
  model_name      TEXT DEFAULT 'claude-sonnet-4-20250514',
  temperature     REAL DEFAULT 0.7,
  channels        channel_type[] DEFAULT '{whatsapp}',  -- enabled channels
  is_active       BOOLEAN DEFAULT true,
  settings        JSONB DEFAULT '{}',           -- per-agent feature config
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 2.5 Channels (channel instances per org — e.g. a specific WhatsApp number)
-- ============================================================
CREATE TABLE channels (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id        UUID REFERENCES agents(id) ON DELETE SET NULL,
  type            channel_type NOT NULL,
  name            TEXT NOT NULL,                -- e.g. 'WhatsApp Principal'
  config          JSONB DEFAULT '{}',           -- provider-specific: phone number, API keys, etc.
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 2.6 Conversations
-- ============================================================
CREATE TABLE conversations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  channel_id      UUID REFERENCES channels(id) ON DELETE SET NULL,
  agent_id        UUID REFERENCES agents(id) ON DELETE SET NULL,
  contact_name    TEXT,
  contact_phone   TEXT,
  contact_email   TEXT,
  channel_type    channel_type NOT NULL DEFAULT 'whatsapp',
  status          conversation_status DEFAULT 'active',
  subject         TEXT,
  metadata        JSONB DEFAULT '{}',           -- channel-specific data
  started_at      TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 2.7 Messages
-- ============================================================
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role            message_role NOT NULL,
  content         TEXT NOT NULL,
  channel_type    channel_type NOT NULL DEFAULT 'whatsapp',
  metadata        JSONB DEFAULT '{}',           -- attachments, media, tokens used
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 2.8 Leads
-- ============================================================
CREATE TABLE leads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  channel_type    channel_type DEFAULT 'whatsapp',
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  company         TEXT,
  source          TEXT,                         -- 'whatsapp', 'web_form', 'manual', etc.
  status          lead_status DEFAULT 'new',
  score           INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  notes           TEXT,
  custom_fields   JSONB DEFAULT '{}',           -- sector-specific fields
  assigned_to     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 2.9 Appointments
-- ============================================================
CREATE TABLE appointments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id         UUID REFERENCES leads(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  channel_type    channel_type DEFAULT 'whatsapp',
  title           TEXT NOT NULL,
  description     TEXT,
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ NOT NULL,
  status          appointment_status DEFAULT 'scheduled',
  location        TEXT,
  attendee_name   TEXT,
  attendee_phone  TEXT,
  attendee_email  TEXT,
  notes           TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 2.10 Knowledge items
-- ============================================================
CREATE TABLE knowledge_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id        UUID REFERENCES agents(id) ON DELETE SET NULL,
  category        TEXT DEFAULT 'faq',           -- faq, product, policy, procedure
  question        TEXT,
  answer          TEXT NOT NULL,
  tags            TEXT[] DEFAULT '{}',
  is_active       BOOLEAN DEFAULT true,
  sort_order      INTEGER DEFAULT 0,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 2.11 Integrations
-- ============================================================
CREATE TABLE integrations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL,                -- 'evolution_api', 'twilio', 'stripe', 'n8n', 'google_calendar'
  type            channel_type,                 -- NULL for non-channel integrations (stripe, n8n)
  config          JSONB DEFAULT '{}',           -- encrypted in production
  status          integration_status DEFAULT 'inactive',
  last_sync_at    TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 2.12 Automations
-- ============================================================
CREATE TABLE automations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  trigger_type    TEXT NOT NULL,                -- 'new_lead', 'new_message', 'appointment_created', 'keyword', 'schedule'
  trigger_config  JSONB DEFAULT '{}',
  action_type     TEXT NOT NULL,                -- 'send_message', 'create_lead', 'notify_email', 'webhook', 'assign_agent'
  action_config   JSONB DEFAULT '{}',
  channel_types   channel_type[] DEFAULT '{}',  -- which channels trigger this
  is_active       BOOLEAN DEFAULT true,
  run_count       INTEGER DEFAULT 0,
  last_run_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 2.13 Tasks
-- ============================================================
CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_to     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  lead_id         UUID REFERENCES leads(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  status          task_status DEFAULT 'pending',
  priority        task_priority DEFAULT 'medium',
  due_date        TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 2.14 Audit logs
-- ============================================================
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,                -- 'lead.created', 'message.sent', 'agent.updated'
  resource_type   TEXT NOT NULL,                -- 'lead', 'conversation', 'agent', etc.
  resource_id     UUID,
  changes         JSONB DEFAULT '{}',           -- { before: {}, after: {} }
  ip_address      INET,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes
-- ============================================================

-- Org lookups
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_sector ON organizations(sector);

-- Membership
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_profile ON organization_members(profile_id);

-- Agents
CREATE INDEX idx_agents_org ON agents(organization_id);

-- Channels
CREATE INDEX idx_channels_org ON channels(organization_id);
CREATE INDEX idx_channels_type ON channels(organization_id, type);

-- Conversations
CREATE INDEX idx_conversations_org ON conversations(organization_id);
CREATE INDEX idx_conversations_channel ON conversations(channel_id);
CREATE INDEX idx_conversations_status ON conversations(organization_id, status);
CREATE INDEX idx_conversations_last_msg ON conversations(organization_id, last_message_at DESC);

-- Messages
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_org ON messages(organization_id);

-- Leads
CREATE INDEX idx_leads_org ON leads(organization_id);
CREATE INDEX idx_leads_status ON leads(organization_id, status);
CREATE INDEX idx_leads_email ON leads(email);

-- Appointments
CREATE INDEX idx_appointments_org ON appointments(organization_id);
CREATE INDEX idx_appointments_time ON appointments(organization_id, start_time);
CREATE INDEX idx_appointments_status ON appointments(organization_id, status);

-- Knowledge
CREATE INDEX idx_knowledge_org ON knowledge_items(organization_id);
CREATE INDEX idx_knowledge_category ON knowledge_items(organization_id, category);
CREATE INDEX idx_knowledge_tags ON knowledge_items USING GIN(tags);

-- Integrations
CREATE INDEX idx_integrations_org ON integrations(organization_id);

-- Automations
CREATE INDEX idx_automations_org ON automations(organization_id);
CREATE INDEX idx_automations_trigger ON automations(organization_id, trigger_type);

-- Tasks
CREATE INDEX idx_tasks_org ON tasks(organization_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(organization_id, status);

-- Audit
CREATE INDEX idx_audit_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_time ON audit_logs(organization_id, created_at DESC);

-- 4. Updated_at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'organizations', 'profiles', 'agents', 'channels',
      'leads', 'appointments', 'knowledge_items',
      'integrations', 'automations', 'tasks'
    ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- 5. Row Level Security
-- ============================================================

-- Enable RLS on all multi-tenant tables
ALTER TABLE organizations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents               ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels             ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages             ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads                ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs           ENABLE ROW LEVEL SECURITY;

-- Helper: get org IDs for current user
CREATE OR REPLACE FUNCTION user_org_ids()
RETURNS SETOF UUID AS $$
  SELECT organization_id
  FROM organization_members
  WHERE profile_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 5.1 Profiles: users see own profile
CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY profiles_update ON profiles
  FOR UPDATE USING (id = auth.uid());

-- 5.2 Organizations: members can see their orgs
CREATE POLICY orgs_select ON organizations
  FOR SELECT USING (id IN (SELECT user_org_ids()));

-- 5.3 Organization members: see members of your orgs
CREATE POLICY org_members_select ON organization_members
  FOR SELECT USING (organization_id IN (SELECT user_org_ids()));

-- 5.4 Org-scoped tables: standard pattern
-- SELECT: member of org. INSERT/UPDATE/DELETE: admin/owner of org.

CREATE OR REPLACE FUNCTION user_is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
      AND profile_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Macro: apply standard org policies
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'agents', 'channels', 'conversations', 'messages',
      'leads', 'appointments', 'knowledge_items',
      'integrations', 'automations', 'tasks', 'audit_logs'
    ])
  LOOP
    -- SELECT: org member
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT USING (organization_id IN (SELECT user_org_ids()))',
      tbl || '_select', tbl
    );
    -- INSERT: org admin
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (user_is_org_admin(organization_id))',
      tbl || '_insert', tbl
    );
    -- UPDATE: org admin
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR UPDATE USING (user_is_org_admin(organization_id))',
      tbl || '_update', tbl
    );
    -- DELETE: org admin
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR DELETE USING (user_is_org_admin(organization_id))',
      tbl || '_delete', tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
-- Done. Run seed.sql next for demo data.
-- ============================================================
