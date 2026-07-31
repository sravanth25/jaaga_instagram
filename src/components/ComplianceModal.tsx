import React from 'react';
import { ShieldCheck, CheckCircle2, Clock, MessageSquare, AlertCircle, X } from 'lucide-react';

interface ComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComplianceModal: React.FC<ComplianceModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Meta Messaging API Compliance
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Official Instagram Graph API & Messaging Policy Guidelines
            </p>
          </div>
        </div>

        <div className="space-y-4 my-4 text-xs">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold mb-1">
              <Clock className="w-4 h-4 text-purple-500" />
              <span>1. The 24-Hour Messaging Window</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              When a follower comments on your post, sends a DM, or replies to a Story, Instagram opens a 24-hour window where your automation can respond freely with promotional content & direct links. DMFlow automatically monitors window expiration.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold mb-1">
              <MessageSquare className="w-4 h-4 text-pink-500" />
              <span>2. Anti-Spam Comment Variation System</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Instagram strictly penalizes repetitive automated comments. DMFlow requires at least 3 randomized public comment reply variations (e.g. "Sent in DMs! 📩", "Check your inbox! ✨") to rotate responses safely.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>3. Rate Limits & Throttling</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Graph API caps automated DMs at 60 DMs per hour per account. DMFlow automatically queues high-volume viral comment bursts and distributes outbound messages evenly to prevent account shadowbans.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold mb-1">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>4. Lead Consent & Opt-in Standard</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              When collecting email address or phone numbers in DMs, DMFlow includes standard opt-in consent disclaimers to remain compliant with GDPR, CCPA, and Meta developer terms.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
