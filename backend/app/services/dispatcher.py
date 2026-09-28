import json
import datetime
from typing import List, Dict, Any, Optional
import httpx
from sqlalchemy.orm import Session
from backend.app.models import Report, DeliveryLog, ReportConfig


class DistributionDispatcher:
    def dispatch_report(
        self,
        db: Session,
        report: Report,
        channels: List[str],
        slack_webhook_url: Optional[str] = None,
        email_recipients: Optional[str] = None
    ) -> List[DeliveryLog]:
        logs = []
        config = db.query(ReportConfig).first()

        effective_slack_url = slack_webhook_url or (config.slack_webhook_url if config else "")
        effective_email_to = email_recipients or (config.default_email_recipients if config else "leadership-team@company.internal")

        for channel in channels:
            if channel == "slack":
                log = self._dispatch_slack(db, report, effective_slack_url)
                logs.append(log)
            elif channel == "email":
                log = self._dispatch_email(db, report, effective_email_to)
                logs.append(log)
            elif channel == "markdown_export":
                log = self._dispatch_markdown(db, report)
                logs.append(log)

        # Transition report to SENT if approved or dispatched
        if report.status in ["DRAFT", "IN_REVIEW", "APPROVED"]:
            report.status = "SENT"
            report.updated_at = datetime.datetime.utcnow()
            db.commit()
            db.refresh(report)

        return logs

    def _dispatch_slack(self, db: Session, report: Report, webhook_url: Optional[str]) -> DeliveryLog:
        payload_data = self.format_slack_block_kit(report)
        payload_json = json.dumps(payload_data)

        if webhook_url and webhook_url.startswith("https://hooks.slack.com/"):
            try:
                resp = httpx.post(webhook_url, json=payload_data, timeout=8.0)
                if resp.status_code == 200:
                    status = "success"
                    err = ""
                else:
                    status = "failed"
                    err = f"Slack webhook returned {resp.status_code}: {resp.text[:100]}"
            except Exception as e:
                status = "failed"
                err = str(e)
        else:
            # High-fidelity simulation mode
            status = "simulated"
            err = "Simulated delivery (No live Slack incoming webhook provided or simulated endpoint)"

        log = DeliveryLog(
            report_id=report.id,
            channel="slack",
            recipient=webhook_url or "#engineering-leadership (simulated)",
            status=status,
            payload=payload_json,
            error_message=err,
            delivered_at=datetime.datetime.utcnow(),
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    def _dispatch_email(self, db: Session, report: Report, recipients: str) -> DeliveryLog:
        email_payload = {
            "subject": f"[Weekly Report] {report.title}",
            "to": [r.strip() for r in recipients.split(",") if r.strip()],
            "from": "weekly-agent@company.internal",
            "html_body": self._format_html_email(report),
            "text_body": report.summary_markdown,
        }
        payload_json = json.dumps(email_payload)

        # In modern corporate agents, email is sent or logged to simulated audit viewer
        log = DeliveryLog(
            report_id=report.id,
            channel="email",
            recipient=recipients,
            status="simulated",  # or success in simulated environment
            payload=payload_json,
            error_message="",
            delivered_at=datetime.datetime.utcnow(),
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    def _dispatch_markdown(self, db: Session, report: Report) -> DeliveryLog:
        payload = {
            "title": report.title,
            "period": f"{report.period_start} to {report.period_end}",
            "char_count": len(report.summary_markdown),
            "raw_markdown": report.summary_markdown,
        }
        log = DeliveryLog(
            report_id=report.id,
            channel="markdown_export",
            recipient="clipboard/file-export",
            status="success",
            payload=json.dumps(payload),
            error_message="",
            delivered_at=datetime.datetime.utcnow(),
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    def format_slack_block_kit(self, report: Report) -> Dict[str, Any]:
        """Generate official Slack Block Kit JSON representation."""
        try:
            sections = json.loads(report.sections_json)
        except Exception:
            sections = {}

        blocks = [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": f"📋 {report.title}", "emoji": True}
            },
            {
                "type": "context",
                "elements": [
                    {"type": "mrkdwn", "text": f"*Period*: {report.period_start} → {report.period_end} | *Tone*: `{report.tone}` | *Status*: `{report.status}`"}
                ]
            },
            {"type": "divider"},
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Executive Summary*\n{sections.get('executive_summary', '_No executive summary._')}"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*🚀 Shipped & Delivered*\n{sections.get('shipped', '_None_')[:2000]}"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*⏳ Slipped / Deferred*\n{sections.get('slipped', '_None_')[:2000]}"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*🛑 Blockers & Risks*\n{sections.get('blocked', '_None_')[:2000]}"
                }
            }
        ]

        if report.leadership_notes:
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*📝 Leadership Commentary*\n{report.leadership_notes[:1000]}"
                }
            })

        return {"blocks": blocks}

    def _format_html_email(self, report: Report) -> str:
        try:
            sections = json.loads(report.sections_json)
        except Exception:
            sections = {}

        return f"""
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; padding: 24px; }}
            .card {{ max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
            h1 {{ font-size: 22px; color: #0f172a; margin-top: 0; }}
            .badge {{ display: inline-block; padding: 4px 8px; font-size: 12px; font-weight: 600; border-radius: 4px; background: #e0e7ff; color: #3730a3; }}
            .section {{ margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; }}
            h2 {{ font-size: 16px; color: #334155; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }}
            .shipped {{ color: #059669; font-weight: bold; }}
            .slipped {{ color: #d97706; font-weight: bold; }}
            .blocked {{ color: #dc2626; font-weight: bold; }}
            pre {{ background: #f8fafc; padding: 12px; border-radius: 6px; white-space: pre-wrap; font-family: inherit; font-size: 14px; }}
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">Weekly Engineering Dispatch</span>
            <h1>{report.title}</h1>
            <p style="color: #64748b; font-size: 14px;">Window: {report.period_start} to {report.period_end} &bull; Tone: {report.tone.title()}</p>
            
            <div class="section">
              <h2>Executive Summary</h2>
              <p>{sections.get('executive_summary', '')}</p>
            </div>

            <div class="section">
              <h2 class="shipped">🚀 Shipped</h2>
              <pre>{sections.get('shipped', '')}</pre>
            </div>

            <div class="section">
              <h2 class="slipped">⏳ Slipped / Deferred</h2>
              <pre>{sections.get('slipped', '')}</pre>
            </div>

            <div class="section">
              <h2 class="blocked">🛑 Blockers</h2>
              <pre>{sections.get('blocked', '')}</pre>
            </div>

            {f'''
            <div class="section">
              <h2>📝 Leadership Commentary</h2>
              <p>{report.leadership_notes}</p>
            </div>
            ''' if report.leadership_notes else ''}
          </div>
        </body>
        </html>
        """


dispatcher = DistributionDispatcher()
