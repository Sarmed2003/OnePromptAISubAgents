"""Priority-based task queue with MongoDB persistence."""

from __future__ import annotations

import logging
import time
from typing import Any

from .types import Task, TaskStatus

logger = logging.getLogger(__name__)


class TaskQueue:
    """In-memory priority task queue backed by MongoDB for persistence."""

    def __init__(self, db=None):
        self.db = db
        self._tasks: dict[str, Task] = {}

    @property
    def pending_count(self) -> int:
        return sum(1 for t in self._tasks.values() if t.status == TaskStatus.PENDING)

    @property
    def in_progress_count(self) -> int:
        return sum(1 for t in self._tasks.values() if t.status == TaskStatus.IN_PROGRESS)

    @property
    def completed_count(self) -> int:
        return sum(1 for t in self._tasks.values() if t.status == TaskStatus.COMPLETE)

    @property
    def failed_count(self) -> int:
        return sum(1 for t in self._tasks.values() if t.status == TaskStatus.FAILED)

    @property
    def total_count(self) -> int:
        return len(self._tasks)

    def add_task(self, task: Task) -> None:
        self._tasks[task.id] = task
        self._persist_task(task)
        logger.info("Task queued: %s (priority=%d)", task.id, task.priority)

    def add_tasks(self, tasks: list[Task]) -> None:
        for task in tasks:
            self.add_task(task)

    def get_next(self) -> Task | None:
        """Return the highest-priority pending task (lowest priority number)."""
        pending = [t for t in self._tasks.values() if t.status == TaskStatus.PENDING]
        if not pending:
            return None
        pending.sort(key=lambda t: (t.priority, t.created_at))
        task = pending[0]
        task.status = TaskStatus.IN_PROGRESS
        task.started_at = time.time()
        self._persist_task(task)
        return task

    def complete_task(self, task_id: str, handoff: Any = None) -> None:
        task = self._tasks.get(task_id)
        if not task:
            logger.warning("Cannot complete unknown task: %s", task_id)
            return
        task.status = TaskStatus.COMPLETE
        task.completed_at = time.time()
        task.handoff = handoff
        self._persist_task(task)
        logger.info("Task completed: %s", task_id)

    def fail_task(self, task_id: str, handoff: Any = None) -> None:
        task = self._tasks.get(task_id)
        if not task:
            return
        task.status = TaskStatus.FAILED
        task.completed_at = time.time()
        task.handoff = handoff
        self._persist_task(task)
        logger.warning("Task failed: %s", task_id)

    def get_task(self, task_id: str) -> Task | None:
        return self._tasks.get(task_id)

    def get_all_tasks(self) -> list[Task]:
        return list(self._tasks.values())

    def get_completed_handoffs(self) -> list[dict[str, Any]]:
        """Return handoff data from all completed tasks for planner feedback."""
        results = []
        for task in self._tasks.values():
            if task.status in (TaskStatus.COMPLETE, TaskStatus.FAILED) and task.handoff:
                results.append({
                    "task_id": task.id,
                    "status": task.handoff.status,
                    "summary": task.handoff.summary,
                    "concerns": task.handoff.concerns,
                    "suggestions": task.handoff.suggestions,
                })
        return results

    def is_all_done(self) -> bool:
        return all(
            t.status in (TaskStatus.COMPLETE, TaskStatus.FAILED)
            for t in self._tasks.values()
        ) and len(self._tasks) > 0

    def _persist_task(self, task: Task) -> None:
        if self.db is not None:
            try:
                self.db.upsert_task(task.to_dict())
            except Exception as e:
                logger.debug("MongoDB persist failed (non-fatal): %s", e)
