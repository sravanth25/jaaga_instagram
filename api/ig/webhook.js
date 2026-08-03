import { GoogleGenAI } from '@google/genai';
import { DEFAULT_JAAGA_SYSTEM_PROMPT } from './ai-test.js';

export default async function handler(req, res) {
  // CORS & Header settings for Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const verifyToken = process.env.IG_VERIFY_TOKEN || process.env.INSTAGRAM_VERIFY_TOKEN || 'jaaga_ig_verify';

  // GET: Meta Webhook Handshake Verification
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'] || req.query['mode'];
    const token = req.query['hub.verify_token'] || req.query['verify_token'];
    const challenge = req.query['hub.challenge'] || req.query['challenge'];

    console.log('[Meta Verification Attempt] Mode:', mode, 'Token:', token);

    if (mode === 'subscribe' && (token === verifyToken || token === 'jaaga_ig_verify' || token === 'dmflow_verify_token_123')) {
      console.log('[Meta Verification Success] Returning challenge:', challenge);
      return res.status(200).send(challenge);
    } else {
      console.warn('[Meta Verification Failed] Token mismatch. Expected:', verifyToken, 'Received:', token);
      return res.status(403).send('Verification failed');
    }
  }

  // POST: Incoming Instagram Webhook Events (Messages, Comments, Mentions)
  if (req.method === 'POST') {
    try {
      const body = req.body;
      console.log('[Instagram Webhook Event]:', JSON.stringify(body, null, 2));

      if (body && (body.object === 'instagram' || body.object === 'page')) {
        const entries = body.entry || [];
        for (const entry of entries) {
          // Process Direct Messages
          if (Array.isArray(entry.messaging)) {
            for (const messagingEvent of entry.messaging) {
              const senderId = messagingEvent.sender?.id;
              const recipientId = messagingEvent.recipient?.id;
              const messageText = messagingEvent.message?.text;
              const isEcho = messagingEvent.message?.is_echo;

              if (messageText && !isEcho && senderId) {
                console.log(`[DM Event] From: ${senderId} -> To: ${recipientId} | Message: "${messageText}"`);

                // Check AI Agent status & process fallback AI response
                const apiKey = process.env.GEMINI_API_KEY;
                if (apiKey) {
                  try {
                    const ai = new GoogleGenAI({ apiKey });
                    const fullPrompt = `${DEFAULT_JAAGA_SYSTEM_PROMPT}\n\nUser Message: ${messageText}`;
                    const response = await ai.models.generateContent({
                      model: 'gemini-3.6-flash',
                      contents: fullPrompt,
                    });
                    const rawReply = response.text || '';
                    const cleanReply = rawReply.replace(/\*/g, '').trim();

                    console.log(`[AI DM Response Generated for ${senderId}]:`, cleanReply);

                    // Send DM via Instagram Graph API v26.0 (matching n8n request structure)
                    const targetToken = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.VITE_INSTAGRAM_ACCESS_TOKEN || process.env.IG_ACCESS_TOKEN;
                    const accountId = process.env.INSTAGRAM_ACCOUNT_ID || '17841462404931884';
                    if (targetToken) {
                      const dmPayload = {
                        recipient: { id: senderId },
                        message: { text: cleanReply },
                      };
                      const dmUrl = `https://graph.instagram.com/v26.0/${accountId}/messages`;
                      console.log(`[Webhook DM Outbound] Sending to ${dmUrl} for recipient ${senderId}...`);
                      await fetch(dmUrl, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${targetToken}`,
                        },
                        body: JSON.stringify(dmPayload),
                      });
                    }
                  } catch (aiErr) {
                    console.error('[Gemini Call Error in DM Webhook]:', aiErr);
                  }
                }
              }
            }
          }

          // Process Comments & Changes
          if (Array.isArray(entry.changes)) {
            for (const change of entry.changes) {
              const field = change.field;
              const value = change.value;
              console.log(`[Change/Comment Event] Field: ${field}`, value);
            }
          }
        }
      }

      // Always return 200 immediately to prevent Meta retry-storms
      return res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
      console.error('[Instagram Webhook Processing Error]:', error);
      // Log error but return 200 so Meta does not retry continuously
      return res.status(200).send('EVENT_RECEIVED');
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
