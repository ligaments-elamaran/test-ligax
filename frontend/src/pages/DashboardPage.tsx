import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  FileText, 
  ArrowRight, 
  Send, 
  ExternalLink 
} from 'lucide-react';
import { Report, ActivityItem } from '../types';

interface DashboardPageProps {
  reports: Report[];
  activities: ActivityItem[];
  onSelectReport: (reportId: string) => void;
  onOpenDraftModal: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  reports,
  activities,
  onSelectReport,
  onOpenDraftModal,
}) => {
  const shippedCount = activities.filter((a) => a.category === 'shipped').length;
  const slippedCount = activities.filter((a) => a.category === 'slipped').length;
  const blockedCount = activities.filter((a) => a.category === 'blocked').length;

  const currentDraft = reports.find(
    (r) => r.status === 'DRAFT' || r.status === 'IN_REVIEW'
  ) || reports[0];

  const recentReports = reports.slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Executive Welcome & Highlight Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-900 border border-indigo-500/20 p-6 lg:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Autonomous Intelligence &bull; Weekly Cycle</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white mb-2">
            Engineering Delivery Radar
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Ingests raw PR and ticket streams across GitHub, Linear, and Jira. Synthesizes a structured 
            1-page weekly update ready for VP / executive distribution every Friday.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {currentDraft && (
              <button
                onClick={() => onSelectReport(currentDraft.id)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition active:scale-95"
              >
                <span>Inspect Active Draft ({currentDraft.status})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onOpenDraftModal}
              className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              Draft New Period
            </button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Shipped */}
        <div className="bg-slate-800/60 border border-emerald-500/20 rounded-xl p-4 shadow-sm hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium text-emerald-400 uppercase tracking-wider">Shipped Items</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{shippedCount}</span>
            <span className="text-xs text-slate-400">merged / closed</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400/90 font-medium">
            Stripe webhook, latency cache, Google OAuth
          </div>
        </div>

        {/* Slipped */}
        <div className="bg-slate-800/60 border border-amber-500/20 rounded-xl p-4 shadow-sm hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium text-amber-400 uppercase tracking-wider">Slipped / Deferred</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{slippedCount}</span>
            <span className="text-xs text-slate-400">deferred to next sprint</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-400/90 font-medium">
            CSV streaming pagination, DB replicas
          </div>
        </div>

        {/* Blocked */}
        <div className="bg-slate-800/60 border border-rose-500/20 rounded-xl p-4 shadow-sm hover:border-rose-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium text-rose-400 uppercase tracking-wider">Active Blockers</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{blockedCount}</span>
            <span className="text-xs text-slate-400">external dependencies</span>
          </div>
          <div className="mt-2 text-[11px] text-rose-400/90 font-medium">
            Apple App Review, Okta SAML admin
          </div>
        </div>

        {/* Reports Archived */}
        <div className="bg-slate-800/60 border border-indigo-500/20 rounded-xl p-4 shadow-sm hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium text-indigo-400 uppercase tracking-wider">Total Reports</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{reports.length}</span>
            <span className="text-xs text-slate-400">archived editions</span>
          </div>
          <div className="mt-2 text-[11px] text-indigo-400/90 font-medium">
            Multi-channel audit logs retained
          </div>
        </div>

      </div>

      {/* Two Column Layout: Current Active Draft Review Preview + Recent Archive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Active Draft Card */}
        <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 lg:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-4 mb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Active Human-In-The-Loop Draft
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {currentDraft ? currentDraft.title : 'No active draft found'}
                </h3>
                {currentDraft && (
                  <p className="text-xs text-slate-400">
                    Cycle: {currentDraft.period_start} &rarr; {currentDraft.period_end} &bull; Tone: <span className="text-slate-200 capitalize">{currentDraft.tone}</span>
                  </p>
                )}
              </div>
              {currentDraft && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase border ${
                  currentDraft.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                  currentDraft.status === 'SENT' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' :
                  'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {currentDraft.status}
                </span>
              )}
            </div>

            {currentDraft ? (
              <div className="space-y-3">
                <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Executive Summary</h4>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {(() => {
                      try {
                        const sec = JSON.parse(currentDraft.sections_json);
                        return sec.executive_summary || 'Draft summary under preparation...';
                      } catch {
                        return currentDraft.summary_markdown.slice(0, 200);
                      }
                    })()}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-2.5">
                    <span className="text-slate-400 block text-[11px]">Shipped</span>
                    <strong className="text-emerald-400 font-bold text-sm">{shippedCount}</strong>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-2.5">
                    <span className="text-slate-400 block text-[11px]">Slipped</span>
                    <strong className="text-amber-400 font-bold text-sm">{slippedCount}</strong>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-2.5">
                    <span className="text-slate-400 block text-[11px]">Blocked</span>
                    <strong className="text-rose-400 font-bold text-sm">{blockedCount}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                No reports generated yet. Click "Draft Report Now" to begin.
              </div>
            )}
          </div>

          {currentDraft && (
            <div className="pt-4 mt-4 border-t border-slate-700/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Created: {new Date(currentDraft.created_at || Date.now()).toLocaleDateString()}
              </span>
              <button
                onClick={() => onSelectReport(currentDraft.id)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
              >
                <span>Open in Review Station</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right 1 Col: Recent Reports List */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-3">
              <h3 className="text-sm font-semibold text-white">Recent Dispatches</h3>
              <span className="text-xs text-slate-400">{reports.length} total</span>
            </div>

            <div className="space-y-2.5">
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => onSelectReport(report.id)}
                  className="p-3 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-slate-700/40 cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-2">
                    <h5 className="text-xs font-semibold text-slate-200 group-hover:text-indigo-400 truncate">
                      {report.title}
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {report.period_start} &rarr; {report.period_end}
                    </p>
                  </div>
                  <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full shrink-0 border ${
                    report.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                    report.status === 'SENT' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                    'bg-slate-700/60 text-slate-300 border-slate-600'
                  }`}>
                    {report.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-700/60 text-right">
            <span className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 cursor-pointer">
              <span>View full archive tab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
