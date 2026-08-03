// Replace api/ig/webhook.js with this complete version.
// Handles: Meta verification (GET), incoming DMs (store + AI reply), and
// COMMENT automations (match ig_dm_rules by media_id + keyword -> public reply + DM).
// Heavy logging so we can trace exactly what happens.

import { GoogleGenAI } from '@google/genai';
import { DEFAULT_JAAGA_SYSTEM_PROMPT } from './ai-test.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BASE = 'https://graph.instagram.com/v26.0';

async function sb(path, opts = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
}

async function storeMessage(row) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  try {
    await sb('ig_messages', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(row) });
  } catch (e) {
    console.error('[STORE ERROR]', e?.message || e);
  }
}

async function getActiveCommentRules() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('[RULES] Supabase env missing');
    return [];
  }
  try {
    const r = await sb('ig_dm_rules?type=eq.comment&active=eq.true&select=*', {});
    const rows = await r.json();
    return Array.isArray(rows) ? rows : [];
  } catch (e) {
    console.error('[RULES ERROR]', e?.message || e);
    return [];
  }
}

function keywordMatch(text, keywords, matchType) {
  if (!keywords || keywords.length === 0) return true; // "any comment"
  const t = (text || '').toLowerCase();
  return keywords.some((k) => {
    const kw = String(k).toLowerCase().trim();
    if (!kw) return false;
    if (matchType === 'exact') return t === kw;
    return t.includes(kw);
  });
}

async function fetchUsername(igsid, token) {
  try {
    const r = await fetch(`${BASE}/${igsid}?fields=username&access_token=${token}`);
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

  const verifyToken = process.env.IG_VERIFY_TOKEN || process.env.INSTAGRAM_VERIFY_TOKEN || 'jaaga_ig_verify';

  if (req.method === 'GET') {
    const mode = req.query['hub.mode'] || req.query['mode'];
    const token = req.query['hub.verify_token'] || req.query['verify_token'];
    const challenge = req.query['hub.challenge'] || req.query['challenge'];
    if (mode === 'subscribe' && (token === verifyToken || token === 'jaaga_ig_verify')) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Verification failed');
  }

  if (req.method === 'POST') {
    try {
      const body = req.body;
      console.log('[IG WEBHOOK EVENT]:', JSON.stringify(body));

      const token =
        process.env.IG_ACCESS_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN || process.env.VITE_INSTAGRAM_ACCESS_TOKEN;
      const accountId = process.env.IG_ACCOUNT_ID || process.env.INSTAGRAM_ACCOUNT_ID || '17841462404931884';

      if (body && (body.object === 'instagram' || body.object === 'page')) {
        for (const entry of body.entry || []) {
          // ---------- DIRECT MESSAGES ----------
          for (const ev of entry.messaging || []) {
            const senderId = ev.sender?.id;
            const text = ev.message?.text;
            const isEcho = ev.message?.is_echo;
            if (!text || isEcho || !senderId || senderId === accountId) continue;

            console.log(`[DM IN] from ${senderId}: "${text}"`);
            const username = await fetchUsername(senderId, token);
            await storeMessage({ igsid: senderId, username, direction: 'in', text, is_ai: false });

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
                if (out) { reply = out; isAi = true; }
              } catch (aiErr) {
                console.error('[GEMINI ERROR]', aiErr?.message || aiErr);
              }
            }

            if (token) {
              const resp = await fetch(`${BASE}/${accountId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ recipient: { id: senderId }, message: { text: reply } }),
              });
              const data = await resp.json().catch(() => ({}));
              console.log('[IG SEND RESULT]', resp.status, JSON.stringify(data));
              await storeMessage({ igsid: senderId, username, direction: 'out', text: reply, is_ai: isAi });
            }
          }

          // ---------- COMMENTS ----------
          for (const change of entry.changes || []) {
            if (change.field !== 'comments') {
              console.log('[CHANGE non-comment]', change.field);
              continue;
            }
            const v = change.value || {};
            const commentId = v.id;
            const commentText = v.text || '';
            const fromId = v.from?.id;
            const fromUser = v.from?.username;
            const mediaId = v.media?.id;
            console.log('[COMMENT IN]', JSON.stringify({ commentId, fromUser, fromId, mediaId, commentText }));

            if (!fromId || fromId === accountId) {
              console.log('[COMMENT SKIP] own/self comment — test from a DIFFERENT account');
              continue;
            }

            const rules = await getActiveCommentRules();
            console.log('[COMMENT RULES]', rules.length, 'active comment rule(s)');
            const rule = rules.find(
              (r) => (!r.media_id || r.media_id === mediaId) && keywordMatch(commentText, r.keywords, r.match_type)
            );
            if (!rule) {
              console.log('[COMMENT NO MATCH]', JSON.stringify({ mediaId, ruleMediaIds: rules.map((r) => r.media_id), text: commentText }));
              continue;
            }
            console.log('[COMMENT MATCHED RULE]', rule.name || rule.id);

            // public reply under the comment
            if (rule.public_reply) {
              const variations = Array.isArray(rule.public_reply) ? rule.public_reply : [rule.public_reply];
              const pr = variations[Math.floor(Math.random() * variations.length)];
              const rr = await fetch(`${BASE}/${commentId}/replies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ message: pr }),
              });
              console.log('[COMMENT PUBLIC REPLY]', rr.status, JSON.stringify(await rr.json().catch(() => ({}))));
            }

            // private DM to the commenter
            if (rule.dm_reply) {
              const dr = await fetch(`${BASE}/${accountId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ recipient: { comment_id: commentId }, message: { text: rule.dm_reply } }),
              });
              const drData = await dr.json().catch(() => ({}));
              console.log('[COMMENT DM]', dr.status, JSON.stringify(drData));
              if (dr.ok && !drData.error) {
                await storeMessage({ igsid: fromId, username: fromUser, direction: 'out', text: rule.dm_reply, is_ai: false });
              }
            }
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
