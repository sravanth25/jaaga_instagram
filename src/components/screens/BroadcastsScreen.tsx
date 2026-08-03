import React, { useState } from 'react';
import { Broadcast, ScreenType } from '../../types';
import {
  Send,
  Users,
  Clock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  BarChart2,
  Sparkles,
  MessageSquare,
  Calendar,
  Loader2,
} from 'lucide-react';

interface BroadcastsScreenProps {
  broadcasts: Broadcast[];
  onSaveBroadcast: (broadcast: Broadcast) => void;
  onNavigate: (screen: ScreenType) => void;
  onOpenConfirmation: (action: () => void, title: string, message: string) => void;
}

export const BroadcastsScreen: React.FC<BroadcastsScreenProps> = ({
  broadcasts,
  onSaveBroadcast,
  onNavigate,
  onOpenConfirmation,
}) => {
  const [isComposing, setIsComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [buttonLabel, setButtonLabel] = useState('🎟️ Claim Offer Now');
  const [buttonUrl, setButtonUrl] = useState('https://www.jaaga.ai');
  const [segment, setSegment] = useState<string>('Recent 24h Contacts');
  const [scheduleType, setScheduleType] = useState<'now' | 'scheduled'>('now');
  const [scheduleDate, setScheduleDate] = useState('2026-08-05 10:00 EST');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    message: string;
    eligible?: number;
    sent?: number;
    failed?: number;
    errors?: any[];
  } | null>(null);

  const executeBroadcast = async () => {
    if (!title.trim() || !body.trim()) return;

    if (scheduleType === 'scheduled') {
      const newBroadcast: Broadcast = {
        id: `bc_${Date.now()}`,
        title: title.trim(),
        body: body.trim(),
        buttons: buttonLabel.trim()
          ? [
              {
                id: `btn_bc_${Date.now()}`,
                type: 'link',
                label: buttonLabel.trim(),
                url: buttonUrl.trim() || 'https://www.jaaga.ai',
              },
            ]
          : [],
        audienceSegment: segment || 'Recent 24h Contacts',
        scheduleType: 'scheduled',
        scheduledFor: scheduleDate,
        status: 'scheduled',
        stats: {
          targetUsers: 0,
          sent: 0,
          failed: 0,
        },
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };

      onSaveBroadcast(newBroadcast);
      setIsComposing(false);
      setTitle('');
      setBody('');
      setSendResult({
        success: true,
        message: `Campaign scheduled for ${scheduleDate}`,
      });
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const buttonsPayload = buttonLabel.trim()
        ? [{ label: buttonLabel.trim(), url: buttonUrl.trim() || 'https://www.jaaga.ai', type: 'link' }]
        : [];

      const res = await fetch('/api/instagram/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          buttons: buttonsPayload,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        const errorMsg = data.error || 'Failed to send broadcast.';
        setSendResult({
          success: false,
          message: errorMsg,
        });
        setIsSending(false);
        return;
      }

      const eligible = Number(data.eligible) || 0;
      const sentCount = Number(data.sent) || 0;
      const failedCount = Number(data.failed) || 0;
      const errList = Array.isArray(data.errors) ? data.errors : [];

      let resultMsg = `Sent to ${sentCount} of ${eligible} reachable contacts`;
      if (eligible === 0) {
        resultMsg = '0 recipients are currently reachable (no contacts messaged in the last 24 hours)';
      } else if (failedCount > 0) {
        const firstErr = errList[0]?.error || String(errList[0]) || 'Error occurred';
        resultMsg += `. ${failedCount} failed (${firstErr})`;
      }

      const newBroadcast: Broadcast = {
        id: `bc_${Date.now()}`,
        title: title.trim(),
        body: body.trim(),
        buttons: buttonLabel.trim()
          ? [
              {
                id: `btn_bc_${Date.now()}`,
                type: 'link',
                label: buttonLabel.trim(),
                url: buttonUrl.trim() || 'https://www.jaaga.ai',
              },
            ]
          : [],
        audienceSegment: segment || 'Recent 24h Contacts',
        scheduleType: 'now',
        status: failedCount > 0 && sentCount === 0 ? 'failed' : 'sent',
        stats: {
          targetUsers: eligible,
          sent: sentCount,
          failed: failedCount,
        },
        errorMessage: errList.length > 0 ? errList[0]?.error || String(errList[0]) : undefined,
        note: data.note,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };

      onSaveBroadcast(newBroadcast);
      setIsComposing(false);
      setTitle('');
      setBody('');
      setSendResult({
        success: true,
        message: resultMsg,
        eligible,
        sent: sentCount,
        failed: failedCount,
        errors: errList,
      });
    } catch (err: any) {
      console.error('Error sending broadcast:', err);
      setSendResult({
        success: false,
        message: err?.message || 'Network error occurred while sending broadcast.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendBroadcast = () => {
    if (!title.trim() || !body.trim()) return;

    if (scheduleType === 'now') {
      onOpenConfirmation(
        executeBroadcast,
        'Send Broadcast DM Now',
        'You are about to send this broadcast message to all Instagram users who messaged your account in the last 24 hours.'
      );
    } else {
      executeBroadcast();
    }
  };

  return (
    <div id="screen-broadcasts" className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <span>Broadcast DMs & Announcements</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900">
              {broadcasts.length} Campaigns
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Send direct messages to contacts active within Meta's 24-hour window.
          </p>
        </div>

        <button
          id="btn-new-broadcast"
          onClick={() => setIsComposing(!isComposing)}
          className="bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:opacity-95 transition-all flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isComposing ? 'Close Composer' : 'Compose Broadcast'}</span>
        </button>
      </div>

      {/* Permanent Info Banner: Meta Platform 24-Hour Policy */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-4 rounded-xl text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-xs">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold block text-sm text-amber-950 dark:text-amber-100">
            Instagram Platform Rule (24-Hour Messaging Window)
          </span>
          <p className="leading-relaxed text-slate-700 dark:text-amber-300">
            Instagram only lets you DM people who messaged your account in the last 24 hours. Broadcasts reach those recent contacts only — you cannot message all followers. This is an Instagram rule, not a limit of this app.
          </p>
        </div>
      </div>

      {/* Send Result Banner */}
      {sendResult && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 animate-fadeIn ${
            sendResult.success
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60 text-red-900 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {sendResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <span className="font-semibold">{sendResult.message}</span>
          </div>
          <button
            onClick={() => setSendResult(null)}
            className="text-xs font-bold hover:underline cursor-pointer opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Broadcast Composer Form Drawer */}
      {isComposing && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-purple-200 dark:border-purple-900/60 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-purple-500" />
              <span>Compose New Broadcast Campaign</span>
            </h3>
            <span className="text-[11px] text-pink-500 font-bold bg-pink-50 dark:bg-pink-950 px-2.5 py-0.5 rounded">
              Meta 24h Window Compliant
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Campaign Title (Internal Reference)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Early Bird Offer Access"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Audience Segment
              </label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="Recent 24h Contacts">Recent 24h Active Contacts</option>
                <option value="Inbound Leads (24h)">Inbound Leads (Active 24h Window)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              DM Message Body
            </label>
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type message body..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Action Button Label (Optional)
              </label>
              <input
                type="text"
                value={buttonLabel}
                onChange={(e) => setButtonLabel(e.target.value)}
                placeholder="e.g. 🎟️ Claim Offer Now"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Action Button URL
              </label>
              <input
                type="url"
                value={buttonUrl}
                onChange={(e) => setButtonUrl(e.target.value)}
                placeholder="e.g. https://www.jaaga.ai"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="schedule"
                  checked={scheduleType === 'now'}
                  onChange={() => setScheduleType('now')}
                  className="text-purple-600"
                />
                <span className="font-semibold text-slate-900 dark:text-white">Send Immediately</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="schedule"
                  checked={scheduleType === 'scheduled'}
                  onChange={() => setScheduleType('scheduled')}
                  className="text-purple-600"
                />
                <span className="font-semibold text-slate-900 dark:text-white">Schedule Future Date</span>
              </label>
            </div>

            <button
              id="btn-confirm-send-broadcast"
              disabled={isSending || !title.trim() || !body.trim()}
              onClick={handleSendBroadcast}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Broadcast...</span>
                </>
              ) : scheduleType === 'now' ? (
                '🚀 Launch Broadcast Campaign'
              ) : (
                '📅 Schedule Campaign'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Broadcast History List */}
      <div className="space-y-4">
        {broadcasts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <Send className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Broadcast Campaigns Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Click "Compose Broadcast" above to send a direct message campaign to your active 24-hour contacts.
            </p>
          </div>
        ) : (
          broadcasts.map((bc) => (
            <div
              key={bc.id}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        bc.status === 'sent'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : bc.status === 'failed'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {bc.status === 'sent' ? 'Sent' : bc.status === 'failed' ? 'Failed' : 'Scheduled'}
                    </span>
                    <span className="text-xs text-slate-400">• Segment: {bc.audienceSegment}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {bc.title}
                  </h3>
                </div>

                <span className="text-xs text-slate-400 font-medium shrink-0">{bc.createdAt}</span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                "{bc.body}"
              </p>

              {/* Real Campaign Analytics Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Reachable (24h)</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {bc.stats?.targetUsers ?? 0}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Sent</span>
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    {bc.stats?.sent ?? 0}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Failed</span>
                  <span className={`text-sm font-extrabold ${(bc.stats?.failed || 0) > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                    {bc.stats?.failed ?? 0}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Status</span>
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 capitalize">
                    {bc.status}
                  </span>
                </div>
              </div>

              {bc.status === 'sent' && bc.stats?.targetUsers === 0 && (
                <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-800/50 mt-1">
                  ℹ️ 0 recipients were reachable in the last 24 hours. Instagram requires contacts to have messaged your account within 24 hours to receive a broadcast.
                </p>
              )}

              {bc.errorMessage && (
                <p className="text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2.5 rounded-lg border border-red-200/60 dark:border-red-800/50 mt-1">
                  Error: {bc.errorMessage}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
