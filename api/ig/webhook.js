// Replace api/ig/webhook.js with this file.
// Same working AI reply as before, PLUS it stores every inbound and outbound
// message into the ig_messages table (via Supabase REST + the service key).

import { GoogleGenAI } from '@google/genai';
import { DEFAULT_JAAGA_SYSTEM_PROMPT } from './ai-test.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function storeMessage(row) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('[STORE SKIP] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    return;
  }
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/ig_messages`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    });
    if (!r.ok) console.error('[STORE ERROR]', r.status, await r.text());
    else console.log('[STORED]', row.direction, row.igsid);
  } catch (e) {
    console.error('[STORE EXCEPTION]', e?.message || e);
  }
}

async function fetchUsername(igsid, token, base) {
  try {
    const r = await fetch(`${base}/${igsid}?fields=username&access_token=${token}`);
    const d = await r.json();
    return d?.username || null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const verifyToken =
    process.env.IG_VERIFY_TOKEN || process.env.INSTAGRAM_VERIFY_TOKEN || 'jaaga_ig_verify';

  // ---- GET: Meta verification ----
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
      const base = 'https://graph.instagram.com/v23.0';

      if (body && (body.object === 'instagram' || body.object === 'page')) {
        for (const entry of body.entry || []) {
          for (const ev of entry.messaging || []) {
            const senderId = ev.sender?.id;
            const text = ev.message?.text;
            const isEcho = ev.message?.is_echo;
            if (!text || isEcho || !senderId || senderId === accountId) continue;

            console.log(`[DM IN] from ${senderId}: "${text}"`);

            const username = await fetchUsername(senderId, token, base);

            // 1) store the incoming message
            await storeMessage({ igsid: senderId, username, direction: 'in', text, is_ai: false });

            // 2) build a reply (AI if configured, else fallback)
            let reply =
              'Thanks for messaging JaaGa! Our team will get back to you shortly. Visit https://www.jaaga.ai or call +91 88851 66880.';
            let isAi = false;
            const apiKey = process.env.GEMINI_API_KEY;
            if (apiKey) {
              try {
                const ai = new GoogleGenAI({ apiKey });
                const result = await ai.models.generateContent({
                  model: 'gemini-2.5-flash',
                  contents: `${DEFAULT_JAAGA_SYSTEM_PROMPT}\n\nUser Message: ${text}`,
                });
                const out = (result.text || '').replace(/\*/g, '').trim();
                if (out) {
                  reply = out;
                  isAi = true;
                }
              } catch (aiErr) {
                console.error('[GEMINI ERROR]', aiErr?.message || aiErr);
              }
            }

            // 3) send the reply
            if (token) {
              const resp = await fetch(`${base}/${accountId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ recipient: { id: senderId }, message: { text: reply } }),
              });
              const data = await resp.json().catch(() => ({}));
              console.log('[IG SEND RESULT]', resp.status, JSON.stringify(data));

              // 4) store the outgoing reply
              await storeMessage({ igsid: senderId, username, direction: 'out', text: reply, is_ai: isAi });
            } else {
              console.error('[SEND ABORTED] no access token env var found');
            }
          }

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