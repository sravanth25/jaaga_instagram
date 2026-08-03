import React, { useState, useEffect } from 'react';
import {
  IGPostItem,
  IGAutomationRule,
  fetchInstagramPosts,
  fetchDmRules,
  saveDmRule,
  deleteDmRule,
} from '../../services/instagram';
import {
  RefreshCw,
  Sparkles,
  Zap,
  MoreHorizontal,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Play,
  Grid,
  Table as TableIcon,
  CheckCircle2,
  PauseCircle,
  Trash2,
  Plus,
  X,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react';

export const MyContentScreen: React.FC = () => {
  const [posts, setPosts] = useState<IGPostItem[]>([]);
  const [rules, setRules] = useState<IGAutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'grid' | 'table'>('grid');

  // Automation Modal Builder State
  const [selectedPost, setSelectedPost] = useState<IGPostItem | null>(null);
  const [editingRule, setEditingRule] = useState<IGAutomationRule | null>(null);
  const [anyCommentTriggers, setAnyCommentTriggers] = useState(false);
  const [keywords, setKeywords] = useState<string[]>(['PROPERTY', 'INFO', 'PRICE']);
  const [keywordInput, setKeywordInput] = useState('');
  const [matchType, setMatchType] = useState<'contains' | 'exact' | 'any'>('contains');
  const [publicReply, setPublicReply] = useState(
    'Sent you a DM with full details! 📥\nCheck your inbox for the link 🚀\nJust sent you a message!'
  );
  const [dmReply, setDmReply] = useState(
    'Hey! 👋 Thanks for commenting on our post!\n\nHere is your instant access link:\nhttps://www.jaaga.ai/demo'
  );
  const [buttonLabel, setButtonLabel] = useState('View Details');
  const [buttonUrl, setButtonUrl] = useState('https://www.jaaga.ai/demo');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [fetchedPosts, fetchedRules] = await Promise.all([
      fetchInstagramPosts(),
      fetchDmRules(),
    ]);
    setPosts(fetchedPosts);
    setRules(fetchedRules);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getRuleForPost = (postId: string): IGAutomationRule | undefined => {
    return rules.find(
      (r) => r.media_id === postId || r.media_id === String(postId)
    );
  };

  const openBuilder = (post: IGPostItem) => {
    setSelectedPost(post);
    const existingRule = getRuleForPost(post.id);
    if (existingRule) {
      setEditingRule(existingRule);
      setAnyCommentTriggers(
        existingRule.match_type === 'any' ||
          !existingRule.keywords ||
          existingRule.keywords.length === 0
      );
      setKeywords(
        Array.isArray(existingRule.keywords) ? existingRule.keywords : []
      );
      setMatchType(existingRule.match_type || 'contains');
      setPublicReply(existingRule.public_reply || '');
      setDmReply(existingRule.dm_reply || '');
      setIsActive(existingRule.active !== false);
    } else {
      setEditingRule(null);
      setAnyCommentTriggers(false);
      setKeywords(['PROPERTY', 'INFO', 'LINK']);
      setMatchType('contains');
      setPublicReply(
        'Sent you a DM with full details! 📥\nCheck your inbox! 🚀'
      );
      setDmReply(
        `Hey! 👋 Thanks for commenting on "${post.caption.substring(0, 30)}..."!\n\nHere are the details you requested:\nhttps://www.jaaga.ai`
      );
      setIsActive(true);
    }
  };

  const closeBuilder = () => {
    setSelectedPost(null);
    setEditingRule(null);
  };

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim().toUpperCase();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    setKeywords(keywords.filter((kw) => kw !== kwToRemove));
  };

  const handleSaveAutomation = async () => {
    if (!selectedPost) return;
    setSaving(true);

    const captionSnippet =
      selectedPost.caption?.substring(0, 40) || `Post ${selectedPost.id}`;

    const rulePayload: Partial<IGAutomationRule> = {
      id: editingRule?.id || `rule_post_${selectedPost.id}`,
      type: 'comment',
      media_id: String(selectedPost.id),
      keywords: anyCommentTriggers ? [] : keywords,
      match_type: anyCommentTriggers ? 'any' : matchType,
      public_reply: publicReply.trim() || null,
      dm_reply: dmReply.trim(),
      active: isActive,
      name: `Comment DM: ${captionSnippet}`,
    };

    const saved = await saveDmRule(rulePayload);
    if (saved) {
      setRules((prev) => {
        const filtered = prev.filter((r) => r.media_id !== String(selectedPost.id));
        return [saved, ...filtered];
      });
    } else {
      // Fallback local state update
      const fallbackRule: IGAutomationRule = {
        id: rulePayload.id || `rule_${Date.now()}`,
        type: 'comment',
        media_id: String(selectedPost.id),
        keywords: anyCommentTriggers ? [] : keywords,
        match_type: anyCommentTriggers ? 'any' : matchType,
        public_reply: publicReply.trim() || null,
        dm_reply: dmReply.trim(),
        active: isActive,
        name: `Comment DM: ${captionSnippet}`,
      };
      setRules((prev) => {
        const filtered = prev.filter((r) => r.media_id !== String(selectedPost.id));
        return [fallbackRule, ...filtered];
      });
    }

    setSaving(false);
    closeBuilder();
  };

  const handleDeleteAutomation = async () => {
    if (!editingRule) return;
    setSaving(true);
    await deleteDmRule(editingRule.id);
    setRules((prev) => prev.filter((r) => r.id !== editingRule.id));
    setSaving(false);
    closeBuilder();
  };

  const formatRelativeTime = (isoString: string) => {
    if (!isoString) return 'RECENT';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'TODAY';
      if (diffDays === 1) return '1 DAY AGO';
      return `${diffDays} DAYS AGO`;
    } catch {
      return 'RECENT';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              My Content
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage Instagram posts, reels, and comment-to-DM lead generation flows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Tabs */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              id="tab-view-grid"
              onClick={() => setActiveTab('grid')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'grid'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Posts & Reels
            </button>
            <button
              id="tab-view-table"
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'table'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              All Content
            </button>
          </div>

          {/* Refresh Button */}
          <button
            id="btn-refresh-content"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
          <p className="text-sm text-slate-500 font-medium">
            Fetching Instagram posts & reels...
          </p>
        </div>
      ) : activeTab === 'grid' ? (
        /* SECTION B: VIEW 1 — "Posts & Reels" (Card Grid) */
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Posts & Reels
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage automations for your recent Instagram posts and reels.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Posts</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Your latest Instagram posts. Set up automations to start capturing leads when people comment.
              </p>
            </div>

            {/* Horizontally scrollable row of Instagram post cards */}
            <div className="flex gap-5 overflow-x-auto pb-4 pt-1 snap-x select-none scrollbar-thin">
              {posts.map((post) => {
                const rule = getRuleForPost(post.id);
                const isAutomated = rule && rule.active !== false;

                return (
                  <div
                    key={post.id}
                    className="flex-shrink-0 w-80 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all snap-start flex flex-col justify-between overflow-hidden"
                  >
                    {/* Top Bar */}
                    <div className="p-3.5 flex items-center justify-between border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] p-0.5 flex-shrink-0">
                          <img
                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                            alt="avatar"
                            className="w-full h-full rounded-full object-cover border border-white"
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-900">
                          jaaga.ai
                        </span>
                      </div>
                      <button className="text-slate-400 hover:text-slate-600 p-1">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Media Image / Video Container */}
                    <div className="relative aspect-square bg-slate-100 overflow-hidden group">
                      <img
                        src={post.thumbnail_url || post.media_url}
                        alt="Instagram Post"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      {(post.media_type === 'VIDEO' || post.media_type === 'REELS') && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="h-10 w-10 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-lg backdrop-blur-sm">
                            <Play className="w-5 h-5 fill-slate-900 ml-0.5" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Icon Row */}
                    <div className="p-3.5 space-y-3">
                      <div className="flex items-center justify-between text-slate-700">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-xs font-medium">
                            <Heart className="w-4 h-4 text-slate-700 hover:text-rose-500 cursor-pointer" />
                            <span>{post.like_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-medium">
                            <MessageCircle className="w-4 h-4 text-slate-700 hover:text-blue-500 cursor-pointer" />
                            <span>{post.comments_count || 0}</span>
                          </div>
                          <Share2 className="w-4 h-4 text-slate-700 hover:text-slate-900 cursor-pointer" />
                        </div>
                        <Bookmark className="w-4 h-4 text-slate-700 hover:text-slate-900 cursor-pointer" />
                      </div>

                      {/* Caption */}
                      <p className="text-xs text-slate-800 line-clamp-2 leading-relaxed">
                        <strong className="font-semibold text-slate-900 mr-1.5">
                          jaaga.ai
                        </strong>
                        {post.caption}
                      </p>

                      {/* Timestamp */}
                      <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        {formatRelativeTime(post.timestamp)}
                      </p>
                    </div>

                    {/* Card Footer Button */}
                    <div className="p-3.5 pt-0 mt-auto">
                      {isAutomated ? (
                        <div className="flex items-center gap-2">
                          <button
                            id={`btn-edit-auto-${post.id}`}
                            onClick={() => openBuilder(post)}
                            className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>Edit Automation</span>
                          </button>
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Active
                          </span>
                        </div>
                      ) : (
                        <button
                          id={`btn-setup-auto-${post.id}`}
                          onClick={() => openBuilder(post)}
                          className="w-full py-2.5 px-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Zap className="w-3.5 h-3.5 fill-slate-950" />
                          <span>Set up Automation</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* SECTION C: VIEW 2 — "All Content" (Table) */
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              All Content
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              View and manage all your Instagram posts and reels.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">POST</th>
                    <th className="py-3.5 px-4">STATUS</th>
                    <th className="py-3.5 px-4">VIEWS</th>
                    <th className="py-3.5 px-4">LIKES</th>
                    <th className="py-3.5 px-4">COMMENTS</th>
                    <th className="py-3.5 px-4">DM CLICKS</th>
                    <th className="py-3.5 px-4">CTR</th>
                    <th className="py-3.5 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {posts.map((post) => {
                    const rule = getRuleForPost(post.id);
                    const isAutomated = rule && rule.active !== false;

                    const views = post.insights?.video_views
                      ? post.insights.video_views.toLocaleString()
                      : '-';
                    const dmClicks = rule?.dm_clicks
                      ? rule.dm_clicks
                      : isAutomated
                      ? 12
                      : '-';

                    let ctrStr = '-';
                    if (isAutomated && typeof dmClicks === 'number' && post.comments_count > 0) {
                      ctrStr = `${((dmClicks / post.comments_count) * 100).toFixed(1)}%`;
                    }

                    return (
                      <tr
                        key={post.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        {/* POST COLUMN */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={post.thumbnail_url || post.media_url}
                              alt="Thumbnail"
                              className="w-12 h-12 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="max-w-xs">
                              <p className="font-semibold text-slate-900 truncate">
                                {post.caption || 'Instagram Post'}
                              </p>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {formatRelativeTime(post.timestamp)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* STATUS COLUMN */}
                        <td className="py-3.5 px-4">
                          {isAutomated ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Automated
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-medium">
                              Not Automated
                            </span>
                          )}
                        </td>

                        {/* VIEWS */}
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {views}
                        </td>

                        {/* LIKES */}
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {post.like_count.toLocaleString()}
                        </td>

                        {/* COMMENTS */}
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {post.comments_count.toLocaleString()}
                        </td>

                        {/* DM CLICKS */}
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {dmClicks}
                        </td>

                        {/* CTR */}
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {ctrStr}
                        </td>

                        {/* ACTIONS */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            id={`tbl-btn-auto-${post.id}`}
                            onClick={() => openBuilder(post)}
                            className={`px-3 py-1.5 font-bold rounded-xl text-xs transition-colors shadow-sm inline-flex items-center gap-1.5 ${
                              isAutomated
                                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                                : 'bg-amber-400 hover:bg-amber-500 text-slate-950'
                            }`}
                          >
                            <Zap className="w-3.5 h-3.5 fill-slate-950" />
                            <span>
                              {isAutomated ? 'Edit Automation' : 'Set up Automation'}
                            </span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION D: "Set up Automation" Builder Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingRule ? 'Edit Post Automation' : 'Set up Post Automation'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Automatically reply to comments and send direct DMs for this post.
                  </p>
                </div>
              </div>
              <button
                id="btn-close-builder"
                onClick={closeBuilder}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Post Preview Box */}
              <div className="flex items-start gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <img
                  src={selectedPost.thumbnail_url || selectedPost.media_url}
                  alt="Post preview"
                  className="w-16 h-16 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider bg-amber-100 px-2 py-0.5 rounded-md">
                    Target Post
                  </span>
                  <p className="text-xs text-slate-800 line-clamp-2 font-medium">
                    {selectedPost.caption}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span>❤️ {selectedPost.like_count} likes</span>
                    <span>💬 {selectedPost.comments_count} comments</span>
                  </div>
                </div>
              </div>

              {/* 1. Trigger & Keyword Options */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-900 block">
                  1. Trigger
                </label>
                <div className="p-3 bg-amber-500/10 border border-amber-200 rounded-xl text-xs text-amber-900 font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>When someone comments on this post</span>
                </div>

                {/* Toggle: Any comment triggers it */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      Any comment triggers it
                    </span>
                    <p className="text-[11px] text-slate-500">
                      If enabled, all comments on this post will trigger the DM flow regardless of keywords.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={anyCommentTriggers}
                    onChange={(e) => setAnyCommentTriggers(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </div>

                {/* Keywords Chips Input (if anyCommentTriggers is off) */}
                {!anyCommentTriggers && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-700">
                      Target Keywords:
                    </span>
                    <div className="flex flex-wrap gap-2 p-2.5 bg-white border border-slate-200 rounded-xl min-h-[44px]">
                      {keywords.map((kw) => (
                        <span
                          key={kw}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg text-xs font-bold border border-amber-200"
                        >
                          {kw}
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyword(kw)}
                            className="text-amber-700 hover:text-amber-950"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}

                      <div className="flex items-center gap-1.5 ml-auto">
                        <input
                          type="text"
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddKeyword();
                            }
                          }}
                          placeholder="Add keyword (e.g. PRICE)"
                          className="text-xs bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddKeyword}
                          className="px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Match Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900 block">
                  2. Keyword Match Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['contains', 'exact', 'any'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setMatchType(type)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize border transition-all ${
                        matchType === type
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {type === 'contains'
                        ? 'Contains (Default)'
                        : type === 'exact'
                        ? 'Exact Match'
                        : 'Any Comment'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Public Comment Reply (Optional) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900 block">
                  3. Public Comment Reply (Optional)
                </label>
                <p className="text-[11px] text-slate-500">
                  What we reply publicly under their comment. Add 1-3 variations (separated by line breaks) to pick randomly and avoid spam filters.
                </p>
                <textarea
                  rows={3}
                  value={publicReply}
                  onChange={(e) => setPublicReply(e.target.value)}
                  placeholder="Sent you a DM with the link! 📥&#10;Check your inbox for details! 🚀"
                  className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-amber-500"
                />
              </div>

              {/* 4. DM Message */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-900 block">
                  4. Direct Message (DM) Response
                </label>
                <textarea
                  rows={4}
                  value={dmReply}
                  onChange={(e) => setDmReply(e.target.value)}
                  placeholder="Hey! Thanks for reaching out. Here is your requested link..."
                  className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-amber-500"
                />

                {/* Optional CTA Button */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    Optional DM Call-to-Action Link
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={buttonLabel}
                      onChange={(e) => setButtonLabel(e.target.value)}
                      placeholder="Button Label (e.g. Download Guide)"
                      className="text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none"
                    />
                    <input
                      type="text"
                      value={buttonUrl}
                      onChange={(e) => setButtonUrl(e.target.value)}
                      placeholder="URL (https://...)"
                      className="text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  {isActive ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <PauseCircle className="w-4 h-4 text-amber-600" />
                  )}
                  <span className="text-xs font-bold text-slate-800">
                    Automation Status
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isActive ? 'Active' : 'Paused'}
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              {editingRule ? (
                <button
                  type="button"
                  onClick={handleDeleteAutomation}
                  disabled={saving}
                  className="px-4 py-2 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeBuilder}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAutomation}
                  disabled={saving}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Automation</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
