import React from 'react';
import { ScreenType } from '../types';
import {
  LayoutDashboard,
  Zap,
  Workflow,
  MessageSquare,
  Bot,
  Users,
  Send,
  BarChart3,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  automationsCount?: number;
  leadsCount?: number;
  unreadMessagesCount?: number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  id: ScreenType;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  unreadMessagesCount = 2,
  collapsed = false,
  onToggleCollapse,
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'automations', label: 'Automations', icon: Zap },
    { id: 'builder', label: 'Flow Builder', icon: Workflow, badge: 'New' },
    { id: 'inbox', label: 'Unified Inbox', icon: MessageSquare, badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
    { id: 'contacts', label: 'Contacts CRM', icon: Users },
    { id: 'broadcasts', label: 'Broadcast DMs', icon: Send },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      id="main-sidebar"
      className={`bg-white text-slate-900 flex flex-col justify-between border-r border-slate-200 transition-all duration-300 relative z-40 select-none ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand & Logo Section */}
      <div>
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">
                DMFlow
              </span>
            </div>
          )}

          {collapsed && (
            <div className="h-8 w-8 mx-auto rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white font-bold shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
          )}

          {onToggleCollapse && (
            <button
              id="btn-toggle-sidebar"
              onClick={onToggleCollapse}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors hidden lg:block"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-900' : 'text-slate-500'}`} />
                {!collapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
                {!collapsed && item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : typeof item.badge === 'number'
                        ? 'bg-[#dc2743] text-white'
                        : 'bg-purple-100 text-purple-700 border border-purple-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer — Account Status */}
      {!collapsed && (
        <div className="mt-auto p-4 border-t border-slate-100">
          <div className="flex items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover mr-3 border border-slate-200"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">@design.master</p>
              <p className="text-[10px] text-green-600 flex items-center font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1 animate-pulse" />
                Meta API Live
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
