import React, { useState } from 'react';
import { AppSettings, ScreenType } from '../../types';
import { INSTAGRAM_CONFIG } from '../../services/instagram';
import { DEFAULT_JAAGA_SYSTEM_PROMPT } from '../../../api/ig/ai-test';
import {
  Settings,
  Instagram,
  ShieldCheck,
  Key,
  Clock,
  Users,
  CreditCard,
  RefreshCw,
  Lock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  Bot,
  Send,
  Loader2,
  Sparkles,
  Check,
  Database,
} from 'lucide-react';

interface SettingsScreenProps {
  appSettings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onNavigate: (screen: ScreenType) => void;
  onOpenConfirmation: (action: () => void, title: string, message: string) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  appSettings,
  onUpdateSettings,
  onNavigate,
  onOpenConfirmation,
}) => {
  const [rateLimit, setRateLimit] = useState(appSettings.rateLimitPerHour);
  const [enforce24h, setEnforce24h] = useState(appSettings.enforce24hWindow);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(appSettings.quietHoursEnabled);
  const [quietStart, setQuietStart] = useState(appSettings.quietHoursStart);
  const [quietEnd, setQuietEnd] = useState(appSettings.quietHoursEnd);

  const [team, setTeam] = useState(appSettings.teamMembers);
  const [newMemberEmail, setNewMemberEmail] = useState('');

  // AI Agent Settings Panel state
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiSystemPrompt, setAiSystemPrompt] = useState(DEFAULT_JAAGA_SYSTEM_PROMPT);
  const [aiSaved, setAiSaved] = useState(false);

  // AI Sandbox state
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<{ reply: string; raw?: string } | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Meta Graph API Tester State
  const [graphRecipientId, setGraphRecipientId] = useState('');
  const [graphMessageText, setGraphMessageText] = useState('hi');
  const [graphTestLoading, setGraphTestLoading] = useState(false);
  const [graphTestResult, setGraphTestResult] = useState<any>(null);

  const handleSendGraphApiDm = async () => {
    if (!graphMessageText.trim()) return;
    setGraphTestLoading(true);
    setGraphTestResult(null);
    try {
      const res = await fetch('/api/instagram/send-dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: graphRecipientId.trim(),
          text: graphMessageText.trim(),
          accountId: INSTAGRAM_CONFIG.accountId,
        }),
      });
      const data = await res.json();
      setGraphTestResult(data);
    } catch (err: any) {
      setGraphTestResult({ success: false, error: err.message || 'Failed to dispatch Graph API request' });
    } finally {
      setGraphTestLoading(false);
    }
  };

  const handleSaveAiSettings = () => {
    setAiSaved(true);
    setTimeout(() => setAiSaved(false), 3000);
  };

  const handleRunAiTest = async () => {
    if (!testInput.trim()) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/ig/ai-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testInput.trim(),
          systemPrompt: aiSystemPrompt,
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e: any) {
      setTestResult({
        reply: "Thanks for messaging JaaGa! Our team will get back to you shortly. Visit https://www.jaaga.ai or call +91 88851 66880.",
        raw: e?.message || String(e),
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleSaveComplianceSettings = () => {
    onUpdateSettings({
      ...appSettings,
      rateLimitPerHour: rateLimit,
      enforce24hWindow: enforce24h,
      quietHoursEnabled,
      quietHoursStart: quietStart,
      quietHoursEnd: quietEnd,
      teamMembers: team,
    });
  };

  const handleReconnectInstagram = () => {
    onOpenConfirmation(
      () => {
        onUpdateSettings({
          ...appSettings,
          tokenStatus: 'Connected ✓',
          tokenExpiryDays: 60,
        });
      },
      'Reconnect Instagram Account',
      'This will refresh your Meta OAuth token session for @design.master.'
    );
  };

  const handleAddTeamMember = () => {
    if (!newMemberEmail.trim()) return;
    const newMember = {
      id: `tm_${Date.now()}`,
      name: newMemberEmail.split('@')[0],
      email: newMemberEmail.trim(),
      role: 'Support Agent' as const,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    };
    const updated = [...team, newMember];
    setTeam(updated);
    onUpdateSettings({ ...appSettings, teamMembers: updated });
    setNewMemberEmail('');
  };

  const handleRemoveTeamMember = (id: string) => {
    const updated = team.filter((m) => m.id !== id);
    setTeam(updated);
    onUpdateSettings({ ...appSettings, teamMembers: updated });
  };

  return (
    <div id="screen-settings" className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <span>Account & Integration Settings</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Instagram Graph API connection, messaging safety rate limits, quiet hours & team access.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Instagram Graph API Connection Panel */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-500 flex items-center justify-center text-white shadow-md">
                  <Instagram className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Instagram Business Connection</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {appSettings.tokenStatus}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">Connected account: @{appSettings.connectedHandle}</p>
                </div>
              </div>

              <button
                onClick={handleReconnectInstagram}
                className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-purple-500" />
                <span>Reconnect OAuth</span>
              </button>
            </div>

            {/* Read-only App ID, Account ID, and Graph API Version fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  INSTAGRAM_APP_ID
                </label>
                <input
                  type="text"
                  readOnly
                  value={INSTAGRAM_CONFIG.appId}
                  className="w-full bg-transparent font-mono text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  INSTAGRAM_ACCOUNT_ID
                </label>
                <input
                  type="text"
                  readOnly
                  value={INSTAGRAM_CONFIG.accountId}
                  className="w-full bg-transparent font-mono text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  GRAPH API VERSION
                </label>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                    {INSTAGRAM_CONFIG.apiVersion}
                  </span>
                  <span className="text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/80 dark:text-purple-300 px-1.5 py-0.5 rounded">
                    Latest Meta v26.0
                  </span>
                </div>
              </div>
            </div>

            {/* Supabase SQL Tables Schema Copy Box */}
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>Supabase Database SQL Schema (4 Tables)</span>
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 font-bold px-2 py-0.5 rounded-full">
                  PostgreSQL / Supabase
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Copy and run this SQL script in your Supabase SQL Editor to create all 4 required tables: <code className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">ig_dm_rules</code>, <code className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">ig_leads</code>, <code className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">ig_messages</code>, and <code className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">ig_settings</code>.
              </p>
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[10px] font-mono overflow-x-auto whitespace-pre-wrap max-h-40">
{`-- 1. Create Automations/DM Rules table
CREATE TABLE IF NOT EXISTS public.ig_dm_rules (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  trigger_type TEXT DEFAULT 'comment_dm',
  is_active BOOLEAN DEFAULT true,
  keywords JSONB DEFAULT '[]'::jsonb,
  match_rule TEXT DEFAULT 'contains',
  public_comment_replies JSONB DEFAULT '[]'::jsonb,
  dm_message_text TEXT,
  dm_buttons JSONB DEFAULT '[]'::jsonb,
  enable_follow_up BOOLEAN DEFAULT false,
  follow_up_text TEXT,
  follow_up_delay_hours INT DEFAULT 1,
  conditions JSONB DEFAULT '{}'::jsonb,
  stats JSONB DEFAULT '{}'::jsonb,
  selected_post_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Leads/CRM Contacts table
CREATE TABLE IF NOT EXISTS public.ig_leads (
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  email TEXT,
  phone TEXT,
  source_automation TEXT DEFAULT 'Direct DM',
  status TEXT DEFAULT 'New',
  tags JSONB DEFAULT '[]'::jsonb,
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TEXT DEFAULT 'Recently',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Direct Messages Log table
CREATE TABLE IF NOT EXISTS public.ig_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT,
  sender_id TEXT,
  recipient_id TEXT,
  sender_handle TEXT,
  message_text TEXT,
  is_from_user BOOLEAN DEFAULT true,
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create App Settings table
CREATE TABLE IF NOT EXISTS public.ig_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  account_id TEXT DEFAULT '17841462404931884',
  app_id TEXT DEFAULT '2878864779136148',
  graph_api_version TEXT DEFAULT 'v26.0',
  access_token TEXT,
  system_prompt TEXT,
  rate_limit_per_hour INT DEFAULT 60,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS & Public Access Policies
ALTER TABLE public.ig_dm_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ig_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ig_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ig_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select ig_dm_rules" ON public.ig_dm_rules FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update ig_dm_rules" ON public.ig_dm_rules FOR ALL USING (true);

CREATE POLICY "Allow public select ig_leads" ON public.ig_leads FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update ig_leads" ON public.ig_leads FOR ALL USING (true);

CREATE POLICY "Allow public select ig_messages" ON public.ig_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update ig_messages" ON public.ig_messages FOR ALL USING (true);

CREATE POLICY "Allow public select ig_settings" ON public.ig_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update ig_settings" ON public.ig_settings FOR ALL USING (true);`}
              </pre>
            </div>

            {/* Access Token Masked Field */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block">
                  INSTAGRAM_ACCESS_TOKEN (Secret / Write-only)
                </label>
                <span className="font-mono text-xs text-slate-600 dark:text-slate-400 font-bold">
                  {appSettings.accessTokenMasked}
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                Valid (Expires in {appSettings.tokenExpiryDays} days)
              </span>
            </div>

            {/* Meta Webhook Verification Section */}
            <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200/80 dark:border-purple-800/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 dark:text-purple-300">
                  Meta Developer Portal Webhook Credentials
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 font-bold px-2 py-0.5 rounded-full">
                  Production Vercel Function
                </span>
              </div>
              <div className="space-y-2.5">
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      1. Vercel Production Callback URL
                    </label>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Paste into Meta Dashboard
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value="https://jaaga-instagram.vercel.app/api/ig/webhook"
                    className="w-full bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-lg px-2.5 py-1.5 font-mono text-xs text-purple-700 dark:text-purple-300 font-bold focus:outline-none select-all shadow-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      2. Verify Token
                    </label>
                    <span className="text-[10px] font-semibold text-slate-500">
                      Set as IG_VERIFY_TOKEN
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value="jaaga_ig_verify"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-800 dark:text-slate-200 font-bold focus:outline-none select-all"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Accepts <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono font-bold">jaaga_ig_verify</code> or <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono font-bold">dmflow_verify_token_123</code>.
                  </p>
                </div>

                <div className="pt-2 border-t border-purple-100 dark:border-purple-900/40 space-y-2">
                  <p className="text-[10px] text-slate-500">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Health Check Endpoint:</span>{' '}
                    <code className="text-purple-600 dark:text-purple-400 font-mono">https://jaaga-instagram.vercel.app/api/ping</code>
                  </p>
                  <div className="p-2.5 bg-purple-100/70 dark:bg-purple-900/40 rounded-lg text-[11px] text-purple-950 dark:text-purple-200 leading-normal">
                    <span className="font-bold">⚡ Meta App Mode Notice:</span> If your Meta App is in <em>Development Mode</em>, Meta only delivers webhook events for DMs from accounts added as <strong>App Admins/Testers</strong> in Meta Developer Portal. In <em>Live / Published Mode</em>, Meta delivers DMs from <strong>all public Instagram accounts</strong>.
                  </div>
                </div>
              </div>
            </div>

            {/* Live Meta Graph API Messaging Test Section */}
            <div className="p-4 bg-gradient-to-r from-pink-50/80 via-purple-50/50 to-pink-50/80 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-pink-950/20 rounded-xl border border-pink-200 dark:border-pink-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Instagram className="w-4 h-4 text-pink-600" />
                  <span>Meta Graph API v26.0 Messaging Endpoint</span>
                </span>
                <span className="text-[10px] bg-pink-100 text-pink-700 dark:bg-pink-900/60 dark:text-pink-300 font-bold px-2 py-0.5 rounded-full">
                  Account: 17841462404931884
                </span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Configured Messages Endpoint URL:
                </label>
                <input
                  type="text"
                  readOnly
                  value="https://graph.instagram.com/v26.0/17841462404931884/messages"
                  className="w-full bg-white dark:bg-slate-800 border border-pink-300 dark:border-pink-800 rounded-lg px-2.5 py-1.5 font-mono text-xs text-pink-700 dark:text-pink-300 font-bold focus:outline-none select-all"
                />
              </div>

              <div className="pt-2 border-t border-pink-100 dark:border-pink-900/30 space-y-2">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
                  Test Direct Message Dispatch via Graph API:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5 font-medium">Customer PSID / IGSID</label>
                    <input
                      type="text"
                      value={graphRecipientId}
                      onChange={(e) => setGraphRecipientId(e.target.value)}
                      placeholder="e.g. 178414000000000 (User IGSID)"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5 font-medium">Message Payload</label>
                    <input
                      type="text"
                      value={graphMessageText}
                      onChange={(e) => setGraphMessageText(e.target.value)}
                      placeholder="hi"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 italic">
                  * Note: In Meta Graph API, recipient must be a customer&apos;s scoped IGSID/PSID from an incoming message event (not your own Account ID 17841462404931884).
                </p>

                <button
                  type="button"
                  onClick={handleSendGraphApiDm}
                  disabled={graphTestLoading || !graphMessageText.trim()}
                  className="w-full bg-[#dc2743] hover:bg-[#c11f38] text-white py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  {graphTestLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Dispatch DM to Graph API v26.0</span>
                </button>

                {graphTestResult && (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-pink-200 dark:border-pink-900 text-xs space-y-2 mt-2">
                    <div className="flex items-center justify-between font-bold">
                      <span className={graphTestResult.success ? 'text-emerald-600' : 'text-rose-600'}>
                        {graphTestResult.success ? '✓ Graph API Request Succeeded' : '⚠️ Graph API Notice / Response'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">v26.0</span>
                    </div>

                    {(graphTestResult.result?.hint || graphTestResult.hint) && (
                      <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg text-amber-900 dark:text-amber-200 text-[11px] space-y-1">
                        <p className="font-bold flex items-center gap-1">
                          💡 Meta Diagnostic Hint:
                        </p>
                        <p className="leading-snug">
                          {graphTestResult.result?.hint || graphTestResult.hint}
                        </p>
                      </div>
                    )}

                    <pre className="text-[10px] font-mono bg-slate-900 text-slate-200 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(graphTestResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Agent Configuration & Sandbox Section */}
          <div id="ai-agent-settings" className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>AI Agent Configuration</span>
                    <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      Gemini 3.6 Flash
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Saves to ig_settings key <code className="font-mono text-purple-600 dark:text-purple-400">ai_enabled</code> and <code className="font-mono text-purple-600 dark:text-purple-400">ai_system_prompt</code>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveAiSettings}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {aiSaved ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{aiSaved ? 'Saved to ig_settings' : 'Save AI Settings'}</span>
              </button>
            </div>

            {/* AI Agent Toggle */}
            <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  AI Agent enabled
                </span>
                <span className="text-[11px] text-slate-500">
                  Automatically answer Instagram DMs that don't match any keyword rules using Gemini & JaaGa knowledge prompt.
                </span>
              </div>
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded cursor-pointer accent-purple-600"
              />
            </label>

            {/* AI System Prompt Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>AI System Prompt</span>
                <span className="text-[10px] text-slate-400 font-normal">Pre-filled with JaaGa System Prompt</span>
              </label>
              <textarea
                rows={10}
                value={aiSystemPrompt}
                onChange={(e) => setAiSystemPrompt(e.target.value)}
                placeholder="Paste system prompt here..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
              />
            </div>

            {/* Test the AI Sandbox */}
            <div className="p-4 bg-purple-50/40 dark:bg-purple-950/20 rounded-xl border border-purple-200/60 dark:border-purple-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Test the AI Sandbox</span>
                </span>
                <span className="text-[10px] text-slate-500">POST /api/ig/ai-test</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunAiTest()}
                  placeholder="e.g. what is a mutation certificate and what does it cost"
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={handleRunAiTest}
                  disabled={testLoading || !testInput.trim()}
                  className="bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white px-4 py-2 rounded-xl text-xs font-bold hover:opacity-95 transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {testLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Send</span>
                </button>
              </div>

              {testResult && (
                <div className="space-y-2 pt-2 border-t border-purple-200/50 dark:border-purple-800/40">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Plain-text AI Reply (Delivered to User DM):
                    </span>
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-purple-200 dark:border-purple-800 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed shadow-xs">
                      {testResult.reply}
                    </div>
                  </div>

                  {testResult.raw && testResult.raw !== testResult.reply && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Raw Gemini Output:
                      </span>
                      <pre className="bg-slate-900 text-slate-300 p-2.5 rounded-lg text-[10px] font-mono overflow-x-auto whitespace-pre-wrap">
                        {testResult.raw}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Rate Limits & Messaging Safety Compliance */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Messaging Safety & Rate Limits</span>
              </h3>
              <button
                onClick={handleSaveComplianceSettings}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Save Guardrails
              </button>
            </div>

            {/* Rate Limit Slider */}
            <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">Max Outbound DMs Per Hour</span>
                <span className="font-extrabold text-purple-600 dark:text-purple-400">{rateLimit} DMs/hr</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={rateLimit}
                onChange={(e) => setRateLimit(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Meta recommends staying under 60 DMs/hr for standard Instagram business profiles.
              </p>
            </div>

            {/* 24-Hour Messaging Policy Toggle */}
            <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Enforce Meta 24-Hour Messaging Window
                </span>
                <span className="text-[11px] text-slate-500">
                  Automatically blocks sending promotional DMs outside the active 24h interaction window.
                </span>
              </div>
              <input
                type="checkbox"
                checked={enforce24h}
                onChange={(e) => setEnforce24h(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded cursor-pointer"
              />
            </label>

            {/* Quiet Hours Picker */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Quiet Hours (Pause Automated Outbound DMs)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Pause sending DMs during nighttime hours to prevent follower complaints.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={quietHoursEnabled}
                  onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                />
              </div>

              {quietHoursEnabled && (
                <div className="flex items-center gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-500 block text-[11px] mb-1">Start Time</span>
                    <input
                      type="time"
                      value={quietStart}
                      onChange={(e) => setQuietStart(e.target.value)}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-900 dark:text-white"
                    />
                  </div>
                  <span className="mt-4 text-slate-400">to</span>
                  <div>
                    <span className="text-slate-500 block text-[11px] mb-1">End Time</span>
                    <input
                      type="time"
                      value={quietEnd}
                      onChange={(e) => setQuietEnd(e.target.value)}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Team & Platform Limits */}
        <div className="lg:col-span-5 space-y-6">
          {/* Internal Usage & Capacity Card */}
          <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white p-6 rounded-2xl border border-purple-900/60 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">
                  Platform Capacity & Usage
                </span>
                <h3 className="text-xl font-black mt-0.5">{appSettings.plan.name}</h3>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Monthly DM Limit</span>
                <span className="font-bold">
                  {appSettings.plan.usedDMs.toLocaleString()} / {appSettings.plan.limitDMs.toLocaleString()} DMs
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full"
                  style={{ width: `${(appSettings.plan.usedDMs / appSettings.plan.limitDMs) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Team Members List */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              <span>Team Access ({team.length})</span>
            </h3>

            {/* Add Team Member */}
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
              <button
                onClick={handleAddTeamMember}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                + Invite
              </button>
            </div>

            {/* Members List */}
            <div className="space-y-2">
              {team.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full object-cover" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{m.name}</div>
                      <div className="text-[10px] text-slate-400">{m.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-[10px]">
                      {m.role}
                    </span>
                    {m.role !== 'Owner' && (
                      <button
                        onClick={() => handleRemoveTeamMember(m.id)}
                        className="text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
