import { supabase } from './supabase';
import type { Agent, Appointment, Conversation, Integration, Lead } from '../types/database';

export interface DashboardData {
  leads: Lead[];
  conversations: Conversation[];
  appointments: Appointment[];
  agents: Agent[];
  knowledgeCount: number;
  integrations: Integration[];
}

export async function fetchDashboardData(organizationId: string): Promise<DashboardData> {
  const [leadsRes, conversationsRes, appointmentsRes, agentsRes, knowledgeRes, integrationsRes] =
    await Promise.all([
      supabase
        .from('leads')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('conversations')
        .select('*')
        .eq('organization_id', organizationId)
        .order('last_message_at', { ascending: false })
        .limit(10),
      supabase
        .from('appointments')
        .select('*')
        .eq('organization_id', organizationId)
        .order('start_time', { ascending: true })
        .limit(10),
      supabase
        .from('agents')
        .select('*')
        .eq('organization_id', organizationId),
      supabase
        .from('knowledge_items')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId),
      supabase
        .from('integrations')
        .select('*')
        .eq('organization_id', organizationId),
    ]);

  if (leadsRes.error) throw leadsRes.error;
  if (conversationsRes.error) throw conversationsRes.error;
  if (appointmentsRes.error) throw appointmentsRes.error;
  if (agentsRes.error) throw agentsRes.error;
  if (knowledgeRes.error) throw knowledgeRes.error;
  if (integrationsRes.error) throw integrationsRes.error;

  return {
    leads: leadsRes.data ?? [],
    conversations: conversationsRes.data ?? [],
    appointments: appointmentsRes.data ?? [],
    agents: agentsRes.data ?? [],
    knowledgeCount: knowledgeRes.count ?? 0,
    integrations: integrationsRes.data ?? [],
  };
}
