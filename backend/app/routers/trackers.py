import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models import TrackerConnection, ActivityItem
from backend.app.schemas import (
    TrackerConnectionResponse,
    TrackerConnectionCreate,
    TrackerConnectionUpdate,
    ActivityItemResponse,
)
from backend.app.services.ingestion import get_connector, ingest_activities_for_period
import datetime

router = APIRouter(prefix="/api", tags=["Trackers & Activities"])


@router.get("/trackers", response_model=List[TrackerConnectionResponse])
def list_trackers(db: Session = Depends(get_db)):
    return db.query(TrackerConnection).all()


@router.post("/trackers", response_model=TrackerConnectionResponse, status_code=201)
def create_tracker(payload: TrackerConnectionCreate, db: Session = Depends(get_db)):
    tracker = TrackerConnection(
        name=payload.name,
        tracker_type=payload.tracker_type,
        is_active=1 if payload.is_active else 0,
        config_json=payload.config_json or "{}",
    )
    db.add(tracker)
    db.commit()
    db.refresh(tracker)
    return tracker


@router.put("/trackers/{tracker_id}", response_model=TrackerConnectionResponse)
def update_tracker(tracker_id: str, payload: TrackerConnectionUpdate, db: Session = Depends(get_db)):
    tracker = db.query(TrackerConnection).filter(TrackerConnection.id == tracker_id).first()
    if not tracker:
        raise HTTPException(status_code=404, detail="Tracker connection not found")

    if payload.name is not None:
        tracker.name = payload.name
    if payload.is_active is not None:
        tracker.is_active = 1 if payload.is_active else 0
    if payload.config_json is not None:
        tracker.config_json = payload.config_json

    db.commit()
    db.refresh(tracker)
    return tracker


@router.post("/trackers/{tracker_id}/test")
def test_tracker_connection(tracker_id: str, db: Session = Depends(get_db)):
    tracker = db.query(TrackerConnection).filter(TrackerConnection.id == tracker_id).first()
    if not tracker:
        raise HTTPException(status_code=404, detail="Tracker connection not found")

    connector = get_connector(tracker)
    return connector.test_connection()


@router.post("/trackers/seed-mock")
def reseed_mock_tracker(db: Session = Depends(get_db)):
    from backend.app.services.trackers.mock_tracker import MockTrackerConnector
    mock_conn = db.query(TrackerConnection).filter(TrackerConnection.tracker_type == "mock").first()
    if not mock_conn:
        mock_conn = TrackerConnection(
            name="Primary Engineering Jira/Linear (Mock)",
            tracker_type="mock",
            is_active=1,
            config_json=json.dumps({"project_key": "PLAT"}),
        )
        db.add(mock_conn)
        db.commit()
        db.refresh(mock_conn)

    connector = MockTrackerConnector("Mock", {})
    now = datetime.datetime.utcnow()
    raw_items = connector.fetch_items(now - datetime.timedelta(days=7), now)

    count = 0
    for item in raw_items:
        existing = db.query(ActivityItem).filter(
            ActivityItem.connection_id == mock_conn.id,
            ActivityItem.external_id == item["external_id"]
        ).first()
        if not existing:
            act = ActivityItem(
                connection_id=mock_conn.id,
                external_id=item["external_id"],
                title=item["title"],
                description=item.get("description", ""),
                category=item["category"],
                author=item.get("author", "unknown"),
                url=item.get("url", ""),
                status=item["status"],
                item_metadata=json.dumps(item.get("item_metadata", {})),
                occurred_at=item.get("occurred_at", now),
            )
            db.add(act)
            count += 1
    db.commit()

    return {"status": "ok", "seeded": count, "total_activities": db.query(ActivityItem).count()}


@router.get("/activities", response_model=List[ActivityItemResponse])
def list_activities(
    category: Optional[str] = Query(None, description="shipped | slipped | blocked"),
    connection_id: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(ActivityItem)
    if category:
        query = query.filter(ActivityItem.category == category)
    if connection_id:
        query = query.filter(ActivityItem.connection_id == connection_id)

    items = query.order_by(ActivityItem.occurred_at.desc()).limit(limit).all()
    return items


@router.post("/activities/sync")
def sync_all_active_trackers(db: Session = Depends(get_db)):
    now = datetime.datetime.utcnow()
    start_date = now - datetime.timedelta(days=7)
    items = ingest_activities_for_period(db, start_date, now)
    return {"status": "synced", "count": len(items)}
