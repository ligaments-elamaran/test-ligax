import datetime
import json
from sqlalchemy.orm import Session
from backend.app.models import TrackerConnection, ActivityItem, Report, DeliveryLog, ReportConfig
from backend.app.services.trackers.mock_tracker import MockTrackerConnector
from backend.app.services.tone_templates import format_executive_tone, compile_full_markdown


def seed_database(db: Session):
    # 1. Seed Default Config if not exists
    config = db.query(ReportConfig).filter(ReportConfig.id == "default").first()
    if not config:
        config = ReportConfig(
            id="default",
            team_name="Core Platform & Services",
            default_tone="executive",
            slack_webhook_url="https://hooks.slack.com/services/T00/B00/simulated_token",
            default_email_recipients="eng-leads@company.internal, exec-updates@company.internal",
            scheduled_day="Friday",
            scheduled_time="17:00",
            auto_draft_enabled=1,
            custom_prompt_instructions="Emphasize customer reliability wins and call out cross-team blockers explicitly.",
        )
        db.add(config)
        db.commit()

    # 2. Seed Mock Tracker Connection if not exists
    mock_conn = db.query(TrackerConnection).filter(TrackerConnection.tracker_type == "mock").first()
    if not mock_conn:
        mock_conn = TrackerConnection(
            name="Primary Engineering Jira/Linear (Mock)",
            tracker_type="mock",
            is_active=1,
            config_json=json.dumps({"project_key": "PLAT", "sync_interval_mins": 30}),
        )
        db.add(mock_conn)
        db.commit()
        db.refresh(mock_conn)

    # Also add GitHub and Linear inactive connections ready to configure
    gh_conn = db.query(TrackerConnection).filter(TrackerConnection.tracker_type == "github").first()
    if not gh_conn:
        gh_conn = TrackerConnection(
            name="GitHub Organization (github.com/company/platform)",
            tracker_type="github",
            is_active=1,
            config_json=json.dumps({"repo": "company/platform", "token": ""}),
        )
        db.add(gh_conn)
        db.commit()

    linear_conn = db.query(TrackerConnection).filter(TrackerConnection.tracker_type == "linear").first()
    if not linear_conn:
        linear_conn = TrackerConnection(
            name="Linear Workspace (Team Core)",
            tracker_type="linear",
            is_active=0,
            config_json=json.dumps({"team_key": "CORE", "api_key": ""}),
        )
        db.add(linear_conn)
        db.commit()

    # 3. Seed Activity Items from Mock Tracker if empty
    activities_count = db.query(ActivityItem).count()
    if activities_count == 0:
        mock_connector = MockTrackerConnector("Mock", {})
        now = datetime.datetime.utcnow()
        raw_items = mock_connector.fetch_items(now - datetime.timedelta(days=7), now)

        for item_data in raw_items:
            item = ActivityItem(
                connection_id=mock_conn.id,
                external_id=item_data["external_id"],
                title=item_data["title"],
                description=item_data.get("description", ""),
                category=item_data["category"],
                author=item_data.get("author", "unknown"),
                url=item_data.get("url", ""),
                status=item_data["status"],
                item_metadata=json.dumps(item_data.get("item_metadata", {})),
                occurred_at=item_data.get("occurred_at", now),
            )
            db.add(item)
        db.commit()

    # 4. Seed Historical Reports if no reports exist
    reports_count = db.query(Report).count()
    if reports_count == 0:
        now = datetime.date.today()
        # Report 1: Last week's sent report
        p1_end = now - datetime.timedelta(days=now.weekday() + 3) # Previous Friday
        p1_start = p1_end - datetime.timedelta(days=7)

        seed_shipped = [
            {"external_id": "ENG-3980", "title": "Migrated auth token storage to HTTP-only SameSite cookies", "description": "Patched session replay risk and hardened mobile cookie transport.", "author": "alex.m"},
            {"external_id": "ENG-3995", "title": "Upgraded Postgres instances to v16 with automated failover", "description": "Zero dropped connections during canary maintenance window.", "author": "dave.b"},
            {"external_id": "ENG-4001", "title": "Integrated OpenTelemetry tracing into payment worker pods", "description": "Traces now stream to Grafana Tempo for p99 outlier profiling.", "author": "sarah.chen"},
        ]
        seed_slipped = [
            {"external_id": "ENG-3955", "title": "Kubernetes cluster autoscale scale-down buffer tuning", "description": "Deferred to coordinate with AWS compute node discount refresh."}
        ]
        seed_blocked = [
            {"external_id": "ENG-3960", "title": "Vendor security signoff for SOC2 Type II audit report", "description": "Waiting on external auditor signoff letter expected Tuesday."}
        ]

        sections = format_executive_tone(seed_shipped, seed_slipped, seed_blocked, str(p1_start), str(p1_end), "Core Platform & Services")
        title_1 = f"Core Platform Weekly Report: {p1_start} to {p1_end}"
        md_1 = compile_full_markdown(title_1, str(p1_start), str(p1_end), sections, "Team operated with high velocity; great work alex.m on auth hardening.")

        report_1 = Report(
            title=title_1,
            period_start=str(p1_start),
            period_end=str(p1_end),
            status="SENT",
            tone="executive",
            summary_markdown=md_1,
            sections_json=json.dumps(sections),
            leadership_notes="Team operated with high velocity; great work alex.m on auth hardening.",
            item_inclusions_json=json.dumps({"ENG-3980": True, "ENG-3995": True, "ENG-4001": True}),
            approved_at=datetime.datetime.utcnow() - datetime.timedelta(days=7),
            approved_by="VP of Engineering (Dave S.)",
        )
        db.add(report_1)
        db.commit()
        db.refresh(report_1)

        # Seed Delivery Logs for report_1
        log_slack = DeliveryLog(
            report_id=report_1.id,
            channel="slack",
            recipient="#engineering-leadership",
            status="simulated",
            payload=json.dumps({"channel": "#engineering-leadership", "text": "Report dispatched via Slack Block Kit"}),
            delivered_at=datetime.datetime.utcnow() - datetime.timedelta(days=7),
        )
        log_email = DeliveryLog(
            report_id=report_1.id,
            channel="email",
            recipient="eng-leads@company.internal",
            status="simulated",
            payload=json.dumps({"subject": report_1.title, "to": ["eng-leads@company.internal"]}),
            delivered_at=datetime.datetime.utcnow() - datetime.timedelta(days=7),
        )
        db.add(log_slack)
        db.add(log_email)

        # Report 2: Current week active DRAFT
        p2_start = p1_end + datetime.timedelta(days=1)
        p2_end = now
        active_items = db.query(ActivityItem).all()
        curr_shipped = [a.__dict__ for a in active_items if a.category == "shipped"]
        curr_slipped = [a.__dict__ for a in active_items if a.category == "slipped"]
        curr_blocked = [a.__dict__ for a in active_items if a.category == "blocked"]

        curr_sections = format_executive_tone(curr_shipped, curr_slipped, curr_blocked, str(p2_start), str(p2_end), "Core Platform & Services")
        title_2 = f"Core Platform Weekly Report: {p2_start} to {p2_end} (Sprint 42)"
        md_2 = compile_full_markdown(title_2, str(p2_start), str(p2_end), curr_sections, "Review before Friday 5:00 PM dispatch.")

        report_2 = Report(
            title=title_2,
            period_start=str(p2_start),
            period_end=str(p2_end),
            status="IN_REVIEW",
            tone="executive",
            summary_markdown=md_2,
            sections_json=json.dumps(curr_sections),
            leadership_notes="Review before Friday 5:00 PM dispatch.",
            item_inclusions_json=json.dumps({a.id: True for a in active_items}),
        )
        db.add(report_2)
        db.commit()
