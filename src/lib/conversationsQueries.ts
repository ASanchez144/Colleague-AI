import { supabase } from './supabase';
import type {
  Conversation,
  ConversationStatus,
  ChannelType,
  Message,
  MessageRole,
} from '../types/database';

export interface ConversationFilters {
  status?: ConversationStatus;
  channel_type?: ChannelType;
}

export interface ConversationUpdate {
  status?: ConversationStatus;
  subject?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
}

export interface MessageInput {
  role: MessageRole;
  content: string;
  channel_type?: ChannelType;
}

export async function fetchConversations(
  organizationId: string,
  filters?: ConversationFilters,
): Promise<Conversation[]> {
  let query = supabase
    .from('conversations')
    .select('*')
    .eq('organization_id', organizationId)
    .order('last_message_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.channel_type) {
    query = query.eq('channel_type', filters.channel_type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchConversationById(
  organizationId: string,
  conversationId: string,
): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .eq('organization_id', organizationId)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchMessages(
  organizationId: string,
  conversationId: string,
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function updateConversation(
  organizationId: string,
  conversationId: string,
  input: ConversationUpdate,
): Promise<Conversation> {
  const { data, error } = await supabase
    .from('conversations')
    .update(input as Record<string, unknown>)
    .eq('id', conversationId)
    .eq('organization_id', organizationId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateConversationStatus(
  organizationId: string,
  conversationId: string,
  status: ConversationStatus,
): Promise<Conversation> {
  return updateConversation(organizationId, conversationId, { status });
}

export async function createInternalMessage(
  organizationId: string,
  conversationId: string,
  input: MessageInput,
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      organization_id: organizationId,
      conversation_id: conversationId,
      role: input.role,
      content: input.content,
      channel_type: input.channel_type ?? 'manual',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
