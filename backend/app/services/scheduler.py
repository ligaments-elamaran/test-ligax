import datetime
from sqlalchemy.orm import Session
from backend.app.models import ReportConfig
from backend.app.services.ingestion import ingest_activities_for_period
from backend.app.services.synthesizer import synthesis_service
from backend.app.models import Report, ActivityItem
import json


class AgentScheduler:
    """
    Simulated Friday 5:00 PM auto-draft trigger and manual cadence runner.
    """

    def check_and_run_scheduled_draft(self, db: Session) -> dict:
        config = db.query(ReportConfig).first()
        if not config or not config.auto_draft_enabled:
            return {"status": "skipped", "reason": "auto_draft_disabled"}

        today = datetime.date.today()
        # Default reporting cycle is past 7 days
        start_date = today - datetime.timedelta(days=7)
        end_date = today

        # Check if report already drafted for this period
        existing = db.query(Report).filter(
            Report.period_start == str(start_date),
            Report.period_end == str(end_date)
        ).first()

        if existing:
            return {"status": "skipped", "reason": "already_exists", "report_id": existing.id}

        # Ingest and generate draft
        activities = ingest_activities_for_period(
            db,
            start_date=datetime.datetime.combine(start_date, datetime.time.min),
            end_date=datetime.datetime.combine(end_date, datetime.time.max)
        )

        shipped = [a.__dict__ for a in activities if a.category == "shipped"]
        slipped = [a.__dict__ for a in activities if a.category == "slipped"]
        blocked = [a.__dict__ for a in activities if a.category == "blocked"]

        synth_result = synthesis_service.synthesize_report(
            shipped=shipped,
            slipped=slipped,
            blocked=blocked,
            period_start=str(start_date),
            period_end=str(end_date),
            tone=config.default_tone,
            team_name=config.team_name,
            custom_instructions=config.custom_prompt_instructions or ""
        )

        inclusions = {a.id: True for a in activities}

        report = Report(
            title=synth_result["title"],
            period_start=str(start_date),
            period_end=str(end_date),
            status="DRAFT",
            tone=config.default_tone,
            summary_markdown=synth_result["summary_markdown"],
            sections_json=json.dumps(synth_result["sections"]),
            leadership_notes="",
            item_inclusions_json=json.dumps(inclusions)
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        return {"status": "drafted", "report_id": report.id, "title": report.title}


scheduler = AgentScheduler()
