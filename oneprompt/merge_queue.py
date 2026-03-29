"""Serial merge queue that integrates worker branches into main."""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Any

from .git_utils import GitRepo
from .types import Task

logger = logging.getLogger(__name__)


@dataclass
class MergeResult:
    task_id: str
    branch: str
    success: bool
    conflict: bool = False
    error: str = ""
    merged_at: float = field(default_factory=time.time)


class MergeQueue:
    """Processes completed worker branches serially to avoid conflicts."""

    def __init__(self, git: GitRepo, strategy: str = "merge-commit"):
        self.git = git
        self.strategy = strategy
        self._queue: list[Task] = []
        self._results: list[MergeResult] = []
        self.total_merged = 0
        self.total_conflicts = 0

    def enqueue(self, task: Task) -> None:
        self._queue.append(task)
        logger.info("Merge enqueued: %s → %s", task.id, task.branch)

    def process_next(self) -> MergeResult | None:
        """Process the next branch in the queue. Returns None if empty."""
        if not self._queue:
            return None

        task = self._queue.pop(0)
        logger.info("Merging branch: %s", task.branch)

        result_data = self.git.merge_branch(task.branch, self.strategy)

        result = MergeResult(
            task_id=task.id,
            branch=task.branch,
            success=result_data["success"],
            conflict=result_data.get("conflict", False),
            error=result_data.get("error", ""),
        )

        self._results.append(result)

        if result.success:
            self.total_merged += 1
            logger.info("Merged successfully: %s", task.branch)
        elif result.conflict:
            self.total_conflicts += 1
            logger.warning("Merge conflict: %s — %s", task.branch, result.error)
        else:
            logger.error("Merge failed: %s — %s", task.branch, result.error)

        return result

    def process_all(self) -> list[MergeResult]:
        """Process all pending merges serially."""
        results = []
        while self._queue:
            r = self.process_next()
            if r:
                results.append(r)
        return results

    @property
    def pending_count(self) -> int:
        return len(self._queue)

    @property
    def success_rate(self) -> float:
        total = self.total_merged + self.total_conflicts
        if total == 0:
            return 100.0
        return self.total_merged / total * 100
