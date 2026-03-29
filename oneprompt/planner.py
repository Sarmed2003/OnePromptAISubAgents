"""Planner and subplanner: decompose a project spec into granular tasks."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from .llm_client import LLMClient
from .types import Task, TaskStatus

logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


def _load_prompt(name: str) -> str:
    path = PROMPTS_DIR / f"{name}.md"
    if path.exists():
        return path.read_text(encoding="utf-8")
    logger.warning("Prompt file not found: %s", path)
    return ""


def _parse_tasks(raw_tasks: list[dict[str, Any]], parent_id: str | None = None) -> list[Task]:
    tasks = []
    for t in raw_tasks:
        branch = (t.get("branch") or "").strip() or f"worker/{t['id']}"
        task = Task(
            id=t["id"],
            description=t["description"],
            scope=t.get("scope", []),
            acceptance=t.get("acceptance", ""),
            branch=branch,
            priority=t.get("priority", 5),
            status=TaskStatus.PENDING,
            parent_id=parent_id,
        )
        tasks.append(task)
    return tasks


class Planner:
    """Root planner: reads the project spec and decomposes into top-level tasks."""

    def __init__(self, llm: LLMClient):
        self.llm = llm
        self.system_prompt = _load_prompt("planner")
        self.scratchpad = ""
        self.iteration = 0

    async def plan(
        self,
        spec: str,
        file_tree: str,
        handoff_context: str = "",
    ) -> list[Task]:
        """Decompose the spec into tasks. Can be called iteratively."""
        self.iteration += 1
        context = handoff_context or "Initial planning — no prior work completed."
        if self.scratchpad:
            context = f"Previous scratchpad:\n{self.scratchpad}\n\n{context}"

        result = await self.llm.plan_tasks(
            self.system_prompt, spec, file_tree, context
        )

        if isinstance(result, list):
            raw_tasks = result
            self.scratchpad = ""
        else:
            self.scratchpad = result.get("scratchpad", "")
            raw_tasks = result.get("tasks", [])

        if not raw_tasks:
            logger.info("Planner returned no tasks (iteration %d)", self.iteration)
            return []

        tasks = _parse_tasks(raw_tasks)
        logger.info(
            "Planner iteration %d: %d tasks generated", self.iteration, len(tasks)
        )
        return tasks


class SubPlanner:
    """Subplanner: further decomposes a parent task into smaller subtasks."""

    def __init__(self, llm: LLMClient):
        self.llm = llm
        self.system_prompt = _load_prompt("subplanner")

    async def decompose(
        self,
        parent_task: Task,
        file_tree: str,
        file_contents: dict[str, str] | None = None,
    ) -> list[Task]:
        """Break a parent task into subtasks. Returns empty if task is atomic."""
        scope_info = ""
        if file_contents:
            for path, content in file_contents.items():
                scope_info += f"\n### {path}\n```\n{content[:2000]}\n```\n"

        user_msg = f"""## Parent Task
- **ID**: {parent_task.id}
- **Description**: {parent_task.description}
- **Scope**: {', '.join(parent_task.scope)}
- **Acceptance**: {parent_task.acceptance}
- **Priority**: {parent_task.priority}

## File Tree
{file_tree}

## Files In Scope
{scope_info if scope_info else 'No existing files — create from scratch.'}

Decompose this task or return empty tasks if it's atomic."""

        result = await self.llm.generate_json(self.system_prompt, user_msg)

        if isinstance(result, list):
            raw_tasks = result
        else:
            raw_tasks = result.get("tasks", [])
        if not raw_tasks:
            logger.info("Task %s is atomic — no decomposition", parent_task.id)
            return []

        tasks = _parse_tasks(raw_tasks, parent_id=parent_task.id)
        logger.info(
            "Subplanner: %s → %d subtasks", parent_task.id, len(tasks)
        )
        return tasks
