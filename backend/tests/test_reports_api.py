import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.session import engine, Base, SessionLocal
from backend.app.db.seed import seed_database


@pytest.fixture(scope="session", autouse=True)
def init_test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


def test_health_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "openai_configured" in data


def test_trackers_and_activities():
    with TestClient(app) as client:
        resp = client.get("/api/trackers")
        assert resp.status_code == 200
        trackers = resp.json()
        assert len(trackers) >= 1

        act_resp = client.get("/api/activities")
        assert act_resp.status_code == 200
        activities = act_resp.json()
        assert len(activities) >= 1


def test_report_lifecycle():
    with TestClient(app) as client:
        # 1. Generate Report
        gen_resp = client.post("/api/reports/generate", json={
            "title": "Sprint 42 Test Report",
            "period_start": "2025-05-10",
            "period_end": "2025-05-17",
            "tone": "executive"
        })
        assert gen_resp.status_code == 201
        report = gen_resp.json()
        report_id = report["id"]
        assert report["status"] == "DRAFT"

        # 2. Update Draft Sections / Notes
        update_resp = client.put(f"/api/reports/{report_id}", json={
            "leadership_notes": "Reviewed and verified with product management.",
            "status": "IN_REVIEW"
        })
        assert update_resp.status_code == 200
        assert update_resp.json()["status"] == "IN_REVIEW"
        assert "Reviewed and verified" in update_resp.json()["leadership_notes"]

        # 3. Approve Report
        approve_resp = client.post(f"/api/reports/{report_id}/approve", params={"approver": "Staff Tech Lead"})
        assert approve_resp.status_code == 200
        assert approve_resp.json()["status"] == "APPROVED"
        assert approve_resp.json()["approved_by"] == "Staff Tech Lead"

        # 4. Dispatch Report (Slack simulation + Email)
        dispatch_resp = client.post(f"/api/reports/{report_id}/dispatch", json={
            "channels": ["slack", "email", "markdown_export"],
            "email_recipients": "test-execs@company.internal"
        })
        assert dispatch_resp.status_code == 200
        dispatch_data = dispatch_resp.json()
        assert dispatch_data["report_status"] == "SENT"
        assert len(dispatch_data["deliveries"]) == 3

        # 5. Check Deliveries endpoint
        del_resp = client.get(f"/api/deliveries?report_id={report_id}")
        assert del_resp.status_code == 200
        assert len(del_resp.json()) == 3
