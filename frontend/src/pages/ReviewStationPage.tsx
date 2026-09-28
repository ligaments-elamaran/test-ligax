import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  CheckCircle2, 
  RotateCw, 
  Send, 
  Save, 
  Sparkles, 
  Eye, 
  Edit3, 
  Check, 
  ExternalLink, 
  User, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Layers 
} from 'lucide-react';
import { Report, ActivityItem, ReportTone } from '../types';
import { SectionEditor } from '../components/SectionEditor';
import { api } from '../services/api';

interface ReviewStationPageProps {
  report: Report;
  activities: ActivityItem[];
  onReportUpdated: (updated: Report) => void;
  onOpenDispatchModal: () => void;
}

export const ReviewStationPage: React.FC<ReviewStationPageProps> = ({
  report,
  activities,
  onReportUpdated,
  onOpenDispatchModal,
}) => {
  // Parse sections and inclusions
  const [sections, setSections] = useState<{ [key: string]: string }>({});
  const [leadershipNotes, setLeadershipNotes] = useState(report.leadership_notes || '');
  const [inclusions, setInclusions] = useState<{ [key: string]: boolean }>({});
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'shipped' | 'slipped' | 'blocked'>('all');
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [approverName, setApproverName] = useState('Sarah Chen (Eng VP)');

  useEffect(() => {
    try {
      const parsed = JSON.parse(report.sections_json);
      setSections(parsed);
    } catch {
      setSections({
        executive_summary: '',
        shipped: '',
        slipped: '',
        blocked: '',
        next_priorities: '',
      });
    }

    try {
      const inc = JSON.parse(report.item_inclusions_json);
      setInclusions(inc);
    } catch {
      setInclusions({});
    }

    setLeadershipNotes(report.leadership_notes || '');
  }, [report.id, report.sections_json, report.leadership_notes, report.item_inclusions_json]);

  // Handle section text change
  const handleSectionChange = (key: string, value: string) => {
    setSections(prev => ({ ...prev, [key]: value }));
  };

  // Save changes
  const handleSave = async (newStatus?: string) => {
    setIsSaving(true);
    try {
      const payload: Partial<Report> = {
        sections_json: JSON.stringify(sections),
        leadership_notes: leadershipNotes,
        item_inclusions_json: JSON.stringify(inclusions),
      };
      if (newStatus) {
        payload.status = newStatus as any;
      }
      const updated = await api.updateReport(report.id, payload);
      onReportUpdated(updated);
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  // Re-synthesize section
  const handleResynthesizeSection = async (sectionKey: string, instruction: string) => {
    const res = await api.resynthesizeSection(report.id, {
      section_key: sectionKey,
      custom_instruction: instruction,
      tone: report.tone,
    });
    if (res.content) {
      setSections(prev => ({ ...prev, [sectionKey]: res.content! }));
    } else if (res.sections) {
      setSections(res.sections);
    }
  };

  // Re-synthesize whole report based on current evidence inclusions
  const handleResynthesizeAll = async () => {
    setIsSaving(true);
    try {
      const res = await api.resynthesizeSection(report.id, {
        section_key: 'all',
        tone: report.tone,
      });
      if (res.sections) {
        setSections(res.sections);
      }
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle item inclusion
  const toggleItemInclusion = (id: string) => {
    setInclusions(prev => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  };

  // Approve report
  const handleApprove = async () => {
    setIsSaving(true);
    try {
      // First save any unsaved sections
      await api.updateReport(report.id, {
        sections_json: JSON.stringify(sections),
        leadership_notes: leadershipNotes,
        item_inclusions_json: JSON.stringify(inclusions),
      });
      const approved = await api.approveReport(report.id, approverName);
      onReportUpdated(approved);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredActivities = activities.filter(a =>
    selectedCategory === 'all' ? true : a.category === selectedCategory
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Review Header Bar */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 lg:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Review Station &bull; Weekly Report
            </span>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
              report.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
              report.status === 'SENT' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' :
              'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              {report.status}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">{report.title}</h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
            <span>Period: <strong className="text-slate-200">{report.period_start} &rarr; {report.period_end}</strong></span>
            <span>&bull;</span>
            <span>Tone: <strong className="text-indigo-300 capitalize">{report.tone}</strong></span>
            {report.approved_by && (
              <>
                <span>&bull;</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Approved by {report.approved_by}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center rounded-lg bg-slate-900 p-1 border border-slate-700/60 text-xs">
            <button
              onClick={() => setViewMode('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                viewMode === 'editor'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Section Editor</span>
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                viewMode === 'preview'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Full Preview</span>
            </button>
          </div>

          {/* Save Draft */}
          <button
            onClick={() => handleSave()}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/60 transition"
          >
            {saveSuccessMsg ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Saved</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-slate-400" />
                <span>Save Draft</span>
              </>
            )}
          </button>

          {/* Approve Report */}
          {report.status !== 'APPROVED' && report.status !== 'SENT' && (
            <button
              onClick={handleApprove}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Approve Report</span>
            </button>
          )}

          {/* Dispatch Button */}
          <button
            onClick={onOpenDispatchModal}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-md shadow-indigo-600/30 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Dispatch & Distribute</span>
          </button>
        </div>
      </div>

      {/* Two Pane Workspace: Left (Raw Evidence / Inclusions) | Right (Synthesized Editor / Live Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Pane: Evidence & Inclusions Checklist (5 Columns) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 lg:p-5">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Issue Tracker Evidence</span>
                </h3>
                <p className="text-[11px] text-slate-400">Toggle inclusion to re-synthesize summary</p>
              </div>

              <button
                onClick={handleResynthesizeAll}
                disabled={isSaving}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/30 transition"
                title="Re-run synthesis using only selected items"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Re-Synthesize All</span>
              </button>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
              {[
                { key: 'all', label: 'All Items', count: activities.length },
                { key: 'shipped', label: 'Shipped', count: activities.filter(a => a.category === 'shipped').length },
                { key: 'slipped', label: 'Slipped', count: activities.filter(a => a.category === 'slipped').length },
                { key: 'blocked', label: 'Blocked', count: activities.filter(a => a.category === 'blocked').length },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setSelectedCategory(f.key as any)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap transition ${
                    selectedCategory === f.key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>

            {/* Activity Items List */}
            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
              {filteredActivities.map(item => {
                const isIncluded = inclusions[item.id] !== false; // Default true
                const badgeColor =
                  item.category === 'shipped'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : item.category === 'slipped'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30';

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition ${
                      isIncluded
                        ? 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                        : 'bg-slate-900/40 border-slate-800/80 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={isIncluded}
                        onChange={() => toggleItemInclusion(item.id)}
                        className="mt-1 accent-indigo-600 rounded cursor-pointer"
                        title="Include in report"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${badgeColor}`}>
                            {item.category.toUpperCase()}
                          </span>
                          <span className="text-xs font-mono font-semibold text-slate-300">
                            {item.external_id}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                            <User className="w-3 h-3" /> @{item.author}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-100 mt-1 leading-snug">
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 mt-1.5"
                          >
                            <span>Open in Tracker</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Pane: Report Editor or Live Full Preview (7 Columns) */}
        <div className="lg:col-span-7 space-y-4">
          
          {viewMode === 'editor' ? (
            <div className="space-y-4">
              
              {/* Executive Summary Section */}
              <SectionEditor
                sectionKey="executive_summary"
                title="Executive Summary & Highlights"
                subtitle="High-level business velocity & outcomes"
                badgeText="STRATEGIC"
                badgeColor="bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                content={sections.executive_summary || ''}
                onChange={(val) => handleSectionChange('executive_summary', val)}
                onResynthesize={(inst) => handleResynthesizeSection('executive_summary', inst)}
              />

              {/* Shipped Deliverables */}
              <SectionEditor
                sectionKey="shipped"
                title="🚀 Shipped & Delivered"
                subtitle="Milestones landed & in production"
                badgeText="DELIVERED"
                badgeColor="bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                content={sections.shipped || ''}
                onChange={(val) => handleSectionChange('shipped', val)}
                onResynthesize={(inst) => handleResynthesizeSection('shipped', inst)}
              />

              {/* Slipped / Deferred Initiatives */}
              <SectionEditor
                sectionKey="slipped"
                title="⏳ Slipped / Deferred Initiatives"
                subtitle="Pushed to next cycle with impact analysis"
                badgeText="DEFERRED"
                badgeColor="bg-amber-500/20 text-amber-300 border-amber-500/30"
                content={sections.slipped || ''}
                onChange={(val) => handleSectionChange('slipped', val)}
                onResynthesize={(inst) => handleResynthesizeSection('slipped', inst)}
              />

              {/* Blockers & Impediments */}
              <SectionEditor
                sectionKey="blocked"
                title="🛑 Blockers & Risks"
                subtitle="External impediments needing escalation"
                badgeText="ACTION REQUIRED"
                badgeColor="bg-rose-500/20 text-rose-300 border-rose-500/30"
                content={sections.blocked || ''}
                onChange={(val) => handleSectionChange('blocked', val)}
                onResynthesize={(inst) => handleResynthesizeSection('blocked', inst)}
              />

              {/* Next Priorities */}
              <SectionEditor
                sectionKey="next_priorities"
                title="🎯 Next Week Priorities"
                subtitle="Immediate sprint focus items"
                content={sections.next_priorities || ''}
                onChange={(val) => handleSectionChange('next_priorities', val)}
                onResynthesize={(inst) => handleResynthesizeSection('next_priorities', inst)}
              />

              {/* Leadership Commentary Card */}
              <div className="bg-slate-800/60 border border-indigo-500/30 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-sm text-indigo-300">
                    📝 Leadership Commentary & Observations (Optional)
                  </span>
                </div>
                <textarea
                  value={leadershipNotes}
                  onChange={(e) => setLeadershipNotes(e.target.value)}
                  rows={3}
                  placeholder="Add custom notes from VP / Manager (e.g. Shoutout to Sarah for the Stripe migration; meeting with Okta customer on Monday)..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

            </div>
          ) : (
            /* Live 1-Page Markdown Preview */
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 lg:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
                    Live Markdown 1-Page Summary
                  </span>
                  <h1 className="text-xl font-bold text-white mt-1">{report.title}</h1>
                  <p className="text-xs text-slate-400">
                    Reporting Window: {report.period_start} &mdash; {report.period_end}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(report.summary_markdown);
                    alert('Markdown copied to clipboard!');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium"
                >
                  Copy Raw Markdown
                </button>
              </div>

              <div className="prose prose-invert prose-indigo max-w-none text-slate-200 text-sm leading-relaxed space-y-4">
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Executive Summary</h3>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {sections.executive_summary}
                  </p>
                </div>

                <div className="border-t border-slate-700/60 pt-4">
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2">
                    🚀 Shipped & Delivered
                  </h3>
                  <div className="text-xs text-slate-300 whitespace-pre-wrap">
                    {sections.shipped}
                  </div>
                </div>

                <div className="border-t border-slate-700/60 pt-4">
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">
                    ⏳ Slipped / Deferred Initiatives
                  </h3>
                  <div className="text-xs text-slate-300 whitespace-pre-wrap">
                    {sections.slipped}
                  </div>
                </div>

                <div className="border-t border-slate-700/60 pt-4">
                  <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-2">
                    🛑 Blockers & Risks
                  </h3>
                  <div className="text-xs text-slate-300 whitespace-pre-wrap">
                    {sections.blocked}
                  </div>
                </div>

                {sections.next_priorities && (
                  <div className="border-t border-slate-700/60 pt-4">
                    <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-2">
                      🎯 Next Week Priorities
                    </h3>
                    <div className="text-xs text-slate-300 whitespace-pre-wrap">
                      {sections.next_priorities}
                    </div>
                  </div>
                )}

                {leadershipNotes && (
                  <div className="border-t border-slate-700/60 pt-4 bg-indigo-950/20 p-4 rounded-xl border border-indigo-500/20">
                    <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">
                      📝 Leadership Commentary
                    </h3>
                    <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {leadershipNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
