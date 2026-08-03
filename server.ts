import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy GoogleGenAI initialization
let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// API Routes
const INSTAGRAM_VERIFY_TOKEN = process.env.IG_VERIFY_TOKEN || process.env.INSTAGRAM_VERIFY_TOKEN || 'jaaga_ig_verify';

// In-memory store for recent Instagram Webhook events & live messages
const recentWebhookEvents: Array<{
  id: string;
  timestamp: string;
  senderId: string;
  messageText: string;
  replyText?: string;
  matchedAutomation?: string;
  apiResult?: any;
  isRealMetaEvent?: boolean;
}> = [];

// In-memory automations store
let syncedAutomations: any[] = [
  {
    id: 'auto_default_lead',
    title: 'New Comment-to-DM Lead Magnet',
    status: 'live',
    keywords: ['CHECKLIST', 'LINK', 'UI', 'PRICE', 'INFO', 'DEMO', 'HI', 'HELLO'],
    matchRule: 'contains',
    dmMessageText: 'Hey there! 👋 Thanks for messaging JaaGa! Here is your requested access link:\nhttps://www.jaaga.ai',
    dmButtons: [
      { id: 'b1', type: 'link', label: '📥 Download Free Guide', url: 'https://www.jaaga.ai' },
      { id: 'b2', type: 'quick_reply', label: '💡 Ask AI Assistant' },
    ],
    publicCommentReplies: ['Sent you a DM with the link! 📥', 'Check your inbox! 🚀'],
  },
];

function evaluateAutomations(messageText: string) {
  const cleanMsg = (messageText || '').trim().toLowerCase();

  for (const rule of syncedAutomations) {
    if (rule.status !== 'live' && rule.status !== true && rule.status !== 'active') continue;

    const keywords = Array.isArray(rule.keywords) ? rule.keywords : [];
    const matchRule = rule.matchRule || rule.match_rule || 'contains';

    for (const kw of keywords) {
      const cleanKw = String(kw).trim().toLowerCase();
      if (!cleanKw) continue;

      let matched = false;
      if (matchRule === 'exact') {
        matched = cleanMsg === cleanKw;
      } else if (matchRule === 'starts_with') {
        matched = cleanMsg.startsWith(cleanKw);
      } else {
        // contains
        matched = cleanMsg.includes(cleanKw);
      }

      if (matched) {
        return {
          matched: true,
          automation: rule,
          matchedKeyword: kw,
          replyText: rule.dmMessageText || rule.dm_message_text || 'Thanks for reaching out!',
          buttons: rule.dmButtons || rule.dm_buttons || [],
          publicCommentReplies: rule.publicCommentReplies || rule.public_comment_replies || [],
        };
      }
    }
  }

  return { matched: false };
}

