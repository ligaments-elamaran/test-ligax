import React from 'react';
import { 
  Bot, 
  Sparkles, 
  Calendar, 
  RefreshCw, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  Send 
} from 'lucide-react';
import { HealthStatus, ReportConfig } from '../types';

interface HeaderProps {
  health: HealthStatus | null;
  config: ReportConfig | null;
  onOpenDraftModal: () => void;
  onTriggerAutoDraft: () => void;
  isTriggering: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  config,
  onOpenDraftModal,
  onTriggerAutoDraft,
  isTriggering,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Brand & Cadence indicator */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Weekly Report Agent
              </h1>
              <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Autonomous
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1 text-slate-300 font-medium">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                {config ? `${config.scheduled_day} @ ${config.scheduled_time}` : 'Friday Cadence'}
              </span>
              <span>&bull;</span>
              <span className="text-slate-400">Team: {config?.team_name || 'Platform'}</span>
            </div>
          </div>
        </div>

        {/* Status Pills & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* OpenAI Mode Pill */}
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <Sparkles className={`w-3.5 h-3.5 ${health?.openai_configured ? 'text-amber-400' : 'text-emerald-400'}`} />
            <span className="text-slate-300">
              AI Engine: <strong className="text-white font-medium">{health?.openai_configured ? 'OpenAI GPT' : 'Deterministic Template'}</strong>
            </span>
          </div>

          {/* Quick Schedule Draft Now Button */}
          <button
            onClick={onTriggerAutoDraft}
            disabled={isTriggering}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
            title="Simulate scheduled Friday cron trigger"
          >
            <Clock className={`w-3.5 h-3.5 ${isTriggering ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
            <span>{isTriggering ? 'Scheduling...' : 'Run Auto-Cadence'}</span>
          </button>

          {/* Draft Report Modal Trigger */}
          <button
            onClick={onOpenDraftModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition shadow-sm shadow-indigo-600/30"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Draft Report Now</span>
          </button>
        </div>

      </div>
    </header>
  );
};
