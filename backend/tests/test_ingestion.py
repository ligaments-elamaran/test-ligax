import pytest
import datetime
from backend.app.services.trackers.mock_tracker import MockTrackerConnector
from backend.app.services.trackers.github_tracker import GitHubTrackerConnector


def test_mock_tracker_categorization():
    connector = MockTrackerConnector("Mock", {})
    now = datetime.datetime.utcnow()
    items = connector.fetch_items(now - datetime.timedelta(days=7), now)

    assert len(items) > 0
    categories = {item["category"] for item in items}
    assert "shipped" in categories
    assert "slipped" in categories
    assert "blocked" in categories

    shipped_items = [i for i in items if i["category"] == "shipped"]
    assert any("billing webhook" in i["title"].lower() or "latency" in i["title"].lower() for i in shipped_items)

    blocked_items = [i for i in items if i["category"] == "blocked"]
    assert any("app store" in i["title"].lower() or "sso" in i["title"].lower() for i in blocked_items)


def test_mock_tracker_connection_test():
    connector = MockTrackerConnector("Mock", {})
    result = connector.test_connection()
    assert result["status"] == "ok"


def test_github_tracker_fallback_mode():
    connector = GitHubTrackerConnector("GitHub", {"repo": "acme/corp"})
    test_result = connector.test_connection()
    assert test_result["status"] in ["unconfigured", "ok"]

    items = connector.fetch_items(datetime.datetime.utcnow() - datetime.timedelta(days=7), datetime.datetime.utcnow())
    assert len(items) >= 1
