// Create this file at:  api/instagram/broadcast.js
// A REAL broadcast: sends a DM (optional button) to everyone who messaged the
// account within Instagram's 24-hour window, and returns true counts.
// Instagram does NOT allow DMing followers outside that 24h window.

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BASE = 'https://graph.instagram.com/v26.0';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const b = req.body || {};
    const title = b.title || '';
    const bodyText = b.body || b.message || b.text || '';
    const text = [title, bodyText].filter(Boolean).join('\n\n').slice(0, 640);
    const buttons = Array.isArray(b.buttons) ? b.buttons.filter((x) => x && x.url).slice(0, 3) : [];

    if (!text && !buttons.length) {
      return res.status(400).json({ success: false, error: 'Nothing to send (empty message).' });
    }
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ success: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY' });
    }

    const token =
      process.env.IG_ACCESS_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN || process.env.VITE_INSTAGRAM_ACCESS_TOKEN;
    const accountId = process.env.IG_ACCOUNT_ID || process.env.INSTAGRAM_ACCOUNT_ID || '17841462404931884';

    // Eligible = anyone who sent us a DM in the last 24 hours (Instagram's rule)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const r = await sb(
      `ig_messages?select=igsid,created_at&direction=eq.in&created_at=gte.${since}&order=created_at.desc`,
      {}
    );
    const rows = (await r.json().catch(() => [])) || [];
    const recipients = [...new Set(rows.map((x) => x.igsid))].filter(Boolean);

    // Build the message payload once
    const message = buttons.length
      ? {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'button',
              text: text || 'Message from JaaGa',
              buttons: buttons.map((bt) => ({
                type: 'web_url',
                url: bt.url,
                title: String(bt.label || bt.title || 'Open').slice(0, 20),
              })),
            },
          },
        }
      : { text };

    let sent = 0;
    const errors = [];
    for (const igsid of recipients) {
      try {
        const resp = await fetch(`${BASE}/${accountId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ recipient: { id: igsid }, message }),
        });
        const data = await resp.json().catch(() => ({}));
        if (resp.ok && !data.error) {
          sent++;
          await sb('ig_messages', {
            method: 'POST',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify({ igsid, direction: 'out', text: text || '[button message]', is_ai: false }),
          });
        } else {
          errors.push({ igsid, error: data.error?.message || `HTTP ${resp.status}` });
        }
      } catch (e) {
        errors.push({ igsid, error: String(e) });
      }
      await sleep(200); // gentle pacing to avoid rate limits
    }

    console.log('[BROADCAST]', JSON.stringify({ eligible: recipients.length, sent, failed: errors.length }));
    return res.status(200).json({
      success: true,
      eligible: recipients.length,
      sent,
      failed: errors.length,
      errors: errors.slice(0, 10),
      note: 'Instagram only allows DMs to users who messaged you within the last 24 hours.',
    });
  } catch (e) {
    console.error('[BROADCAST EXCEPTION]', e);
    return res.status(500).json({ success: false, error: String(e) });
  }
}