import json
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models import Report, ActivityItem, ReportConfig, DeliveryLog
from backend.app.schemas import (
    ReportResponse,
    ReportListResponse,
    ReportGenerateRequest,
    ReportUpdateRequest,
    ReportResynthesizeRequest,
    DispatchRequest,
    DeliveryLogResponse,
)
from backend.app.services.ingestion import ingest_activities_for_period
from backend.app.services.synthesizer import synthesis_service
from backend.app.services.dispatcher import dispatcher
from backend.app.services.tone_templates import compile_full_markdown

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("", response_model=ReportListResponse)
def list_reports(
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    query = db.query(Report)
    if status_filter:
        query = query.filter(Report.status == status_filter.upper())

    total = query.count()
    reports = query.order_by(Report.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {"items": reports, "total": total}


@router.post("/generate", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def generate_report(payload: ReportGenerateRequest, db: Session = Depends(get_db)):
    config = db.query(ReportConfig).first()
    team_name = config.team_name if config else "Core Platform Team"
    tone = payload.tone or (config.default_tone if config else "executive")

    try:
        p_start = datetime.datetime.fromisoformat(payload.period_start)
        p_end = datetime.datetime.fromisoformat(payload.period_end)
    except Exception:
        p_start = datetime.datetime.utcnow() - datetime.timedelta(days=7)
        p_end = datetime.datetime.utcnow()

    # Ingest from trackers
    activities = ingest_activities_for_period(
        db,
        start_date=p_start,
        end_date=p_end,
        tracker_ids=payload.tracker_ids
    )

    # If no activities, load existing activities within range or all recent
    if not activities:
        activities = db.query(ActivityItem).order_by(ActivityItem.occurred_at.desc()).limit(15).all()

    shipped = [a.__dict__ for a in activities if a.category == "shipped"]
    slipped = [a.__dict__ for a in activities if a.category == "slipped"]
    blocked = [a.__dict__ for a in activities if a.category == "blocked"]

    synth = synthesis_service.synthesize_report(
        shipped=shipped,
        slipped=slipped,
        blocked=blocked,
        period_start=payload.period_start,
        period_end=payload.period_end,
        tone=tone,
        team_name=team_name,
        custom_instructions=config.custom_prompt_instructions if config else ""
    )

    inclusions = {a.id: True for a in activities}

    report = Report(
        title=payload.title or synth["title"],
        period_start=payload.period_start,
        period_end=payload.period_end,
        status="DRAFT",
        tone=tone,
        summary_markdown=synth["summary_markdown"],
        sections_json=json.dumps(synth["sections"]),
        leadership_notes="",
        item_inclusions_json=json.dumps(inclusions)
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Attach activity items for response
    resp = ReportResponse.model_validate(report)
    resp.activities = activities
    return resp


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Fetch relevant activities
    activities = db.query(ActivityItem).order_by(ActivityItem.occurred_at.desc()).limit(30).all()

    resp = ReportResponse.model_validate(report)
    resp.activities = activities
    return resp


@router.put("/{report_id}", response_model=ReportResponse)
def update_report(report_id: str, payload: ReportUpdateRequest, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if payload.title is not None:
        report.title = payload.title
    if payload.status is not None:
        report.status = payload.status
        if payload.status == "APPROVED":
            report.approved_at = datetime.datetime.utcnow()
            report.approved_by = payload.approved_by or "Engineering Lead"
    if payload.tone is not None:
        report.tone = payload.tone
    if payload.leadership_notes is not None:
        report.leadership_notes = payload.leadership_notes
    if payload.sections_json is not None:
        report.sections_json = payload.sections_json
        try:
            sec_dict = json.loads(payload.sections_json)
            report.summary_markdown = compile_full_markdown(
                report.title,
                report.period_start,
                report.period_end,
                sec_dict,
                report.leadership_notes or ""
            )
        except Exception:
            pass
    if payload.summary_markdown is not None:
        report.summary_markdown = payload.summary_markdown
    if payload.item_inclusions_json is not None:
        report.item_inclusions_json = payload.item_inclusions_json

    report.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(report)
    return report


@router.post("/{report_id}/resynthesize")
def resynthesize_section(
    report_id: str,
    payload: ReportResynthesizeRequest,
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    try:
        sections = json.loads(report.sections_json)
    except Exception:
        sections = {}

    activities = db.query(ActivityItem).all()
    # Check item inclusion
    try:
        inclusions = json.loads(report.item_inclusions_json)
    except Exception:
        inclusions = {}

    filtered = [a for a in activities if inclusions.get(a.id, True)]
    shipped = [a.__dict__ for a in filtered if a.category == "shipped"]
    slipped = [a.__dict__ for a in filtered if a.category == "slipped"]
    blocked = [a.__dict__ for a in filtered if a.category == "blocked"]

    tone = payload.tone or report.tone

    if payload.section_key == "all":
        synth = synthesis_service.synthesize_report(
            shipped, slipped, blocked, report.period_start, report.period_end, tone=tone
        )
        report.sections_json = json.dumps(synth["sections"])
        report.summary_markdown = synth["summary_markdown"]
        db.commit()
        db.refresh(report)
        return {"section_key": "all", "sections": synth["sections"], "summary_markdown": synth["summary_markdown"]}
    else:
        new_content = synthesis_service.resynthesize_section(
            section_key=payload.section_key,
            current_sections=sections,
            shipped=shipped,
            slipped=slipped,
            blocked=blocked,
            tone=tone,
            custom_instruction=payload.custom_instruction
        )
        sections[payload.section_key] = new_content
        report.sections_json = json.dumps(sections)
        report.summary_markdown = compile_full_markdown(
            report.title,
            report.period_start,
            report.period_end,
            sections,
            report.leadership_notes or ""
        )
        db.commit()
        db.refresh(report)
        return {"section_key": payload.section_key, "content": new_content, "summary_markdown": report.summary_markdown}


@router.post("/{report_id}/approve", response_model=ReportResponse)
def approve_report(report_id: str, approver: str = "Engineering Lead", db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = "APPROVED"
    report.approved_at = datetime.datetime.utcnow()
    report.approved_by = approver
    report.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(report)
    return report


@router.post("/{report_id}/dispatch")
def dispatch_report_endpoint(
    report_id: str,
    payload: DispatchRequest,
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    logs = dispatcher.dispatch_report(
        db=db,
        report=report,
        channels=payload.channels,
        slack_webhook_url=payload.slack_webhook_url,
        email_recipients=payload.email_recipients
    )

    return {
        "status": "dispatched",
        "report_id": report.id,
        "report_status": report.status,
        "deliveries": [DeliveryLogResponse.model_validate(log) for log in logs]
    }
