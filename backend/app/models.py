import datetime
import uuid
from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from backend.app.db.session import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class TrackerConnection(Base):
    __tablename__ = "tracker_connections"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    tracker_type = Column(String, nullable=False)  # 'github' | 'linear' | 'mock'
    is_active = Column(Integer, nullable=False, default=1)
    config_json = Column(Text, nullable=False, default="{}")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    activities = relationship("ActivityItem", back_populates="connection", cascade="all, delete-orphan")


class ActivityItem(Base):
    __tablename__ = "activity_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    connection_id = Column(String, ForeignKey("tracker_connections.id", ondelete="CASCADE"), nullable=True)
    external_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    category = Column(String, nullable=False)  # 'shipped' | 'slipped' | 'blocked'
    author = Column(String, nullable=False, default="unknown")
    url = Column(String, default="")
    status = Column(String, nullable=False)
    item_metadata = Column(Text, default="{}")
    occurred_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    connection = relationship("TrackerConnection", back_populates="activities")


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    period_start = Column(String, nullable=False)  # YYYY-MM-DD
    period_end = Column(String, nullable=False)    # YYYY-MM-DD
    status = Column(String, nullable=False, default="DRAFT")  # 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'SENT'
    tone = Column(String, nullable=False, default="executive")  # 'executive' | 'bullets' | 'deep_dive'
    summary_markdown = Column(Text, nullable=False, default="")
    sections_json = Column(Text, nullable=False, default="{}")
    leadership_notes = Column(Text, default="")
    item_inclusions_json = Column(Text, nullable=False, default="{}")
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    delivery_logs = relationship("DeliveryLog", back_populates="report", cascade="all, delete-orphan")


class DeliveryLog(Base):
    __tablename__ = "delivery_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)
    channel = Column(String, nullable=False)  # 'slack' | 'email' | 'markdown_export'
    recipient = Column(String, nullable=False)
    status = Column(String, nullable=False)  # 'success' | 'failed' | 'simulated'
    payload = Column(Text, nullable=False, default="{}")
    error_message = Column(Text, default="")
    delivered_at = Column(DateTime, default=datetime.datetime.utcnow)

    report = relationship("Report", back_populates="delivery_logs")


class ReportConfig(Base):
    __tablename__ = "report_configs"

    id = Column(String, primary_key=True, default="default")
    team_name = Column(String, nullable=False, default="Core Platform Team")
    default_tone = Column(String, nullable=False, default="executive")
    slack_webhook_url = Column(String, default="")
    default_email_recipients = Column(String, default="")
    scheduled_day = Column(String, nullable=False, default="Friday")
    scheduled_time = Column(String, nullable=False, default="17:00")
    auto_draft_enabled = Column(Integer, nullable=False, default=1)
    custom_prompt_instructions = Column(Text, default="")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
