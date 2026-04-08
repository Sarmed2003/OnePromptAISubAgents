"""Template system for domain-specific prompt overlays.

Base prompts in prompts/ are domain-agnostic. Templates in templates/<name>/
add domain-specific examples and conventions that get appended to the base.

Usage:
    loader = TemplateLoader("my-domain")
    prompt = loader.load_prompt("planner")  # base + overlay from templates/my-domain/planner.md
"""

from __future__ import annotations

import logging
from pathlib import Path

logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"
TEMPLATES_DIR = Path(__file__).parent.parent / "templates"


class TemplateLoader:
    """Loads base prompts and optionally merges with a template overlay."""

    def __init__(self, template_name: str | None = None):
        self.template_name = template_name or None
        if self.template_name:
            overlay_dir = TEMPLATES_DIR / self.template_name
            if not overlay_dir.is_dir():
                logger.warning(
                    "Template '%s' not found at %s — using base prompts only",
                    self.template_name, overlay_dir,
                )
                self.template_name = None

    def load_prompt(self, role: str) -> str:
        """Load the base prompt for *role*, appending the template overlay if active."""
        base_path = PROMPTS_DIR / f"{role}.md"
        if not base_path.exists():
            logger.warning("Base prompt not found: %s", base_path)
            return ""

        base = base_path.read_text(encoding="utf-8")

        if not self.template_name:
            return base

        overlay_path = TEMPLATES_DIR / self.template_name / f"{role}.md"
        if not overlay_path.exists():
            return base

        overlay = overlay_path.read_text(encoding="utf-8")
        return (
            f"{base}\n\n"
            f"---\n\n"
            f"# Template: {self.template_name}\n\n"
            f"{overlay}"
        )

    def list_available_templates(self) -> list[str]:
        """Return names of all template directories."""
        if not TEMPLATES_DIR.is_dir():
            return []
        return [
            d.name for d in TEMPLATES_DIR.iterdir()
            if d.is_dir() and not d.name.startswith("_")
        ]
