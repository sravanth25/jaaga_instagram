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
  apiResult?: any;
}> = [];

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
      return { success: false, error: data?.error?.message || 'Meta API returned error', details: data, endpointUsed: primaryUrl };
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
        if (Array.isArray(entry.messaging)) {
          for (const messagingEvent of entry.messaging) {
            const senderId = messagingEvent.sender?.id;
            const recipientId = messagingEvent.recipient?.id;
            const messageText = messagingEvent.message?.text;
            const isEcho = messagingEvent.message?.is_echo;

            if (messageText && !isEcho && senderId) {
              console.log(`[Meta Webhook] Incoming message from ${senderId}: "${messageText}"`);

              // Generate AI response via Gemini
              let replyText = '';
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

              // Send response back via Instagram Graph API v25.0
              const apiRes = await sendInstagramDM({
                recipientId: senderId,
                text: replyText,
                accountId: recipientId || '17841462404931884',
              });

              recentWebhookEvents.unshift({
                id: `evt_${Date.now()}`,
                timestamp: new Date().toISOString(),
                senderId,
                messageText,
                replyText,
                apiResult: apiRes,
              });
              if (recentWebhookEvents.length > 50) recentWebhookEvents.pop();
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
