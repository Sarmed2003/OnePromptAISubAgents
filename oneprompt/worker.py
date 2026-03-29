"""Worker agent: executes a single task in an isolated branch."""

from __future__ import annotations

import logging
import time
from typing import Any

from .git_utils import GitRepo
from .llm_client import LLMClient
from .types import AgentState, AgentRole, Handoff, Task, TaskStatus

logger = logging.getLogger(__name__)


class Worker:
    """Executes a task: generates code, commits to a branch, produces a handoff."""

    def __init__(
        self,
        worker_id: str,
        llm: LLMClient,
        git: GitRepo,
        system_prompt: str,
    ):
        self.worker_id = worker_id
        self.llm = llm
        self.git = git
        self.system_prompt = system_prompt
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
            self.git.create_branch(branch_name)

            file_contents = self.git.read_files_in_scope(task.scope)

            result = await self.llm.execute_worker_task(
                self.system_prompt,
                task.to_dict(),
                file_contents,
            )

            files = result.get("files", {})
            handoff_data = result.get("handoff", {})

            if files:
                commit_msg = f"[{task.id}] {handoff_data.get('summary', task.description)[:100]}"
                self.git.commit_files(files, commit_msg)
                self.state.commits += 1

                push_ok = self.git.push_branch(branch_name)
                if not push_ok:
                    logger.warning("[%s] Push failed for %s", self.worker_id, branch_name)
                    handoff_data["concerns"] = handoff_data.get("concerns", []) + [
                        "Push to remote failed — branch may need manual push."
                    ]

            handoff = Handoff(
                status=handoff_data.get("status", "complete"),
                summary=handoff_data.get("summary", ""),
                files_changed=handoff_data.get("filesChanged", list(files.keys())),
                concerns=handoff_data.get("concerns", []),
                suggestions=handoff_data.get("suggestions", []),
            )

            logger.info(
                "[%s] Task %s → %s (%d files)",
                self.worker_id, task.id, handoff.status, len(files),
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
            self.git.checkout_main()
