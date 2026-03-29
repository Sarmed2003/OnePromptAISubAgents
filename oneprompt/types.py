"""Shared types and data models for the orchestration system."""

from __future__ import annotations

import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETE = "complete"
    PARTIAL = "partial"
    BLOCKED = "blocked"
    FAILED = "failed"


class AgentRole(str, Enum):
    PLANNER = "planner"
    SUBPLANNER = "subplanner"
    WORKER = "worker"
    RECONCILER = "reconciler"


class MergeStrategy(str, Enum):
    FAST_FORWARD = "fast-forward"
    REBASE = "rebase"
    MERGE_COMMIT = "merge-commit"


@dataclass
class Task:
    id: str
    description: str
    scope: list[str] = field(default_factory=list)
    acceptance: str = ""
    branch: str = ""
    priority: int = 5
    status: TaskStatus = TaskStatus.PENDING
    parent_id: str | None = None
    created_at: float = field(default_factory=time.time)
    started_at: float | None = None
    completed_at: float | None = None
    worker_id: str | None = None
    handoff: Handoff | None = None

    def to_dict(self) -> dict[str, Any]:
        d = {
            "id": self.id,
            "description": self.description,
            "scope": self.scope,
            "acceptance": self.acceptance,
            "branch": self.branch,
            "priority": self.priority,
            "status": self.status.value,
            "parent_id": self.parent_id,
            "created_at": self.created_at,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "worker_id": self.worker_id,
        }
        if self.handoff:
            d["handoff"] = self.handoff.to_dict()
        return d

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> Task:
        handoff_data = d.pop("handoff", None)
        d["status"] = TaskStatus(d.get("status", "pending"))
        task = cls(**{k: v for k, v in d.items() if k in cls.__dataclass_fields__})
        if handoff_data:
            task.handoff = Handoff.from_dict(handoff_data)
        return task


@dataclass
class Handoff:
    status: str = "complete"
    summary: str = ""
    files_changed: list[str] = field(default_factory=list)
    concerns: list[str] = field(default_factory=list)
    suggestions: list[str] = field(default_factory=list)
    committed: bool = False

    def to_dict(self) -> dict[str, Any]:
        return {
            "status": self.status,
            "summary": self.summary,
            "files_changed": self.files_changed,
            "concerns": self.concerns,
            "suggestions": self.suggestions,
            "committed": self.committed,
        }

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> Handoff:
        return cls(**{k: v for k, v in d.items() if k in cls.__dataclass_fields__})


@dataclass
class AgentState:
    agent_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    role: AgentRole = AgentRole.WORKER
    status: str = "idle"
    current_task_id: str | None = None
    started_at: float = field(default_factory=time.time)
    tokens_used: int = 0
    commits: int = 0


@dataclass
class RunMetrics:
    run_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    started_at: float = field(default_factory=time.time)
    total_tasks: int = 0
    completed_tasks: int = 0
    failed_tasks: int = 0
    total_commits: int = 0
    total_tokens: int = 0
    merge_conflicts: int = 0
    agents_active: int = 0

    @property
    def elapsed_seconds(self) -> float:
        return time.time() - self.started_at

    @property
    def success_rate(self) -> float:
        done = self.completed_tasks + self.failed_tasks
        if done == 0:
            return 0.0
        return self.completed_tasks / done * 100

    @property
    def commits_per_hour(self) -> float:
        elapsed_h = self.elapsed_seconds / 3600
        if elapsed_h < 0.001:
            return 0.0
        return self.total_commits / elapsed_h


@dataclass
class NdjsonEvent:
    """Event format for dashboard communication (NDJSON protocol)."""
    type: str
    data: dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)

    def to_dict(self) -> dict[str, Any]:
        return {"type": self.type, "data": self.data, "ts": self.timestamp}
