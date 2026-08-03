import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface SupabaseHealthResult {
  connected: boolean;
  configured: boolean;
  url: string;
  tablesStatus?: {
    ig_settings?: boolean;
    ig_dm_rules?: boolean;
    ig_leads?: boolean;
    ig_messages?: boolean;
  };
  error?: string;
}

export async function fetchLiveAutomations(): Promise<any[]> {
  if (!supabase || !isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase.from('ig_dm_rules').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((item: any) => ({
      id: item.id || `auto_${item.id}`,
      title: item.title || item.rule_name || 'Automation Flow',
      description: item.description || `Trigger: ${item.trigger_type || 'comment_dm'}`,
      triggerType: item.trigger_type || 'comment_dm',
      status: item.is_active ? 'live' : 'paused',
      selectedPostIds: item.selected_post_ids || [],
      keywords: item.keywords || (item.trigger_keyword ? [item.trigger_keyword] : []),
      matchRule: item.match_rule || 'contains',
      publicCommentReplies: item.public_comment_replies || [],
      dmMessageText: item.dm_message_text || item.response_text || '',
      dmButtons: item.dm_buttons || [],
      enableFollowUp: item.enable_follow_up || false,
      followUpText: item.follow_up_text || '',
      followUpDelayHours: item.follow_up_delay_hours || 1,
      conditions: item.conditions || { replyOncePerUser: true, requireFollowing: false, captureLead: true },
      stats: item.stats || { triggersCount: item.trigger_count || 0, dmsSent: item.dm_count || 0, leadsCaptured: 0, ctrPercent: 0 },
      createdAt: item.created_at || new Date().toISOString(),
      updatedAt: item.updated_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.error('Error fetching live automations from Supabase:', err);
    return [];
  }
}

export async function saveLiveAutomationToSupabase(auto: any): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const payload = {
      title: auto.title,
      trigger_type: auto.triggerType,
      is_active: auto.status === 'live',
      keywords: auto.keywords,
      match_rule: auto.matchRule,
      public_comment_replies: auto.publicCommentReplies,
      dm_message_text: auto.dmMessageText,
      dm_buttons: auto.dmButtons,
      enable_follow_up: auto.enableFollowUp,
      follow_up_text: auto.followUpText,
      follow_up_delay_hours: auto.followUpDelayHours,
      conditions: auto.conditions,
      stats: auto.stats,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('ig_dm_rules').upsert({ id: auto.id, ...payload });
    return !error;
  } catch (err) {
    console.error('Error saving automation to Supabase:', err);
    return false;
  }
}

export async function fetchLiveLeads(): Promise<any[]> {
  if (!supabase || !isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase.from('ig_leads').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((item: any) => ({
      id: item.id || `lead_${item.id}`,
      handle: item.handle || item.user_handle || 'user',
      name: item.name || item.user_name || item.handle || 'Instagram User',
      avatar: item.avatar || item.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      email: item.email || '',
      phone: item.phone || '',
      sourceAutomation: item.source_automation || item.source || 'Direct DM',
      status: item.status || 'New',
      tags: item.tags || [],
      capturedAt: item.captured_at || item.created_at || new Date().toISOString(),
      lastActive: item.last_active || 'Recently',
    }));
  } catch (err) {
    console.error('Error fetching live leads from Supabase:', err);
    return [];
  }
}

export async function saveLiveLeadToSupabase(lead: any): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const payload = {
      handle: lead.handle,
      name: lead.name,
      avatar_url: lead.avatar,
      email: lead.email,
      phone: lead.phone,
      source_automation: lead.sourceAutomation,
      status: lead.status,
      tags: lead.tags,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('ig_leads').upsert({ id: lead.id, ...payload });
    return !error;
  } catch (err) {
    console.error('Error saving lead to Supabase:', err);
    return false;
  }
}

export async function checkSupabaseConnection(): Promise<SupabaseHealthResult> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      connected: false,
      configured: false,
      url: supabaseUrl || 'Not configured in env',
      error: 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing.',
    };
  }

  try {
    // Attempt a lightweight ping query on the database
    const tables = ['ig_settings', 'ig_dm_rules', 'ig_leads', 'ig_messages'];
    const tablesStatus: Record<string, boolean> = {};

    for (const table of tables) {
      const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
      tablesStatus[table] = !error;
    }

    const connected = Object.values(tablesStatus).some((status) => status);

    return {
      connected: true,
      configured: true,
      url: supabaseUrl,
      tablesStatus,
      error: connected ? undefined : 'Connected to Supabase, but required tables (ig_settings, etc.) may not exist yet.',
    };
  } catch (err: any) {
    return {
      connected: false,
      configured: true,
      url: supabaseUrl,
      error: err?.message || 'Failed to connect to Supabase database',
    };
  }
}
