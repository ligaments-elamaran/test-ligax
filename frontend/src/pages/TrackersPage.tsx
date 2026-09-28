import React, { useState } from 'react';
import { 
  Activity, 
  RefreshCw, 
  Plus, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  Database, 
  Github 
} from 'lucide-react';
import { TrackerConnection, ActivityItem } from '../types';
import { api } from '../services/api';

interface TrackersPageProps {
  trackers: TrackerConnection[];
  activities: ActivityItem[];
  onRefreshTrackers: () => void;
  onRefreshActivities: () => void;
}

export const TrackersPage: React.FC<TrackersPageProps> = ({
  trackers,
  activities,
  onRefreshTrackers,
  onRefreshActivities,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{ [id: string]: { status: string; message: string } }>({});
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'shipped' | 'slipped' | 'blocked'>('all');

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      const res = await api.testTracker(id);
      setTestResults(prev => ({ ...prev, [id]: res }));
    } catch (e: any) {
      setTestResults(prev => ({ ...prev, [id]: { status: 'error', message: e.message } }));
    } finally {
      setTestingId(null);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      await api.syncActivities();
      onRefreshActivities();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReseedMock = async () => {
    setIsSyncing(true);
    try {
      await api.seedMockTracker();
      onRefreshActivities();
      onRefreshTrackers();
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredActivities = activities.filter(a =>
    categoryFilter === 'all' ? true : a.category === categoryFilter
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <span>Issue Trackers & Ingestion Pipelines</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Connect Linear, GitHub, and Jira to feed weekly activity evidence automatically
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleReseedMock}
            disabled={isSyncing}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
            title="Seed fresh engineering scenarios (Stripe v2024, p99 Redis caching, Apple review blocker)"
          >
            Reseed Mock Data
          </button>
          <button
            onClick={handleSyncAll}
            disabled={isSyncing}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync All Trackers</span>
          </button>
        </div>
      </div>

      {/* Trackers List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {trackers.map((tr) => {
          const testRes = testResults[tr.id];
          return (
            <div
              key={tr.id}
              className="bg-slate-800/50 border border-slate-700/70 rounded-2xl p-4 lg:p-5 flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-700 text-slate-300">
                    {tr.tracker_type}
                  </span>
                  <span className={`text-[11px] font-semibold flex items-center gap-1 ${
                    tr.is_active ? 'text-emerald-400' : 'text-slate-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${tr.is_active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    {tr.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-1">{tr.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">
                  Config: <span className="font-mono text-[11px] text-slate-300">{tr.config_json}</span>
                </p>

                {testRes && (
                  <div className={`mt-3 p-2.5 rounded-lg text-[11px] border ${
                    testRes.status === 'ok'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}>
                    {testRes.message}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-700/60 flex items-center justify-between">
                <button
                  onClick={() => handleTestConnection(tr.id)}
                  disabled={testingId === tr.id}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${testingId === tr.id ? 'animate-spin' : ''}`} />
                  <span>{testingId === tr.id ? 'Testing...' : 'Test Connection'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Raw Ingested Activities Stream */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 lg:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-700/60 pb-4">
          <div>
            <h3 className="text-base font-bold text-white">Ingested Activity Stream</h3>
            <p className="text-xs text-slate-400">Total {activities.length} items recorded across active tracking cycles</p>
          </div>

          <div className="flex items-center gap-1.5">
            {['all', 'shipped', 'slipped', 'blocked'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat as any)}
                className={`text-xs px-3 py-1.5 rounded-lg capitalize transition ${
                  categoryFilter === cat
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-700/40">
          {filteredActivities.map((act) => {
            const badgeColor =
              act.category === 'shipped'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : act.category === 'slipped'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30';

            return (
              <div key={act.id} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase border ${badgeColor}`}>
                      {act.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {act.external_id}
                    </span>
                    <span className="text-xs text-slate-400">
                      by @{act.author}
                    </span>
                    <span className="text-xs text-slate-500">&bull; Status: {act.status}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-white">{act.title}</h4>
                  {act.description && (
                    <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                      {act.description}
                    </p>
                  )}
                </div>

                {act.url && (
                  <a
                    href={act.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 shrink-0"
                    title="Open in Tracker"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
