"""Planner and subplanner: decompose a project spec into granular tasks."""

from __future__ import annotations

import logging
import os
import re
from typing import Any

from .llm_client import LLMClient
from .templates import TemplateLoader
from .types import Task, TaskStatus
from .vault import VaultReader

logger = logging.getLogger(__name__)

_TASK_ID_RE = re.compile(r"^[a-zA-Z0-9._-]{1,120}$")


def _parse_tasks(raw_tasks: list[dict[str, Any]], parent_id: str | None = None) -> list[Task]:
    """Build Task objects from planner JSON with validation, dedupe, and caps."""
    max_tasks = max(1, int(os.getenv("MAX_PLANNER_TASKS", "48")))
    seen: set[str] = set()
    tasks: list[Task] = []
    for t in raw_tasks:
        if not isinstance(t, dict):
            continue
        tid = str(t.get("id") or "").strip()
        if not tid or tid in seen:
            if tid in seen:
                logger.warning("Skipping duplicate planner task id: %s", tid)
            continue
        if not _TASK_ID_RE.match(tid):
            logger.warning("Skipping task with invalid id (use alphanumeric, dot, underscore, hyphen): %r", tid)
            continue
        desc = t.get("description")
        if desc is None or not str(desc).strip():
            logger.warning("Skipping task %s: empty description", tid)
            continue
        scope = t.get("scope", [])
        if scope is None:
            scope = []
        if not isinstance(scope, list):
            scope = [str(scope)]
        else:
            scope = [str(x) for x in scope if str(x).strip()]
        branch = (t.get("branch") or "").strip() or f"worker/{tid}"
        try:
            prio = int(t.get("priority", 5))
        except (TypeError, ValueError):
            prio = 5
        prio = max(1, min(10, prio))
        task = Task(
            id=tid,
            description=str(desc).strip(),
            scope=scope,
            acceptance=str(t.get("acceptance", "") or "").strip(),
            branch=branch,
            priority=prio,
            status=TaskStatus.PENDING,
            parent_id=parent_id,
        )
        tasks.append(task)
        seen.add(tid)
        if len(tasks) >= max_tasks:
            logger.warning(
                "Planner output capped at MAX_PLANNER_TASKS=%d (%d raw rows)",
                max_tasks,
                len(raw_tasks),
            )
            break
    return tasks


class Planner:
    """Root planner: reads the project spec and decomposes into top-level tasks."""

    def __init__(
        self,
        llm: LLMClient,
        template_loader: TemplateLoader | None = None,
        vault: VaultReader | None = None,
    ):
        self.llm = llm
        if template_loader:
            self.system_prompt = template_loader.load_prompt("planner")
        else:
            self.system_prompt = TemplateLoader().load_prompt("planner")
        self.vault = vault
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

        if self.vault:
            vault_context = self.vault.load_for_planner()
            if vault_context:
                context = f"{vault_context}\n\n{context}"

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

    def __init__(self, llm: LLMClient, template_loader: TemplateLoader | None = None):
        self.llm = llm
        if template_loader:
            self.system_prompt = template_loader.load_prompt("subplanner")
        else:
            self.system_prompt = TemplateLoader().load_prompt("subplanner")

    async def decompose(
        self,
        parent_task: Task,
        file_tree: str,
        file_contents: dict[str, str] | None = None,
    ) -> list[Task]:
        """Break a parent task into subtasks. Returns empty if task is atomic."""
        scope_info = ""
        if file_contents:
            scope_info = "\n".join(
                f"\n### {path}\n```\n{content[:2000]}\n```\n"
                for path, content in file_contents.items()
            )

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
