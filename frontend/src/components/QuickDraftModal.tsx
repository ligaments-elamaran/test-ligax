import React, { useState } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Settings2, 
  Layers, 
  X, 
  RotateCw, 
  Check 
} from 'lucide-react';
import { ReportTone, TrackerConnection } from '../types';

interface QuickDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackers: TrackerConnection[];
  onGenerate: (params: {
    title: string;
    period_start: string;
    period_end: string;
    tone: ReportTone;
    tracker_ids: string[];
  }) => Promise<void>;
}

export const QuickDraftModal: React.FC<QuickDraftModalProps> = ({
  isOpen,
  onClose,
  trackers,
  onGenerate,
}) => {
  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];
  const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(lastWeek);
  const [endDate, setEndDate] = useState(today);
  const [tone, setTone] = useState<ReportTone>('executive');
  const [title, setTitle] = useState('');
  const [selectedTrackers, setSelectedTrackers] = useState<string[]>(
    trackers.filter(t => t.is_active).map(t => t.id)
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      await onGenerate({
        title: title.trim() || undefined,
        period_start: startDate,
        period_end: endDate,
        tone,
        tracker_ids: selectedTrackers,
      } as any);
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTracker = (id: string) => {
    setSelectedTrackers(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Synthesize Weekly Report</h2>
              <p className="text-xs text-slate-400">Ingest tracker evidence & run AI synthesis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Custom Report Title (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Core Platform Sprint 42 Highlights"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Period Start</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Period End</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Executive Tone / Persona</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'executive', name: 'Executive', desc: 'Strategic & velocity' },
                { id: 'bullets', name: 'Concise Bullets', desc: 'Fast scanning TL;DR' },
                { id: 'deep_dive', name: 'Deep-dive', desc: 'Architecture details' },
              ].map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTone(t.id as ReportTone)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    tone === t.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-semibold">{t.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Evidence Sources (Trackers)</label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {trackers.map((tr) => (
                <label
                  key={tr.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-700/60 hover:bg-slate-800 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedTrackers.includes(tr.id)}
                      onChange={() => toggleTracker(tr.id)}
                      className="accent-indigo-600 rounded"
                    />
                    <span className="text-xs font-medium text-slate-200">{tr.name}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300 uppercase">
                    {tr.tracker_type}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Draft</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
