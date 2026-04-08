"""Worker agent: executes a single task in an isolated branch."""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

from .git_utils import GitRepo
from .llm_client import LLMClient
from .types import AgentState, AgentRole, Handoff, Task, TaskStatus

logger = logging.getLogger(__name__)


def _normalize_files(raw: Any) -> dict[str, str]:
    """Coerce LLM JSON into path -> content; models vary (files vs Files, dict vs list)."""
    if raw is None:
        return {}
    if isinstance(raw, dict):
        out: dict[str, str] = {}
        for k, v in raw.items():
            if isinstance(v, str):
                out[str(k)] = v
        return out
    if isinstance(raw, list):
        out = {}
        for item in raw:
            if not isinstance(item, dict):
                continue
            path = item.get("path") or item.get("file") or item.get("filepath")
            content = item.get("content")
            if path and isinstance(content, str):
                out[str(path)] = content
        return out
    return {}


def _filter_to_scope(files: dict[str, str], scope: list[str]) -> dict[str, str]:
    """Keep only files that belong to the task's scope to prevent cross-worker conflicts.

    A file is considered in-scope if:
    - Its exact path is in the scope list, OR
    - Its path shares a directory prefix with a scope entry, OR
    - The scope is empty (consolidation/rework tasks can write anything)
    """
    if not scope:
        return files

    scope_dirs: set[str] = set()
    scope_exact: set[str] = set()
    for s in scope:
        scope_exact.add(s)
        parts = s.rsplit("/", 1)
        if len(parts) == 2:
            scope_dirs.add(parts[0])

    filtered: dict[str, str] = {}
    for path, content in files.items():
        if path in scope_exact:
            filtered[path] = content
            continue
        dir_part = path.rsplit("/", 1)[0] if "/" in path else ""
        if dir_part and dir_part in scope_dirs:
            filtered[path] = content
            continue
        for sd in scope_dirs:
            if path.startswith(sd + "/"):
                filtered[path] = content
                break

    if not filtered and files:
        logger.warning(
            "Scope filter dropped all %d files (scope=%s, got=%s). "
            "Worker likely ignored its scope assignment.",
            len(files), scope, list(files.keys()),
        )
        return {}

    dropped = len(files) - len(filtered)
    if dropped:
        logger.info("Scope filter: kept %d, dropped %d out-of-scope files", len(filtered), dropped)

    return filtered


class Worker:
    """Executes a task: generates code, commits to a branch, produces a handoff.

    When ``sandboxed=True`` the worker expects its ``git`` repo to be an
    isolated worktree that already has the correct branch checked out.
    """

    def __init__(
        self,
        worker_id: str,
        llm: LLMClient,
        git: GitRepo,
        system_prompt: str,
        *,
        sandboxed: bool = False,
        gource_name: str | None = None,
    ):
        self.worker_id = worker_id
        self.llm = llm
        self.git = git
        self.system_prompt = system_prompt
        self.sandboxed = sandboxed
        self.gource_name = gource_name
        self.state = AgentState(
            agent_id=worker_id,
            role=AgentRole.WORKER,
        )

    async def execute(self, task: Task) -> Handoff:
        """Run the full worker lifecycle for a task."""
        self.state.status = "working"
        self.state.current_task_id = task.id
        logger.info("[%s] Starting task: %s", self.worker_id, task.id)

        try:
            branch_name = task.branch or f"worker/{task.id}"

            if not self.sandboxed:
                await asyncio.to_thread(self.git.create_branch, branch_name)

            bulk_snapshot = (
                not task.scope
                and (
                    task.id.startswith("consolidation-")
                    or task.id.startswith("recover-")
                )
            )
            if bulk_snapshot:
                file_contents = await asyncio.to_thread(
                    self.git.read_repo_snapshot, 55
                )
            else:
                file_contents = await asyncio.to_thread(
                    self.git.read_files_in_scope, task.scope
                )

            result = await self.llm.execute_worker_task(
                self.system_prompt,
                task.to_dict(),
                file_contents,
            )

            raw_files = _normalize_files(
                result.get("files") or result.get("Files") or result.get("file_changes")
            )
            files = _filter_to_scope(raw_files, task.scope)
            handoff_data = result.get("handoff") or result.get("Handoff") or {}
            if not isinstance(handoff_data, dict):
                handoff_data = {}

            committed = False
            if files:
                commit_msg = f"[{task.id}] {handoff_data.get('summary', task.description)[:100]}"
                if await asyncio.to_thread(
                    self.git.commit_files, files, commit_msg,
                    author_name=self.gource_name,
                ):
                    committed = True
                    self.state.commits += 1

                    push_ok = await asyncio.to_thread(self.git.push_branch, branch_name)
                    if not push_ok:
                        logger.warning("[%s] Push failed for %s", self.worker_id, branch_name)
                        handoff_data.setdefault("concerns", []).append(
                            "Push to remote failed — branch may need manual push."
                        )
                else:
                    logger.warning("[%s] Git commit failed for %s", self.worker_id, task.id)
                    handoff_data.setdefault("concerns", []).append(
                        "Git commit failed (nothing staged, hook failure, or identical to HEAD)."
                    )
            elif handoff_data.get("status", "complete") in ("complete", "partial"):
                handoff_data.setdefault("concerns", []).append(
                    "Model returned no file payloads — nothing was written or committed."
                )

            keys_from_model = handoff_data.get("filesChanged") or handoff_data.get("files_changed")
            if isinstance(keys_from_model, list) and keys_from_model:
                changed = [str(x) for x in keys_from_model]
            else:
                changed = list(files.keys())

            handoff = Handoff(
                status=handoff_data.get("status", "complete"),
                summary=handoff_data.get("summary", ""),
                files_changed=changed,
                concerns=handoff_data.get("concerns", []),
                suggestions=handoff_data.get("suggestions", []),
                committed=committed,
            )

            logger.info(
                "[%s] Task %s → %s (%d files, committed=%s)",
                self.worker_id, task.id, handoff.status, len(files), committed,
            )
            return handoff

        except Exception as e:
            logger.error("[%s] Task %s crashed: %s", self.worker_id, task.id, e)
            return Handoff(
                status="failed",
                summary=f"Worker crashed: {e}",
                concerns=[str(e)],
            )
        finally:
            self.state.status = "idle"
            self.state.current_task_id = None
            if not self.sandboxed:
                await asyncio.to_thread(self.git.checkout_main)
