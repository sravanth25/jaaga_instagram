// Create/replace at:  api/instagram/send-dm.js
// The Inbox "Send" endpoint. Instagram requires the NUMERIC igsid as recipient,
// not the @username. If the frontend passes a username, this resolves it to the
// numeric igsid from ig_messages, then sends.

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function storeMessage(row) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/ig_messages`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    });
  } catch (e) {
    console.error('[SEND-DM STORE ERROR]', e?.message || e);
  }
}

// If given a username, find the newest numeric igsid we stored for them.
async function resolveIgsid(value) {
  if (/^\d+$/.test(String(value))) return String(value); // already numeric
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const url =
      `${SUPABASE_URL}/rest/v1/ig_messages` +
      `?username=eq.${encodeURIComponent(value)}` +
      `&order=created_at.desc&limit=1&select=igsid`;
    const r = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    const rows = await r.json();
    const id = rows?.[0]?.igsid;
    return /^\d+$/.test(String(id)) ? String(id) : null;
  } catch (e) {
    console.error('[RESOLVE IGSID ERROR]', e?.message || e);
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const body = req.body || {};
    const rawRecipient =
      body.recipientId || body.igsid || body.recipient_id || body.to || body.recipient?.id;
    const text = body.text || body.message || body.messageText || body.body;

    if (!rawRecipient || !text) {
      return res.status(400).json({ success: false, error: 'Missing recipientId or text', received: body });
    }

    const recipientId = await resolveIgsid(rawRecipient);
    if (!recipientId) {
      return res.status(200).json({
        success: false,
        error: `Could not find a numeric Instagram ID for "${rawRecipient}". Instagram needs the numeric igsid, not the @username. Make sure ig_messages has a numeric igsid stored for this person.`,
      });
    }

    const token =
      process.env.IG_ACCESS_TOKEN ||
      process.env.INSTAGRAM_ACCESS_TOKEN ||
      process.env.VITE_INSTAGRAM_ACCESS_TOKEN;
    const accountId =
      process.env.IG_ACCOUNT_ID || process.env.INSTAGRAM_ACCOUNT_ID || '17841462404931884';
    const base = 'https://graph.instagram.com/v26.0';

    const resp = await fetch(`${base}/${accountId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ recipient: { id: recipientId }, message: { text } }),
    });
    const data = await resp.json().catch(() => ({}));
    console.log('[SEND-DM RESULT]', resp.status, recipientId, JSON.stringify(data));

    if (resp.ok && !data.error) {
      await storeMessage({ igsid: recipientId, direction: 'out', text, is_ai: false });
      return res.status(200).json({ success: true, result: { data }, data });
    }

    return res.status(200).json({
      success: false,
      error: data.error?.message || 'Instagram rejected the message',
      code: data.error?.code,
      data,
    });
  } catch (e) {
    console.error('[SEND-DM EXCEPTION]', e);
    return res.status(500).json({ success: false, error: String(e) });
  }
}