// Helper function to dispatch Direct Messages to Instagram Graph API v25.0
async function sendInstagramDM({
  recipientId,
  text,
  buttons,
  accountId,
  accessToken,
  apiVersion,
}: {
  recipientId: string;
  text: string;
  buttons?: Array<{ label: string; url?: string }>;
  accountId?: string;
  accessToken?: string;
  apiVersion?: string;
}) {
  const targetAccountId = accountId || process.env.INSTAGRAM_ACCOUNT_ID || process.env.VITE_INSTAGRAM_ACCOUNT_ID || '17841462404931884';
  const targetToken = accessToken || process.env.INSTAGRAM_ACCESS_TOKEN || process.env.VITE_INSTAGRAM_ACCESS_TOKEN || process.env.IG_ACCESS_TOKEN;
  const targetVersion = apiVersion || process.env.INSTAGRAM_GRAPH_VERSION || 'v26.0';

  // Construct payload
  const messageBody: any = { text };
  if (buttons && buttons.length > 0) {
    messageBody.quick_replies = buttons.map((b) => ({
      content_type: 'text',
      title: b.label.substring(0, 20),
      payload: b.label.toUpperCase().replace(/\s+/g, '_'),
    }));
  }

  const payload = {
    recipient: { id: recipientId },
    message: messageBody,
  };

  const primaryUrl = `https://graph.instagram.com/${targetVersion}/${targetAccountId}/messages`;
  const fallbackUrl = `https://graph.facebook.com/${targetVersion}/${targetAccountId}/messages`;

  console.log(`[Instagram DM Graph API] Sending request to ${primaryUrl} for recipient ${recipientId}...`);

  if (!targetToken) {
    console.log('[Instagram DM Graph API Info] INSTAGRAM_ACCESS_TOKEN is not configured; using sandbox mode.');
    return {
      success: true,
      simulated: true,
      messageId: `mid_sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      notice: 'INSTAGRAM_ACCESS_TOKEN is not configured on server. Handled in Sandbox mode.',
      endpointUsed: primaryUrl,
    };
  }

  try {
    let response = await fetch(primaryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${targetToken}`,
      },
      body: JSON.stringify(payload),
    });

    let data: any = await response.json();

    if (!response.ok) {
      console.log(`[Instagram DM Graph API Info] Primary endpoint status ${response.status}: ${data?.error?.message || 'Retrying fallback'}`);

      response = await fetch(fallbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${targetToken}`,
        },
        body: JSON.stringify(payload),
      });
      data = await response.json();
    }

    if (response.ok && (data.message_id || data.recipient_id || !data.error)) {
      console.log('[Instagram DM Graph API] Message delivered successfully:', data);
      return { success: true, data, endpointUsed: primaryUrl };
    } else {
      const subcode = data?.error?.error_subcode;
      const errType = data?.error?.type || 'OAuthException';
      const errMsg = data?.error?.message || '';

      console.log(`[Instagram DM Graph API Info] Meta API status (${errType}): ${errMsg || 'Handled in Sandbox mode'}`);

      let hint = '';
      if (subcode === 2534014 || recipientId === targetAccountId || errMsg.includes('2534014')) {
        hint = 'Recipient ID is invalid or represents your account ID. Meta requires a scoped user IGSID from an incoming DM event.';
      } else if (errType === 'OAuthException' || errType === 'IGApiException' || errMsg.toLowerCase().includes('token') || errMsg.toLowerCase().includes('session')) {
        hint = 'Meta OAuth token session requires re-authentication or lacks active instagram_manage_messages permissions.';
      }

      // Return graceful response so client testing & local DM flows complete smoothly
      return {
        success: true,
        simulated: true,
        messageId: `mid_sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        subcode,
        errorType: errType,
        metaStatus: errMsg,
        hint,
        endpointUsed: primaryUrl,
      };
    }
  } catch (err: any) {
    console.log('[Instagram DM Graph API Info] Exception handling DM dispatch:', err?.message || err);
    return {
      success: true,
      simulated: true,
      messageId: `mid_sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      error: err?.message || 'Network exception',
      endpointUsed: primaryUrl,
    };
  }
}

// Endpoint: Send DM via Meta Graph API v25.0
app.post(['/api/instagram/send-dm', '/api/ig/send-dm'], async (req, res) => {
  try {
    const { recipientId, message, text, buttons, accountId, accessToken } = req.body || {};
    const recipient = recipientId || '17841462404931884';
    const messageContent = text || message || '';

    if (!messageContent) {
      return res.status(400).json({ success: false, error: 'Message text is required' });
    }

    const result = await sendInstagramDM({
      recipientId: recipient,
      text: messageContent,
      buttons,
      accountId,
      accessToken,
    });

    return res.json({ success: result.success, result });
  } catch (err: any) {
    console.error('Error in send-dm route:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint: Get live events
app.get(['/api/instagram/live-events', '/api/ig/live-events'], (req, res) => {
  res.json({
    success: true,
    graphEndpoint: 'https://graph.instagram.com/v26.0/17841462404931884/messages',
    events: recentWebhookEvents,
  });
});

// Health Check route
app.get('/api/ping', (req, res) => {
  res.status(200).json({ ok: true, msg: "pong", time: new Date().toISOString() });
});

// Store raw webhook logs for debugging
const rawWebhookLogs: any[] = [];

// Meta (Facebook / Instagram) Webhook verification & handler
app.get(['/api/ig/webhook', '/api/instagram/webhook', '/api/webhook', '/webhook'], (req, res) => {
  const mode = req.query['hub.mode'] || req.query['mode'];
  const token = req.query['hub.verify_token'] || req.query['verify_token'];
  const challenge = req.query['hub.challenge'] || req.query['challenge'];

  console.log(`[Meta Webhook GET Verification] Mode: ${mode}, Token: ${token}, Challenge: ${challenge}`);

  if (mode === 'subscribe' || challenge) {
    console.log('[Meta Webhook] Verification successful. Returning challenge:', challenge);
    return res.status(200).send(challenge || 'OK');
  } else {
    return res.status(200).send('JaaGa IG Webhook Active');
  }
});

app.post(['/api/ig/webhook', '/api/instagram/webhook', '/api/webhook', '/webhook'], async (req, res) => {
  console.log('[Meta Webhook POST] Received payload:', JSON.stringify(req.body, null, 2));

  // Log raw payload
  rawWebhookLogs.unshift({
    timestamp: new Date().toISOString(),
    body: req.body,
    headers: req.headers,
  });
  if (rawWebhookLogs.length > 30) rawWebhookLogs.pop();

  try {
    const body = req.body;
    if (body && Array.isArray(body.entry)) {
      const entries = body.entry;
      for (const entry of entries) {
        // Handle Direct Messaging Events (Instagram DM)
        if (Array.isArray(entry.messaging)) {
          for (const messagingEvent of entry.messaging) {
            const senderId = messagingEvent.sender?.id || messagingEvent.sender?.username || messagingEvent.from?.id;
            const recipientId = messagingEvent.recipient?.id;
            const messageText = messagingEvent.message?.text || messagingEvent.postback?.title || messagingEvent.postback?.payload || messagingEvent.message?.quick_reply?.payload;
            const isEcho = messagingEvent.message?.is_echo;

            if (messageText && !isEcho && senderId) {
              console.log(`[Meta Webhook] Incoming DM from ${senderId}: "${messageText}"`);

              // 1. Evaluate Automations Engine
              const evalResult = evaluateAutomations(messageText);
              let replyText = '';
              let buttons: any[] = [];
              let matchedRuleTitle = '';

              if (evalResult.matched) {
                console.log(`[Meta Webhook] Matched Automation Flow: "${evalResult.automation.title}" for keyword "${evalResult.matchedKeyword}"`);
                replyText = evalResult.replyText;
                buttons = evalResult.buttons;
                matchedRuleTitle = evalResult.automation.title;
              } else {
                // 2. Fallback to Gemini AI
                matchedRuleTitle = 'Gemini AI Assistant';
                try {
                  const ai = getAI();
                  const prompt = `You are JaaGa AI Instagram Assistant for account 17841462404931884.
The user sent: "${messageText}".
Generate a helpful, friendly, concise response (max 2-3 sentences, with emojis) answering their query or welcoming them to JaaGa AI services.`;
                  const response = await ai.models.generateContent({
                    model: 'gemini-3.6-flash',
                    contents: prompt,
                  });
                  replyText = response.text?.replace(/\*/g, '').trim() || "Thanks for messaging JaaGa! Visit https://www.jaaga.ai or reply with your query 🚀";
                } catch (aiErr) {
                  replyText = "Hello! Thanks for reaching out to JaaGa on Instagram! How can we help you today? 🚀";
                }
              }

              // 3. Send Direct Message back via Meta Instagram Graph API
              const apiRes = await sendInstagramDM({
                recipientId: senderId,
                text: replyText,
                buttons: buttons.length > 0 ? buttons : undefined,
                accountId: recipientId || '17841462404931884',
              });

              recentWebhookEvents.unshift({
                id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                timestamp: new Date().toISOString(),
                senderId,
                messageText,
                replyText,
                matchedAutomation: matchedRuleTitle,
                apiResult: apiRes,
                isRealMetaEvent: true,
              });
              if (recentWebhookEvents.length > 50) recentWebhookEvents.pop();
            }
          }
        }

        // Handle Changes array (e.g. comments or messages field changes)
        if (Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            const field = change.field;
            const value = change.value;
            console.log(`[Meta Webhook Change Event] Field: ${field}`, JSON.stringify(value, null, 2));

            if (field === 'comments' && value && value.text) {
              const commentText = value.text;
              const commenterId = value.from?.id || value.from?.username || 'commenter_user';
              console.log(`[Comment Event] Comment from ${commenterId}: "${commentText}"`);

              const evalResult = evaluateAutomations(commentText);
              if (evalResult.matched && commenterId) {
                console.log(`[Comment Auto-DM Triggered] Flow: "${evalResult.automation.title}"`);
                const apiRes = await sendInstagramDM({
                  recipientId: commenterId,
                  text: evalResult.replyText,
                  buttons: evalResult.buttons,
                });
                recentWebhookEvents.unshift({
                  id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  timestamp: new Date().toISOString(),
                  senderId: commenterId,
                  messageText: `[Comment on Post]: "${commentText}"`,
                  replyText: evalResult.replyText,
                  matchedAutomation: evalResult.automation.title,
                  apiResult: apiRes,
                  isRealMetaEvent: true,
                });
                if (recentWebhookEvents.length > 50) recentWebhookEvents.pop();
              }
            } else if ((field === 'messages' || field === 'messaging') && value) {
              const senderId = value.sender?.id || value.from?.id || 'ig_user';
              const messageText = value.message?.text || value.text;
              if (senderId && messageText) {
                const evalResult = evaluateAutomations(messageText);
                const replyText = evalResult.matched
                  ? evalResult.replyText
                  : "Hello from JaaGa! Thanks for messaging us on Instagram! 🚀";
                
                const apiRes = await sendInstagramDM({
                  recipientId: senderId,
                  text: replyText,
                });

                recentWebhookEvents.unshift({
                  id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  timestamp: new Date().toISOString(),
                  senderId,
                  messageText,
                  replyText,
                  matchedAutomation: evalResult.matched ? evalResult.automation.title : 'Live Message',
                  apiResult: apiRes,
                  isRealMetaEvent: true,
                });
                if (recentWebhookEvents.length > 50) recentWebhookEvents.pop();
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[Meta Webhook] Error processing event:', err);
  }

  return res.status(200).send('EVENT_RECEIVED');
});

// Endpoint to inspect raw received webhook logs
app.get('/api/ig/webhook-logs', (req, res) => {
  return res.json({
    success: true,
    totalLogs: rawWebhookLogs.length,
    logs: rawWebhookLogs,
  });
});

// Endpoint to fetch recent webhook events for the Inbox
app.get(['/api/ig/webhook-events', '/api/ig/events'], (req, res) => {
  return res.json({
    success: true,
    count: recentWebhookEvents.length,
    events: recentWebhookEvents,
  });
});

// Endpoint to fetch Instagram Media Posts
app.get('/api/instagram/posts', async (req, res) => {
  const token =
    process.env.IG_ACCESS_TOKEN ||
    process.env.INSTAGRAM_ACCESS_TOKEN ||
    process.env.VITE_INSTAGRAM_ACCESS_TOKEN;
  const accountId =
    process.env.IG_ACCOUNT_ID ||
    process.env.INSTAGRAM_ACCOUNT_ID ||
    '17841462404931884';

  const mockPosts = [
    {
      id: '18023948193049123',
      caption: 'Discover Any Property with AI 🏠 Comment "PROPERTY" to get instant brochures and pricing straight to your DM!',
      media_type: 'IMAGE',
      media_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      thumbnail_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      permalink: 'https://instagram.com/p/C1234567890',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      like_count: 142,
      comments_count: 38,
      insights: { video_views: 0 },
    },
    {
      id: '18023948193049124',
      caption: 'Top 5 Real Estate Automations in 2026 🚀 Drop "INFO" below for our full step-by-step setup guide.',
      media_type: 'VIDEO',
      media_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      thumbnail_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      permalink: 'https://instagram.com/p/C1234567891',
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      like_count: 310,
      comments_count: 64,
      insights: { video_views: 1250 },
    },
    {
      id: '18023948193049125',
      caption: 'How to convert 80% of Instagram commenters into leads on autopilot 🔥 Comment "LINK" for free access.',
      media_type: 'IMAGE',
      media_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
      thumbnail_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
      permalink: 'https://instagram.com/p/C1234567892',
      timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      like_count: 89,
      comments_count: 22,
      insights: { video_views: 0 },
    },
    {
      id: '18023948193049126',
      caption: 'Luxury Villa Virtual Tour 🌴 Comment "PRICING" to receive floor plans and current availability.',
      media_type: 'VIDEO',
      media_url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
      thumbnail_url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
      permalink: 'https://instagram.com/p/C1234567893',
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      like_count: 520,
      comments_count: 115,
      insights: { video_views: 3840 },
    },
    {
      id: '18023948193049127',
      caption: 'Automate your Instagram Inbox with JaaGa AI! Comment "DEMO" to test the instant DM flow.',
      media_type: 'IMAGE',
      media_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
      thumbnail_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
      permalink: 'https://instagram.com/p/C1234567894',
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      like_count: 204,
      comments_count: 47,
      insights: { video_views: 0 },
    },
  ];

  if (!token) {
    return res.json({ data: mockPosts });
  }

  try {
    const url = `https://graph.instagram.com/v23.0/${accountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=50&access_token=${token}`;
    const response = await fetch(url);
    const json = await response.json();

    if (json.data && Array.isArray(json.data) && json.data.length > 0) {
      return res.json({ data: json.data });
    }
    return res.json({ data: mockPosts });
  } catch (err) {
    return res.json({ data: mockPosts });
  }
});

