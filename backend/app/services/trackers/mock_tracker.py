import datetime
from typing import List, Dict, Any
from backend.app.services.trackers.base import BaseTrackerConnector


class MockTrackerConnector(BaseTrackerConnector):
    """
    Realistic engineering seed items simulating Jira/Linear/GitHub activities
    with varied categories (shipped, slipped, blocked) and rich context.
    """

    def test_connection(self) -> Dict[str, Any]:
        return {"status": "ok", "message": "Mock Engineering Tracker is operational and ready"}

    def fetch_items(self, start_date: datetime.datetime, end_date: datetime.datetime) -> List[Dict[str, Any]]:
        now = datetime.datetime.utcnow()
        day = datetime.timedelta(days=1)

        mock_catalog = [
            # 1. Shipped items
            {
                "external_id": "ENG-4102",
                "title": "Migrated billing webhook to Stripe v2024 with zero downtime",
                "description": "Updated signature verification, idempotency key generation, and handling for async tax calculations.",
                "category": "shipped",
                "author": "sarah.chen",
                "url": "https://github.com/org/platform/pull/4102",
                "status": "MERGED",
                "item_metadata": {"pr_number": 4102, "reviews": 3, "effort_points": 8},
                "occurred_at": now - day * 1,
            },
            {
                "external_id": "ENG-4115",
                "title": "Reduced p99 API latency from 420ms to 110ms with Redis cluster caching",
                "description": "Added multi-tier cache for organization permissions and tenant config queries.",
                "category": "shipped",
                "author": "alex.m",
                "url": "https://github.com/org/platform/pull/4115",
                "status": "MERGED",
                "item_metadata": {"latency_impact_pct": -73, "service": "auth-proxy"},
                "occurred_at": now - day * 2,
            },
            {
                "external_id": "ENG-4089",
                "title": "Added OAuth2 Google Sign-in to web application and mobile redirect",
                "description": "Implements PKCE flow, domain restriction rules for enterprise accounts, and session exchange.",
                "category": "shipped",
                "author": "elena.r",
                "url": "https://github.com/org/web-app/pull/4089",
                "status": "MERGED",
                "item_metadata": {"security_reviewed": True, "frontend_components": 4},
                "occurred_at": now - day * 2,
            },
            {
                "external_id": "ENG-4120",
                "title": "Implemented dark mode toggle in account settings and design tokens",
                "description": "Migrated CSS variables to semantic token layer with high-contrast fallback support.",
                "category": "shipped",
                "author": "marcus.k",
                "url": "https://github.com/org/web-app/pull/4120",
                "status": "MERGED",
                "item_metadata": {"tokens_updated": 48, "a11y_contrast_passed": True},
                "occurred_at": now - day * 3,
            },
            {
                "external_id": "ENG-4074",
                "title": "Automated synthetic smoke tests in CI pipeline across staging regions",
                "description": "End-to-end Cypress suites running every 30 minutes with PagerDuty alerts on degradation.",
                "category": "shipped",
                "author": "devin.w",
                "url": "https://github.com/org/infra/pull/4074",
                "status": "MERGED",
                "item_metadata": {"test_count": 52, "pipeline_time_secs": 140},
                "occurred_at": now - day * 3,
            },
            # 2. Slipped items
            {
                "external_id": "ENG-4050",
                "title": "Export to CSV & Excel feature for enterprise audit logs",
                "description": "Pushed to next sprint due to pagination edge cases and memory spikes on 1M+ row datasets.",
                "category": "slipped",
                "author": "priya.p",
                "url": "https://linear.app/org/issue/ENG-4050",
                "status": "DEFERRED",
                "item_metadata": {"reason": "Large dataset streaming requires S3 chunking redesign", "target_sprint": "Sprint 43"},
                "occurred_at": now - day * 1,
            },
            {
                "external_id": "ENG-4066",
                "title": "PostgreSQL database read-replica rollout for reporting queries",
                "description": "Deferred pending load testing under simulated replica replication lag spikes.",
                "category": "slipped",
                "author": "dave.b",
                "url": "https://linear.app/org/issue/ENG-4066",
                "status": "IN_PROGRESS",
                "item_metadata": {"reason": "Replication lag exceeded 5s during stress tests", "blocker_ticket": "INFRA-890"},
                "occurred_at": now - day * 2,
            },
            {
                "external_id": "ENG-4098",
                "title": "Self-serve API key rotation UI and automated notification",
                "description": "Delayed to align with new IAM RBAC permissions model rolling out next week.",
                "category": "slipped",
                "author": "sarah.chen",
                "url": "https://linear.app/org/issue/ENG-4098",
                "status": "IN_PROGRESS",
                "item_metadata": {"reason": "Waiting on IAM RBAC schema merge", "eta_days": 4},
                "occurred_at": now - day * 4,
            },
            # 3. Blocked items
            {
                "external_id": "ENG-4033",
                "title": "Apple App Store approval for v2.4 mobile release",
                "description": "Blocked by App Store review inquiry regarding background audio and health sync permissions.",
                "category": "blocked",
                "author": "jordan.t",
                "url": "https://linear.app/org/issue/ENG-4033",
                "status": "BLOCKED",
                "item_metadata": {"blocker": "Waiting on Apple App Review response to clarification note submitted on May 16", "impact": "Mobile release delayed"},
                "occurred_at": now - day * 1,
            },
            {
                "external_id": "ENG-4045",
                "title": "SSO integration with Okta for Fortune 500 pilot customer",
                "description": "Blocked waiting on customer IT admin to supply SAML metadata XML and test user provisioning.",
                "category": "blocked",
                "author": "elena.r",
                "url": "https://linear.app/org/issue/ENG-4045",
                "status": "BLOCKED",
                "item_metadata": {"blocker": "Customer IT Security review pending; meeting booked Monday 10am", "risk_level": "High"},
                "occurred_at": now - day * 2,
            },
            {
                "external_id": "ENG-4110",
                "title": "Data ingestion pipeline scaling for EU-Central datacenter",
                "description": "Blocked on AWS Frankfurt instance limit increase request pending support approval.",
                "category": "blocked",
                "author": "devin.w",
                "url": "https://linear.app/org/issue/ENG-4110",
                "status": "BLOCKED",
                "item_metadata": {"ticket": "AWS-CASE-9921", "blocker": "AWS service quota request in progress"},
                "occurred_at": now - day * 3,
            }
        ]

        # Return items within range (or all if range covers this week)
        return mock_catalog
