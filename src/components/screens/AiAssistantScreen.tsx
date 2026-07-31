import React, { useState } from 'react';
import { AiSettings, FaqItem } from '../../types';
import {
  Bot,
  Sparkles,
  Plus,
  Trash2,
  Send,
  HelpCircle,
  BookOpen,
  Sliders,
  Check,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface AiAssistantScreenProps {
  aiSettings: AiSettings;
  onUpdateAiSettings: (settings: AiSettings) => void;
}

export const AiAssistantScreen: React.FC<AiAssistantScreenProps> = ({
  aiSettings,
  onUpdateAiSettings,
}) => {
  const [enabled, setEnabled] = useState(aiSettings.enabled);
  const [persona, setPersona] = useState(aiSettings.persona);
  const [systemPrompt, setSystemPrompt] = useState(aiSettings.systemPrompt);
  const [confidence, setConfidence] = useState(aiSettings.fallbackConfidenceThreshold);
  const [faqs, setFaqs] = useState<FaqItem[]>(aiSettings.faqs);

  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newCategory, setNewCategory] = useState('General');

  // Test Chat Sandbox state
  const [sandboxInput, setSandboxInput] = useState('');
  const [sandboxMessages, setSandboxMessages] = useState<
    Array<{ sender: 'user' | 'ai'; text: string; timestamp: string }>
  >([
    {
      sender: 'ai',
      text: "👋 Hi! I'm the AI assistant for @design.master. Test typing a question about our pricing, templates, or support!",
      timestamp: 'Just now',
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);

  // Add FAQ
  const handleAddFaq = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    const newItem: FaqItem = {
      id: `faq_${Date.now()}`,
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      category: newCategory,
    };
    const updated = [...faqs, newItem];
    setFaqs(updated);
    onUpdateAiSettings({ ...aiSettings, faqs: updated });
    setNewQuestion('');
    setNewAnswer('');
  };

  const handleRemoveFaq = (id: string) => {
    const updated = faqs.filter((f) => f.id !== id);
    setFaqs(updated);
    onUpdateAiSettings({ ...aiSettings, faqs: updated });
  };

  const handleSaveSettings = () => {
    onUpdateAiSettings({
      ...aiSettings,
      enabled,
      persona,
      systemPrompt,
      fallbackConfidenceThreshold: confidence,
      faqs,
    });
  };

  // Sandbox Test Send
  const handleSendSandbox = async () => {
    if (!sandboxInput.trim()) return;
    const userMsg = sandboxInput.trim();
    setSandboxInput('');
    setSandboxMessages((prev) => [
      ...prev,
      { sender: 'user', text: userMsg, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);

    setIsThinking(true);
    try {
      const res = await fetch('/api/gemini/ai-test-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: userMsg,
          persona,
          faqs,
          systemPrompt,
        }),
      });
      const data = await res.json();
      setSandboxMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: data?.reply || "Thanks for your question! I've logged your request.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (e) {
      setSandboxMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: "Thanks for reaching out! Check out our link in bio or ask about our UI templates ✨",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div id="screen-ai-assistant" className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-24">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-sm shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-900">Instagram AI Assistant Agent</h2>
              <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                Gemini 3.6 Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Train an intelligent DM bot that automatically answers follower inquiries 24/7 using your business FAQ.
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          className="bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:opacity-95 transition-all flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Check className="w-4 h-4" />
          <span>Save AI Settings</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Config & FAQs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Persona & Tone Selector */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-500" />
              <span>Persona & Tone Configuration</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {[
                'Friendly & Professional',
                'Casual & Helpful',
                'High-Energy Sales',
                'Creator Fan-Focused',
              ].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPersona(p as any)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    persona === p
                      ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="text-xs">{p}</span>
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Custom System Prompt Bio
              </label>
              <textarea
                rows={3}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Business FAQ Knowledge Base */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-pink-500" />
                <span>Business FAQ Knowledge Base ({faqs.length})</span>
              </h3>
              <span className="text-[11px] text-slate-400">Add Q&A pairs to train the AI</span>
            </div>

            {/* Add FAQ Form */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-3">
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Question (e.g. What is included in Design Pro?)"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
              <textarea
                rows={2}
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder="Answer (e.g. It includes 120+ modules and lifetime Figma access...)"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddFaq}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-1.5 rounded-lg text-xs font-bold cursor-pointer"
              >
                + Add Q&A Pair to Knowledge Base
              </button>
            </div>

            {/* List of FAQs */}
            <div className="space-y-3">
              {faqs.map((f) => (
                <div
                  key={f.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1 relative group"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Q: {f.question}
                    </span>
                    <button
                      onClick={() => handleRemoveFaq(f.id)}
                      className="text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    A: {f.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Test Sandbox */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-4 flex flex-col h-[580px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span className="text-xs font-bold text-slate-200">AI Test Chat Sandbox</span>
              </div>
              <button
                onClick={() => setSandboxMessages([])}
                className="p-1 text-slate-400 hover:text-white"
                title="Clear Chat History"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sandbox Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-3 p-2">
              {sandboxMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[9px] text-slate-400 mb-0.5">
                    {msg.sender === 'user' ? 'You (Test Follower)' : 'AI Bot'}
                  </span>
                  <div
                    className={`max-w-[240px] p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-purple-600 text-white rounded-tr-xs'
                        : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex items-center gap-2 text-xs text-pink-400 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI generating reply...</span>
                </div>
              )}
            </div>

            {/* Sandbox Input Bar */}
            <div className="pt-2 border-t border-slate-800 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={sandboxInput}
                onChange={(e) => setSandboxInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSendSandbox())}
                placeholder="Test a question e.g. What is your pricing?"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleSendSandbox}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-2 rounded-xl shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