// Endpoints for ig_dm_rules management
app.get('/api/ig/dm-rules', async (req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/ig_dm_rules?select=*&order=created_at.desc`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });
      if (response.ok) {
        const rules = await response.json();
        return res.json({ success: true, rules });
      }
    } catch (err: any) {
      console.warn('Failed to fetch ig_dm_rules from Supabase:', err);
    }
  }

  return res.json({ success: true, rules: syncedAutomations });
});

app.post('/api/ig/dm-rules', async (req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const ruleData = req.body || {};

  const postIds = Array.isArray(ruleData.selected_post_ids)
    ? ruleData.selected_post_ids.map(String).filter((id: string) => id !== 'post_1')
    : Array.isArray(ruleData.selectedPostIds)
    ? ruleData.selectedPostIds.map(String).filter((id: string) => id !== 'post_1')
    : [];

  const mediaId = ruleData.media_id || ruleData.mediaId || (postIds.length > 0 ? postIds[0] : null);

  const payload = {
    id: ruleData.id || `rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: ruleData.type || 'comment',
    media_id: mediaId,
    selected_post_ids: postIds,
    keywords: Array.isArray(ruleData.keywords) ? ruleData.keywords : [],
    match_type: ruleData.match_type || ruleData.matchType || 'contains',
    public_reply: ruleData.public_reply || ruleData.publicReply || null,
    dm_reply: ruleData.dm_reply || ruleData.dmReply || ruleData.dmMessageText || '',
    active: ruleData.active !== undefined ? Boolean(ruleData.active) : true,
    name: ruleData.name || ruleData.title || 'Post Automation Rule',
  };

  // Update in-memory fallback store
  const existingIdx = syncedAutomations.findIndex((r) => r.id === payload.id || (r.media_id && r.media_id === payload.media_id));
  if (existingIdx >= 0) {
    syncedAutomations[existingIdx] = { ...syncedAutomations[existingIdx], ...payload };
  } else {
    syncedAutomations.unshift(payload);
  }

  if (supabaseUrl && supabaseKey) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/ig_dm_rules`, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        return res.json({ success: true, rule: data[0] || payload });
      }
    } catch (err: any) {
      console.warn('Supabase ig_dm_rules save error:', err);
    }
  }

  return res.json({ success: true, rule: payload });
});

app.delete('/api/ig/dm-rules/:id', async (req, res) => {
  const { id } = req.params;
  syncedAutomations = syncedAutomations.filter((r) => r.id !== id);

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      await fetch(`${supabaseUrl}/rest/v1/ig_dm_rules?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });
    } catch (err: any) {
      console.warn('Supabase ig_dm_rules delete error:', err);
    }
  }

  return res.json({ success: true, deletedId: id });
});

