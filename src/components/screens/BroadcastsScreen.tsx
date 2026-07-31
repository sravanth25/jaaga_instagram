import React, { useState } from 'react';
import { Broadcast, ScreenType } from '../../types';
import {
  Send,
  Users,
  Clock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  BarChart2,
  Sparkles,
  MessageSquare,
  Calendar,
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
  const [buttonUrl, setButtonUrl] = useState('https://designmaster.co/vip');
  const [segment, setSegment] = useState<any>('VIP Leads');
  const [scheduleType, setScheduleType] = useState<'now' | 'scheduled'>('now');
  const [scheduleDate, setScheduleDate] = useState('2026-08-05 10:00 EST');

  const handleSendBroadcast = () => {
    if (!title.trim() || !body.trim()) return;

    onOpenConfirmation(
      () => {
        const newBroadcast: Broadcast = {
          id: `bc_${Date.now()}`,
          title: title.trim(),
          body: body.trim(),
          buttons: [
            {
              id: `btn_bc_${Date.now()}`,
              type: 'link',
              label: buttonLabel.trim() || 'Open Link',
              url: buttonUrl.trim() || 'https://designmaster.co',
            },
          ],
          audienceSegment: segment,
          scheduleType,
          scheduledFor: scheduleType === 'scheduled' ? scheduleDate : undefined,
          status: scheduleType === 'now' ? 'sent' : 'scheduled',
          stats: {
            targetUsers: segment === 'VIP Leads' ? 2500 : 1420,
            sent: scheduleType === 'now' ? 2480 : 0,
            delivered: scheduleType === 'now' ? 2450 : 0,
            opened: scheduleType === 'now' ? 1890 : 0,
            clicked: scheduleType === 'now' ? 1240 : 0,
          },
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };

        onSaveBroadcast(newBroadcast);
        setIsComposing(false);
        setTitle('');
        setBody('');
      },
      scheduleType === 'now' ? 'Send Broadcast DM Now' : 'Schedule Broadcast',
      `You are about to send a broadcast DM campaign to all opted-in followers in segment "${segment}".`
    );
  };

  return (
    <div id="screen-broadcasts" className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <span>Broadcast DMs & Announcements</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">
              {broadcasts.length} Campaigns
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Send bulk direct messages to opted-in followers & captured leads.
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

      {/* Broadcast Composer Form Drawer */}
      {isComposing && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-purple-200 dark:border-purple-900/60 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-purple-500" />
              <span>Compose New Broadcast Campaign</span>
            </h3>
            <span className="text-[11px] text-pink-500 font-bold bg-pink-50 dark:bg-pink-950 px-2 py-0.5 rounded">
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
                placeholder="e.g. Q3 Masterclass Early Bird Access"
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
                <option value="All Leads">All Leads (3,920 Contacts)</option>
                <option value="VIP Leads">VIP Leads (2,500 Contacts)</option>
                <option value="Figma Kit Leads">Figma Kit Leads (1,420 Contacts)</option>
                <option value="UI Checklist Buyers">UI Checklist Buyers (940 Contacts)</option>
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
                Action Button Label
              </label>
              <input
                type="text"
                value={buttonLabel}
                onChange={(e) => setButtonLabel(e.target.value)}
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
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
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
              onClick={handleSendBroadcast}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              {scheduleType === 'now' ? '🚀 Launch Broadcast Campaign' : '📅 Schedule Campaign'}
            </button>
          </div>
        </div>
      )}

      {/* Broadcast History List */}
      <div className="space-y-4">
        {broadcasts.map((bc) => (
          <div
            key={bc.id}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      bc.status === 'sent'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {bc.status === 'sent' ? 'Sent' : 'Scheduled'}
                  </span>
                  <span className="text-xs text-slate-400">• Audience: {bc.audienceSegment}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {bc.title}
                </h3>
              </div>

              <span className="text-xs text-slate-400 font-medium">{bc.createdAt}</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              "{bc.body}"
            </p>

            {/* Campaign Analytics Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-center">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Target</span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {bc.stats.targetUsers.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Sent</span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {bc.stats.sent.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Delivered</span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {bc.stats.delivered.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Opened</span>
                <span className="text-sm font-extrabold text-purple-600 dark:text-purple-400">
                  {bc.stats.opened.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Clicked</span>
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  {bc.stats.clicked.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
