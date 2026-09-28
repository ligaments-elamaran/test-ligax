import json
import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models import TrackerConnection, ActivityItem
from backend.app.services.trackers.mock_tracker import MockTrackerConnector
from backend.app.services.trackers.github_tracker import GitHubTrackerConnector
from backend.app.services.trackers.linear_tracker import LinearTrackerConnector


def get_connector(conn: TrackerConnection):
    try:
        config = json.loads(conn.config_json)
    except Exception:
        config = {}

    if conn.tracker_type == "mock":
        return MockTrackerConnector(name=conn.name, config=config)
    elif conn.tracker_type == "github":
        return GitHubTrackerConnector(name=conn.name, config=config)
    elif conn.tracker_type == "linear":
        return LinearTrackerConnector(name=conn.name, config=config)
    else:
        return MockTrackerConnector(name=conn.name, config=config)


def ingest_activities_for_period(
    db: Session,
    start_date: datetime.datetime,
    end_date: datetime.datetime,
    tracker_ids: List[str] = None
) -> List[ActivityItem]:
    """
    Fetch activities across active trackers and persist into SQLite ActivityItems table.
    """
    query = db.query(TrackerConnection).filter(TrackerConnection.is_active == 1)
    if tracker_ids:
        query = query.filter(TrackerConnection.id.in_(tracker_ids))
    connections = query.all()

    ingested_items = []
    for conn in connections:
        connector = get_connector(conn)
        raw_items = connector.fetch_items(start_date, end_date)

        for item_data in raw_items:
            # Check if item already exists to avoid duplicate duplicates
            existing = db.query(ActivityItem).filter(
                ActivityItem.connection_id == conn.id,
                ActivityItem.external_id == item_data["external_id"]
            ).first()

            if existing:
                existing.title = item_data["title"]
                existing.description = item_data.get("description", "")
                existing.category = item_data["category"]
                existing.status = item_data["status"]
                existing.author = item_data.get("author", "unknown")
                existing.url = item_data.get("url", "")
                existing.item_metadata = json.dumps(item_data.get("item_metadata", {}))
                existing.occurred_at = item_data.get("occurred_at", datetime.datetime.utcnow())
                ingested_items.append(existing)
            else:
                new_item = ActivityItem(
                    connection_id=conn.id,
                    external_id=item_data["external_id"],
                    title=item_data["title"],
                    description=item_data.get("description", ""),
                    category=item_data["category"],
                    author=item_data.get("author", "unknown"),
                    url=item_data.get("url", ""),
                    status=item_data["status"],
                    item_metadata=json.dumps(item_data.get("item_metadata", {})),
                    occurred_at=item_data.get("occurred_at", datetime.datetime.utcnow()),
                )
                db.add(new_item)
                ingested_items.append(new_item)

    db.commit()
    for item in ingested_items:
        db.refresh(item)
    return ingested_items
