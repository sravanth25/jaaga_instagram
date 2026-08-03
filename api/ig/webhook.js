import { GoogleGenAI } from '@google/genai';
import { DEFAULT_JAAGA_SYSTEM_PROMPT } from './ai-test.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const verifyToken =
    process.env.IG_VERIFY_TOKEN || process.env.INSTAGRAM_VERIFY_TOKEN || 'jaaga_ig_verify';

  // ---- GET: Meta webhook verification ----
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'] || req.query['mode'];
    const token = req.query['hub.verify_token'] || req.query['verify_token'];
    const challenge = req.query['hub.challenge'] || req.query['challenge'];
    if (mode === 'subscribe' && (token === verifyToken || token === 'jaaga_ig_verify')) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Verification failed');
  }

  // ---- POST: incoming events ----
  if (req.method === 'POST') {
    try {
      const body = req.body;
      console.log('[IG WEBHOOK EVENT]:', JSON.stringify(body));

      const token =
        process.env.IG_ACCESS_TOKEN ||
        process.env.INSTAGRAM_ACCESS_TOKEN ||
        process.env.VITE_INSTAGRAM_ACCESS_TOKEN;
      const accountId =
        process.env.IG_ACCOUNT_ID || process.env.INSTAGRAM_ACCOUNT_ID || '17841462404931884';

      if (body && (body.object === 'instagram' || body.object === 'page')) {
        for (const entry of body.entry || []) {
          // ---- Direct Messages ----
          for (const ev of entry.messaging || []) {
            const senderId = ev.sender?.id;
            const text = ev.message?.text;
            const isEcho = ev.message?.is_echo;
            if (!text || isEcho || !senderId || senderId === accountId) continue;

            console.log(`[DM IN] from ${senderId}: "${text}"`);

            // 1) Build a reply. ALWAYS have a fallback so a DM is answered
            //    even if Gemini is misconfigured or down.
            let reply = 'Thanks for messaging JaaGa! Our team will get back to you shortly. Visit https://www.jaaga.ai or call +91 88851 66880.';
            const apiKey = process.env.GEMINI_API_KEY;
            if (apiKey) {
              try {
                const ai = new GoogleGenAI({ apiKey });
                const result = await ai.models.generateContent({
                  model: 'gemini-2.5-flash', // valid model (was gemini-3.6-flash = invalid)
                  contents: `${DEFAULT_JAAGA_SYSTEM_PROMPT}\n\nUser Message: ${text}`,
                });
                const out = (result.text || '').replace(/\*/g, '').trim();
                if (out) reply = out;
              } catch (aiErr) {
                console.error('[GEMINI ERROR]', aiErr?.message || aiErr);
              }
            } else {
              console.warn('[GEMINI] GEMINI_API_KEY not set — using fallback reply.');
            }

            // 2) Send the DM and LOG the real Graph API response.
            if (!token) {
              console.error('[SEND ABORTED] No access token env var found.');
              continue;
            }
            const dmUrl = `https://graph.instagram.com/v23.0/${accountId}/messages`;
            const resp = await fetch(dmUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ recipient: { id: senderId }, message: { text: reply } }),
            });
            const data = await resp.json().catch(() => ({}));
            console.log('[IG SEND RESULT]', resp.status, JSON.stringify(data));
          }

          // ---- Comments / other changes (log only for now) ----
          for (const change of entry.changes || []) {
            console.log('[CHANGE]', change.field, JSON.stringify(change.value));
          }
        }
      }

      return res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
      console.error('[WEBHOOK ERROR]', error);
      return res.status(200).send('EVENT_RECEIVED');
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}