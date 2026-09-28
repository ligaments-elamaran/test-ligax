import React, { useState } from 'react';
import { 
  Archive, 
  Search, 
  Filter, 
  ArrowRight, 
  Calendar, 
  FileText, 
  Send 
} from 'lucide-react';
import { Report } from '../types';

interface ArchivePageProps {
  reports: Report[];
  onSelectReport: (reportId: string) => void;
  onOpenDraftModal: () => void;
}

export const ArchivePage: React.FC<ArchivePageProps> = ({
  reports,
  onSelectReport,
  onOpenDraftModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = reports.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.summary_markdown.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Archive className="w-5 h-5 text-indigo-400" />
            <span>Weekly Report Archive</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Historical audit logs of past executive dispatches and draft cycles
          </p>
        </div>

        <button
          onClick={onOpenDraftModal}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition self-start sm:self-auto"
        >
          Draft New Edition
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search reports by title or content keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['all', 'SENT', 'APPROVED', 'IN_REVIEW', 'DRAFT'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
              }`}
            >
              {st === 'all' ? 'All Status' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Table / Card List */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="text-center py-14 text-slate-400 text-xs">
            No matching reports found in archive.
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {filtered.map((report) => (
              <div
                key={report.id}
                onClick={() => onSelectReport(report.id)}
                className="p-4 lg:p-5 hover:bg-slate-800/60 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                        report.status === 'SENT'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          : report.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {report.status}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {report.period_start} &rarr; {report.period_end}
                    </span>
                    <span className="text-xs text-slate-500">&bull; Tone: {report.tone}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition">
                    {report.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2">
                    {(() => {
                      try {
                        const sec = JSON.parse(report.sections_json);
                        return sec.executive_summary || report.summary_markdown.slice(0, 180);
                      } catch {
                        return report.summary_markdown.slice(0, 180);
                      }
                    })()}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  {report.approved_by && (
                    <span className="text-[11px] text-emerald-400/90 hidden md:inline">
                      Signed: {report.approved_by}
                    </span>
                  )}
                  <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 group-hover:text-white bg-slate-700/60 group-hover:bg-indigo-600 transition">
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
