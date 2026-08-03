// Create this file at:  api/ig/sync-automations.js
// Your frontend POSTs { automations: [...] } here on every change to save them.
// The route was missing (404), so automations were never written to the DB and
// vanished on refresh. This upserts them into ig_dm_rules (service key).

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { automations } = req.body || {};
    if (!Array.isArray(automations)) {
      return res.status(400).json({ success: false, error: 'Body must be { automations: [...] }' });
    }
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ success: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY' });
    }

    // Map each frontend automation object to the ig_dm_rules columns
    const rows = automations
      .filter((s) => s && s.id != null)
      .map((s) => ({
        id: String(s.id),
        title: s.title ?? null,
        trigger_type: s.triggerType ?? 'comment_dm',
        is_active: s.status === 'live',
        keywords: s.keywords ?? [],
        match_rule: s.matchRule ?? 'contains',
        public_comment_replies: s.publicCommentReplies ?? [],
        dm_message_text: s.dmMessageText ?? null,
        dm_buttons: s.dmButtons ?? [],
        enable_follow_up: !!s.enableFollowUp,
        follow_up_text: s.followUpText ?? null,
        follow_up_delay_hours: s.followUpDelayHours ?? null,
        conditions: s.conditions ?? {},
        stats: s.stats ?? {},
        selected_post_ids: s.selectedPostIds ?? [],
        updated_at: new Date().toISOString(),
      }));

    if (rows.length === 0) {
      return res.status(200).json({ success: true, count: 0 });
    }

    // Bulk upsert on primary key id
    const r = await fetch(`${SUPABASE_URL}/rest/v1/ig_dm_rules?on_conflict=id`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(rows),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('[SYNC-AUTOMATIONS ERROR]', r.status, text);
      return res.status(200).json({ success: false, error: text });
    }

    console.log('[SYNC-AUTOMATIONS] upserted', rows.length);
    return res.status(200).json({ success: true, count: rows.length });
  } catch (e) {
    console.error('[SYNC-AUTOMATIONS EXCEPTION]', e);
    return res.status(500).json({ success: false, error: String(e) });
  }
}
