from typing import List, Dict, Any


def format_executive_tone(
    shipped: List[Dict[str, Any]],
    slipped: List[Dict[str, Any]],
    blocked: List[Dict[str, Any]],
    period_start: str,
    period_end: str,
    team_name: str = "Core Engineering"
) -> Dict[str, str]:
    """Executive tone: High-level business impact, velocity summary, risk mitigation."""
    exec_summary = (
        f"During the weekly cycle of {period_start} to {period_end}, {team_name} delivered "
        f"{len(shipped)} high-impact capability releases while actively triaging {len(slipped)} deferred initiatives "
        f"and managing {len(blocked)} external dependencies. Velocity remained solid with substantial stability "
        f"and performance wins delivered across customer-facing workflows."
    )

    shipped_lines = []
    for item in shipped:
        shipped_lines.append(
            f"- **{item['title']}** (`{item['external_id']}`, lead: @{item.get('author', 'team')}): {item.get('description', '')}"
        )
    shipped_md = "\n".join(shipped_lines) if shipped_lines else "_No closed items recorded for this period._"

    slipped_lines = []
    for item in slipped:
        slipped_lines.append(
            f"- **{item['title']}** (`{item['external_id']}`): {item.get('description', '')} *(Impact: Deferred to upcoming cycle with minimal timeline disruption)*"
        )
    slipped_md = "\n".join(slipped_lines) if slipped_lines else "_Zero slipped items. All planned deliverables landed on schedule._"

    blocked_lines = []
    for item in blocked:
        blocked_lines.append(
            f"- **[BLOCKER] {item['title']}** (`{item['external_id']}`): {item.get('description', '')} *(Assigned lead: @{item.get('author', 'team')} — escalated for unblock)*"
        )
    blocked_md = "\n".join(blocked_lines) if blocked_lines else "_No critical blockers reported. All active workstreams progressing cleanly._"

    next_p = (
        "1. Complete rollout verification for recently deployed billing and auth upgrades.\n"
        "2. Address unblocking requirements for mobile release and SSO customer pilot.\n"
        "3. Finalize data streaming pagination architecture to unblock enterprise CSV exports."
    )

    return {
        "executive_summary": exec_summary,
        "shipped": shipped_md,
        "slipped": slipped_md,
        "blocked": blocked_md,
        "next_priorities": next_p,
    }


def format_bullets_tone(
    shipped: List[Dict[str, Any]],
    slipped: List[Dict[str, Any]],
    blocked: List[Dict[str, Any]],
    period_start: str,
    period_end: str,
    team_name: str = "Core Engineering"
) -> Dict[str, str]:
    """Concise Bullets tone: Fast-scanning list, bulleted points, immediate TL;DR."""
    exec_summary = (
        f"**Weekly TL;DR ({period_start} → {period_end})**: "
        f"✅ {len(shipped)} Shipped | ⏳ {len(slipped)} Slipped | 🛑 {len(blocked)} Blocked."
    )

    shipped_lines = [f"• {item['title']} ({item['external_id']}) - @{item.get('author', 'team')}" for item in shipped]
    shipped_md = "\n".join(shipped_lines) if shipped_lines else "• None"

    slipped_lines = [f"• {item['title']} ({item['external_id']}) - Pushed: {item.get('description', '')[:90]}" for item in slipped]
    slipped_md = "\n".join(slipped_lines) if slipped_lines else "• None"

    blocked_lines = [f"• [BLOCKED] {item['title']} ({item['external_id']}) - Owner: @{item.get('author', 'team')}" for item in blocked]
    blocked_md = "\n".join(blocked_lines) if blocked_lines else "• None"

    next_p = (
        "• Unblock Apple review & Okta SAML pilot\n"
        "• Execute database replica load stress tests\n"
        "• Close Sprint 43 commitments"
    )

    return {
        "executive_summary": exec_summary,
        "shipped": shipped_md,
        "slipped": slipped_md,
        "blocked": blocked_md,
        "next_priorities": next_p,
    }


def format_deep_dive_tone(
    shipped: List[Dict[str, Any]],
    slipped: List[Dict[str, Any]],
    blocked: List[Dict[str, Any]],
    period_start: str,
    period_end: str,
    team_name: str = "Core Engineering"
) -> Dict[str, str]:
    """Engineering Deep-dive tone: Technical details, root causes, architecture impacts."""
    exec_summary = (
        f"Engineering Retrospective & Deliverables Report ({period_start} to {period_end}).\n\n"
        f"The team completed {len(shipped)} architectural milestones, focusing on infrastructure hardening, "
        f"latency reduction, and authentication security. Two initiatives slipped due to unexpected boundary limits, "
        f"and {len(blocked)} items face external upstream impediments requiring partner coordination."
    )

    shipped_lines = []
    for item in shipped:
        shipped_lines.append(
            f"### `{item['external_id']}` {item['title']}\n"
            f"- **Author / Lead**: @{item.get('author', 'team')}\n"
            f"- **Technical Summary**: {item.get('description', '')}\n"
            f"- **Status / Link**: [{item.get('status', 'MERGED')}]({item.get('url', '#')})\n"
        )
    shipped_md = "\n".join(shipped_lines) if shipped_lines else "_No closed PRs or tickets._"

    slipped_lines = []
    for item in slipped:
        slipped_lines.append(
            f"### `{item['external_id']}` {item['title']}\n"
            f"- **Slip Reason & Root Cause**: {item.get('description', '')}\n"
            f"- **Mitigation**: Architecture plan revised; scheduling for next sprint sprint-review.\n"
        )
    slipped_md = "\n".join(slipped_lines) if slipped_lines else "_No slipped milestones._"

    blocked_lines = []
    for item in blocked:
        blocked_lines.append(
            f"### `[BLOCKER] {item['external_id']}` {item['title']}\n"
            f"- **Impediment Details**: {item.get('description', '')}\n"
            f"- **Action Required**: Escalation with third-party platform team and customer security group.\n"
        )
    blocked_md = "\n".join(blocked_lines) if blocked_lines else "_No blockers._"

    next_p = (
        "- **Infra**: Address replication lag thresholds on RDS aurora instances.\n"
        "- **Platform**: Finish async S3 streaming chunk generator for large CSV files.\n"
        "- **Security**: Assist customer enterprise admins in configuring Okta SAML attributes."
    )

    return {
        "executive_summary": exec_summary,
        "shipped": shipped_md,
        "slipped": slipped_md,
        "blocked": blocked_md,
        "next_priorities": next_p,
    }


def compile_full_markdown(
    title: str,
    period_start: str,
    period_end: str,
    sections: Dict[str, str],
    leadership_notes: str = ""
) -> str:
    parts = [
        f"# {title}",
        f"**Reporting Window**: {period_start} — {period_end}",
        "",
        "## Executive Summary",
        sections.get("executive_summary", "").strip(),
        "",
        "## 🚀 Shipped & Delivered",
        sections.get("shipped", "").strip(),
        "",
        "## ⏳ Slipped / Deferred Initiatives",
        sections.get("slipped", "").strip(),
        "",
        "## 🛑 Blockers & Risks",
        sections.get("blocked", "").strip(),
        "",
        "## 🎯 Next Week Priorities",
        sections.get("next_priorities", "").strip(),
    ]

    if leadership_notes and leadership_notes.strip():
        parts.extend([
            "",
            "## 📝 Leadership Notes & Observations",
            leadership_notes.strip()
        ])

    return "\n\n".join(parts)
