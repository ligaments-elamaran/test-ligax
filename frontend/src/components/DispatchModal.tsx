import React, { useState } from 'react';
import { 
  Send, 
  Slack, 
  Mail, 
  FileText, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  RotateCw 
} from 'lucide-react';
import { Report, ReportConfig } from '../types';

interface DispatchModalProps {
  report: Report;
  config: ReportConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onDispatch: (channels: string[], slackUrl?: string, emailRecipients?: string) => Promise<void>;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({
  report,
  config,
  isOpen,
  onClose,
  onDispatch,
}) => {
  if (!isOpen) return null;

  const [slackEnabled, setSlackEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [markdownExportEnabled, setMarkdownExportEnabled] = useState(true);

  const [slackUrl, setSlackUrl] = useState(config?.slack_webhook_url || '');
  const [emailTo, setEmailTo] = useState(config?.default_email_recipients || 'leadership-team@company.internal');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSend = async () => {
    const channels: string[] = [];
    if (slackEnabled) channels.push('slack');
    if (emailEnabled) channels.push('email');
    if (markdownExportEnabled) channels.push('markdown_export');

    if (channels.length === 0) {
      setErrorMsg('Please select at least one delivery channel.');
      return;
    }

    setIsSending(true);
    setErrorMsg('');
    try {
      await onDispatch(channels, slackUrl, emailTo);
      onClose();
    } catch (e: any) {
      setErrorMsg(e.message || 'Dispatch failed');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Multi-Channel Dispatch</h2>
              <p className="text-xs text-slate-400">Broadcast weekly deliverables to stakeholders</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="text-xs text-slate-300 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <span className="font-medium text-white">Report Target:</span> {report.title}
            <div className="text-slate-400 mt-0.5">Window: {report.period_start} to {report.period_end} &bull; Tone: {report.tone}</div>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Select Delivery Channels</span>

            {/* Slack Channel */}
            <div className="p-3.5 rounded-xl border bg-slate-800/40 border-slate-700 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#4A154B]/30 text-[#ECB22E] flex items-center justify-center border border-[#ECB22E]/20">
                    <Slack className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white">Slack Block Kit Dispatch</span>
                    <p className="text-[11px] text-slate-400">Posts formatted message cards to channel</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={slackEnabled}
                  onChange={(e) => setSlackEnabled(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              {slackEnabled && (
                <div className="mt-1">
                  <label className="text-[11px] font-medium text-slate-400">Webhook URL (or Leave blank for internal simulation):</label>
                  <input
                    type="text"
                    value={slackUrl}
                    onChange={(e) => setSlackUrl(e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Email Channel */}
            <div className="p-3.5 rounded-xl border bg-slate-800/40 border-slate-700 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white">Executive Email Digest</span>
                    <p className="text-[11px] text-slate-400">Clean styled HTML template with leadership notes</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={emailEnabled}
                  onChange={(e) => setEmailEnabled(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              {emailEnabled && (
                <div className="mt-1">
                  <label className="text-[11px] font-medium text-slate-400">Recipients (comma separated):</label>
                  <input
                    type="text"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="exec-team@company.internal, vp-eng@company.internal"
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Markdown Export */}
            <div className="p-3.5 rounded-xl border bg-slate-800/40 border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-medium text-white">Markdown Export & Audit Log</span>
                  <p className="text-[11px] text-slate-400">Record in delivery audit table and ready for clipboard</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={markdownExportEnabled}
                onChange={(e) => setMarkdownExportEnabled(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isSending}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition"
          >
            {isSending ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Broadcasting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Confirm & Dispatch</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
