import { supabase } from './supabase';
import type { Lead, LeadStatus, ChannelType } from '../types/database';

export interface LeadFilters {
  status?: LeadStatus;
}

export interface LeadInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  source?: string | null;
  status?: LeadStatus;
  score?: number;
  notes?: string | null;
  channel_type?: ChannelType;
}

export type LeadUpdate = Partial<LeadInput>;

export async function fetchLeads(
  organizationId: string,
  filters?: LeadFilters,
): Promise<Lead[]> {
  let query = supabase
    .from('leads')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchLeadById(
  organizationId: string,
  leadId: string,
): Promise<Lead | null> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .eq('organization_id', organizationId)
    .single();
  if (error) throw error;
  return data;
}

export async function createLead(
  organizationId: string,
  input: LeadInput,
): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .insert({
      organization_id: organizationId,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      company: input.company ?? null,
      source: input.source ?? null,
      status: input.status ?? 'new',
      score: input.score ?? 0,
      notes: input.notes ?? null,
      channel_type: input.channel_type ?? 'manual',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateLead(
  organizationId: string,
  leadId: string,
  input: LeadUpdate,
): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .update(input as Record<string, unknown>)
    .eq('id', leadId)
    .eq('organization_id', organizationId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateLeadStatus(
  organizationId: string,
  leadId: string,
  status: LeadStatus,
): Promise<Lead> {
  return updateLead(organizationId, leadId, { status });
}
