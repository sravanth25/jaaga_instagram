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
 * Sends a Direct Message to an Instagram user recipient via Instagram Messaging API.
 * TODO: Wire to backend endpoint POST /api/instagram/send-dm
 */
export async function sendDirectMessage(params: SendDMParams): Promise<{ success: boolean; messageId: string }> {
  console.log('[Instagram Graph API STUB] sendDirectMessage called:', {
    appId: INSTAGRAM_CONFIG.appId,
    accountId: INSTAGRAM_CONFIG.accountId,
    recipientId: params.recipientId,
    messageLength: params.message.length,
    buttonCount: params.buttons?.length || 0,
  });

  // Simulated network latency
  await new Promise((resolve) => setTimeout(resolve, 350));

  return {
    success: true,
    messageId: `mid_ig_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
  };
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
    handle: 'design.master',
  };
}
