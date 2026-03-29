"""Reconciler: monitors build health and generates fix tasks."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from .git_utils import GitRepo
from .llm_client import LLMClient
from .types import Task, TaskStatus

logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


class Reconciler:
    """Periodically checks main branch health and emits targeted fix tasks."""

    def __init__(self, llm: LLMClient, git: GitRepo):
        self.llm = llm
        self.git = git
        prompt_path = PROMPTS_DIR / "reconciler.md"
        self.system_prompt = (
            prompt_path.read_text(encoding="utf-8") if prompt_path.exists() else ""
        )
        self.sweep_count = 0
        self.total_fixes_emitted = 0

    async def sweep(self) -> list[Task]:
        """Run a health check and return fix tasks if anything is broken."""
        self.sweep_count += 1
        logger.info("Reconciler sweep #%d", self.sweep_count)

        self.git.checkout_main()

        build_code, build_output = self.git.run_build()
        test_code, test_output = self.git.run_tests()
        recent = self.git.get_recent_commits(20)

        if build_code == 0 and test_code == 0:
            logger.info("Reconciler sweep #%d: all green", self.sweep_count)
            return []

        logger.warning(
            "Reconciler sweep #%d: issues found (build=%d, test=%d)",
            self.sweep_count, build_code, test_code,
        )

        try:
            fix_data = await self.llm.run_reconciler(
                self.system_prompt,
                build_output[:4000],
                test_output[:4000],
                recent,
            )
        except Exception as e:
            logger.error("Reconciler LLM call failed: %s", e)
            return []

        tasks = []
        for fd in fix_data[:5]:
            task = Task(
                id=fd.get("id", f"fix-{self.sweep_count:03d}"),
                description=fd.get("description", "Fix build/test failure"),
                scope=fd.get("scope", []),
                acceptance=fd.get("acceptance", "Build and tests pass"),
                branch=fd.get("branch", f"worker/fix-{self.sweep_count:03d}"),
                priority=fd.get("priority", 1),
                status=TaskStatus.PENDING,
            )
            tasks.append(task)

        self.total_fixes_emitted += len(tasks)
        logger.info("Reconciler emitted %d fix tasks", len(tasks))
        return tasks
