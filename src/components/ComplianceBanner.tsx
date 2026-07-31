import React from 'react';
import { ShieldAlert, X, ExternalLink } from 'lucide-react';

interface ComplianceBannerProps {
  onDismiss?: () => void;
  onOpenDetails?: () => void;
  onOpenPolicyModal?: () => void;
}

export const ComplianceBanner: React.FC<ComplianceBannerProps> = ({
  onDismiss,
  onOpenDetails,
  onOpenPolicyModal,
}) => {
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;

  const handleOpen = onOpenPolicyModal || onOpenDetails;

  return (
    <div
      id="compliance-alert-banner"
      className="bg-blue-50 border-b border-blue-100 text-blue-900 px-6 py-2 flex items-center justify-between text-xs font-medium"
    >
      <div className="flex items-center space-x-2">
        <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0" />
        <p className="leading-snug">
          <strong className="font-bold">Meta Policy Guardrails Active:</strong>{' '}
          All comment replies & DM flows strictly respect Instagram's 24-hour messaging window, anti-spam comment variations, and Graph API rate limits (max 60 DMs/hr).
        </p>
      </div>

      <div className="flex items-center space-x-3 shrink-0 ml-3">
        {handleOpen && (
          <button
            onClick={handleOpen}
            className="text-blue-700 hover:text-blue-950 font-bold underline flex items-center space-x-1 text-xs cursor-pointer"
          >
            <span>Compliance Rules</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={() => {
            if (onDismiss) onDismiss();
            setDismissed(true);
          }}
          className="p-1 rounded text-blue-400 hover:text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
          aria-label="Dismiss compliance notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
