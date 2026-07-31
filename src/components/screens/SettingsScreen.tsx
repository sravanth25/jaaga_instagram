import React, { useState } from 'react';
import { AppSettings, ScreenType } from '../../types';
import { INSTAGRAM_CONFIG } from '../../services/instagram';
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

            {/* Read-only App ID & Account ID fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  INSTAGRAM_APP_ID (Read-only)
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
                  INSTAGRAM_ACCOUNT_ID (Read-only)
                </label>
                <input
                  type="text"
                  readOnly
                  value={INSTAGRAM_CONFIG.accountId}
                  className="w-full bg-transparent font-mono text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
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

                <div className="pt-1 border-t border-purple-100 dark:border-purple-900/40">
                  <p className="text-[10px] text-slate-500">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Health Check Endpoint:</span>{' '}
                    <code className="text-purple-600 dark:text-purple-400 font-mono">https://jaaga-instagram.vercel.app/api/ping</code>
                  </p>
                </div>
              </div>
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
