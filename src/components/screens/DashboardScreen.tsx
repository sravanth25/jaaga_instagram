import React from 'react';
import { Automation, Conversation, ScreenType } from '../../types';
import {
  Zap,
  MessageSquare,
  Users,
  TrendingUp,
  ArrowUpRight,
  Plus,
  Send,
  Bot,
  CheckCircle,
  Play,
  Pause,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface DashboardScreenProps {
  automations: Automation[];
  conversations: Conversation[];
  leads?: any[];
  onNavigate: (screen: ScreenType) => void;
  onToggleAutomationStatus?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
  onSelectAutomation?: (automation: Automation) => void;
  onSelectConversation?: (conversationId: string) => void;
  onStartLiveChat?: (userHandle?: string, initialText?: string) => void;
  connectedHandle?: string;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  automations,
  conversations,
  leads = [],
  onNavigate,
  onToggleAutomationStatus,
  onToggleStatus,
  onSelectAutomation,
  onSelectConversation,
  onStartLiveChat,
  connectedHandle = 'jaaga.ai',
}) => {
  const totalDMsSent = automations.reduce((acc, a) => acc + a.stats.dmsSent, 0);
  const totalCommentsReplied = automations.reduce((acc, a) => acc + a.stats.triggersCount, 0);
  const totalLeadsCaptured = automations.reduce((acc, a) => acc + a.stats.leadsCaptured, 0);
  const avgOptInRate = (totalLeadsCaptured / Math.max(totalDMsSent, 1) * 100).toFixed(1);

  const activeAutomations = automations.filter((a) => a.status === 'live');

  // Simulated chart data
  const activityData = [
    { day: 'Jul 1', dms: 120, comments: 140 },
    { day: 'Jul 5', dms: 190, comments: 210 },
    { day: 'Jul 10', dms: 310, comments: 280 },
    { day: 'Jul 15', dms: 480, comments: 520 },
    { day: 'Jul 20', dms: 620, comments: 690 },
    { day: 'Jul 25', dms: 810, comments: 750 },
    { day: 'Jul 30', dms: 950, comments: 890 },
  ];

  return (
    <div id="screen-dashboard" className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Connected: @{connectedHandle}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Instagram Automation Control Center
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-responder active. Convert post comments into lead magnet DMs & CRM contacts automatically.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            id="btn-dash-create-auto"
            onClick={() => onNavigate('builder')}
            className="bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:opacity-95 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Comment-to-DM Flow</span>
          </button>
          <button
            id="btn-dash-broadcast"
            onClick={() => onNavigate('broadcasts')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-bold border border-slate-200 transition-colors cursor-pointer flex items-center space-x-1.5"
          >
            <Send className="w-3.5 h-3.5 text-pink-500" />
            <span>Send Broadcast</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            Total DMs Sent
          </p>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-slate-900">{totalDMsSent.toLocaleString()}</h3>
            <span className="text-green-500 text-xs font-bold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              +24.8%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">vs last 30 days period</p>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            Comments Replied
          </p>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-slate-900">{totalCommentsReplied.toLocaleString()}</h3>
            <span className="text-green-500 text-xs font-bold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              +18.3%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Auto-replies posted publicly</p>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            Leads Captured
          </p>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-slate-900">{totalLeadsCaptured.toLocaleString()}</h3>
            <span className="text-green-500 text-xs font-bold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              +31.2%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Emails & phone numbers in CRM</p>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            Lead Opt-In Rate
          </p>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-slate-900">{avgOptInRate}%</h3>
            <span className="text-green-500 text-xs font-bold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              +5.4%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">DMs converting to leads</p>
        </div>
      </div>

      {/* Main Grid: Chart & Recent Conversations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 30-Day Activity Visualization */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                30-Day Automation Activity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily volume of public comment replies vs direct messages sent
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-purple-600 inline-block" />
                <span className="text-slate-600 dark:text-slate-300">DMs Sent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-pink-500 inline-block" />
                <span className="text-slate-600 dark:text-slate-300">Comments</span>
              </div>
            </div>
          </div>

          {/* Activity Visualizer Bar Graph */}
          <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
            {activityData.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end gap-1.5 group">
                <div className="w-full max-w-[32px] bg-slate-100 dark:bg-slate-800 rounded-t-lg flex flex-col justify-end overflow-hidden p-0.5 gap-0.5 transition-all group-hover:bg-slate-200 dark:group-hover:bg-slate-700">
                  <div
                    style={{ height: `${(item.dms / 1000) * 100}%` }}
                    className="w-full bg-gradient-to-t from-purple-700 to-purple-500 rounded-t-xs transition-all"
                    title={`DMs: ${item.dms}`}
                  />
                  <div
                    style={{ height: `${(item.comments / 1000) * 100}%` }}
                    className="w-full bg-gradient-to-t from-pink-600 to-pink-400 rounded-t-xs transition-all"
                    title={`Comments: ${item.comments}`}
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-400">{item.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Peak Day: July 30 (950 DMs Sent)</span>
            <button onClick={() => onNavigate('analytics')} className="text-pink-500 hover:underline font-semibold flex items-center gap-1">
              <span>Detailed analytics</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Live Conversation Stream Feed */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Recent Conversations</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </h3>
              <button
                onClick={() => onNavigate('inbox')}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
              >
                View Inbox
              </button>
            </div>

            <div className="space-y-3">
              {conversations.slice(0, 4).map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    onNavigate('inbox');
                  }}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-900/60 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-purple-50/40 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={conv.avatar}
                      alt={conv.userHandle}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-500/20"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          @{conv.userHandle.replace(/^@+/, '')}
                        </span>
                        {conv.mode === 'automated' ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                            Bot
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                            Human
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {conv.lastMessage}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                    {conv.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={() => onNavigate('inbox')}
              className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer"
            >
              Open Unified DM Inbox →
            </button>
          </div>
        </div>
      </div>

      {/* Active Automations List Summary */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Active Automations ({activeAutomations.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Trigger flows currently running live on @{connectedHandle}
            </p>
          </div>
          <button
            onClick={() => onNavigate('automations')}
            className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
          >
            Manage All Automations
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {automations.map((auto) => (
            <div
              key={auto.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      auto.triggerType === 'comment_dm'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        : auto.triggerType === 'dm_keyword'
                        ? 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {auto.triggerType === 'comment_dm'
                      ? 'Comment → DM'
                      : auto.triggerType === 'dm_keyword'
                      ? 'DM Keyword'
                      : 'Story Reply'}
                  </span>

                  {/* Live / Paused Switch Button */}
                  <button
                    onClick={() => onToggleStatus(auto.id)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                      auto.status === 'live'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 hover:bg-emerald-200'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-300'
                    }`}
                  >
                    {auto.status === 'live' ? (
                      <>
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Live</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-2.5 h-2.5 fill-current" />
                        <span>Paused</span>
                      </>
                    )}
                  </button>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {auto.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                  {auto.description}
                </p>

                {/* Keywords Chips */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {auto.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono font-medium text-purple-600 dark:text-purple-300"
                    >
                      "{kw}"
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats Bar */}
              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {auto.stats.dmsSent.toLocaleString()}
                  </span>{' '}
                  DMs Sent
                </div>
                <div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {auto.stats.leadsCaptured}
                  </span>{' '}
                  Leads
                </div>
                <button
                  onClick={() => {
                    onSelectAutomation(auto);
                    onNavigate('builder');
                  }}
                  className="text-pink-500 hover:underline font-semibold text-[11px] cursor-pointer"
                >
                  Edit Flow →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
