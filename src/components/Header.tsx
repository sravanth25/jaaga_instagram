import React from 'react';
import { ScreenType, AppSettings } from '../types';
import {
  Plus,
  ShieldCheck,
  Instagram,
  Bell,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface HeaderProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  appSettings: AppSettings;
  onOpenComplianceModal: () => void;
  onNewAutomation: () => void;
}

const SCREEN_TITLES: Record<ScreenType, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview of DM automations, activity & lead conversions' },
  automations: { title: 'Automations', subtitle: 'Manage your active Instagram comment & DM trigger flows' },
  builder: { title: 'Automation Builder', subtitle: 'Design visual Comment-to-DM triggers & automated message flows' },
  inbox: { title: 'Unified Inbox', subtitle: 'Manage Instagram DM threads with automated or human takeover' },
  'ai-assistant': { title: 'AI Assistant', subtitle: 'Train an intelligent Instagram DM agent with custom FAQ knowledge base' },
  contacts: { title: 'Contacts & Leads CRM', subtitle: 'Manage, tag, and export captured lead emails & phone numbers' },
  broadcasts: { title: 'Broadcast DMs', subtitle: 'Send targeted message campaigns to opted-in Instagram followers' },
  analytics: { title: 'Analytics & Funnel', subtitle: 'Track comment-to-DM conversions, click rates & top keywords' },
  settings: { title: 'Account Settings', subtitle: 'Instagram API connection, rate limits, quiet hours & team access' },
};

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  appSettings,
  onOpenComplianceModal,
  onNewAutomation,
}) => {
  const currentInfo = SCREEN_TITLES[currentScreen] || { title: 'DMFlow', subtitle: '' };

  return (
    <header id="main-app-header" className="h-16 bg-white border-b border-slate-200 px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Title & Subtitle */}
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-bold text-slate-900">
          {currentInfo.title}
        </h1>
        <span className="text-slate-300 hidden sm:inline">|</span>
        <p className="text-xs font-medium text-slate-500 hidden sm:block">
          {currentInfo.subtitle}
        </p>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center space-x-3">
        {/* Meta Compliance Pill */}
        <button
          id="btn-compliance-status"
          onClick={onOpenComplianceModal}
          className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer"
          title="Click to view Meta Messaging API Compliance Rules"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Compliance: 24h Window Active</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
        </button>

        {/* Instagram Connected Account Badge */}
        <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
          <div className="relative">
            <img
              src={appSettings.handleAvatar}
              alt={appSettings.connectedHandle}
              className="w-5 h-5 rounded-full object-cover ring-1 ring-pink-500/50"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 ring-1 ring-white" />
          </div>
          <span className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
            <Instagram className="w-3 h-3 text-pink-500" />
            <span>@{appSettings.connectedHandle}</span>
          </span>
        </div>

        {/* Notifications Icon */}
        <button
          id="btn-notifications"
          className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors relative cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#dc2743] rounded-full" />
        </button>

        {/* New Automation CTA Button */}
        <button
          id="btn-header-new-automation"
          onClick={onNewAutomation}
          className="bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:opacity-95 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>New Automation</span>
        </button>
      </div>
    </header>
  );
};
