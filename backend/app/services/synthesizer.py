import os
import json
from typing import List, Dict, Any, Optional
import httpx
from backend.app.services.tone_templates import (
    format_executive_tone,
    format_bullets_tone,
    format_deep_dive_tone,
    compile_full_markdown,
)


class SynthesisService:
    def __init__(self):
        self.api_key = os.environ.get("OPENAI_API_KEY", "")
        self.model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

    def is_llm_available(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    def synthesize_report(
        self,
        shipped: List[Dict[str, Any]],
        slipped: List[Dict[str, Any]],
        blocked: List[Dict[str, Any]],
        period_start: str,
        period_end: str,
        tone: str = "executive",
        team_name: str = "Core Engineering Team",
        custom_instructions: str = ""
    ) -> Dict[str, Any]:
        """
        Synthesizes a full report. If OpenAI API key is set and valid, calls OpenAI API.
        Otherwise deterministically uses rich rule-based templates.
        """
        if self.is_llm_available():
            try:
                sections = self._synthesize_with_openai(
                    shipped=shipped,
                    slipped=slipped,
                    blocked=blocked,
                    period_start=period_start,
                    period_end=period_end,
                    tone=tone,
                    team_name=team_name,
                    custom_instructions=custom_instructions
                )
                title = f"{team_name} Weekly Update ({period_start} – {period_end})"
                full_md = compile_full_markdown(title, period_start, period_end, sections)
                return {
                    "title": title,
                    "sections": sections,
                    "summary_markdown": full_md,
                    "mode": "openai",
                }
            except Exception as e:
                # Log error and fallback seamlessly
                print(f"[SynthesisService] OpenAI query failed ({e}), falling back to deterministic template.")

        # Deterministic Fallback
        if tone == "bullets":
            sections = format_bullets_tone(shipped, slipped, blocked, period_start, period_end, team_name)
        elif tone == "deep_dive":
            sections = format_deep_dive_tone(shipped, slipped, blocked, period_start, period_end, team_name)
        else:
            sections = format_executive_tone(shipped, slipped, blocked, period_start, period_end, team_name)

        title = f"{team_name} Weekly Report: {period_start} to {period_end}"
        full_md = compile_full_markdown(title, period_start, period_end, sections)

        return {
            "title": title,
            "sections": sections,
            "summary_markdown": full_md,
            "mode": "deterministic_fallback",
        }

    def resynthesize_section(
        self,
        section_key: str,
        current_sections: Dict[str, str],
        shipped: List[Dict[str, Any]],
        slipped: List[Dict[str, Any]],
        blocked: List[Dict[str, Any]],
        tone: str = "executive",
        custom_instruction: Optional[str] = None
    ) -> str:
        """
        Re-synthesize a specific section on demand.
        """
        if self.is_llm_available():
            try:
                return self._resynthesize_section_with_openai(
                    section_key=section_key,
                    current_content=current_sections.get(section_key, ""),
                    shipped=shipped,
                    slipped=slipped,
                    blocked=blocked,
                    tone=tone,
                    custom_instruction=custom_instruction
                )
            except Exception as e:
                print(f"[SynthesisService] OpenAI section re-synthesis failed: {e}")

        # Fallback section regeneration
        fresh_pack = (
            format_bullets_tone(shipped, slipped, blocked, "Current Cycle", "Today")
            if tone == "bullets"
            else format_deep_dive_tone(shipped, slipped, blocked, "Current Cycle", "Today")
            if tone == "deep_dive"
            else format_executive_tone(shipped, slipped, blocked, "Current Cycle", "Today")
        )

        base = fresh_pack.get(section_key, current_sections.get(section_key, ""))
        if custom_instruction:
            base += f"\n\n*(Note addressed: {custom_instruction})*"
        return base

    def _synthesize_with_openai(
        self,
        shipped: List[Dict[str, Any]],
        slipped: List[Dict[str, Any]],
        blocked: List[Dict[str, Any]],
        period_start: str,
        period_end: str,
        tone: str,
        team_name: str,
        custom_instructions: str
    ) -> Dict[str, str]:
        system_prompt = (
            "You are an expert Engineering Chief of Staff and Technical Writer. "
            "Your job is to generate a comprehensive, polished, and structured 1-page weekly report. "
            "Return a JSON object with keys: 'executive_summary', 'shipped', 'slipped', 'blocked', 'next_priorities'. "
            f"The desired tone is: '{tone}'. Custom guidance: '{custom_instructions}'. "
            "Use clear markdown with bullet points and bolding for readability."
        )

        payload_evidence = {
            "team_name": team_name,
            "period": f"{period_start} to {period_end}",
            "shipped_count": len(shipped),
            "shipped_items": [{"id": i["external_id"], "title": i["title"], "desc": i.get("description", ""), "author": i.get("author")} for i in shipped],
            "slipped_count": len(slipped),
            "slipped_items": [{"id": i["external_id"], "title": i["title"], "desc": i.get("description", "")} for i in slipped],
            "blocked_count": len(blocked),
            "blocked_items": [{"id": i["external_id"], "title": i["title"], "desc": i.get("description", "")} for i in blocked],
        }

        user_content = json.dumps(payload_evidence)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        body = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Generate the weekly report sections JSON from this data:\n{user_content}"},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.3,
        }

        resp = httpx.post("https://api.openai.com/v1/chat/completions", headers=headers, json=body, timeout=25.0)
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        return {
            "executive_summary": parsed.get("executive_summary", ""),
            "shipped": parsed.get("shipped", ""),
            "slipped": parsed.get("slipped", ""),
            "blocked": parsed.get("blocked", ""),
            "next_priorities": parsed.get("next_priorities", ""),
        }

    def _resynthesize_section_with_openai(
        self,
        section_key: str,
        current_content: str,
        shipped: List[Dict[str, Any]],
        slipped: List[Dict[str, Any]],
        blocked: List[Dict[str, Any]],
        tone: str,
        custom_instruction: Optional[str]
    ) -> str:
        prompt = (
            f"You are refining the '{section_key}' section of an engineering weekly report. "
            f"Current content:\n{current_content}\n\n"
            f"Target tone: {tone}.\n"
            f"User instruction: {custom_instruction or 'Improve clarity, impact, and concise formatting'}.\n"
            "Return ONLY the updated markdown text for this section."
        )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        body = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a senior technical writer. Return only the revised section markdown."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.4,
        }
        resp = httpx.post("https://api.openai.com/v1/chat/completions", headers=headers, json=body, timeout=20.0)
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()


synthesis_service = SynthesisService()
