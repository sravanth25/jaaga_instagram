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

async function fetchActiveDmRules() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/ig_dm_rules?select=*&active=eq.true`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('[FETCH DM RULES EXCEPTION]', e?.message || e);
  }
  return [];
}

function findMatchingRule(rules, commentText, mediaId) {
  const cleanComment = (commentText || '').trim().toLowerCase();
  for (const rule of rules) {
    if (rule.active === false) continue;
    if (rule.type && rule.type !== 'comment') continue;

    // Check media_id scope
    if (rule.media_id && mediaId && String(rule.media_id) !== String(mediaId)) {
      continue;
    }

    const keywords = Array.isArray(rule.keywords)
      ? rule.keywords
      : (typeof rule.keywords === 'string' ? rule.keywords.split(',').map(s => s.trim()) : []);
    const matchType = rule.match_type || 'contains';

    if (keywords.length === 0 || matchType === 'any') {
      return rule;
    }

    const isMatch = keywords.some((kw) => {
      const cleanKw = String(kw).trim().toLowerCase();
      if (!cleanKw) return false;
      if (matchType === 'exact') return cleanComment === cleanKw;
      return cleanComment.includes(cleanKw);
    });

    if (isMatch) return rule;
  }
  return null;
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

          // 1. Direct Messaging events
          for (const ev of entry.messaging || []) {
            const senderId = ev.sender?.id;
            const text = ev.message?.text;
            const isEcho = ev.message?.is_echo;
            if (!text || isEcho || !senderId || senderId === accountId) continue;

            console.log(`[DM IN] from ${senderId}: "${text}"`);
            const username = await fetchUsername(senderId, token, base);

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
                if (out) {
                  reply = out;
                  isAi = true;
                }
              } catch (aiErr) {
                console.error('[GEMINI ERROR]', aiErr?.message || aiErr);
              }
            }

            if (token) {
              const resp = await fetch(`${base}/${accountId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ recipient: { id: senderId }, message: { text: reply } }),
              });
              const data = await resp.json().catch(() => ({}));
              console.log('[IG DM SEND RESULT]', resp.status, JSON.stringify(data));

              await storeMessage({ igsid: senderId, username, direction: 'out', text: reply, is_ai: isAi });
            }
          }

          // 2. Change events (Comments handling per Section E)
          for (const change of entry.changes || []) {
            console.log('[CHANGE FIELD]', change.field, JSON.stringify(change.value));

            if (change.field === 'comments' && change.value) {
              const val = change.value;
              const commentId = val.id;
              const commentText = val.text || '';
              const commenterId = val.from?.id;
              const commenterName = val.from?.username || commenterId || 'user';
              const mediaId = val.media?.id || val.media_id;

              // Section E1: Skip if commenter is our own account (avoid loops)
              if (commenterId === accountId) {
                console.log('[COMMENT SKIP] Comment from page owner');
                continue;
              }

              console.log(`[COMMENT IN] id=${commentId} from=${commenterName} media=${mediaId} text="${commentText}"`);

              // Section E2: Find active rule
              const activeRules = await fetchActiveDmRules();
              const matchedRule = findMatchingRule(activeRules, commentText, mediaId);

              if (matchedRule) {
                console.log(`[RULE MATCHED] Rule "${matchedRule.name || matchedRule.id}" for comment "${commentText}"`);

                // Section E3: Public comment reply
                if (matchedRule.public_reply) {
                  const variations = String(matchedRule.public_reply)
                    .split(/\n|\|/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                  const publicMsg = variations[Math.floor(Math.random() * variations.length)] || matchedRule.public_reply;

                  if (token && commentId) {
                    try {
                      const pubResp = await fetch(`${base}/${commentId}/replies`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ message: publicMsg }),
                      });
                      const pubData = await pubResp.json().catch(() => ({}));
                      console.log('[PUBLIC COMMENT REPLY RESULT]', pubResp.status, JSON.stringify(pubData));
                    } catch (pubErr) {
                      console.error('[PUBLIC COMMENT REPLY ERROR]', pubErr);
                    }
                  }
                }

                // Section E4: DM message private reply to commenter
                if (matchedRule.dm_reply) {
                  const dmText = matchedRule.dm_reply;

                  if (token && commentId) {
                    try {
                      const dmResp = await fetch(`${base}/${accountId}/messages`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          recipient: { comment_id: commentId },
                          message: { text: dmText },
                        }),
                      });
                      const dmData = await dmResp.json().catch(() => ({}));
                      console.log('[DM PRIVATE REPLY RESULT]', dmResp.status, JSON.stringify(dmData));
                    } catch (dmErr) {
                      console.error('[DM PRIVATE REPLY ERROR]', dmErr);
                    }
                  }

                  // Store message for Inbox tracking
                  await storeMessage({
                    igsid: commenterId || commentId,
                    username: commenterName,
                    direction: 'out',
                    text: `[Auto-DM via Comment]: ${dmText}`,
                    is_ai: false,
                  });
                }
              } else {
                console.log('[COMMENT NO MATCH] No active rule matched for comment.');
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
