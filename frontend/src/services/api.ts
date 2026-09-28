import {
  TrackerConnection,
  ActivityItem,
  Report,
  DeliveryLog,
  ReportConfig,
  HealthStatus,
  ReportTone
} from '../types';

const BASE_URL = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!resp.ok) {
    let errorDetail = 'API request failed';
    try {
      const err = await resp.json();
      errorDetail = err.detail || JSON.stringify(err);
    } catch {
      errorDetail = await resp.text();
    }
    throw new Error(`Error ${resp.status}: ${errorDetail}`);
  }

  return resp.json();
}

export const api = {
  // System Health
  getHealth: () => fetchJson<HealthStatus>(`${BASE_URL}/health`),

  // Trackers
  getTrackers: () => fetchJson<TrackerConnection[]>(`${BASE_URL}/trackers`),
  createTracker: (payload: Partial<TrackerConnection>) =>
    fetchJson<TrackerConnection>(`${BASE_URL}/trackers`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateTracker: (id: string, payload: Partial<TrackerConnection>) =>
    fetchJson<TrackerConnection>(`${BASE_URL}/trackers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  testTracker: (id: string) =>
    fetchJson<{ status: string; message: string }>(`${BASE_URL}/trackers/${id}/test`, {
      method: 'POST',
    }),
  seedMockTracker: () =>
    fetchJson<{ status: string; seeded: number; total_activities: number }>(
      `${BASE_URL}/trackers/seed-mock`,
      { method: 'POST' }
    ),
  syncActivities: () =>
    fetchJson<{ status: string; count: number }>(`${BASE_URL}/activities/sync`, {
      method: 'POST',
    }),

  // Activities
  getActivities: (params?: { category?: string; connection_id?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.connection_id) query.append('connection_id', params.connection_id);
    if (params?.limit) query.append('limit', String(params.limit));
    return fetchJson<ActivityItem[]>(`${BASE_URL}/activities?${query.toString()}`);
  },

  // Reports
  getReports: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return fetchJson<{ items: Report[]; total: number }>(`${BASE_URL}/reports${query}`);
  },
  getReportById: (id: string) => fetchJson<Report>(`${BASE_URL}/reports/${id}`),
  generateReport: (payload: {
    title?: string;
    period_start: string;
    period_end: string;
    tone?: ReportTone;
    tracker_ids?: string[];
  }) =>
    fetchJson<Report>(`${BASE_URL}/reports/generate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateReport: (id: string, payload: Partial<Report>) =>
    fetchJson<Report>(`${BASE_URL}/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  resynthesizeSection: (
    reportId: string,
    payload: {
      section_key: string;
      custom_instruction?: string;
      tone?: string;
    }
  ) =>
    fetchJson<{ section_key: string; content?: string; sections?: any; summary_markdown: string }>(
      `${BASE_URL}/reports/${reportId}/resynthesize`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),
  approveReport: (id: string, approver = 'Engineering Lead') =>
    fetchJson<Report>(`${BASE_URL}/reports/${id}/approve?approver=${encodeURIComponent(approver)}`, {
      method: 'POST',
    }),
  dispatchReport: (
    id: string,
    payload: {
      channels: string[];
      slack_webhook_url?: string;
      email_recipients?: string;
    }
  ) =>
    fetchJson<{
      status: string;
      report_id: string;
      report_status: string;
      deliveries: DeliveryLog[];
    }>(`${BASE_URL}/reports/${id}/dispatch`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Deliveries
  getDeliveries: (reportId?: string) => {
    const query = reportId ? `?report_id=${reportId}` : '';
    return fetchJson<DeliveryLog[]>(`${BASE_URL}/deliveries${query}`);
  },

  // Config
  getConfig: () => fetchJson<ReportConfig>(`${BASE_URL}/config`),
  updateConfig: (payload: Partial<ReportConfig>) =>
    fetchJson<ReportConfig>(`${BASE_URL}/config`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  triggerDraftNow: () =>
    fetchJson<{ status: string; report_id?: string; title?: string; reason?: string }>(
      `${BASE_URL}/scheduler/trigger-draft`,
      { method: 'POST' }
    ),
};
