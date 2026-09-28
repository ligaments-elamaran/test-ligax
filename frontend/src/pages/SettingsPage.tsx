import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  RotateCw, 
  Check, 
  Calendar, 
  Slack, 
  Mail, 
  Sparkles, 
  Shield 
} from 'lucide-react';
import { ReportConfig, ReportTone } from '../types';
import { api } from '../services/api';

interface SettingsPageProps {
  config: ReportConfig | null;
  onConfigUpdated: (config: ReportConfig) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  config,
  onConfigUpdated,
}) => {
  const [teamName, setTeamName] = useState(config?.team_name || 'Core Platform Team');
  const [defaultTone, setDefaultTone] = useState<ReportTone>(config?.default_tone || 'executive');
  const [slackUrl, setSlackUrl] = useState(config?.slack_webhook_url || '');
  const [emailTo, setEmailTo] = useState(config?.default_email_recipients || '');
  const [schedDay, setSchedDay] = useState(config?.scheduled_day || 'Friday');
  const [schedTime, setSchedTime] = useState(config?.scheduled_time || '17:00');
  const [autoDraft, setAutoDraft] = useState(config?.auto_draft_enabled ?? true);
  const [customPrompt, setCustomPrompt] = useState(config?.custom_prompt_instructions || '');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api.updateConfig({
        team_name: teamName,
        default_tone: defaultTone,
        slack_webhook_url: slackUrl,
        default_email_recipients: emailTo,
        scheduled_day: schedDay,
        scheduled_time: schedTime,
        auto_draft_enabled: autoDraft,
        custom_prompt_instructions: customPrompt,
      });
      onConfigUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-200">
      
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          <span>Agent Cadence & Synthesis Settings</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure autonomous Friday scheduling, distribution defaults, and custom prompt directives
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* General Identity */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 lg:p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Team & Tone Preferences</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Engineering Team / Org Name
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Default Synthesis Tone
              </label>
              <select
                value={defaultTone}
                onChange={(e) => setDefaultTone(e.target.value as ReportTone)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="executive">Executive (High-level business velocity)</option>
                <option value="bullets">Concise Bullets (Fast scanning TL;DR)</option>
                <option value="deep_dive">Engineering Deep-dive (Technical milestones)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Autonomous Cadence Scheduling */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 lg:p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Autonomous Weekly Cadence</span>
          </h3>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
            <input
              type="checkbox"
              id="auto-draft"
              checked={autoDraft}
              onChange={(e) => setAutoDraft(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
            <label htmlFor="auto-draft" className="text-xs text-slate-200 cursor-pointer">
              Enable autonomous draft generation on schedule (agent wakes up and drafts the week's report for human review)
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Scheduled Trigger Day
              </label>
              <select
                value={schedDay}
                onChange={(e) => setSchedDay(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="Friday">Friday (Recommended)</option>
                <option value="Thursday">Thursday</option>
                <option value="Monday">Monday (Retrospective)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Trigger Time (UTC/Local)
              </label>
              <input
                type="text"
                value={schedTime}
                onChange={(e) => setSchedTime(e.target.value)}
                placeholder="17:00"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Multi-Channel Dispatch Defaults */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 lg:p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Slack className="w-4 h-4 text-[#ECB22E]" />
            <span>Distribution Channel Defaults</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Slack Incoming Webhook URL
              </label>
              <input
                type="text"
                value={slackUrl}
                onChange={(e) => setSlackUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Leave blank or enter placeholder to run simulated Block Kit delivery.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Default Email Recipients (Comma-separated)
              </label>
              <input
                type="text"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="vp-eng@company.internal, tech-leads@company.internal"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Custom Persona & Prompt Guidance */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 lg:p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Custom Synthesis Directives</span>
          </h3>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Custom Agent Instructions / Style Rules
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
              placeholder="e.g. Always emphasize latency benchmarks; highlight Stripe migration outcomes; flag dependencies on customer IT admins..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <Check className="w-4 h-4" /> Preferences saved successfully
            </span>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition"
          >
            {isSaving ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
};
