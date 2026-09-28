import React from 'react';
import { 
  LayoutDashboard, 
  FileEdit, 
  Archive, 
  Activity, 
  Inbox, 
  Settings 
} from 'lucide-react';

export type TabKey = 'dashboard' | 'review' | 'archive' | 'trackers' | 'deliveries' | 'settings';

interface LayoutProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  children: React.ReactNode;
  activeReportCount?: number;
}

export const Layout: React.FC<LayoutProps> = ({
  activeTab,
  onTabChange,
  children,
  activeReportCount = 1,
}) => {
  const tabs = [
    { key: 'dashboard' as TabKey, label: 'Dashboard', icon: LayoutDashboard },
    { key: 'review' as TabKey, label: 'Review Station', icon: FileEdit, badge: activeReportCount > 0 ? 'Active' : undefined },
    { key: 'archive' as TabKey, label: 'Report Archive', icon: Archive },
    { key: 'trackers' as TabKey, label: 'Issue Trackers', icon: Activity },
    { key: 'deliveries' as TabKey, label: 'Outbox & Delivery Logs', icon: Inbox },
    { key: 'settings' as TabKey, label: 'Agent Cadence & Settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation Sub-header / Tabs */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 backdrop-blur sticky top-[61px] z-30 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center space-x-1 overflow-x-auto py-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};
