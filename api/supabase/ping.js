import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(200).json({
      connected: false,
      configured: false,
      msg: 'Supabase credentials missing on Vercel environment variables.',
      envVarsChecked: ['VITE_SUPABASE_URL', 'SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const tables = ['ig_settings', 'ig_dm_rules', 'ig_leads', 'ig_messages'];
    const tableChecks = {};

    for (const table of tables) {
      const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
      tableChecks[table] = !error;
    }

    const anyTableExists = Object.values(tableChecks).some(Boolean);

    return res.status(200).json({
      connected: true,
      configured: true,
      url: supabaseUrl,
      tableChecks,
      allTablesReady: Object.values(tableChecks).every(Boolean),
      msg: anyTableExists
        ? 'Supabase is successfully connected and responding!'
        : 'Supabase is connected, but SQL tables (ig_settings, etc.) are missing. Please run the SQL migration script.'
    });
  } catch (error) {
    return res.status(200).json({
      connected: false,
      configured: true,
      error: error?.message || String(error),
      msg: 'Failed to connect to Supabase.'
    });
  }
}
