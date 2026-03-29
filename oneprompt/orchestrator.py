"""Main orchestrator: coordinates planning, execution, merging, and reconciliation."""

from __future__ import annotations

import asyncio
import json
import logging
import sys
import time
from pathlib import Path
from typing import Any, Callable

from .config import AppConfig
from .db import create_database
from .git_utils import GitRepo
from .llm_client import LLMClient
from .merge_queue import MergeQueue
from .planner import Planner, SubPlanner
from .reconciler import Reconciler
from .sandbox import LocalSandbox
from .task_queue import TaskQueue
from .types import (
    AgentState,
    AgentRole,
    Handoff,
    NdjsonEvent,
    RunMetrics,
    Task,
    TaskStatus,
)
from .worker import Worker

logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


def _load_prompt(name: str) -> str:
    path = PROMPTS_DIR / f"{name}.md"
    return path.read_text(encoding="utf-8") if path.exists() else ""


class Orchestrator:
    """Coordinates the full lifecycle: plan → dispatch → execute → merge → reconcile."""

    def __init__(self, config: AppConfig, on_event: Callable[[NdjsonEvent], None] | None = None):
        self.config = config
        self.on_event = on_event or self._default_event_handler

        self.llm = LLMClient(config.llm)
        self.git = GitRepo(config.git, config.orchestrator.target_repo_path)
        self.db = create_database(
            backend=config.database.backend,
            region=config.aws.region,
            table_prefix=config.aws.dynamodb_table_prefix,
            uri=config.database.mongodb_uri,
            db_name=config.database.mongodb_db,
        )
        self.task_queue = TaskQueue(db=self.db)
        self.merge_queue = MergeQueue(self.git, config.worker.merge_strategy)
        self.planner = Planner(self.llm)
        self.subplanner = SubPlanner(self.llm)
        self.reconciler = Reconciler(self.llm, self.git)
        self.sandbox = LocalSandbox(config.orchestrator.target_repo_path, config.git)
        self.metrics = RunMetrics()
        self._worker_prompt = _load_prompt("worker")
        self._agents: list[AgentState] = []
        self._stop = False

    def _emit(self, event_type: str, data: dict[str, Any] | None = None) -> None:
        event = NdjsonEvent(type=event_type, data=data or {})
        self.on_event(event)
        self.db.log_event(event_type, data or {})

    def _default_event_handler(self, event: NdjsonEvent) -> None:
        line = json.dumps(event.to_dict())
        sys.stdout.write(line + "\n")
        sys.stdout.flush()

    async def run(self, spec: str) -> RunMetrics:
        """Execute the full orchestration loop for a given project spec."""
        logger.info("=== OnePromptAI Run Starting ===")
        self._emit("run_start", {"spec_preview": spec[:200]})

        self.db.connect()

        if not self.git.clone_or_pull():
            self._emit("error", {"message": "Failed to clone/pull target repo"})
            raise RuntimeError("Cannot access target repository")

        file_tree = self.git.get_file_tree()
        self._emit("repo_ready", {"files": file_tree[:500]})

        # Phase 1: Planning
        self._emit("phase", {"name": "planning"})
        tasks = await self.planner.plan(spec, file_tree)

        if not tasks:
            self._emit("error", {"message": "Planner returned no tasks"})
            return self.metrics

        # Optionally decompose large tasks via subplanner
        all_tasks: list[Task] = []
        for task in tasks:
            if len(task.scope) > 5 or task.priority <= 2:
                file_contents = self.git.read_files_in_scope(task.scope)
                subtasks = await self.subplanner.decompose(task, file_tree, file_contents)
                if subtasks:
                    all_tasks.extend(subtasks)
                    self._emit("subplan", {
                        "parent": task.id,
                        "subtasks": [t.id for t in subtasks],
                    })
                    continue
            all_tasks.append(task)

        self.task_queue.add_tasks(all_tasks)
        self.metrics.total_tasks = self.task_queue.total_count
        self._emit("tasks_queued", {"count": self.metrics.total_tasks})

        # Phase 2: Execution
        self._emit("phase", {"name": "execution"})
        worker_sem = asyncio.Semaphore(self.config.worker.max_workers)

        async def run_worker(task: Task) -> None:
            async with worker_sem:
                worker_id = f"w-{task.id}"
                worker = Worker(worker_id, self.llm, self.git, self._worker_prompt)
                self._agents.append(worker.state)
                self.metrics.agents_active += 1

                self._emit("worker_start", {"worker": worker_id, "task": task.id})

                handoff = await worker.execute(task)
                self.metrics.agents_active -= 1
                self.metrics.total_tokens = self.llm.total_tokens

                if handoff.status in ("complete", "partial"):
                    self.task_queue.complete_task(task.id, handoff)
                    self.metrics.completed_tasks += 1
                    self.merge_queue.enqueue(task)
                else:
                    self.task_queue.fail_task(task.id, handoff)
                    self.metrics.failed_tasks += 1

                self._emit("worker_done", {
                    "worker": worker_id,
                    "task": task.id,
                    "status": handoff.status,
                    "summary": handoff.summary[:200],
                })

        # Dispatch workers in batches by priority
        worker_tasks: list[asyncio.Task] = []
        while not self.task_queue.is_all_done() and not self._stop:
            next_task = self.task_queue.get_next()
            if next_task is None:
                if worker_tasks:
                    await asyncio.gather(*worker_tasks)
                    worker_tasks.clear()

                    # Process merge queue between batches
                    merge_results = self.merge_queue.process_all()
                    for mr in merge_results:
                        self.metrics.total_commits += 1 if mr.success else 0
                        self.metrics.merge_conflicts += 1 if mr.conflict else 0
                        self._emit("merge", {
                            "task": mr.task_id,
                            "branch": mr.branch,
                            "success": mr.success,
                            "conflict": mr.conflict,
                        })

                    if self.task_queue.is_all_done():
                        break

                    # Iterative replanning with handoff feedback
                    handoffs = self.task_queue.get_completed_handoffs()
                    if handoffs:
                        file_tree = self.git.get_file_tree()
                        context = json.dumps(handoffs, indent=2)
                        new_tasks = await self.planner.plan(spec, file_tree, context)
                        if new_tasks:
                            self.task_queue.add_tasks(new_tasks)
                            self.metrics.total_tasks = self.task_queue.total_count
                            self._emit("replan", {"new_tasks": len(new_tasks)})
                        else:
                            break
                else:
                    break
            else:
                coro = run_worker(next_task)
                worker_tasks.append(asyncio.create_task(coro))

        if worker_tasks:
            await asyncio.gather(*worker_tasks)
            self.merge_queue.process_all()

        # Phase 3: Reconciliation
        if self.config.orchestrator.finalization_enabled:
            self._emit("phase", {"name": "reconciliation"})
            for attempt in range(self.config.orchestrator.finalization_max_attempts):
                fix_tasks = await self.reconciler.sweep()
                if not fix_tasks:
                    self._emit("reconciler_green", {"attempt": attempt + 1})
                    break

                self.task_queue.add_tasks(fix_tasks)
                fix_workers = [
                    asyncio.create_task(run_worker(ft)) for ft in fix_tasks
                ]
                await asyncio.gather(*fix_workers)
                self.merge_queue.process_all()

        # Cleanup
        self.sandbox.cleanup_all()
        self._emit("run_complete", {
            "total_tasks": self.metrics.total_tasks,
            "completed": self.metrics.completed_tasks,
            "failed": self.metrics.failed_tasks,
            "commits": self.metrics.total_commits,
            "tokens": self.metrics.total_tokens,
            "elapsed": self.metrics.elapsed_seconds,
        })

        self.db.save_run_metrics({
            "run_id": self.metrics.run_id,
            "started_at": self.metrics.started_at,
            "completed_at": time.time(),
            **self.metrics.__dict__,
        })

        logger.info("=== OnePromptAI Run Complete ===")
        return self.metrics

    def stop(self) -> None:
        self._stop = True
        logger.info("Stop requested — finishing active workers...")
