import React, { useState, useEffect } from 'react';
import { Automation, IGPost, DMButton, MatchRule, ScreenType } from '../../types';
import { IGPostItem, fetchInstagramPosts } from '../../services/instagram';
import {
  Sparkles,
  Plus,
  Trash2,
  Check,
  Instagram,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  MessageSquare,
  Zap,
  Layers,
  Link,
  CornerDownRight,
  Clock,
  UserCheck,
  Save,
  HelpCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface AutomationBuilderScreenProps {
  automationToEdit?: Automation | null;
  onSaveAutomation: (automation: Automation) => void;
  onNavigate: (screen: ScreenType) => void;
  onOpenConfirmation: (action: () => void, title: string, message: string) => void;
  connectedHandle?: string;
}

export const AutomationBuilderScreen: React.FC<AutomationBuilderScreenProps> = ({
  automationToEdit,
  onSaveAutomation,
  onNavigate,
  onOpenConfirmation,
  connectedHandle = 'jaaga.ai',
}) => {
  // Local state for building or editing automation
  const [title, setTitle] = useState(automationToEdit?.title || 'New Comment-to-DM Lead Magnet');
  const [description, setDescription] = useState(
    automationToEdit?.description || 'Auto-replies to comments and sends direct messages with lead link.'
  );
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>(
    automationToEdit?.selectedPostIds && automationToEdit.selectedPostIds.length > 0
      ? automationToEdit.selectedPostIds.map(String).filter((id) => id !== 'post_1')
      : []
  );
  const [igPosts, setIgPosts] = useState<IGPostItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  useEffect(() => {
    async function loadPosts() {
      setLoadingPosts(true);
      const posts = await fetchInstagramPosts();
      setIgPosts(posts);
      setLoadingPosts(false);
    }
    loadPosts();
  }, []);
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>(
    automationToEdit?.keywords || ['CHECKLIST', 'LINK', 'UI']
  );
  const [matchRule, setMatchRule] = useState<MatchRule>(automationToEdit?.matchRule || 'contains');

  const [commentReplyInput, setCommentReplyInput] = useState('');
  const [publicCommentReplies, setPublicCommentReplies] = useState<string[]>(
    automationToEdit?.publicCommentReplies || [
      'Sent you the link in your DMs! 📥✨',
      'Check your inbox! I just dropped the download link for you! 🚀',
      'Sent! Enjoy the 2026 UI/UX Checklist 🎨👍',
    ]
  );

  const [dmMessageText, setDmMessageText] = useState(
    automationToEdit?.dmMessageText ||
      'Hey there! 👋 Thanks for commenting. Here is your direct access link:'
  );

  const [dmButtons, setDmButtons] = useState<DMButton[]>(
    automationToEdit?.dmButtons || [
      { id: 'b1', type: 'link', label: '📥 Download Free Checklist', url: 'https://designmaster.co/checklist-2026' },
      { id: 'b2', type: 'quick_reply', label: '💡 Watch 2-Min Demo' },
    ]
  );

  const [enableFollowUp, setEnableFollowUp] = useState(automationToEdit?.enableFollowUp || false);
  const [followUpText, setFollowUpText] = useState(
    automationToEdit?.followUpText || 'Hey! Did you get a chance to open the checklist? Reply YES for Figma template!'
  );
  const [followUpDelayHours, setFollowUpDelayHours] = useState(automationToEdit?.followUpDelayHours || 2);

  const [replyOncePerUser, setReplyOncePerUser] = useState(
    automationToEdit?.conditions.replyOncePerUser ?? true
  );
  const [requireFollowing, setRequireFollowing] = useState(
    automationToEdit?.conditions.requireFollowing ?? false
  );
  const [captureLead, setCaptureLead] = useState(
    automationToEdit?.conditions.captureLead ?? true
  );

  const [newButtonLabel, setNewButtonLabel] = useState('');
  const [newButtonUrl, setNewButtonUrl] = useState('');
  const [newButtonType, setNewButtonType] = useState<'link' | 'quick_reply'>('link');

  // Add keyword
  const handleAddKeyword = () => {
    if (!keywordInput.trim()) return;
    const cleaned = keywordInput.trim().toUpperCase();
    if (!keywords.includes(cleaned)) {
      setKeywords([...keywords, cleaned]);
    }
    setKeywordInput('');
  };

  const handleRemoveKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  // Add public comment reply variation
  const handleAddCommentReply = () => {
    if (!commentReplyInput.trim()) return;
    setPublicCommentReplies([...publicCommentReplies, commentReplyInput.trim()]);
    setCommentReplyInput('');
  };

  const handleRemoveCommentReply = (index: number) => {
    if (publicCommentReplies.length <= 1) return;
    setPublicCommentReplies(publicCommentReplies.filter((_, i) => i !== index));
  };

  // Add button to DM
  const handleAddButton = () => {
    if (!newButtonLabel.trim()) return;
    setDmButtons([
      ...dmButtons,
      {
        id: `btn_${Date.now()}`,
        type: newButtonType,
        label: newButtonLabel.trim(),
        url: newButtonType === 'link' ? newButtonUrl.trim() || 'https://designmaster.co' : undefined,
      },
    ]);
    setNewButtonLabel('');
    setNewButtonUrl('');
  };

  const handleRemoveButton = (id: string) => {
    setDmButtons(dmButtons.filter((b) => b.id !== id));
  };

  // Save Automation Handler
  const handleSave = (status: 'live' | 'paused') => {
    onOpenConfirmation(
      () => {
        const newAuto: Automation = {
          id: automationToEdit?.id || `auto_${Date.now()}`,
          title: title || 'Untitled Automation',
          description,
          triggerType: 'comment_dm',
          status,
          selectedPostIds,
          keywords: keywords.length > 0 ? keywords : ['CHECKLIST'],
          matchRule,
          publicCommentReplies: publicCommentReplies.length > 0 ? publicCommentReplies : ['Sent to your DMs! 📩'],
          dmMessageText,
          dmButtons,
          enableFollowUp,
          followUpText,
          followUpDelayHours,
          conditions: {
            replyOncePerUser,
            requireFollowing,
            captureLead,
          },
          stats: automationToEdit?.stats || {
            triggersCount: 0,
            dmsSent: 0,
            leadsCaptured: 0,
            ctrPercent: 0,
          },
          createdAt: automationToEdit?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        onSaveAutomation(newAuto);
        onNavigate('automations');
      },
      status === 'live' ? 'Publish Automation Live' : 'Save as Paused',
      status === 'live'
        ? 'This trigger will start auto-replying to Instagram comments and sending DMs immediately.'
        : 'Save flow as draft/paused.'
    );
  };

  // Select Post toggle
  const togglePostSelection = (postId: string) => {
    if (selectedPostIds.includes(postId)) {
      setSelectedPostIds(selectedPostIds.filter((id) => id !== postId));
    } else {
      setSelectedPostIds([...selectedPostIds, postId]);
    }
  };

  const selectAnyPost = () => {
    setSelectedPostIds([]);
  };

  return (
    <div id="screen-automation-builder" className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100">
              Flow Builder
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Comment → DM Automation</span>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-500 focus:outline-none mt-1 w-full max-w-md"
            placeholder="Automation Name..."
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="btn-save-paused"
            onClick={() => handleSave('paused')}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Save Paused
          </button>
          <button
            id="btn-publish-live"
            onClick={() => handleSave('live')}
            className="bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:opacity-95 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Publish & Go Live</span>
          </button>
        </div>
      </div>

      {/* Main Builder Grid: Steps (Left) + Phone Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 5 Steps Form Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: Select Post / Reel */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Step 1: Pick Instagram Post or Reel
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select a specific post to watch for comments, or choose any current/future post.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={selectAnyPost}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  selectedPostIds.length === 0
                    ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-700 dark:text-purple-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                ✨ Any current or future post
              </button>
            </div>

            {/* Live Instagram Posts Grid */}
            {loadingPosts ? (
              <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                <span>Loading Instagram posts...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {igPosts.map((post) => {
                  const postRealId = String(post.id);
                  const isSelected = selectedPostIds.includes(postRealId);
                  return (
                    <div
                      key={postRealId}
                      onClick={() => togglePostSelection(postRealId)}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-purple-600 ring-2 ring-purple-500/30'
                          : 'border-slate-200 dark:border-slate-800 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={post.thumbnail_url || post.media_url}
                        alt="IG Post"
                        className="w-full h-24 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="p-1.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] truncate">
                        {post.caption || `Post ${postRealId}`}
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* STEP 2: Trigger Keywords & Matching Rules */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Step 2: Define Trigger Keywords
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  When a comment contains any of these words, the DM trigger will fire.
                </p>
              </div>
            </div>

            {/* Keyword Chip Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Target Keywords
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                  placeholder="Type keyword e.g. CHECKLIST and press Enter..."
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Add Keyword
                </button>
              </div>

              {/* Keyword Chips Display */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {keywords.map((kw, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-mono font-bold"
                  >
                    <span>"{kw}"</span>
                    <button
                      onClick={() => handleRemoveKeyword(index)}
                      className="hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Matching Rules Selector */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Match Rule
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'contains', label: 'Contains Keyword', desc: 'Comment includes word' },
                  { id: 'exact', label: 'Exact Match Only', desc: 'Comment is solely word' },
                  { id: 'any', label: 'Any Comment', desc: 'Triggers on all comments' },
                ].map((rule) => (
                  <button
                    key={rule.id}
                    type="button"
                    onClick={() => setMatchRule(rule.id as MatchRule)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      matchRule === rule.id
                        ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-bold">{rule.label}</div>
                    <div className="text-[10px] opacity-75 mt-0.5">{rule.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 3: Public Comment Reply Variations */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Step 3: Public Comment Reply (Anti-Spam)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Rotates public replies on the post so Instagram doesn't flag your responses as spam.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-pink-500 bg-pink-50 dark:bg-pink-950 px-2 py-0.5 rounded border border-pink-200">
                Meta Compliance Required
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={commentReplyInput}
                onChange={(e) => setCommentReplyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCommentReply())}
                placeholder="Add reply variation e.g. Check your DMs! 🚀"
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={handleAddCommentReply}
                className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Add Variation
              </button>
            </div>

            <div className="space-y-2">
              {publicCommentReplies.map((reply, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs"
                >
                  <span className="text-slate-700 dark:text-slate-200 font-medium truncate">
                    "{reply}"
                  </span>
                  {publicCommentReplies.length > 1 && (
                    <button
                      onClick={() => handleRemoveCommentReply(idx)}
                      className="text-slate-400 hover:text-rose-500 cursor-pointer ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* STEP 4: The Direct Message (Text + Interactive Buttons) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                4
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Step 4: The Instagram DM Message
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Compose the rich direct message with link buttons or quick replies.
                </p>
              </div>
            </div>

            {/* Message Body Input */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                DM Text Body
              </label>
              <textarea
                rows={3}
                value={dmMessageText}
                onChange={(e) => setDmMessageText(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
                placeholder="Type your Instagram DM message..."
              />
            </div>

            {/* Buttons Builder */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Interactive Message Buttons ({dmButtons.length}/3)</span>
                <span className="text-[11px] text-slate-400">Link buttons or quick replies</span>
              </label>

              {/* Existing Buttons List */}
              <div className="space-y-2">
                {dmButtons.map((btn) => (
                  <div
                    key={btn.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                        {btn.type === 'link' ? 'Link Button' : 'Quick Reply'}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {btn.label}
                      </span>
                      {btn.url && (
                        <span className="text-slate-400 truncate text-[11px]">
                          ({btn.url})
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveButton(btn.id)}
                      className="text-slate-400 hover:text-rose-500 cursor-pointer ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Button Controls */}
              {dmButtons.length < 3 && (
                <div className="p-3 bg-purple-50/50 dark:bg-slate-800/40 rounded-xl border border-purple-200/60 dark:border-slate-700 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newButtonLabel}
                      onChange={(e) => setNewButtonLabel(e.target.value)}
                      placeholder="Button Label (e.g. 📥 Download Guide)"
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <select
                      value={newButtonType}
                      onChange={(e) => setNewButtonType(e.target.value as any)}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="link">Link Button (Opens URL)</option>
                      <option value="quick_reply">Quick Reply (Triggers Bot)</option>
                    </select>
                  </div>

                  {newButtonType === 'link' && (
                    <input
                      type="url"
                      value={newButtonUrl}
                      onChange={(e) => setNewButtonUrl(e.target.value)}
                      placeholder="https://yourwebsite.com/lead-magnet"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  )}

                  <button
                    type="button"
                    onClick={handleAddButton}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    + Attach Button to Message
                  </button>
                </div>
              )}
            </div>

            {/* Optional Follow-up Toggle */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Automated Follow-up Message
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Send a nudge if the user does not open or click within a few hours.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={enableFollowUp}
                  onChange={(e) => setEnableFollowUp(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                />
              </div>

              {enableFollowUp && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-purple-500" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Send follow-up after:
                    </span>
                    <select
                      value={followUpDelayHours}
                      onChange={(e) => setFollowUpDelayHours(Number(e.target.value))}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-900 dark:text-white"
                    >
                      <option value={1}>1 Hour</option>
                      <option value={2}>2 Hours</option>
                      <option value={6}>6 Hours</option>
                      <option value={24}>24 Hours</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    value={followUpText}
                    onChange={(e) => setFollowUpText(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                    placeholder="Follow-up message text..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* STEP 5: Conditions & Opt-In Rules */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                5
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Step 5: Opt-in & Rules
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Set safety guardrails and lead generation rules.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Reply Only Once Per User
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Prevents sending duplicate DMs if a follower comments multiple times.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={replyOncePerUser}
                  onChange={(e) => setReplyOncePerUser(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Require Follow First (Follow Gate)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Prompts non-followers to follow @{connectedHandle} before unlocking full link.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={requireFollowing}
                  onChange={(e) => setRequireFollowing(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Capture Lead Email/Phone into CRM
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Automatically prompt user for email inside DM and sync to Contacts table.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={captureLead}
                  onChange={(e) => setCaptureLead(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Phone Mockup Preview */}
        <div className="lg:col-span-5">
          <div className="sticky top-20 bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-4 select-none">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-pink-400" />
                <span className="text-xs font-bold text-slate-200">Live Phone Simulation</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Real-Time Preview
              </span>
            </div>

            {/* Simulated iPhone Frame */}
            <div className="w-full max-w-[320px] mx-auto bg-black rounded-[36px] p-3 border-4 border-slate-800 shadow-2xl relative">
              {/* iPhone Notch / Island */}
              <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto mb-2" />

              {/* Instagram Feed & Comment Section */}
              <div className="bg-slate-950 rounded-2xl overflow-hidden text-[11px] space-y-2 p-3 border border-slate-900">
                {/* IG Account Header */}
                <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-amber-500 p-0.5">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                      className="w-full h-full rounded-full object-cover"
                      alt="avatar"
                    />
                  </div>
                  <span className="font-bold text-white">{connectedHandle}</span>
                </div>

                {/* Simulated Comment Trigger */}
                <div className="bg-slate-900/90 p-2.5 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-slate-300">@follower_user</span>
                    <span className="text-slate-500">1m ago</span>
                  </div>
                  <p className="text-slate-100 font-mono">
                    "{keywords[0] || 'CHECKLIST'}"
                  </p>
                </div>

                {/* Simulated Automated Public Reply */}
                <div className="pl-3 border-l-2 border-pink-500 space-y-1 py-1">
                  <div className="flex items-center gap-1 text-[10px] text-pink-400 font-bold">
                    <span>@{connectedHandle}</span>
                    <span className="text-slate-500">• Auto-replied</span>
                  </div>
                  <p className="text-slate-300 text-[10px]">
                    "{publicCommentReplies[0] || 'Sent to DMs!'}"
                  </p>
                </div>
              </div>

              {/* Instagram DM Chat Interface Mockup */}
              <div className="mt-3 bg-slate-950 rounded-2xl p-3 border border-slate-900 space-y-3">
                <div className="text-[10px] text-center text-slate-500 font-semibold border-b border-slate-900 pb-1.5 flex items-center justify-center gap-1">
                  <Instagram className="w-3 h-3 text-pink-400" />
                  <span>Instagram Direct Message</span>
                </div>

                {/* Outbound DM Bubble */}
                <div className="space-y-2">
                  <div className="flex items-end gap-1.5 justify-end">
                    <div className="max-w-[220px] bg-gradient-to-tr from-purple-600 to-pink-600 text-white rounded-2xl rounded-tr-xs p-3 text-xs leading-relaxed shadow-md">
                      <p>{dmMessageText || 'Hey there! Here is your link:'}</p>
                    </div>
                  </div>

                  {/* Buttons inside DM */}
                  <div className="space-y-1.5 pl-6">
                    {dmButtons.map((btn) => (
                      <button
                        key={btn.id}
                        type="button"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/40 rounded-xl py-2 px-3 text-[11px] font-bold text-center block transition-all"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulated Follow-up Preview if enabled */}
                {enableFollowUp && (
                  <div className="pt-2 border-t border-slate-900">
                    <span className="text-[9px] text-amber-400 font-semibold block mb-1">
                      ⏱️ Scheduled Follow-up ({followUpDelayHours}h):
                    </span>
                    <div className="bg-slate-900 text-slate-300 p-2 rounded-xl text-[10px]">
                      "{followUpText}"
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center">
              <p className="text-[11px] text-slate-400">
                This simulation accurately mirrors real Instagram DM rendering on iOS and Android.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
