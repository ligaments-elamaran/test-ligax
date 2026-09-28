export type TrackerType = 'github' | 'linear' | 'mock';

export interface TrackerConnection {
  id: string;
  name: string;
  tracker_type: TrackerType;
  is_active: boolean;
  config_json: string;
  created_at?: string;
  updated_at?: string;
}

export type ActivityCategory = 'shipped' | 'slipped' | 'blocked';

export interface ActivityItem {
  id: string;
  connection_id?: string;
  external_id: string;
  title: string;
  description?: string;
  category: ActivityCategory;
  author: string;
  url?: string;
  status: string;
  item_metadata?: string;
  occurred_at?: string;
  created_at?: string;
}

export type ReportStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'SENT';
export type ReportTone = 'executive' | 'bullets' | 'deep_dive';

export interface ReportSections {
  executive_summary: string;
  shipped: string;
  slipped: string;
  blocked: string;
  next_priorities: string;
}

export interface Report {
  id: string;
  title: string;
  period_start: string;
  period_end: string;
  status: ReportStatus;
  tone: ReportTone;
  summary_markdown: string;
  sections_json: string;
  leadership_notes?: string;
  item_inclusions_json: string;
  approved_at?: string;
  approved_by?: string;
  created_at?: string;
  updated_at?: string;
  activities?: ActivityItem[];
}

export interface DeliveryLog {
  id: string;
  report_id: string;
  channel: 'slack' | 'email' | 'markdown_export';
  recipient: string;
  status: 'success' | 'failed' | 'simulated';
  payload: string;
  error_message?: string;
  delivered_at?: string;
}

export interface ReportConfig {
  id: string;
  team_name: string;
  default_tone: ReportTone;
  slack_webhook_url?: string;
  default_email_recipients?: string;
  scheduled_day: string;
  scheduled_time: string;
  auto_draft_enabled: boolean;
  custom_prompt_instructions?: string;
  updated_at?: string;
}

export interface HealthStatus {
  status: string;
  service: string;
  openai_configured: boolean;
  model: string;
}
