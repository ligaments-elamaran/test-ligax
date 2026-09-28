PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- Tracker Connections (GitHub, Linear, Mock)
CREATE TABLE IF NOT EXISTS tracker_connections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tracker_type TEXT NOT NULL, -- 'github' | 'linear' | 'mock'
    is_active INTEGER NOT NULL DEFAULT 1,
    config_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Ingested Activity Items
CREATE TABLE IF NOT EXISTS activity_items (
    id TEXT PRIMARY KEY,
    connection_id TEXT REFERENCES tracker_connections(id) ON DELETE CASCADE,
    external_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL, -- 'shipped' | 'slipped' | 'blocked'
    author TEXT NOT NULL DEFAULT 'unknown',
    url TEXT DEFAULT '',
    status TEXT NOT NULL,
    item_metadata TEXT DEFAULT '{}',
    occurred_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Weekly Reports
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT', -- 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'SENT'
    tone TEXT NOT NULL DEFAULT 'executive', -- 'executive' | 'bullets' | 'deep_dive'
    summary_markdown TEXT NOT NULL,
    sections_json TEXT NOT NULL DEFAULT '{}',
    leadership_notes TEXT DEFAULT '',
    item_inclusions_json TEXT NOT NULL DEFAULT '{}',
    approved_at TEXT,
    approved_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Delivery Audit Logs (Slack, Email, Markdown Export)
CREATE TABLE IF NOT EXISTS delivery_logs (
    id TEXT PRIMARY KEY,
    report_id TEXT REFERENCES reports(id) ON DELETE CASCADE,
    channel TEXT NOT NULL, -- 'slack' | 'email' | 'markdown_export'
    recipient TEXT NOT NULL,
    status TEXT NOT NULL, -- 'success' | 'failed' | 'simulated'
    payload TEXT NOT NULL DEFAULT '{}',
    error_message TEXT DEFAULT '',
    delivered_at TEXT DEFAULT (datetime('now'))
);

-- Report Templates & Agent Config
CREATE TABLE IF NOT EXISTS report_configs (
    id TEXT PRIMARY KEY,
    team_name TEXT NOT NULL DEFAULT 'Core Platform Team',
    default_tone TEXT NOT NULL DEFAULT 'executive',
    slack_webhook_url TEXT DEFAULT '',
    default_email_recipients TEXT DEFAULT '',
    scheduled_day TEXT NOT NULL DEFAULT 'Friday',
    scheduled_time TEXT NOT NULL DEFAULT '17:00',
    auto_draft_enabled INTEGER NOT NULL DEFAULT 1,
    custom_prompt_instructions TEXT DEFAULT '',
    updated_at TEXT DEFAULT (datetime('now'))
);
