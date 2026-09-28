import React, { useState } from 'react';
import { 
  Inbox, 
  Slack, 
  Mail, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Eye, 
  X, 
  Code 
} from 'lucide-react';
import { DeliveryLog } from '../types';

interface DeliveryLogsPageProps {
  logs: DeliveryLog[];
}

export const DeliveryLogsPage: React.FC<DeliveryLogsPageProps> = ({ logs }) => {
  const [selectedLog, setSelectedLog] = useState<DeliveryLog | null>(null);

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'slack':
        return <Slack className="w-4 h-4 text-[#ECB22E]" />;
      case 'email':
        return <Mail className="w-4 h-4 text-emerald-400" />;
      default:
        return <FileText className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Inbox className="w-5 h-5 text-indigo-400" />
          <span>Outbox & Multi-Channel Delivery Logs</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Audited distribution logs across Slack Block Kit, Executive Email Dispatches, and Markdown exports
        </p>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden shadow-sm">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No delivery records logged yet. Dispatched reports will appear here.
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {logs.map((log) => {
              const statusColor =
                log.status === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : log.status === 'simulated'
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40';

              return (
                <div
                  key={log.id}
                  className="p-4 lg:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/50 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                        {getChannelIcon(log.channel)}
                      </div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        {log.channel.replace('_', ' ')}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${statusColor}`}>
                        {log.status}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(log.delivered_at || Date.now()).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300">
                      Recipient / Target: <strong className="text-slate-100 font-mono">{log.recipient}</strong>
                    </div>

                    {log.error_message && (
                      <div className="text-[11px] text-rose-400">
                        {log.error_message}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedLog(log)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 transition self-end sm:self-center"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Payload</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payload Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-slate-800">
                  {getChannelIcon(selectedLog.channel)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Delivery Payload &bull; {selectedLog.channel.toUpperCase()}
                  </h3>
                  <p className="text-xs text-slate-400">Target: {selectedLog.recipient}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {/* If Email channel, show simulated HTML preview as well as raw JSON */}
              {selectedLog.channel === 'email' ? (
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-300">Simulated Email Digest View:</span>
                  <div className="bg-white text-slate-900 p-4 rounded-xl shadow-inner border border-slate-200 text-xs overflow-x-auto">
                    {(() => {
                      try {
                        const parsed = JSON.parse(selectedLog.payload);
                        return (
                          <div dangerouslySetInnerHTML={{ __html: parsed.html_body || parsed.text_body }} />
                        );
                      } catch {
                        return <pre className="text-slate-800 font-mono">{selectedLog.payload}</pre>;
                      }
                    })()}
                  </div>
                </div>
              ) : null}

              {/* JSON Payload */}
              <div>
                <span className="text-xs font-semibold text-slate-300 mb-1.5 block">Raw JSON Payload</span>
                <pre className="p-4 bg-slate-950 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto border border-slate-800 max-h-80">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedLog.payload), null, 2);
                    } catch {
                      return selectedLog.payload;
                    }
                  })()}
                </pre>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
