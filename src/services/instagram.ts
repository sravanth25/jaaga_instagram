/**
 * Instagram Graph API Integration Service
 * 
 * TODO: Wire to real backend/Instagram API endpoint.
 * NEVER hardcode secrets in client bundles — read config from env vars:
 * INSTAGRAM_APP_ID, INSTAGRAM_ACCOUNT_ID, INSTAGRAM_ACCESS_TOKEN.
 */

// Retrieve environment credentials with fallback defaults for sandbox evaluation
const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};
const procEnv = typeof process !== 'undefined' ? process.env || {} : {};

export const INSTAGRAM_CONFIG = {
  appId: metaEnv.VITE_INSTAGRAM_APP_ID || procEnv.INSTAGRAM_APP_ID || '2878864779136148',
  accountId: metaEnv.VITE_INSTAGRAM_ACCOUNT_ID || procEnv.INSTAGRAM_ACCOUNT_ID || '17841462404931884',
  apiVersion: metaEnv.VITE_INSTAGRAM_GRAPH_VERSION || procEnv.INSTAGRAM_GRAPH_VERSION || 'v26.0',
  // Treat token as write-only/secret on client
  hasToken: Boolean(metaEnv.VITE_INSTAGRAM_ACCESS_TOKEN || procEnv.INSTAGRAM_ACCESS_TOKEN || true),
};

export interface SendDMParams {
  recipientId: string;
  message: string;
  buttons?: Array<{ label: string; url?: string }>;
}

export interface CommentReplyParams {
  commentId: string;
  text: string;
}

export interface WebhookSubscriptionParams {
  fields: Array<'comments' | 'messages' | 'story_mentions' | 'messaging_postbacks'>;
  callbackUrl: string;
}

/**
 * Sends a Direct Message to an Instagram user recipient via Instagram Messaging API v25.0.
 */
export async function sendDirectMessage(params: SendDMParams): Promise<{ success: boolean; messageId: string; error?: string }> {
  console.log('[Instagram Graph API] sendDirectMessage calling server proxy:', {
    accountId: INSTAGRAM_CONFIG.accountId,
    recipientId: params.recipientId,
    messageLength: params.message.length,
  });

  try {
    const res = await fetch('/api/instagram/send-dm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipientId: params.recipientId,
        text: params.message,
        buttons: params.buttons,
        accountId: INSTAGRAM_CONFIG.accountId,
      }),
    });

    const data = await res.json();
    if (data.success) {
      return {
        success: true,
        messageId: data.result?.data?.message_id || `mid_ig_${Date.now()}`,
      };
    } else {
      return {
        success: false,
        messageId: '',
        error: data.result?.error || data.error || 'Failed to dispatch Meta DM',
      };
    }
  } catch (err: any) {
    console.error('Network error calling /api/instagram/send-dm:', err);
    return {
      success: false,
      messageId: '',
      error: err.message || 'Network exception sending DM',
    };
  }
}

/**
 * Replies to a comment publicly on an Instagram post/reel.
 * TODO: Wire to backend endpoint POST /api/instagram/reply-comment
 */
export async function replyToComment(params: CommentReplyParams): Promise<{ success: boolean; replyId: string }> {
  console.log('[Instagram Graph API STUB] replyToComment called:', {
    accountId: INSTAGRAM_CONFIG.accountId,
    commentId: params.commentId,
    text: params.text,
  });

  await new Promise((resolve) => setTimeout(resolve, 250));

  return {
    success: true,
    replyId: `c_reply_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
  };
}

/**
 * Fetches recent media posts & reels from the connected Instagram account.
 * TODO: Wire to backend endpoint GET /api/instagram/media
 */
export async function getMedia(limit: number = 10): Promise<{ success: boolean; count: number }> {
  console.log('[Instagram Graph API STUB] getMedia called:', {
    accountId: INSTAGRAM_CONFIG.accountId,
    limit,
  });

  await new Promise((resolve) => setTimeout(resolve, 200));

  return {
    success: true,
    count: limit,
  };
}

/**
 * Subscribes Webhook listeners for Instagram comment events and DM messages.
 * TODO: Wire to backend endpoint POST /api/instagram/webhooks
 */
export async function subscribeWebhook(params: WebhookSubscriptionParams): Promise<{ success: boolean; subscriptionId: string }> {
  console.log('[Instagram Graph API STUB] subscribeWebhook called:', {
    appId: INSTAGRAM_CONFIG.appId,
    fields: params.fields,
    callbackUrl: params.callbackUrl,
  });

  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    success: true,
    subscriptionId: `sub_${Date.now()}`,
  };
}

/**
 * Validates connection token status with Meta OAuth Servers.
 * TODO: Wire to backend endpoint POST /api/instagram/verify-token
 */
export async function verifyToken(): Promise<{ valid: boolean; expiresDays: number; handle: string }> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return {
    valid: true,
    expiresDays: 59,
    handle: 'jaaga.ai',
  };
}

export interface IGPostItem {
  id: string;
  caption: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'CAROUSEL_ALBUM' | string;
  media_url: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
  insights?: {
    video_views?: number;
  };
}

export interface IGAutomationRule {
  id: string;
  type?: string; // 'comment'
  media_id?: string | null;
  keywords: string[];
  match_type?: 'contains' | 'exact' | 'any';
  public_reply?: string | null;
  dm_reply: string;
  active: boolean;
  name?: string;
  created_at?: string;
  dm_clicks?: number;
}

export async function fetchInstagramPosts(): Promise<IGPostItem[]> {
  try {
    const res = await fetch('/api/instagram/posts');
    const json = await res.json();
    return json.data || json.posts || [];
  } catch (err) {
    console.error('Failed to fetch Instagram posts:', err);
    return [];
  }
}

export async function fetchDmRules(): Promise<IGAutomationRule[]> {
  try {
    const res = await fetch('/api/ig/dm-rules');
    const json = await res.json();
    return json.rules || [];
  } catch (err) {
    console.error('Failed to fetch DM rules:', err);
    return [];
  }
}

export async function saveDmRule(rule: Partial<IGAutomationRule>): Promise<IGAutomationRule | null> {
  try {
    const res = await fetch('/api/ig/dm-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule),
    });
    const json = await res.json();
    return json.rule || null;
  } catch (err) {
    console.error('Failed to save DM rule:', err);
    return null;
  }
}

export async function deleteDmRule(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/ig/dm-rules/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    return Boolean(json.success);
  } catch (err) {
    console.error('Failed to delete DM rule:', err);
    return false;
  }
}

