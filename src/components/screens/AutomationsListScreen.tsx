import React, { useState } from 'react';
import { Automation, TriggerType, ScreenType } from '../../types';
import {
  Zap,
  Plus,
  Play,
  Pause,
  Trash2,
  Copy,
  Edit3,
  Search,
  MessageSquare,
  Users,
  MousePointer,
  Filter,
  Sparkles,
} from 'lucide-react';

interface AutomationsListScreenProps {
  automations: Automation[];
  onNavigate: (screen: ScreenType) => void;
  onToggleStatus: (id: string) => void;
  onSelectAutomation: (automation: Automation) => void;
  onDuplicateAutomation: (automation: Automation) => void;
  onDeleteAutomation: (automation: Automation) => void;
}

export const AutomationsListScreen: React.FC<AutomationsListScreenProps> = ({
  automations,
  onNavigate,
  onToggleStatus,
  onSelectAutomation,
  onDuplicateAutomation,
  onDeleteAutomation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = automations.filter((auto) => {
    const matchesSearch =
      auto.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      auto.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      auto.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'all') return true;
    if (filterType === 'live') return auto.status === 'live';
    if (filterType === 'paused') return auto.status === 'paused';
    return auto.triggerType === filterType;
  });

  return (
    <div id="screen-automations-list" className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <span>Automations & Trigger Flows</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">
              {automations.length} Total
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage comment-to-DM triggers, keyword auto-responders, and story reply flows.
          </p>
        </div>

        <button
          id="btn-create-automation-list"
          onClick={() => onNavigate('builder')}
          className="bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:opacity-95 transition-all flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Automation</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Flows' },
            { id: 'live', label: 'Live' },
            { id: 'paused', label: 'Paused' },
            { id: 'comment_dm', label: 'Comment → DM' },
            { id: 'dm_keyword', label: 'DM Keywords' },
            { id: 'story_reply', label: 'Story Replies' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterType === tab.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search triggers or keywords..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Automations Cards Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-5">
          {filtered.map((auto) => (
            <div
              key={auto.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        auto.triggerType === 'comment_dm'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                          : auto.triggerType === 'dm_keyword'
                          ? 'bg-pink-100 text-pink-700 dark:bg-pink-950/80 dark:text-pink-300 border border-pink-200 dark:border-pink-800'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {auto.triggerType === 'comment_dm'
                        ? 'Comment → DM'
                        : auto.triggerType === 'dm_keyword'
                        ? 'DM Keyword'
                        : 'Story Reply'}
                    </span>

                    <span className="text-[11px] text-slate-400 font-medium">
                      Updated {new Date(auto.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Status Toggle Button */}
                  <button
                    onClick={() => onToggleStatus(auto.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-all ${
                      auto.status === 'live'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 hover:bg-emerald-200 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 border border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {auto.status === 'live' ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Live</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <span>Paused</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Title & Description */}
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {auto.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {auto.description}
                </p>

                {/* Keywords Trigger Section */}
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
                    <span>Trigger Keywords ({auto.keywords.length})</span>
                    <span className="text-purple-600 dark:text-purple-400 capitalize">
                      Rule: {auto.matchRule} match
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {auto.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-mono font-bold text-purple-700 dark:text-purple-300 shadow-2xs"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Performance Stats Metrics Grid */}
              <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Triggers</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {auto.stats.triggersCount.toLocaleString()}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">DMs Sent</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {auto.stats.dmsSent.toLocaleString()}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Leads</span>
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    {auto.stats.leadsCaptured.toLocaleString()}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">CTR</span>
                  <span className="text-sm font-extrabold text-purple-600 dark:text-purple-400">
                    {auto.stats.ctrPercent}%
                  </span>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onDuplicateAutomation(auto)}
                    className="p-2 text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Duplicate Flow"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteAutomation(auto)}
                    className="p-2 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Delete Automation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    onSelectAutomation(auto);
                    onNavigate('builder');
                  }}
                  className="flex items-center gap-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Builder</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center max-w-lg mx-auto my-8 space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Automations Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No trigger flows match your current filter. Create a new Comment-to-DM automation to get started.
          </p>
          <button
            onClick={() => onNavigate('builder')}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Automation</span>
          </button>
        </div>
      )}
    </div>
  );
};
