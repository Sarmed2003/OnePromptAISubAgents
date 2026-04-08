"""Priority-based task queue with heapq scheduling and optional DB persistence."""

from __future__ import annotations

import heapq
import json
import logging
import time
from typing import Any

from .types import Task, TaskStatus

logger = logging.getLogger(__name__)


class TaskQueue:
    """In-memory priority task queue with O(log n) dequeue via heapq."""

    def __init__(self, db=None):
        self.db = db
        self._tasks: dict[str, Task] = {}
        self._heap: list[tuple[int, float, str]] = []  # (priority, created_at, task_id)
        self._counts: dict[TaskStatus, int] = {s: 0 for s in TaskStatus}

    @property
    def pending_count(self) -> int:
        return self._counts[TaskStatus.PENDING]

    @property
    def in_progress_count(self) -> int:
        return self._counts[TaskStatus.IN_PROGRESS]

    @property
    def completed_count(self) -> int:
        return self._counts[TaskStatus.COMPLETE]

    @property
    def failed_count(self) -> int:
        return self._counts[TaskStatus.FAILED]

    @property
    def total_count(self) -> int:
        return len(self._tasks)

    def _evict_task_id(self, task_id: str) -> None:
        """Remove an existing task id before re-queuing the same id (keeps _counts accurate)."""
        old = self._tasks.pop(task_id, None)
        if old is None:
            return
        st = old.status
        if st in self._counts and self._counts[st] > 0:
            self._counts[st] -= 1
        logger.warning(
            "Replacing queued task id %s (was %s) — duplicate ids break metrics without eviction",
            task_id,
            st.value,
        )

    def _transition(self, task: Task, new_status: TaskStatus) -> None:
        old = task.status
        if old in self._counts:
            self._counts[old] -= 1
        task.status = new_status
        self._counts[new_status] = self._counts.get(new_status, 0) + 1

    def add_task(self, task: Task) -> None:
        if task.id in self._tasks:
            self._evict_task_id(task.id)
        self._tasks[task.id] = task
        self._counts[task.status] = self._counts.get(task.status, 0) + 1
        if task.status == TaskStatus.PENDING:
            heapq.heappush(self._heap, (task.priority, task.created_at, task.id))
        self._persist_task(task)
        logger.info("Task queued: %s (priority=%d)", task.id, task.priority)

    def add_tasks(self, tasks: list[Task]) -> None:
        for task in tasks:
            if task.id in self._tasks:
                self._evict_task_id(task.id)
            self._tasks[task.id] = task
            self._counts[task.status] = self._counts.get(task.status, 0) + 1
            if task.status == TaskStatus.PENDING:
                heapq.heappush(self._heap, (task.priority, task.created_at, task.id))
        self._persist_tasks_batch(tasks)
        logger.info("Queued %d tasks", len(tasks))

    def get_next(self) -> Task | None:
        """Return the highest-priority pending task in O(log n)."""
        while self._heap:
            _prio, _ts, task_id = heapq.heappop(self._heap)
            task = self._tasks.get(task_id)
            if task and task.status == TaskStatus.PENDING:
                self._transition(task, TaskStatus.IN_PROGRESS)
                task.started_at = time.time()
                self._persist_task(task)
                return task
        return None

    def complete_task(self, task_id: str, handoff: Any = None) -> None:
        task = self._tasks.get(task_id)
        if not task:
            logger.warning("Cannot complete unknown task: %s", task_id)
            return
        self._transition(task, TaskStatus.COMPLETE)
        task.completed_at = time.time()
        task.handoff = handoff
        self._persist_task(task)
        logger.info("Task completed: %s", task_id)

    def fail_task(self, task_id: str, handoff: Any = None) -> None:
        task = self._tasks.get(task_id)
        if not task:
            return
        self._transition(task, TaskStatus.FAILED)
        task.completed_at = time.time()
        task.handoff = handoff
        self._persist_task(task)
        logger.warning("Task failed: %s", task_id)

    def get_task(self, task_id: str) -> Task | None:
        return self._tasks.get(task_id)

    def get_all_tasks(self) -> list[Task]:
        return list(self._tasks.values())

    def get_completed_handoffs(self) -> list[dict[str, Any]]:
        """Return handoff data from terminal tasks (for diagnostics / legacy callers)."""
        results = []
        for task in self._tasks.values():
            if task.status in (TaskStatus.COMPLETE, TaskStatus.FAILED) and task.handoff:
                results.append({
                    "task_id": task.id,
                    "queue_status": task.status.value,
                    "status": task.handoff.status,
                    "summary": task.handoff.summary,
                    "concerns": task.handoff.concerns,
                    "suggestions": task.handoff.suggestions,
                })
        return results

    def get_replan_context(self, *, max_failed: int = 14) -> str:
        """Structured JSON for replanning: separates successes from failures (capped)."""
        completed: list[dict[str, Any]] = []
        failed: list[dict[str, Any]] = []
        for task in self._tasks.values():
            if not task.handoff:
                continue
            entry = {
                "task_id": task.id,
                "handoff_status": task.handoff.status,
                "summary": (task.handoff.summary or "")[:800],
                "concerns": list(task.handoff.concerns or [])[:6],
            }
            if task.status == TaskStatus.COMPLETE:
                completed.append(entry)
            elif task.status == TaskStatus.FAILED:
                failed.append(entry)
        failed = failed[:max(0, max_failed)]
        if not completed and not failed:
            return None
        payload = {
            "completed_tasks": completed,
            "failed_tasks": failed,
            "hint": "Prefer follow-up tasks that address failed_tasks without duplicating completed work.",
        }
        return json.dumps(payload, indent=2)

    def is_all_done(self) -> bool:
        if not self._tasks:
            return False
        return (self._counts[TaskStatus.PENDING] + self._counts[TaskStatus.IN_PROGRESS]) == 0

    def _persist_task(self, task: Task) -> None:
        if self.db is not None:
            try:
                self.db.upsert_task(task.to_dict())
            except Exception as e:
                logger.debug("DB persist failed (non-fatal): %s", e)

    def _persist_tasks_batch(self, tasks: list[Task]) -> None:
        if self.db is not None:
            try:
                self.db.upsert_tasks_batch([t.to_dict() for t in tasks])
            except Exception:
                for task in tasks:
                    self._persist_task(task)
