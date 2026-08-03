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
  const mapItemToAuto = (item: any) => {
    let postIds: string[] = [];
    if (Array.isArray(item.selected_post_ids) && item.selected_post_ids.length > 0) {
      postIds = item.selected_post_ids.map((id: any) => String(id)).filter((id: string) => id !== 'post_1');
    } else if (Array.isArray(item.selectedPostIds) && item.selectedPostIds.length > 0) {
      postIds = item.selectedPostIds.map((id: any) => String(id)).filter((id: string) => id !== 'post_1');
    } else if (item.media_id) {
      postIds = [String(item.media_id)].filter((id: string) => id !== 'post_1');
    }

    const isLive = item.status === 'live' || item.is_active === true || item.active === true || (item.is_active !== false && item.active !== false);

    return {
      id: String(item.id || `auto_${Date.now()}`),
      title: item.title || item.name || item.rule_name || 'Post Automation',
      description: item.description || `Auto-replies for Instagram comments`,
      triggerType: item.trigger_type || item.type || 'comment_dm',
      status: isLive ? 'live' : 'paused',
      selectedPostIds: postIds,
      keywords: Array.isArray(item.keywords)
        ? item.keywords
        : item.trigger_keyword
        ? [item.trigger_keyword]
        : ['PROPERTY', 'INFO', 'LINK'],
      matchRule: item.match_rule || item.match_type || 'contains',
      publicCommentReplies: Array.isArray(item.public_comment_replies)
        ? item.public_comment_replies
        : item.public_reply
        ? [item.public_reply]
        : ['Sent you a DM with the link! 📥'],
      dmMessageText: item.dm_message_text || item.dm_reply || item.response_text || 'Hey there! Thanks for commenting.',
      dmButtons: Array.isArray(item.dm_buttons) ? item.dm_buttons : [],
      enableFollowUp: Boolean(item.enable_follow_up),
      followUpText: item.follow_up_text || '',
      followUpDelayHours: item.follow_up_delay_hours || 1,
      conditions: item.conditions || { replyOncePerUser: true, requireFollowing: false, captureLead: true },
      stats: item.stats || { triggersCount: item.dm_clicks || item.trigger_count || 0, dmsSent: item.dm_count || 0, leadsCaptured: 0, ctrPercent: 0 },
      createdAt: item.created_at || new Date().toISOString(),
      updatedAt: item.updated_at || new Date().toISOString(),
    };
  };

  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('ig_dm_rules').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map(mapItemToAuto);
      }
    } catch (err) {
      console.error('Error fetching live automations from Supabase client:', err);
    }
  }

  try {
    const res = await fetch('/api/ig/dm-rules');
    const json = await res.json();
    if (json.rules && Array.isArray(json.rules) && json.rules.length > 0) {
      return json.rules.map(mapItemToAuto);
    }
  } catch (err) {
    console.error('Error fetching rules from server endpoint:', err);
  }

  return [];
}

export async function saveLiveAutomationToSupabase(auto: any): Promise<boolean> {
  const postIds = Array.isArray(auto.selectedPostIds)
    ? auto.selectedPostIds.map((id: any) => String(id)).filter((id: string) => id !== 'post_1')
    : [];
  const firstPostId = postIds.length > 0 ? postIds[0] : null;

  const payload = {
    id: String(auto.id),
    title: auto.title,
    name: auto.title,
    trigger_type: auto.triggerType || 'comment_dm',
    type: 'comment',
    is_active: auto.status === 'live',
    active: auto.status === 'live',
    selected_post_ids: postIds,
    media_id: firstPostId,
    keywords: auto.keywords || [],
    match_rule: auto.matchRule || 'contains',
    match_type: auto.matchRule || 'contains',
    public_comment_replies: auto.publicCommentReplies || [],
    public_reply: auto.publicCommentReplies && auto.publicCommentReplies.length > 0 ? auto.publicCommentReplies[0] : null,
    dm_message_text: auto.dmMessageText || '',
    dm_reply: auto.dmMessageText || '',
    dm_buttons: auto.dmButtons || [],
    enable_follow_up: Boolean(auto.enableFollowUp),
    follow_up_text: auto.followUpText || '',
    follow_up_delay_hours: auto.followUpDelayHours || 1,
    conditions: auto.conditions || {},
    stats: auto.stats || {},
    updated_at: new Date().toISOString(),
  };

  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('ig_dm_rules').upsert(payload);
      if (error) {
        console.error('Supabase upsert error:', error);
      }
    } catch (err) {
      console.error('Error saving automation to Supabase client:', err);
    }
  }

  try {
    await fetch('/api/ig/dm-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('Backend dm-rules sync warning:', err);
  }

  return true;
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

export async function fetchLiveMessagesFromSupabase(): Promise<any[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('ig_messages')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('Supabase client ig_messages query failed, trying API fallback:', err);
    }
  }

  try {
    const res = await fetch('/api/ig/supabase-messages');
    const json = await res.json();
    if (json?.success && Array.isArray(json.messages)) {
      return json.messages;
    }
  } catch (err) {
    console.error('API fetch for ig_messages failed:', err);
  }

  return [];
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
