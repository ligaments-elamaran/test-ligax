from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


# ---------------- Tracker Schemas ---------------- #
class TrackerConnectionBase(BaseModel):
    name: str
    tracker_type: str  # 'github' | 'linear' | 'mock'
    is_active: bool = True
    config_json: Optional[str] = "{}"


class TrackerConnectionCreate(TrackerConnectionBase):
    pass


class TrackerConnectionUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    config_json: Optional[str] = None


class TrackerConnectionResponse(TrackerConnectionBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------- Activity Schemas ---------------- #
class ActivityItemBase(BaseModel):
    external_id: str
    title: str
    description: Optional[str] = ""
    category: str  # 'shipped' | 'slipped' | 'blocked'
    author: str = "unknown"
    url: Optional[str] = ""
    status: str
    item_metadata: Optional[str] = "{}"
    occurred_at: Optional[datetime] = None


class ActivityItemCreate(ActivityItemBase):
    connection_id: Optional[str] = None


class ActivityItemResponse(ActivityItemBase):
    id: str
    connection_id: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------- Report Schemas ---------------- #
class ReportSections(BaseModel):
    executive_summary: str = ""
    shipped: str = ""
    slipped: str = ""
    blocked: str = ""
    next_priorities: str = ""


class ReportGenerateRequest(BaseModel):
    title: Optional[str] = None
    period_start: str  # YYYY-MM-DD
    period_end: str    # YYYY-MM-DD
    tone: Optional[str] = "executive"  # 'executive' | 'bullets' | 'deep_dive'
    tracker_ids: Optional[List[str]] = None


class ReportUpdateRequest(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None  # 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'SENT'
    tone: Optional[str] = None
    summary_markdown: Optional[str] = None
    sections_json: Optional[str] = None
    leadership_notes: Optional[str] = None
    item_inclusions_json: Optional[str] = None
    approved_by: Optional[str] = None


class ReportResynthesizeRequest(BaseModel):
    section_key: str  # 'executive_summary' | 'shipped' | 'slipped' | 'blocked' | 'all'
    custom_instruction: Optional[str] = None
    tone: Optional[str] = None


class ReportResponse(BaseModel):
    id: str
    title: str
    period_start: str
    period_end: str
    status: str
    tone: str
    summary_markdown: str
    sections_json: str
    leadership_notes: Optional[str] = ""
    item_inclusions_json: str
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    activities: Optional[List[ActivityItemResponse]] = None

    model_config = ConfigDict(from_attributes=True)


class ReportListResponse(BaseModel):
    items: List[ReportResponse]
    total: int


# ---------------- Dispatch Schemas ---------------- #
class DispatchRequest(BaseModel):
    channels: List[str] = ["slack", "email"]  # ['slack', 'email', 'markdown_export']
    slack_webhook_url: Optional[str] = None
    email_recipients: Optional[str] = None


class DeliveryLogResponse(BaseModel):
    id: str
    report_id: str
    channel: str
    recipient: str
    status: str
    payload: str
    error_message: Optional[str] = ""
    delivered_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------- Config Schemas ---------------- #
class ReportConfigBase(BaseModel):
    team_name: str = "Core Platform Team"
    default_tone: str = "executive"
    slack_webhook_url: Optional[str] = ""
    default_email_recipients: Optional[str] = ""
    scheduled_day: str = "Friday"
    scheduled_time: str = "17:00"
    auto_draft_enabled: bool = True
    custom_prompt_instructions: Optional[str] = ""


class ReportConfigUpdate(BaseModel):
    team_name: Optional[str] = None
    default_tone: Optional[str] = None
    slack_webhook_url: Optional[str] = None
    default_email_recipients: Optional[str] = None
    scheduled_day: Optional[str] = None
    scheduled_time: Optional[str] = None
    auto_draft_enabled: Optional[bool] = None
    custom_prompt_instructions: Optional[str] = None


class ReportConfigResponse(ReportConfigBase):
    id: str
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
