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
    console.warn('[Instagram DM Graph API] Warning: INSTAGRAM_ACCESS_TOKEN is not set.');
    return {
      success: false,
      error: 'INSTAGRAM_ACCESS_TOKEN is not configured on server.',
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
      console.warn('[Instagram DM Graph API] primary endpoint error:', data);
      console.log(`[Instagram DM Graph API] Retrying fallback: ${fallbackUrl}`);

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
      console.error('[Instagram DM Graph API] Meta API error:', data);
      
      let hint = '';
      const subcode = data?.error?.error_subcode;
      const errType = data?.error?.type;
      const errMsg = data?.error?.message || '';

      if (subcode === 2534014 || recipientId === targetAccountId || errMsg.includes('2534014')) {
        hint = 'Recipient ID is invalid or represents your own Instagram Account ID (17841462404931884). Meta Instagram Graph API requires a scoped user IGSID/PSID (received when a customer messages your page/account first). You cannot send direct messages to your own account ID.';
      } else if (errType === 'OAuthException' || errMsg.toLowerCase().includes('token') || errMsg.toLowerCase().includes('session')) {
        hint = 'Authentication token error. Ensure your Instagram Access Token has instagram_manage_messages permissions and is linked to the Instagram Business Account.';
      }

      return {
        success: false,
        error: data?.error?.message || 'Meta API returned error',
        subcode,
        errorType: errType,
        hint,
        details: data,
        endpointUsed: primaryUrl,
      };
    }
  } catch (err: any) {
    console.error('[Instagram DM Graph API] Exception sending DM:', err);
    return { success: false, error: err.message || 'Network exception', endpointUsed: primaryUrl };
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

// Meta (Facebook / Instagram) Webhook verification & handler
app.get(['/api/ig/webhook', '/api/instagram/webhook', '/api/webhook'], (req, res) => {
  const mode = req.query['hub.mode'] || req.query['mode'];
  const token = req.query['hub.verify_token'] || req.query['verify_token'];
  const challenge = req.query['hub.challenge'] || req.query['challenge'];

  if (mode === 'subscribe' && (token === INSTAGRAM_VERIFY_TOKEN || token === 'jaaga_ig_verify' || token === 'dmflow_verify_token_123')) {
    console.log('[Meta Webhook] Successfully verified webhook challenge token!');
    return res.status(200).send(challenge);
  } else {
    console.warn('[Meta Webhook] Verification failed. Expected token:', INSTAGRAM_VERIFY_TOKEN, 'Received token:', token);
    return res.status(403).send('Verification failed');
  }
});

app.post(['/api/ig/webhook', '/api/instagram/webhook', '/api/webhook'], async (req, res) => {
  console.log('[Meta Webhook] Received webhook payload:', JSON.stringify(req.body, null, 2));

  try {
    const body = req.body;
    if (body && (body.object === 'instagram' || body.object === 'page')) {
      const entries = body.entry || [];
      for (const entry of entries) {
        // Handle Direct Messaging Events
        if (Array.isArray(entry.messaging)) {
          for (const messagingEvent of entry.messaging) {
            const senderId = messagingEvent.sender?.id;
            const recipientId = messagingEvent.recipient?.id;
            const messageText = messagingEvent.message?.text;
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
                matchedRuleTitle = 'Gemini AI Fallback';
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
                id: `evt_${Date.now()}`,
                timestamp: new Date().toISOString(),
                senderId,
                messageText,
                replyText,
                matchedAutomation: matchedRuleTitle,
                apiResult: apiRes,
              });
              if (recentWebhookEvents.length > 50) recentWebhookEvents.pop();
            }
          }
        }

        // Handle Post Comments Events
        if (Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            const field = change.field;
            const value = change.value;
            console.log(`[Meta Webhook Comment Event] Field: ${field}`, JSON.stringify(value, null, 2));

            if (field === 'comments' && value && value.text) {
              const commentId = value.id;
              const commentText = value.text;
              const commenterId = value.from?.id || 'commenter_user';
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
                  id: `evt_${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  senderId: commenterId,
                  messageText: `[Comment on Post]: "${commentText}"`,
                  replyText: evalResult.replyText,
                  matchedAutomation: evalResult.automation.title,
                  apiResult: apiRes,
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

// Endpoint to fetch recent webhook events for the Inbox
app.get(['/api/ig/webhook-events', '/api/ig/events'], (req, res) => {
  return res.json({
    success: true,
    count: recentWebhookEvents.length,
    events: recentWebhookEvents,
  });
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