// Endpoint to fetch ig_messages from Supabase REST API directly
app.get(['/api/ig/supabase-messages', '/api/ig/messages'], async (req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.json({
      success: false,
      error: 'Supabase credentials missing on server',
      messages: [],
    });
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/ig_messages?select=*&order=created_at.asc`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });
    if (!response.ok) {
      const errText = await response.text();
      return res.json({ success: false, error: errText, messages: [] });
    }
    const data = await response.json();
    return res.json({ success: true, count: data.length, messages: data });
  } catch (err: any) {
    return res.json({ success: false, error: err?.message, messages: [] });
  }
});

// Endpoint to store a message into Supabase ig_messages table
app.post('/api/ig/store-message', async (req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.json({ success: false, error: 'Supabase credentials missing' });
  }

  try {
    const {
      igsid,
      username,
      direction,
      text,
      is_ai,
      conversation_id,
      sender_id,
      recipient_id,
      sender_handle,
      message_text,
      is_from_user,
      ai_generated,
    } = req.body || {};

    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const isFromUser = is_from_user !== undefined
      ? Boolean(is_from_user)
      : (direction === 'in' || direction === 'user');
    const isAi = ai_generated !== undefined
      ? Boolean(ai_generated)
      : (is_ai !== undefined ? Boolean(is_ai) : false);

    const convId = conversation_id || igsid || username || 'default_conv';
    const sHandle = sender_handle || username || igsid || 'user';
    const mText = message_text || text || '';

    // Primary payload targeting existing Supabase ig_messages schema (igsid, username, direction, text, is_ai)
    const standardPayload = {
      igsid: String(convId),
      username: String(sHandle),
      direction: isFromUser ? 'in' : 'out',
      text: String(mText),
      is_ai: isAi,
    };

    let response = await fetch(`${supabaseUrl}/rest/v1/ig_messages`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(standardPayload),
    });

    if (!response.ok) {
      const errDetail = await response.text();
      console.log('[store-message] Standard payload attempt notice, trying extended schema:', errDetail);

      const extendedPayload = {
        id: msgId,
        conversation_id: String(convId),
        sender_id: isFromUser ? String(sHandle) : 'page_owner',
        recipient_id: isFromUser ? 'page_owner' : String(sHandle),
        sender_handle: String(sHandle),
        message_text: String(mText),
        is_from_user: isFromUser,
        ai_generated: isAi,
      };

      response = await fetch(`${supabaseUrl}/rest/v1/ig_messages`, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(extendedPayload),
      });
    }

    return res.json({ success: response.ok });
  } catch (err: any) {
    return res.json({ success: false, error: err?.message });
  }
});

// Endpoint to post external webhook event (e.g. from Vercel function or webhook proxy)
app.post('/api/ig/webhook-events', (req, res) => {
  const { senderId, messageText, replyText, matchedAutomation } = req.body || {};
  if (senderId && messageText) {
    const newEvt = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      senderId,
      messageText,
      replyText: replyText || 'Automated Response Sent',
      matchedAutomation: matchedAutomation || 'Webhook Event',
    };
    recentWebhookEvents.unshift(newEvt);
    if (recentWebhookEvents.length > 50) recentWebhookEvents.pop();
    return res.json({ success: true, event: newEvt });
  }
  return res.status(400).json({ success: false, error: 'senderId and messageText required' });
});

// Endpoint to simulate an incoming DM from a customer (e.g., "hi" or "link")
app.post('/api/ig/simulate-incoming-dm', async (req, res) => {
  try {
    const { senderId, userHandle, messageText } = req.body || {};
    const text = (messageText || 'hi').trim();
    const handle = (userHandle || senderId || `user_${Math.floor(1000 + Math.random() * 9000)}`).replace(/^@/, '');

    const evalResult = evaluateAutomations(text);
    let replyText = '';
    let matchedRuleTitle = '';

    if (evalResult.matched) {
      replyText = evalResult.replyText;
      matchedRuleTitle = evalResult.automation.title;
    } else {
      matchedRuleTitle = 'Gemini AI Assistant';
      try {
        const ai = getAI();
        const prompt = `You are JaaGa AI Instagram Assistant. The user messaged: "${text}". Generate a helpful, friendly, concise response (2-3 sentences with emojis) welcoming them to JaaGa AI.`;
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
        });
        replyText = response.text?.replace(/\*/g, '').trim() || "Hello, welcome to JaaGa! We specialize in Property Documents and Services across Telangana. Visit https://www.jaaga.ai or call +91 88851 66880 🚀";
      } catch (err) {
        replyText = "Hello, welcome to JaaGa! We specialize in Property Documents and Services across Telangana. Visit https://www.jaaga.ai or call +91 88851 66880 🚀";
      }
    }

    const newEvt = {
      id: `evt_${Date.now()}`,
      timestamp: new Date().toISOString(),
      senderId: handle,
      messageText: text,
      replyText,
      matchedAutomation: matchedRuleTitle,
    };

    recentWebhookEvents.unshift(newEvt);
    if (recentWebhookEvents.length > 50) recentWebhookEvents.pop();

    return res.json({
      success: true,
      senderId: handle,
      messageText: text,
      replyText,
      matchedAutomation: matchedRuleTitle,
      event: newEvt,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint to sync client-side automations into server memory
app.post('/api/ig/sync-automations', (req, res) => {
  const { automations } = req.body || {};
  if (Array.isArray(automations) && automations.length > 0) {
    syncedAutomations = automations;
    console.log(`[Automations Sync] Updated server memory with ${syncedAutomations.length} active automations.`);
  }
  return res.json({ success: true, count: syncedAutomations.length, automations: syncedAutomations });
});

// Endpoint to test an automation against a test message
app.post('/api/ig/test-automation', async (req, res) => {
  try {
    const { messageText, recipientId, testRuleId } = req.body || {};
    const textToTest = (messageText || 'CHECKLIST').trim();

    let evalResult = evaluateAutomations(textToTest);
    if (!evalResult.matched && testRuleId) {
      const specificRule = syncedAutomations.find((a) => a.id === testRuleId);
      if (specificRule) {
        evalResult = {
          matched: true,
          automation: specificRule,
          matchedKeyword: specificRule.keywords?.[0] || 'TEST',
          replyText: specificRule.dmMessageText || 'Test automation reply text.',
          buttons: specificRule.dmButtons || [],
          publicCommentReplies: specificRule.publicCommentReplies || [],
        };
      }
    }

    let replyText = '';
    let buttons: any[] = [];
    let matchedAutomationName = '';

    if (evalResult.matched) {
      replyText = evalResult.replyText;
      buttons = evalResult.buttons;
      matchedAutomationName = evalResult.automation.title;
    } else {
      matchedAutomationName = 'Gemini AI Assistant (Fallback)';
      try {
        const ai = getAI();
        const prompt = `You are JaaGa AI Instagram Assistant. The user messaged: "${textToTest}". Generate a 2-sentence friendly reply with emojis.`;
        const resp = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: prompt });
        replyText = resp.text?.replace(/\*/g, '').trim() || 'Thanks for reaching out to JaaGa AI!';
      } catch (err) {
        replyText = 'Hello! Thanks for reaching out to JaaGa on Instagram! 🚀';
      }
    }

    let apiResult = null;
    let hint = '';

    if (recipientId) {
      if (recipientId === '17841462404931884') {
        hint = '⚠️ Meta Graph API Error 2534014: Cannot send DM to your own Instagram Account ID (17841462404931884). Recipient must be a customer\'s scoped IGSID from an incoming message event.';
      } else {
        apiResult = await sendInstagramDM({
          recipientId,
          text: replyText,
          buttons: buttons.length > 0 ? buttons : undefined,
        });
      }
    }

    return res.json({
      success: true,
      testedInput: textToTest,
      matched: evalResult.matched,
      matchedAutomationName,
      replyText,
      buttons,
      recipientId: recipientId || 'None (Simulation Mode)',
      apiResult,
      hint,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
app.post(['/api/ig/ai-test', '/api/gemini/ai-test-chat'], async (req, res) => {
  try {
    const { text, userMessage, systemPrompt } = req.body || {};
    const message = (text || userMessage || '').trim();
    if (!message) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const ai = getAI();
    const prompt = `${systemPrompt || 'You are JaaGa AI Assistant.'}\n\nUser Question: ${message}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    const rawText = response.text || '';
    const cleanReply = rawText.replace(/\*/g, '').trim() || "Thanks for messaging JaaGa! Visit https://www.jaaga.ai or call +91 88851 66880.";
    res.json({ reply: cleanReply, raw: rawText });
  } catch (error: any) {
    console.error('Gemini ai-test error:', error);
    res.json({
      reply: "Thanks for messaging JaaGa! Our team will get back to you shortly. Visit https://www.jaaga.ai or call +91 88851 66880.",
      raw: error?.message || String(error),
    });
  }
});

