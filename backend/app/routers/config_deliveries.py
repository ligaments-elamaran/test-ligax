from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models import DeliveryLog, ReportConfig
from backend.app.schemas import (
    DeliveryLogResponse,
    ReportConfigResponse,
    ReportConfigUpdate,
)
from backend.app.services.scheduler import scheduler

router = APIRouter(prefix="/api", tags=["Deliveries & Settings"])


@router.get("/deliveries", response_model=List[DeliveryLogResponse])
def list_deliveries(
    report_id: Optional[str] = None,
    channel: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(DeliveryLog)
    if report_id:
        query = query.filter(DeliveryLog.report_id == report_id)
    if channel:
        query = query.filter(DeliveryLog.channel == channel)

    logs = query.order_by(DeliveryLog.delivered_at.desc()).limit(limit).all()
    return logs


@router.get("/config", response_model=ReportConfigResponse)
def get_config(db: Session = Depends(get_db)):
    config = db.query(ReportConfig).filter(ReportConfig.id == "default").first()
    if not config:
        config = ReportConfig(id="default")
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


@router.put("/config", response_model=ReportConfigResponse)
def update_config(payload: ReportConfigUpdate, db: Session = Depends(get_db)):
    config = db.query(ReportConfig).filter(ReportConfig.id == "default").first()
    if not config:
        config = ReportConfig(id="default")
        db.add(config)

    if payload.team_name is not None:
        config.team_name = payload.team_name
    if payload.default_tone is not None:
        config.default_tone = payload.default_tone
    if payload.slack_webhook_url is not None:
        config.slack_webhook_url = payload.slack_webhook_url
    if payload.default_email_recipients is not None:
        config.default_email_recipients = payload.default_email_recipients
    if payload.scheduled_day is not None:
        config.scheduled_day = payload.scheduled_day
    if payload.scheduled_time is not None:
        config.scheduled_time = payload.scheduled_time
    if payload.auto_draft_enabled is not None:
        config.auto_draft_enabled = 1 if payload.auto_draft_enabled else 0
    if payload.custom_prompt_instructions is not None:
        config.custom_prompt_instructions = payload.custom_prompt_instructions

    db.commit()
    db.refresh(config)
    return config


@router.post("/scheduler/trigger-draft")
def trigger_agent_draft(db: Session = Depends(get_db)):
    result = scheduler.check_and_run_scheduled_draft(db)
    return result
