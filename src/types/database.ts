/**
 * Sebas.ai / Colleague-AI — Supabase Database Types
 *
 * Auto-generate later with:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 *
 * These hand-written types mirror 001_initial_schema.sql and are enough
 * to build UI components before connecting to a live Supabase instance.
 */

// ============================================================
// Enums (match CREATE TYPE in migration)
// ============================================================

export type ChannelType =
  | 'whatsapp'
  | 'voice_call'
  | 'email'
  | 'web_chat'
  | 'form'
  | 'manual';

export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';

export type ConversationStatus = 'active' | 'waiting' | 'resolved' | 'archived';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'won'
  | 'lost';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type MessageRole = 'user' | 'assistant' | 'system';

export type IntegrationStatus = 'active' | 'inactive' | 'error';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'custom';

// ============================================================
// Row types (what SELECT returns)
// ============================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  sector: string | null;
  template_id: string | null;
  logo_url: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  timezone: string;
  locale: string;
  subscription: SubscriptionTier;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  locale: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  profile_id: string;
  role: OrgRole;
  invited_at: string;
  joined_at: string | null;
  created_at: string;
}

export interface Agent {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  system_prompt: string | null;
  tone: string;
  language: string;
  model_provider: string;
  model_name: string;
  temperature: number;
  channels: ChannelType[];
  is_active: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Channel {
  id: string;
  organization_id: string;
  agent_id: string | null;
  type: ChannelType;
  name: string;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  organization_id: string;
  channel_id: string | null;
  agent_id: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  channel_type: ChannelType;
  status: ConversationStatus;
  subject: string | null;
  metadata: Record<string, unknown>;
  started_at: string;
  last_message_at: string;
  resolved_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  organization_id: string;
  role: MessageRole;
  content: string;
  channel_type: ChannelType;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Lead {
  id: string;
  organization_id: string;
  conversation_id: string | null;
  channel_type: ChannelType;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  status: LeadStatus;
  score: number;
  notes: string | null;
  custom_fields: Record<string, unknown>;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  organization_id: string;
  lead_id: string | null;
  conversation_id: string | null;
  channel_type: ChannelType;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  location: string | null;
  attendee_name: string | null;
  attendee_phone: string | null;
  attendee_email: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeItem {
  id: string;
  organization_id: string;
  agent_id: string | null;
  category: string;
  question: string | null;
  answer: string;
  tags: string[];
  is_active: boolean;
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Integration {
  id: string;
  organization_id: string;
  provider: string;
  type: ChannelType | null;
  config: Record<string, unknown>;
  status: IntegrationStatus;
  last_sync_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Automation {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  action_type: string;
  action_config: Record<string, unknown>;
  channel_types: ChannelType[];
  is_active: boolean;
  run_count: number;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  organization_id: string;
  assigned_to: string | null;
  lead_id: string | null;
  conversation_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  changes: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

// ============================================================
// Supabase Database type (for createClient<Database>)
// ============================================================

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: Partial<Organization> & Pick<Organization, 'name' | 'slug'>;
        Update: Partial<Organization>;
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & Pick<Profile, 'id' | 'email'>;
        Update: Partial<Profile>;
      };
      organization_members: {
        Row: OrganizationMember;
        Insert: Partial<OrganizationMember> & Pick<OrganizationMember, 'organization_id' | 'profile_id'>;
        Update: Partial<OrganizationMember>;
      };
      agents: {
        Row: Agent;
        Insert: Partial<Agent> & Pick<Agent, 'organization_id' | 'name'>;
        Update: Partial<Agent>;
      };
      channels: {
        Row: Channel;
        Insert: Partial<Channel> & Pick<Channel, 'organization_id' | 'type' | 'name'>;
        Update: Partial<Channel>;
      };
      conversations: {
        Row: Conversation;
        Insert: Partial<Conversation> & Pick<Conversation, 'organization_id'>;
        Update: Partial<Conversation>;
      };
      messages: {
        Row: Message;
        Insert: Partial<Message> & Pick<Message, 'conversation_id' | 'organization_id' | 'role' | 'content'>;
        Update: Partial<Message>;
      };
      leads: {
        Row: Lead;
        Insert: Partial<Lead> & Pick<Lead, 'organization_id' | 'name'>;
        Update: Partial<Lead>;
      };
      appointments: {
        Row: Appointment;
        Insert: Partial<Appointment> & Pick<Appointment, 'organization_id' | 'title' | 'start_time' | 'end_time'>;
        Update: Partial<Appointment>;
      };
      knowledge_items: {
        Row: KnowledgeItem;
        Insert: Partial<KnowledgeItem> & Pick<KnowledgeItem, 'organization_id' | 'answer'>;
        Update: Partial<KnowledgeItem>;
      };
      integrations: {
        Row: Integration;
        Insert: Partial<Integration> & Pick<Integration, 'organization_id' | 'provider'>;
        Update: Partial<Integration>;
      };
      automations: {
        Row: Automation;
        Insert: Partial<Automation> & Pick<Automation, 'organization_id' | 'name' | 'trigger_type' | 'action_type'>;
        Update: Partial<Automation>;
      };
      tasks: {
        Row: Task;
        Insert: Partial<Task> & Pick<Task, 'organization_id' | 'title'>;
        Update: Partial<Task>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Partial<AuditLog> & Pick<AuditLog, 'organization_id' | 'action' | 'resource_type'>;
        Update: Partial<AuditLog>;
      };
    };
    Enums: {
      channel_type: ChannelType;
      org_role: OrgRole;
      conversation_status: ConversationStatus;
      lead_status: LeadStatus;
      appointment_status: AppointmentStatus;
      message_role: MessageRole;
      integration_status: IntegrationStatus;
      task_status: TaskStatus;
      task_priority: TaskPriority;
      subscription_tier: SubscriptionTier;
    };
  };
}
