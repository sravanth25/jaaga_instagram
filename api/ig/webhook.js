// Replace api/ig/webhook.js with this.
// Handles: Meta verification, incoming DMs (store + AI reply), and COMMENT
// automations that read the REAL ig_dm_rules columns your app writes.

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

// Read active comment automations (real columns: trigger_type, is_active)
async function getCommentRules() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('[RULES] Supabase env missing');
    return [];
  }
  try {
    const r = await sb('ig_dm_rules?is_active=eq.true&select=*', {});
    const rows = await r.json();
    if (!Array.isArray(rows)) return [];
    // comment automations only
    return rows.filter((x) => (x.trigger_type || 'comment_dm') === 'comment_dm');
  } catch (e) {
    console.error('[RULES ERROR]', e?.message || e);
    return [];
  }
}

function keywordMatch(text, keywords, matchRule) {
  const rule = String(matchRule || 'contains').toLowerCase();
  const kws = Array.isArray(keywords) ? keywords : [];
  if (rule.includes('any') || kws.length === 0) return true; // any comment
  const t = (text || '').toLowerCase();
  return kws.some((k) => {
    const kw = String(k).toLowerCase().trim();
    if (!kw) return false;
    if (rule.includes('exact')) return t === kw;
    return t.includes(kw); // contains
  });
}

function pick(arr) {
  const a = Array.isArray(arr) ? arr.filter(Boolean) : (arr ? [arr] : []);
  if (a.length === 0) return null;
  return a[Math.floor(Math.random() * a.length)];
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
            if (!text || ev.message?.is_echo || !senderId || senderId === accountId) continue;

            console.log(`[DM IN] from ${senderId}: "${text}"`);
            const username = await fetchUsername(senderId, token);
            await storeMessage({ igsid: senderId, username, direction: 'in', text, is_ai: false });

            let reply =
              'Thanks for messaging JaaGa! Our team will get back to you shortly. Visit https://www.jaaga.ai or call +91 88851 66880.';
            let isAi = false;
            if (process.env.GEMINI_API_KEY) {
              try {
                const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                const result = await ai.models.generateContent({
                  model: 'gemini-2.5-flash',
                  contents: `${DEFAULT_JAAGA_SYSTEM_PROMPT}\n\nUser Message: ${text}`,
                });
                const out = (result.text || '').replace(/\*/g, '').trim();
                if (out) { reply = out; isAi = true; }
              } catch (e) {
                console.error('[GEMINI ERROR]', e?.message || e);
              }
            }
            const dm = await fetch(`${BASE}/${accountId}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ recipient: { id: senderId }, message: { text: reply } }),
            });
            console.log('[IG SEND RESULT]', dm.status, JSON.stringify(await dm.json().catch(() => ({}))));
            await storeMessage({ igsid: senderId, username, direction: 'out', text: reply, is_ai: isAi });
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
            const mediaId = v.media?.id ? String(v.media.id) : null;
            console.log('[COMMENT IN]', JSON.stringify({ commentId, fromUser, fromId, mediaId, commentText }));

            if (!fromId || fromId === accountId) {
              console.log('[COMMENT SKIP] own/self comment — test from a DIFFERENT account');
              continue;
            }

            const rules = await getCommentRules();
            console.log('[COMMENT RULES]', rules.length, 'active comment automation(s)');

            const rule = rules.find((r) => {
              const posts = Array.isArray(r.selected_post_ids) ? r.selected_post_ids.map(String) : [];
              const postOk = posts.length === 0 || posts.includes(mediaId);
              return postOk && keywordMatch(commentText, r.keywords, r.match_rule);
            });

            if (!rule) {
              console.log('[COMMENT NO MATCH]', JSON.stringify({
                mediaId,
                rulePosts: rules.map((r) => r.selected_post_ids),
                ruleKeywords: rules.map((r) => r.keywords),
                commentText,
              }));
              continue;
            }
            console.log('[COMMENT MATCHED]', rule.title || rule.id);

            // public reply under the comment
            const publicReply = pick(rule.public_comment_replies);
            if (publicReply) {
              const rr = await fetch(`${BASE}/${commentId}/replies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ message: publicReply }),
              });
              console.log('[COMMENT PUBLIC REPLY]', rr.status, JSON.stringify(await rr.json().catch(() => ({}))));
            }

            // private DM to the commenter (with buttons if the automation has them)
            const dmText = rule.dm_message_text;
            const btns = Array.isArray(rule.dm_buttons)
              ? rule.dm_buttons.filter((b) => b && b.url).slice(0, 3) // Instagram allows max 3 buttons
              : [];
            if (dmText || btns.length) {
              let message;
              if (btns.length) {
                // Button template: text + clickable web_url buttons (title max 20 chars)
                message = {
                  attachment: {
                    type: 'template',
                    payload: {
                      template_type: 'button',
                      text: String(dmText || 'Here are the details you requested:').slice(0, 640),
                      buttons: btns.map((b) => ({
                        type: 'web_url',
                        url: b.url,
                        title: String(b.label || b.title || 'Open').slice(0, 20),
                      })),
                    },
                  },
                };
              } else {
                message = { text: dmText };
              }
              const dr = await fetch(`${BASE}/${accountId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ recipient: { comment_id: commentId }, message }),
              });
              const drData = await dr.json().catch(() => ({}));
              console.log('[COMMENT DM]', dr.status, JSON.stringify(drData));
              if (dr.ok && !drData.error) {
                await storeMessage({ igsid: fromId, username: fromUser, direction: 'out', text: dmText, is_ai: false });
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
