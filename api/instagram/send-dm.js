// Create this file at:  api/instagram/send-dm.js
// This is the endpoint your Inbox "Send" button calls. It was missing (404),
// which is why every manual reply failed. It sends the DM and stores it.

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const body = req.body || {};
    // accept whatever key the frontend uses
    const recipientId =
      body.recipientId || body.igsid || body.recipient_id || body.to || body.recipient?.id;
    const text = body.text || body.message || body.messageText || body.body;

    if (!recipientId || !text) {
      return res.status(400).json({ success: false, error: 'Missing recipientId or text', received: body });
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
    console.log('[SEND-DM RESULT]', resp.status, JSON.stringify(data));

    if (resp.ok && !data.error) {
      await storeMessage({ igsid: recipientId, direction: 'out', text, is_ai: false });
      return res.status(200).json({ success: true, data });
    }

    // Instagram rejected it — surface the REAL reason (often the 24-hour window)
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
