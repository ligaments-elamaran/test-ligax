import pytest
from backend.app.services.synthesizer import SynthesisService
from backend.app.services.tone_templates import (
    format_executive_tone,
    format_bullets_tone,
    format_deep_dive_tone,
    compile_full_markdown,
)


def test_deterministic_tone_templates():
    shipped = [{"external_id": "ENG-101", "title": "Added Redis caching", "description": "Reduced p99", "author": "alice"}]
    slipped = [{"external_id": "ENG-102", "title": "Export CSV", "description": "Deferred to sprint 43"}]
    blocked = [{"external_id": "ENG-103", "title": "Apple App Store approval", "description": "Waiting on review", "author": "bob"}]

    # Executive
    exec_sections = format_executive_tone(shipped, slipped, blocked, "2025-05-10", "2025-05-17", "Platform")
    assert "Platform delivered" in exec_sections["executive_summary"]
    assert "ENG-101" in exec_sections["shipped"]
    assert "ENG-102" in exec_sections["slipped"]
    assert "ENG-103" in exec_sections["blocked"]

    # Bullets
    bullets = format_bullets_tone(shipped, slipped, blocked, "2025-05-10", "2025-05-17", "Platform")
    assert "Weekly TL;DR" in bullets["executive_summary"]
    assert "ENG-101" in bullets["shipped"]

    # Deep dive
    deep = format_deep_dive_tone(shipped, slipped, blocked, "2025-05-10", "2025-05-17", "Platform")
    assert "Engineering Retrospective" in deep["executive_summary"]


def test_synthesis_service_fallback():
    service = SynthesisService()
    shipped = [{"external_id": "ENG-101", "title": "Added Redis caching", "description": "Reduced p99", "author": "alice"}]
    slipped = []
    blocked = []

    res = service.synthesize_report(
        shipped=shipped,
        slipped=slipped,
        blocked=blocked,
        period_start="2025-05-10",
        period_end="2025-05-17",
        tone="executive",
        team_name="Core Services"
    )

    assert res["title"] is not None
    assert "Executive Summary" in res["summary_markdown"]
    assert "ENG-101" in res["sections"]["shipped"]


def test_section_resynthesis_fallback():
    service = SynthesisService()
    current_sections = {"executive_summary": "Original summary", "shipped": "Original shipped"}
    shipped = [{"external_id": "ENG-101", "title": "Added Redis caching", "description": "Reduced p99", "author": "alice"}]

    new_sec = service.resynthesize_section(
        section_key="shipped",
        current_sections=current_sections,
        shipped=shipped,
        slipped=[],
        blocked=[],
        tone="bullets",
        custom_instruction="Include author tags clearly"
    )
    assert "ENG-101" in new_sec
