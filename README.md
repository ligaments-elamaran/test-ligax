# Weekly Report Agent

Autonomous weekly reporting agent for engineering teams.
Ingests raw activity items from GitHub, Linear, and Jira, classifies progress into **Shipped**, **Slipped**, and **Blocked**, and synthesizes an executive 1-page report for Friday distribution.

---

## 🌟 Key Features

1. **Autonomous Ingestion & Connectors**:
   - `MockTrackerConnector`: Rich out-of-the-box realistic engineering items (Sprint 42 delivered Stripe migration, Redis p99 reduction, iOS blocker).
   - `GitHubTrackerConnector`: Query merged PRs and blocked issues via GitHub REST API.
   - `LinearTrackerConnector`: Ingest completed and deferred sprint issues.

2. **AI & Deterministic Synthesis Engine**:
   - OpenAI GPT integration with high-fidelity local deterministic template fallback.
   - Tones supported: **Executive**, **Concise Bullets**, and **Engineering Deep-dive**.
   - Granular section re-synthesis with custom prompt directives.

3. **Human-in-the-Loop Review Station**:
   - Two-pane workspace: Evidence item toggle on the left, live Markdown preview & section editor on the right.
   - Report lifecycle state machine: `DRAFT` ➔ `IN_REVIEW` ➔ `APPROVED` ➔ `SENT`.
   - Leadership commentary injection.

4. **Multi-Channel Outbox & Dispatch**:
   - Slack Incoming Webhook (Slack Block Kit card layout).
   - Executive Email Digest (Clean HTML & text styling with simulated preview modal).
   - Markdown clipboard export and audit log retention.

5. **Autonomous Cadence Scheduling**:
   - Friday 5:00 PM auto-draft trigger with manual instant-cadence override.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Install Dependencies
```bash
# Backend dependencies
pip install fastapi uvicorn sqlalchemy pydantic httpx pytest

# Frontend dependencies
cd frontend
npm install --legacy-peer-deps
```

### 2. Run Tests
```bash
PYTHONPATH=. python3 -m pytest backend/tests/ -v
```

### 3. Launch Services
Run the unified script:
```bash
chmod +x run.sh
./run.sh
```
Or start individually:
```bash
# Terminal 1 - Backend FastAPI (Port 8000)
PYTHONPATH=. python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend Vite (Port 5173)
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173
```

---

## 📡 API Endpoints

- `GET /api/health`: Health status & LLM availability
- `GET /api/trackers`: List configured issue trackers
- `POST /api/trackers/seed-mock`: Reseed mock data
- `GET /api/activities`: List activity items filtered by category
- `POST /api/reports/generate`: Ingest activities and synthesize report
- `GET /api/reports`: List report archive
- `GET /api/reports/:id`: Get full report details with activities
- `PUT /api/reports/:id`: Update sections, tone, or leadership notes
- `POST /api/reports/:id/resynthesize`: Re-craft single section with AI
- `POST /api/reports/:id/approve`: Approve draft report
- `POST /api/reports/:id/dispatch`: Dispatch report to Slack and Email
- `GET /api/deliveries`: Inspect outbox delivery audit logs
- `GET/PUT /api/config`: Manage agent schedule and channel settings
