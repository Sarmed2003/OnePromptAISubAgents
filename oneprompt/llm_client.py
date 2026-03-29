"""Gemini API client for all LLM interactions."""

from __future__ import annotations

import json
import logging
import time
from typing import Any

from google import genai
from google.genai import types

from .config import LLMConfig

logger = logging.getLogger(__name__)


class LLMClient:
    """Wrapper around the Google Gemini API for structured agent communication."""

    def __init__(self, config: LLMConfig):
        self.config = config
        self.client = genai.Client(api_key=config.api_key)
        self.total_tokens = 0

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        response_format: str = "text",
    ) -> str:
        """Send a prompt to Gemini and return the response text."""
        try:
            response = self.client.models.generate_content(
                model=self.config.model,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=self.config.temperature,
                    max_output_tokens=self.config.max_tokens,
                    response_mime_type=(
                        "application/json" if response_format == "json" else "text/plain"
                    ),
                ),
            )

            if response.usage_metadata:
                self.total_tokens += (
                    response.usage_metadata.total_token_count or 0
                )

            return response.text or ""

        except Exception as e:
            logger.error("Gemini API call failed: %s", e)
            raise

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> dict[str, Any] | list[Any]:
        """Generate a response and parse it as JSON."""
        raw = await self.generate(system_prompt, user_prompt, response_format="json")
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]
            raw = raw.strip()
        return json.loads(raw)

    async def plan_tasks(
        self,
        system_prompt: str,
        spec: str,
        file_tree: str,
        context: str = "",
    ) -> dict[str, Any]:
        """Have the planner decompose a spec into tasks."""
        user_msg = f"""## Project Specification
{spec}

## Current File Tree
{file_tree}

## Additional Context
{context if context else 'Initial planning — no prior work.'}

Respond with a JSON object containing "scratchpad" (string) and "tasks" (array of task objects).
Each task: {{"id": "task-NNN", "description": "...", "scope": ["file1.py"], "acceptance": "...", "branch": "worker/task-NNN-slug", "priority": N}}"""

        return await self.generate_json(system_prompt, user_msg)

    async def execute_worker_task(
        self,
        system_prompt: str,
        task: dict[str, Any],
        file_contents: dict[str, str],
    ) -> dict[str, Any]:
        """Have a worker generate code for a task and return a handoff."""
        files_section = ""
        for path, content in file_contents.items():
            files_section += f"\n### {path}\n```\n{content}\n```\n"

        user_msg = f"""## Your Task
- **ID**: {task['id']}
- **Description**: {task['description']}
- **Scope**: {', '.join(task.get('scope', []))}
- **Acceptance Criteria**: {task.get('acceptance', 'N/A')}

## Current File Contents
{files_section if files_section else 'No existing files in scope — create from scratch.'}

Generate the complete implementation. Respond with a JSON object:
{{
  "files": {{
    "path/to/file.py": "complete file content..."
  }},
  "handoff": {{
    "status": "complete|partial|blocked|failed",
    "summary": "What you did...",
    "filesChanged": ["path/to/file.py"],
    "concerns": ["any concerns"],
    "suggestions": ["follow-up ideas"]
  }}
}}"""

        return await self.generate_json(system_prompt, user_msg)

    async def run_reconciler(
        self,
        system_prompt: str,
        build_output: str,
        test_output: str,
        recent_commits: str,
    ) -> list[dict[str, Any]]:
        """Run the reconciler to analyze build health and produce fix tasks."""
        user_msg = f"""## Build Output
{build_output}

## Test Output
{test_output}

## Recent Commits
{recent_commits}

Analyze the outputs. If everything passes, respond with an empty JSON array: []
If there are errors, respond with a JSON array of fix tasks."""

        result = await self.generate_json(system_prompt, user_msg)
        if isinstance(result, list):
            return result
        return result.get("tasks", [])
