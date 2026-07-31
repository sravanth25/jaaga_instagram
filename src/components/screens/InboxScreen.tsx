import React, { useState } from 'react';
import { Conversation, Message, ScreenType } from '../../types';
import {
  MessageSquare,
  Search,
  Bot,
  User,
  Sparkles,
  Send,
  Tag,
  Phone,
  Mail,
  Instagram,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader2,
  Shield,
  Zap,
} from 'lucide-react';

interface InboxScreenProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onToggleMode: (id: string, mode: 'automated' | 'manual') => void;
  onSendMessage: (id: string, text: string, sender: 'bot' | 'human') => void;
  onUpdateLeadInfo: (id: string, email: string, phone: string, tags: string[]) => void;
  onNavigate: (screen: ScreenType) => void;
}

export const InboxScreen: React.FC<InboxScreenProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onToggleMode,
  onSendMessage,
  onUpdateLeadInfo,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'automated' | 'manual' | 'unread'>('all');

  const [messageInput, setMessageInput] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Active conversation
  const activeConv =
    conversations.find((c) => c.id === selectedConversationId) || conversations[0] || null;

  // Local editable lead state
  const [editableEmail, setEditableEmail] = useState(activeConv?.leadInfo?.email || '');
  const [editablePhone, setEditablePhone] = useState(activeConv?.leadInfo?.phone || '');
  const [newTagInput, setNewTagInput] = useState('');
  const [tagsList, setTagsList] = useState<string[]>(activeConv?.tags || []);

  // Update local lead state when active conversation changes
  React.useEffect(() => {
    if (activeConv) {
      setEditableEmail(activeConv.leadInfo?.email || '');
      setEditablePhone(activeConv.leadInfo?.phone || '');
      setTagsList(activeConv.tags || []);
    }
  }, [activeConv?.id]);

  const filteredConvs = conversations.filter((conv) => {
    const matchesSearch =
      conv.userHandle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterTab === 'all') return true;
    if (filterTab === 'automated') return conv.mode === 'automated';
    if (filterTab === 'manual') return conv.mode === 'manual';
    if (filterTab === 'unread') return conv.unread;
    return true;
  });

  // Handle Send
  const handleSend = () => {
    if (!messageInput.trim() || !activeConv) return;
    onSendMessage(activeConv.id, messageInput.trim(), activeConv.mode === 'manual' ? 'human' : 'bot');
    setMessageInput('');
  };

  // AI Suggest Reply call to backend
  const handleAiSuggestReply = async () => {
    if (!activeConv) return;
    setIsSuggesting(true);
    try {
      const res = await fetch('/api/gemini/suggest-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatHistory: activeConv.messages,
          userHandle: activeConv.userHandle,
          customerNote: activeConv.notes,
        }),
      });
      const data = await res.json();
      if (data?.reply) {
        setMessageInput(data.reply);
      } else {
        setMessageInput(`Hey @${activeConv.userHandle}! Thanks for reaching out. Here is the link you requested: https://designmaster.co ✨`);
      }
    } catch (e) {
      setMessageInput(`Hey @${activeConv.userHandle}! Thanks for reaching out. Let me know if you need any help with your download ✨`);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSaveContactDetails = () => {
    if (!activeConv) return;
    onUpdateLeadInfo(activeConv.id, editableEmail, editablePhone, tagsList);
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const cleaned = newTagInput.trim();
    if (!tagsList.includes(cleaned)) {
      const updated = [...tagsList, cleaned];
      setTagsList(updated);
      if (activeConv) {
        onUpdateLeadInfo(activeConv.id, editableEmail, editablePhone, updated);
      }
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    const updated = tagsList.filter((t) => t !== tag);
    setTagsList(updated);
    if (activeConv) {
      onUpdateLeadInfo(activeConv.id, editableEmail, editablePhone, updated);
    }
  };

  return (
    <div id="screen-inbox" className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden bg-slate-50">
      {/* Left Column: Conversation List */}
      <div className="w-full lg:w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
        {/* Search & Filter Header */}
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All' },
              { id: 'automated', label: 'Bot' },
              { id: 'manual', label: 'Human' },
              { id: 'unread', label: 'Unread' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  filterTab === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredConvs.map((conv) => {
            const isSelected = activeConv?.id === conv.id;
            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-pink-50/50 border-l-4 border-[#dc2743]'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={conv.avatar}
                    alt={conv.userHandle}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-pink-500/20"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                      conv.mode === 'automated' ? 'bg-pink-500' : 'bg-amber-500'
                    }`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      @{conv.userHandle}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                      {conv.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {conv.lastMessage}
                  </p>

                  <div className="flex items-center gap-1.5 mt-2">
                    {conv.mode === 'automated' ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-pink-100 text-pink-700">
                        🤖 Bot Active
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-700">
                        👤 Human Mode
                      </span>
                    )}

                    {conv.tags.slice(0, 1).map((t, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.2 rounded text-[9px] bg-slate-100 text-slate-600 font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Center Column: Chat Thread */}
      {activeConv ? (
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
          {/* Chat Header */}
          <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
            <div className="flex items-center gap-3">
              <img
                src={activeConv.avatar}
                alt={activeConv.userHandle}
                className="w-9 h-9 rounded-full object-cover"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {activeConv.userName}
                  </h3>
                  <span className="text-xs text-slate-400">@{activeConv.userHandle}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Followers: {activeConv.followerCount || '10k+'} • Instagram Direct
                </p>
              </div>
            </div>

            {/* Mode Switcher Toggle: Automated Bot vs Manual Human Takeover */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                id="btn-mode-automated"
                onClick={() => onToggleMode(activeConv.id, 'automated')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeConv.mode === 'automated'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Automated Bot</span>
              </button>
              <button
                id="btn-mode-manual"
                onClick={() => onToggleMode(activeConv.id, 'manual')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeConv.mode === 'manual'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Human Takeover</span>
              </button>
            </div>
          </div>

          {/* Chat Message Thread Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
            {activeConv.messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex items-center gap-1 mb-1 text-[10px] text-slate-400 font-semibold px-1">
                    {msg.sender === 'user' && <span>@{activeConv.userHandle}</span>}
                    {msg.sender === 'bot' && (
                      <span className="text-purple-500 font-bold flex items-center gap-1">
                        <Bot className="w-3 h-3" /> Auto Bot
                      </span>
                    )}
                    {msg.sender === 'human' && (
                      <span className="text-amber-500 font-bold flex items-center gap-1">
                        <User className="w-3 h-3" /> Agent (You)
                      </span>
                    )}
                    <span>• {msg.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                      isUser
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-tl-xs'
                        : msg.sender === 'bot'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-xs'
                        : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-tr-xs font-medium'
                    }`}
                  >
                    <p>{msg.text}</p>

                    {/* Button attachments inside DM message */}
                    {msg.buttons && msg.buttons.length > 0 && (
                      <div className="mt-2.5 space-y-1.5 pt-2 border-t border-white/20">
                        {msg.buttons.map((b) => (
                          <a
                            key={b.id}
                            href={b.url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="block w-full text-center bg-white/20 hover:bg-white/30 text-white font-bold py-1.5 px-3 rounded-xl text-[11px] transition-colors"
                          >
                            {b.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat Input Controls + AI Suggest Reply */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
            {/* AI Suggest Bar */}
            <div className="flex items-center justify-between">
              <button
                id="btn-ai-suggest-reply"
                onClick={handleAiSuggestReply}
                disabled={isSuggesting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/60 dark:to-pink-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:opacity-90 transition-all cursor-pointer"
              >
                {isSuggesting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                    <span>Gemini AI thinking...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                    <span>AI Suggest Smart DM Reply</span>
                  </>
                )}
              </button>

              <span className="text-[10px] text-slate-400 font-medium">
                Sending as: <strong className="text-slate-700 dark:text-slate-200">{activeConv.mode === 'manual' ? 'Human Agent' : 'Automated Bot'}</strong>
              </span>
            </div>

            {/* Input Box */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSend())}
                placeholder={`Type a reply to @${activeConv.userHandle}...`}
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                id="btn-send-dm"
                onClick={handleSend}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white p-2.5 rounded-xl shadow-xs transition-opacity cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400">
          Select a conversation from the left to view messages.
        </div>
      )}

      {/* Right Column: Contact Lead Profile & CRM Drawer */}
      {activeConv && (
        <div className="w-full lg:w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 overflow-y-auto space-y-6 shrink-0">
          {/* User Profile Summary */}
          <div className="text-center space-y-2">
            <img
              src={activeConv.avatar}
              alt={activeConv.userHandle}
              className="w-16 h-16 rounded-full object-cover mx-auto ring-4 ring-purple-500/20"
            />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {activeConv.userName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">@{activeConv.userHandle}</p>
          </div>

          {/* Captured Lead Data Fields */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
              <span>Captured Lead Data</span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                Synced CRM
              </span>
            </h4>

            {/* Email Field */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
                <Mail className="w-3 h-3 text-purple-500" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                value={editableEmail}
                onChange={(e) => setEditableEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Phone Field */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
                <Phone className="w-3 h-3 text-pink-500" />
                <span>Phone Number</span>
              </label>
              <input
                type="tel"
                value={editablePhone}
                onChange={(e) => setEditablePhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <button
              onClick={handleSaveContactDetails}
              className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
            >
              Save Lead Details
            </button>
          </div>

          {/* Tags */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Tags & Segment</span>
              <Tag className="w-3 h-3 text-slate-400" />
            </label>

            <div className="flex flex-wrap gap-1">
              {tagsList.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded text-[10px] font-bold flex items-center gap-1"
                >
                  <span>{tag}</span>
                  <button onClick={() => handleRemoveTag(tag)} className="hover:text-rose-500">
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-1 pt-1">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add tag..."
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-[11px] text-slate-900 dark:text-white"
              />
              <button
                onClick={handleAddTag}
                className="bg-purple-600 text-white px-2 py-1 rounded text-[11px] font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Trigger History Log */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Trigger Activity History</span>
            </h4>
            <div className="space-y-1.5">
              {activeConv.triggerHistory.map((trig, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-[11px] space-y-0.5"
                >
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {trig.automationName}
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    Matched "{trig.keywordMatched}" • {trig.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
