import React, { useState, useEffect } from 'react';
import { Layout, TabKey } from './components/Layout';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { ReviewStationPage } from './pages/ReviewStationPage';
import { ArchivePage } from './pages/ArchivePage';
import { TrackersPage } from './pages/TrackersPage';
import { DeliveryLogsPage } from './pages/DeliveryLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { QuickDraftModal } from './components/QuickDraftModal';
import { DispatchModal } from './components/DispatchModal';
import { api } from './services/api';
import { 
  Report, 
  TrackerConnection, 
  ActivityItem, 
  DeliveryLog, 
  ReportConfig, 
  HealthStatus 
} from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [config, setConfig] = useState<ReportConfig | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [trackers, setTrackers] = useState<TrackerConnection[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryLog[]>([]);

  // Modals state
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isTriggeringAutoCadence, setIsTriggeringAutoCadence] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial load
  const loadInitialData = async () => {
    try {
      const [h, cfg, reps, trs, acts, dels] = await Promise.all([
        api.getHealth().catch(() => null),
        api.getConfig().catch(() => null),
        api.getReports().catch(() => ({ items: [], total: 0 })),
        api.getTrackers().catch(() => []),
        api.getActivities().catch(() => []),
        api.getDeliveries().catch(() => []),
      ]);

      if (h) setHealth(h);
      if (cfg) setConfig(cfg);
      if (reps) {
        setReports(reps.items);
        if (reps.items.length > 0 && !selectedReportId) {
          // Select draft or in-review report if available, else first
          const draft = reps.items.find(r => r.status === 'DRAFT' || r.status === 'IN_REVIEW');
          setSelectedReportId(draft ? draft.id : reps.items[0].id);
        }
      }
      if (trs) setTrackers(trs);
      if (acts) setActivities(acts);
      if (dels) setDeliveries(dels);
    } catch (e) {
      console.error('Failed loading initial data:', e);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSelectReport = (reportId: string) => {
    setSelectedReportId(reportId);
    setActiveTab('review');
  };

  const handleGenerateReport = async (params: any) => {
    try {
      const newReport = await api.generateReport(params);
      setReports(prev => [newReport, ...prev]);
      setSelectedReportId(newReport.id);
      setActiveTab('review');
      showToast('Weekly report draft generated successfully!');
      // Refresh activities
      const freshActs = await api.getActivities();
      setActivities(freshActs);
    } catch (e: any) {
      showToast(`Generation failed: ${e.message}`);
    }
  };

  const handleTriggerAutoDraft = async () => {
    setIsTriggeringAutoCadence(true);
    try {
      const res = await api.triggerDraftNow();
      if (res.status === 'drafted' && res.report_id) {
        showToast(`Scheduled agent executed: Drafted "${res.title}"`);
        const fresh = await api.getReports();
        setReports(fresh.items);
        setSelectedReportId(res.report_id);
        setActiveTab('review');
      } else {
        showToast(`Agent check completed: ${res.reason || 'Report already up-to-date'}`);
      }
    } catch (e: any) {
      showToast(`Cadence check failed: ${e.message}`);
    } finally {
      setIsTriggeringAutoCadence(false);
    }
  };

  const handleDispatch = async (channels: string[], slackUrl?: string, emailRecipients?: string) => {
    if (!selectedReportId) return;
    try {
      const res = await api.dispatchReport(selectedReportId, {
        channels,
        slack_webhook_url: slackUrl,
        email_recipients: emailRecipients,
      });
      // Update report status to SENT
      setReports(prev =>
        prev.map(r => (r.id === selectedReportId ? { ...r, status: 'SENT' as any } : r))
      );
      // Refresh deliveries
      const dels = await api.getDeliveries();
      setDeliveries(dels);
      showToast(`Dispatched across ${channels.join(', ')}!`);
    } catch (e: any) {
      showToast(`Dispatch error: ${e.message}`);
      throw e;
    }
  };

  const currentReport = reports.find(r => r.id === selectedReportId) || reports[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-indigo-400/40 animate-in slide-in-from-bottom-5">
          {toastMessage}
        </div>
      )}

      {/* Header with cadence and fast action button */}
      <Header
        health={health}
        config={config}
        onOpenDraftModal={() => setIsDraftModalOpen(true)}
        onTriggerAutoDraft={handleTriggerAutoDraft}
        isTriggering={isTriggeringAutoCadence}
      />

      {/* Navigation Layout Shell */}
      <Layout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeReportCount={reports.filter(r => r.status === 'DRAFT' || r.status === 'IN_REVIEW').length}
      >
        {activeTab === 'dashboard' && (
          <DashboardPage
            reports={reports}
            activities={activities}
            onSelectReport={handleSelectReport}
            onOpenDraftModal={() => setIsDraftModalOpen(true)}
          />
        )}

        {activeTab === 'review' && currentReport && (
          <ReviewStationPage
            report={currentReport}
            activities={activities}
            onReportUpdated={(updated) => {
              setReports(prev => prev.map(r => (r.id === updated.id ? updated : r)));
              showToast('Draft updated');
            }}
            onOpenDispatchModal={() => setIsDispatchModalOpen(true)}
          />
        )}

        {activeTab === 'archive' && (
          <ArchivePage
            reports={reports}
            onSelectReport={handleSelectReport}
            onOpenDraftModal={() => setIsDraftModalOpen(true)}
          />
        )}

        {activeTab === 'trackers' && (
          <TrackersPage
            trackers={trackers}
            activities={activities}
            onRefreshTrackers={async () => {
              const trs = await api.getTrackers();
              setTrackers(trs);
            }}
            onRefreshActivities={async () => {
              const acts = await api.getActivities();
              setActivities(acts);
            }}
          />
        )}

        {activeTab === 'deliveries' && (
          <DeliveryLogsPage logs={deliveries} />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            config={config}
            onConfigUpdated={(cfg) => {
              setConfig(cfg);
              showToast('Configuration updated');
            }}
          />
        )}
      </Layout>

      {/* Quick Draft Synthesis Modal */}
      <QuickDraftModal
        isOpen={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        trackers={trackers}
        onGenerate={handleGenerateReport}
      />

      {/* Multi-channel Dispatch Modal */}
      {currentReport && (
        <DispatchModal
          isOpen={isDispatchModalOpen}
          onClose={() => setIsDispatchModalOpen(false)}
          report={currentReport}
          config={config}
          onDispatch={handleDispatch}
        />
      )}

    </div>
  );
};
