import React from 'react';
import { Automation } from '../../types';
import {
  BarChart3,
  TrendingUp,
  Zap,
  MessageSquare,
  Users,
  Filter,
  ArrowRight,
  Sparkles,
  MousePointer,
  CheckCircle2,
} from 'lucide-react';

interface AnalyticsScreenProps {
  automations: Automation[];
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ automations }) => {
  const totalComments = automations.reduce((acc, a) => acc + a.stats.triggersCount, 0);
  const totalDMs = automations.reduce((acc, a) => acc + a.stats.dmsSent, 0);
  const totalOpened = Math.round(totalDMs * 0.82);
  const totalClicked = Math.round(totalDMs * 0.62);
  const totalLeads = automations.reduce((acc, a) => acc + a.stats.leadsCaptured, 0);

  const keywordsRanking = [
    { keyword: 'CHECKLIST', triggers: 1420, dms: 1380, leads: 940, conversion: '68.1%' },
    { keyword: 'FIGMA', triggers: 820, dms: 790, leads: 520, conversion: '65.8%' },
    { keyword: 'PLAYBOOK', triggers: 891, dms: 850, leads: 510, conversion: '60.0%' },
    { keyword: 'AUTOMATE', triggers: 640, dms: 610, leads: 340, conversion: '55.7%' },
    { keyword: 'PRICING', triggers: 450, dms: 450, leads: 180, conversion: '40.0%' },
  ];

  return (
    <div id="screen-analytics" className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <span>Analytics & Conversion Funnel</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">
            Real-Time Data
          </span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Measure post comment engagement, DM click-through rates, and lead capture conversions.
        </p>
      </div>

      {/* Conversion Funnel Visualizer Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Filter className="w-4 h-4 text-purple-500" />
            <span>Comment-to-Lead Conversion Funnel</span>
          </h3>
          <p className="text-xs text-slate-500">
            Conversion drop-off analysis across every stage of the Instagram automation flow
          </p>
        </div>

        {/* Funnel Stages */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {/* Stage 1 */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-center relative">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Stage 1</span>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
              {totalComments.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">Comments Posted</div>
            <span className="text-[10px] font-bold text-emerald-500 mt-2 inline-block">100% Top Funnel</span>
          </div>

          {/* Stage 2 */}
          <div className="p-4 bg-purple-50/60 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800 text-center relative">
            <span className="text-[10px] font-bold text-purple-400 uppercase">Stage 2</span>
            <div className="text-lg font-black text-purple-700 dark:text-purple-300 mt-1">
              {totalDMs.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-0.5">DMs Dispatched</div>
            <span className="text-[10px] font-bold text-purple-500 mt-2 inline-block">97.2% Sent</span>
          </div>

          {/* Stage 3 */}
          <div className="p-4 bg-pink-50/60 dark:bg-pink-950/40 rounded-2xl border border-pink-200 dark:border-pink-800 text-center relative">
            <span className="text-[10px] font-bold text-pink-400 uppercase">Stage 3</span>
            <div className="text-lg font-black text-pink-700 dark:text-pink-300 mt-1">
              {totalOpened.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-pink-600 dark:text-pink-400 mt-0.5">DMs Opened</div>
            <span className="text-[10px] font-bold text-pink-500 mt-2 inline-block">82.0% Open Rate</span>
          </div>

          {/* Stage 4 */}
          <div className="p-4 bg-amber-50/60 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 text-center relative">
            <span className="text-[10px] font-bold text-amber-400 uppercase">Stage 4</span>
            <div className="text-lg font-black text-amber-700 dark:text-amber-300 mt-1">
              {totalClicked.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">Links Clicked</div>
            <span className="text-[10px] font-bold text-amber-500 mt-2 inline-block">62.0% CTR</span>
          </div>

          {/* Stage 5 */}
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center relative">
            <span className="text-[10px] font-bold text-emerald-400 uppercase">Stage 5</span>
            <div className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-1">
              {totalLeads.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">Leads Captured</div>
            <span className="text-[10px] font-bold text-emerald-600 mt-2 inline-block">56.2% Final Opt-in</span>
          </div>
        </div>
      </div>

      {/* Top Keywords Ranking Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Top Performing Trigger Keywords
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase">
                <th className="p-3">Keyword</th>
                <th className="p-3">Comments Matched</th>
                <th className="p-3">DMs Delivered</th>
                <th className="p-3">Leads Captured</th>
                <th className="p-3 text-right">Conversion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {keywordsRanking.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-purple-600 dark:text-purple-300">
                    "{item.keyword}"
                  </td>
                  <td className="p-3 text-slate-700 dark:text-slate-300">{item.triggers}</td>
                  <td className="p-3 text-slate-700 dark:text-slate-300">{item.dms}</td>
                  <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">{item.leads}</td>
                  <td className="p-3 text-right font-extrabold text-purple-700 dark:text-purple-300">
                    {item.conversion}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