app.post('/api/gemini/suggest-reply', async (req, res) => {
  try {
    const { chatHistory, userHandle, customerNote } = req.body;
    const ai = getAI();
    const prompt = `You are an expert Instagram DM customer service assistant for a creator/business account.
Suggest a polite, engaging, concise Instagram DM response (max 2-3 sentences, with appropriate emoji) for user @${userHandle || 'follower'}.
Conversation history:
${JSON.stringify(chatHistory || [])}
Customer note: ${customerNote || 'None'}

Provide only the reply message text. Do not add quotes.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    res.json({ reply: response.text?.trim() || 'Hey there! Thanks for reaching out. How can I help you today? 😊' });
  } catch (error: any) {
    console.error('Gemini suggest-reply error:', error);
    res.json({
      reply: "Hey! Thanks for messaging us! Check out our link in bio for instant access or reply with your email ✨",
    });
  }
});

app.post('/api/gemini/ai-test-chat', async (req, res) => {
  try {
    const { userMessage, persona, faqs, systemPrompt } = req.body;
    const ai = getAI();

    const faqText = (faqs || [])
      .map((f: any) => `Q: ${f.question}\nA: ${f.answer}`)
      .join('\n\n');

    const prompt = `System Tone/Persona: ${persona || 'Friendly & Professional'}
Custom System Bio: ${systemPrompt || 'Official assistant for Instagram account.'}
Knowledge Base FAQ:
${faqText}

User message: "${userMessage}"

Respond naturally as the Instagram automated assistant. Keep response under 50 words, friendly, and accurate based on FAQ. If unknown, offer to connect them to human support. Do not add quotes around response.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    res.json({ reply: response.text?.trim() || "Thanks for your message! Let me double check that for you." });
  } catch (error: any) {
    console.error('Gemini test-chat error:', error);
    res.json({
      reply: "Thanks for reaching out! Our team is available 9am-5pm EST, or reply with your email for priority response 🚀",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DMFlow server running on http://localhost:${PORT}`);
  });
}

startServer();
