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
from .templates import TemplateLoader
from .types import (
    AgentState,
    AgentRole,
    Handoff,
    NdjsonEvent,
    RunMetrics,
    Task,
    TaskStatus,
)
from .vault import VaultReader
from .worker import Worker

logger = logging.getLogger(__name__)


class Orchestrator:
    """Coordinates the full lifecycle: plan → architect → execute → merge → review → QA → sandbox → security → reconcile → devops → vault write."""

    def __init__(self, config: AppConfig, on_event: Callable[[NdjsonEvent], None] | None = None):
        self.config = config
        self.on_event = on_event or self._default_event_handler

        self.llm = LLMClient(config.llm)
        self.git = GitRepo(config.git, config.orchestrator.target_repo_path)
        self.db = create_database(
            backend=config.database.backend,
            region=config.aws.region,
            table_prefix=config.aws.dynamodb_table_prefix,
            access_key_id=config.aws.access_key_id,
            secret_access_key=config.aws.secret_access_key,
            session_token=config.aws.session_token,
            uri=config.database.mongodb_uri,
            db_name=config.database.mongodb_db,
        )
        self.task_queue = TaskQueue(db=self.db)
        self.merge_queue = MergeQueue(self.git, config.worker.merge_strategy)

        self.template_loader = TemplateLoader(config.template or None)
        self.vault = VaultReader(config.vault.path, config.vault.max_context_chars) if config.vault.enabled else None

        self.planner = Planner(self.llm, self.template_loader, self.vault)
        self.subplanner = SubPlanner(self.llm, self.template_loader)
        self.reconciler = Reconciler(self.llm, self.git)
        self.sandbox = LocalSandbox(config.orchestrator.target_repo_path, config.git)
        self.metrics = RunMetrics()

        self._worker_prompt = self.template_loader.load_prompt("worker")
        self._architect_prompt = self.template_loader.load_prompt("architect")
        self._reviewer_prompt = self.template_loader.load_prompt("reviewer")
        self._tester_prompt = self.template_loader.load_prompt("tester")
        self._security_prompt = self.template_loader.load_prompt("security")
        self._devops_prompt = self.template_loader.load_prompt("devops")
        self._bundler_prompt = self.template_loader.load_prompt("bundler")
        self._integrator_prompt = self.template_loader.load_prompt("integrator")
        self._agents: list[AgentState] = []
        self._stop = False
        self._phase_overrides: dict[str, bool] | None = None
        self._consolidation_counter = 0
        self._architect_decisions: list[str] = []
        self._run_errors: list[str] = []

    # ------------------------------------------------------------------
    # Smart phase selection
    # ------------------------------------------------------------------

    async def _select_phases(self, spec: str) -> dict[str, bool]:
        """Optionally use an LLM to trim SDLC phases. Disabled when smart_phase_selection is off."""
        orch_cfg = self.config.orchestrator
        defaults = {
            "architect": orch_cfg.architect_enabled,
            "review": orch_cfg.review_enabled,
            "qa": orch_cfg.qa_enabled,
            "security": orch_cfg.security_enabled,
            "devops": orch_cfg.devops_enabled,
        }

        if not orch_cfg.smart_phase_selection:
            logger.info("SMART_PHASE_SELECTION off — running all env-enabled SDLC phases")
            return defaults

        system = (
            "You decide which SDLC agent phases to activate for a given project prompt. "
            "Return a JSON object with boolean values for each phase. "
            "Only enable phases that add real value — do NOT waste tokens on unnecessary work.\n\n"
            "Phases:\n"
            "- architect: true if the project has 3+ tasks, multiple files that must integrate, or needs API/data contracts\n"
            "- review: true if the project has business logic, API endpoints, complex state management, or cloud resources\n"
            "- qa: true if the project has testable logic (functions, APIs, algorithms, handlers, data transforms)\n"
            "- security: true if the project handles user input, auth, network requests, stores data, or uses cloud services (Lambda, DynamoDB, etc.)\n"
            "- devops: true if the project is a deployable app (backend, serverless, CDK, fullstack, containerized). false for simple scripts or one-off utilities\n"
        )
        user = (
            f"Project prompt: {spec[:500]}\n\n"
            "Return JSON: {\"architect\": bool, \"review\": bool, \"qa\": bool, \"security\": bool, \"devops\": bool}"
        )

        try:
            result = await self.llm.generate_json(system, user)
            if isinstance(result, dict):
                phases = {}
                for key in defaults:
                    val = result.get(key)
                    if isinstance(val, bool):
                        phases[key] = val and defaults[key]
                    else:
                        phases[key] = defaults[key]
                return phases
        except Exception as e:
            logger.warning("Phase selection failed, using defaults: %s", e)

        return defaults

    def _phase_enabled(self, phase: str) -> bool:
        """Check if a phase is enabled, respecting both config and smart overrides."""
        if self._phase_overrides and phase in self._phase_overrides:
            return self._phase_overrides[phase]
        return getattr(self.config.orchestrator, f"{phase}_enabled", True)

    def _emit(self, event_type: str, data: dict[str, Any] | None = None) -> None:
        event = NdjsonEvent(type=event_type, data=data or {})
        self.on_event(event)
        self.db.log_event(event_type, data or {})

    def _default_event_handler(self, event: NdjsonEvent) -> None:
        line = json.dumps(event.to_dict())
        sys.stdout.write(line + "\n")
        sys.stdout.flush()

    async def _generate_json_retry(
        self, system: str, user: str, *, attempts: int | None = None
    ) -> tuple[dict | None, str | None]:
        """Call LLM JSON mode with retries. Returns (dict, None) or (None, reason)."""
        n = attempts if attempts is not None else (
            4 if self.config.orchestrator.strict_sdlc else 2
        )
        last: str | None = None
        for i in range(n):
            try:
                r = await self.llm.generate_json(system, user)
                if isinstance(r, dict):
                    return r, None
                last = "non-dict response"
            except Exception as e:
                last = str(e)[:400]
                logger.warning("generate_json failed (%d/%d): %s", i + 1, n, e)
                if i + 1 < n:
                    await asyncio.sleep(self.config.orchestrator.json_retry_backoff_sec)
        return None, last

    def _phase_terminal(
        self,
        event: str,
        err_msg: str,
        *,
        strict_extra: dict[str, Any] | None = None,
        lenient_extra: dict[str, Any] | None = None,
    ) -> None:
        """In strict SDLC mode, count phase errors and emit error; else emit skipped."""
        msg = (err_msg or "").strip()[:400]
        if self.config.orchestrator.strict_sdlc:
            self.metrics.strict_phase_errors += 1
            self._run_errors.append(f"{event}: {msg}")
            data = {"status": "error", "error": msg}
            if strict_extra:
                data.update(strict_extra)
            self._emit(event, data)
        else:
            data = {"status": "skipped", "reason": msg}
            if lenient_extra:
                data.update(lenient_extra)
            self._emit(event, data)

    # ------------------------------------------------------------------
    # Optional: re-queue failed worker tasks after merge (recovery workers)
    # ------------------------------------------------------------------

    async def _run_failure_recovery(self, spec: str, run_worker_fn) -> None:
        """Spawn recover-* tasks for FAILED workers, run them, merge again."""
        rounds = self.config.orchestrator.recovery_max_rounds
        if rounds <= 0:
            return
        for r in range(rounds):
            failed = [
                t for t in self.task_queue.get_all_tasks()
                if t.status == TaskStatus.FAILED
            ]
            if not failed:
                return
            new_tasks: list[Task] = []
            for ft in failed[:12]:
                if ft.id.startswith("recover-"):
                    continue
                hid = f"recover-{ft.id}-R{r}"
                if self.task_queue.get_task(hid):
                    continue
                summ = (ft.handoff.summary if ft.handoff else "") or ""
                desc = (
                    "[RECOVERY] A prior worker task failed. Re-implement the intent on top of current main.\n\n"
                    f"## Spec (run goal)\n{spec[:1200]}\n\n"
                    f"## Original task {ft.id}\n{ft.description[:2000]}\n\n"
                    f"## Failure / handoff\n{summ[:1200]}"
                )
                new_tasks.append(
                    Task(
                        id=hid,
                        description=desc,
                        scope=[],
                        acceptance="Project builds; the failed task's intent is addressed",
                        branch=f"worker/{hid}",
                        priority=2,
                        status=TaskStatus.PENDING,
                    )
                )
            if not new_tasks:
                return
            self.task_queue.add_tasks(new_tasks)
            self.metrics.total_tasks = self.task_queue.total_count
            self._emit("recovery_dispatched", {"count": len(new_tasks), "round": r + 1})
            for t in new_tasks:
                await run_worker_fn(t)
            await self._merge_and_rework(run_worker_fn)

    # ------------------------------------------------------------------
    # Helper: merge pending branches and handle conflicts with rework
    # ------------------------------------------------------------------

    async def _merge_and_rework(self, run_worker_fn) -> None:
        """Merge all pending branches.

        On conflicts, create ONE consolidation task that reads the current
        main-branch files and incorporates all missing features, instead of
        spawning a separate conflict-fix task per failure.
        """
        results = self.merge_queue.process_all()
        conflicting_task_ids: list[str] = []
        merge_ok = 0
        merge_fail = 0
        conflict_count = 0

        for mr in results:
            self.metrics.total_commits += 1 if mr.success else 0
            self.metrics.merge_conflicts += 1 if mr.conflict else 0
            if mr.success:
                merge_ok += 1
            elif mr.conflict:
                merge_fail += 1
                conflict_count += 1
                conflicting_task_ids.append(mr.task_id)
            else:
                merge_fail += 1
            self._emit("merge", {
                "task": mr.task_id,
                "branch": mr.branch,
                "success": mr.success,
                "conflict": mr.conflict,
                "error": (mr.error or "")[:500],
            })

        if results:
            self._emit("merge_summary", {
                "merged": merge_ok,
                "conflicts": conflict_count,
                "failed": merge_fail - conflict_count,
                "total": len(results),
            })

        if not conflicting_task_ids:
            return

        self.git.checkout_main()
        file_tree = self.git.get_file_tree()
        existing_files: dict[str, str] = {}
        for line in file_tree.split("\n"):
            fp = line.strip()
            if not fp or fp.startswith(".git"):
                continue
            content = self.git.read_file(fp)
            if content:
                existing_files[fp] = content[:5000]
            if len(existing_files) >= 45:
                break

        missed_descriptions: list[str] = []
        for tid in conflicting_task_ids:
            task_obj = self.task_queue.get_task(tid)
            if task_obj:
                raw_desc = task_obj.description
                if "[ARCHITECTURE" in raw_desc and "[TASK]" in raw_desc:
                    raw_desc = raw_desc.split("[TASK]", 1)[-1].strip()
                missed_descriptions.append(
                    f"- Task {tid}: {raw_desc[:400]}"
                )

        self._consolidation_counter += 1
        c_id = f"consolidation-{self._consolidation_counter}"

        hint_paths = "\n".join(f"- `{p}`" for p in list(existing_files.keys())[:40])
        consolidation_task = Task(
            id=c_id,
            description=(
                "[CONSOLIDATION] The following features were built on separate branches "
                "but could not be merged because they conflict with each other.\n\n"
                "Your job: read the repository snapshot (Current File Contents), then produce "
                "UPDATED file payloads that incorporate ALL missing features below. "
                "You may touch any source files needed — do NOT discard working code.\n\n"
                f"## Likely touched paths (hints)\n{hint_paths}\n\n"
                f"## Missing features to incorporate\n"
                + "\n".join(missed_descriptions[:15])
            ),
            scope=[],
            acceptance="All listed features are integrated into the existing codebase and the project works end-to-end",
            branch=f"worker/{c_id}",
            priority=1,
            status=TaskStatus.PENDING,
        )

        self.task_queue.add_tasks([consolidation_task])
        self.metrics.total_tasks = self.task_queue.total_count
        self._emit("conflict_rework", {
            "count": 1,
            "strategy": "consolidation",
            "missed_tasks": len(conflicting_task_ids),
        })

        await run_worker_fn(consolidation_task)

        ct = self.task_queue.get_task(c_id)
        last_why = ""
        if ct and ct.status == TaskStatus.FAILED:
            if ct.handoff and ct.handoff.summary:
                last_why = ct.handoff.summary[:800]
            logger.warning("Consolidation %s failed — retrying: %s", c_id, last_why[:200])
            self._consolidation_counter += 1
            c2_id = f"consolidation-{self._consolidation_counter}"
            retry_task = Task(
                id=c2_id,
                description=(
                    consolidation_task.description
                    + "\n\n## Previous consolidation attempt failed\n"
                    + (last_why or "Unknown error — merge conflicts may still exist; resolve fully.")
                    + "\n\nYou MUST output complete file contents and ensure a successful commit."
                ),
                scope=[],
                acceptance=consolidation_task.acceptance,
                branch=f"worker/{c2_id}",
                priority=1,
                status=TaskStatus.PENDING,
            )
            self.task_queue.add_tasks([retry_task])
            self.metrics.total_tasks = self.task_queue.total_count
            self._emit("conflict_rework", {
                "count": 1,
                "strategy": "consolidation-retry",
                "missed_tasks": len(conflicting_task_ids),
            })
            await run_worker_fn(retry_task)

            c2t = self.task_queue.get_task(c2_id)
            if c2t and c2t.status == TaskStatus.FAILED:
                w2 = (c2t.handoff.summary if c2t.handoff else "")[:800] or last_why
                logger.warning("Consolidation %s failed — final retry: %s", c2_id, w2[:200])
                self._consolidation_counter += 1
                c3_id = f"consolidation-{self._consolidation_counter}"
                retry3 = Task(
                    id=c3_id,
                    description=(
                        retry_task.description
                        + "\n\n## Second consolidation attempt also failed\n"
                        + (w2 or "Resolve conflicts; ensure every changed file is included in `files`.")
                        + "\n\nFocus on minimal, correct merges that compile."
                    ),
                    scope=[],
                    acceptance=consolidation_task.acceptance,
                    branch=f"worker/{c3_id}",
                    priority=1,
                    status=TaskStatus.PENDING,
                )
                self.task_queue.add_tasks([retry3])
                self.metrics.total_tasks = self.task_queue.total_count
                self._emit("conflict_rework", {
                    "count": 1,
                    "strategy": "consolidation-retry-2",
                    "missed_tasks": len(conflicting_task_ids),
                })
                await run_worker_fn(retry3)

        consolidation_results = self.merge_queue.process_all()
        for mr in consolidation_results:
            self.metrics.total_commits += 1 if mr.success else 0
            self.metrics.merge_conflicts += 1 if mr.conflict else 0
            self._emit("merge", {
                "task": mr.task_id,
                "branch": mr.branch,
                "success": mr.success,
                "conflict": mr.conflict,
                "error": (mr.error or "")[:500],
            })

    # ------------------------------------------------------------------
    # Helper: clean up remote branches after merge
    # ------------------------------------------------------------------

    def _cleanup_remote_branches(self, branches: list[str]) -> None:
        """Delete worker branches from the remote to keep the repo clean."""
        seen: set[str] = set()
        url = self.config.git.authenticated_url
        for branch in branches:
            if branch in seen or branch == self.config.git.main_branch:
                continue
            seen.add(branch)
            try:
                self.git._run("push", url, "--delete", branch)
                logger.info("Deleted remote branch: %s", branch)
            except Exception:
                pass

    # ------------------------------------------------------------------
    # Phase: Architect
    # ------------------------------------------------------------------

    async def _run_architect_phase(self, tasks: list[Task], file_tree: str) -> list[Task]:
        """Architect enriches tasks with architectural context for consistent integration."""
        if not self._phase_enabled("architect") or not self._architect_prompt:
            return tasks

        self._emit("phase", {"name": "architect"})
        self._emit("architect_start", {"task_count": len(tasks)})

        task_summaries = json.dumps(
            [{"id": t.id, "description": t.description, "scope": t.scope, "acceptance": t.acceptance} for t in tasks],
            indent=2,
        )

        vault_context = ""
        if self.vault:
            vault_context = self.vault.load_for_architect()
            if vault_context:
                vault_context = f"\n\n## Knowledge Vault\n{vault_context}\n"

        user_msg = f"""## Planned Tasks
{task_summaries}

## Current File Tree
{file_tree}
{vault_context}
Analyze these tasks and produce architectural guidance so all workers produce compatible, integrated code."""

        try:
            result, err = await self._generate_json_retry(self._architect_prompt, user_msg)
            if result is None:
                self._phase_terminal(
                    "architect_done",
                    err or "LLM failed",
                    strict_extra={"tasks_enriched": 0},
                    lenient_extra={"tasks_enriched": 0},
                )
                return tasks

            enriched = result.get("enriched_tasks", [])
            enrichment_map: dict[str, str] = {}
            for entry in enriched:
                if isinstance(entry, dict):
                    tid = entry.get("task_id", "")
                    ctx = entry.get("architecture_context", "")
                    if tid and ctx:
                        enrichment_map[tid] = ctx

            architecture = result.get("architecture", {})
            arch_summary = json.dumps(architecture, indent=2)[:2000] if architecture else ""

            if isinstance(architecture, dict):
                pattern = architecture.get("pattern", "")
                if pattern:
                    self._architect_decisions.append(f"Architecture pattern: {pattern}")
                conventions = architecture.get("conventions", {})
                if isinstance(conventions, dict):
                    for k, v in list(conventions.items())[:5]:
                        self._architect_decisions.append(f"{k}: {v}")

            for task in tasks:
                extra = enrichment_map.get(task.id, "")
                if extra:
                    task.description = f"[ARCHITECTURE CONTEXT]\n{extra}\n\n[TASK]\n{task.description}"
                elif arch_summary:
                    task.description = f"[ARCHITECTURE]\n{arch_summary[:800]}\n\n[TASK]\n{task.description}"

            self._emit("architect_done", {
                "status": "complete",
                "tasks_enriched": len(enrichment_map),
                "architecture_pattern": architecture.get("pattern", "N/A") if isinstance(architecture, dict) else "N/A",
            })
            logger.info("Architect enriched %d/%d tasks", len(enrichment_map), len(tasks))

        except Exception as e:
            logger.error("Architect phase failed: %s", e)
            self._phase_terminal(
                "architect_done",
                str(e),
                strict_extra={"tasks_enriched": 0},
                lenient_extra={"tasks_enriched": 0},
            )

        return tasks

    # ------------------------------------------------------------------
    # Phase: Code Review
    # ------------------------------------------------------------------

    async def _run_review_phase(self, completed_tasks: list[Task]) -> tuple[list[Task], list[Task]]:
        """Review merged code on main. Returns (approved_tasks, rework_tasks)."""
        if not self._phase_enabled("review") or not self._reviewer_prompt:
            return completed_tasks, []

        if not completed_tasks:
            return completed_tasks, []

        self._emit("phase", {"name": "review"})
        self._emit("review_start", {"task_count": len(completed_tasks)})

        self.git.checkout_main()
        recent_commits = self.git.get_recent_commits(30)
        file_tree = self.git.get_file_tree()

        task_summaries: list[dict[str, str]] = []
        for task in completed_tasks[:10]:
            task_summaries.append({
                "task_id": task.id,
                "description": task.description[:400],
                "acceptance": task.acceptance[:200],
            })

        user_msg = f"""## Recent Commits (merged into main)
{recent_commits}

## Current File Tree
{file_tree}

## Tasks That Were Implemented
{json.dumps(task_summaries, indent=2)}

Review the committed code for correctness, code quality, and interface compliance.
Focus on the most recent changes visible in the commits."""

        approved: list[Task] = []
        rework: list[Task] = []

        try:
            result, err = await self._generate_json_retry(self._reviewer_prompt, user_msg)
            if result is None:
                self._phase_terminal(
                    "review_done",
                    err or "LLM failed",
                    strict_extra={"approved": 0, "rework": 0},
                    lenient_extra={
                        "approved": len(completed_tasks),
                        "rework": 0,
                    },
                )
                return completed_tasks, []

            reviews = result.get("reviews", [])
            verdict_map: dict[str, dict] = {}
            for review in reviews:
                if isinstance(review, dict):
                    verdict_map[review.get("task_id", "")] = review

            for task in completed_tasks:
                review_data = verdict_map.get(task.id, {})
                verdict = review_data.get("verdict", "approve")

                if verdict == "request_changes":
                    rework_instructions = review_data.get("rework_instructions", "")
                    issues = review_data.get("issues", [])
                    issue_text = "\n".join(
                        f"- [{i.get('severity', '?')}] {i.get('file', '?')}: {i.get('description', '?')}"
                        for i in issues[:5]
                    )
                    rework_task = Task(
                        id=f"rework-{task.id}",
                        description=f"[REWORK REQUIRED]\n{rework_instructions}\n\nIssues found:\n{issue_text}\n\nOriginal task: {task.description[:500]}",
                        scope=task.scope,
                        acceptance=task.acceptance,
                        branch=f"worker/rework-{task.id}",
                        priority=1,
                        status=TaskStatus.PENDING,
                        parent_id=task.id,
                    )
                    rework.append(rework_task)
                    self._emit("review_verdict", {
                        "task": task.id,
                        "verdict": "request_changes",
                        "issues": len(issues),
                        "summary": review_data.get("summary", "")[:200],
                    })
                else:
                    approved.append(task)
                    self._emit("review_verdict", {
                        "task": task.id,
                        "verdict": "approve",
                        "summary": review_data.get("summary", "")[:200],
                    })

            self._emit("review_done", {
                "status": "complete",
                "approved": len(approved),
                "rework": len(rework),
            })

        except Exception as e:
            logger.error("Review phase failed: %s", e)
            self._phase_terminal(
                "review_done",
                str(e),
                strict_extra={"approved": 0, "rework": 0},
                lenient_extra={"approved": len(completed_tasks), "rework": 0},
            )
            return completed_tasks, []

        return approved, rework

    # ------------------------------------------------------------------
    # Phase: QA Testing
    # ------------------------------------------------------------------

    async def _run_qa_phase(self, file_tree: str) -> None:
        """Generate test files for the merged codebase on main."""
        if not self._phase_enabled("qa") or not self._tester_prompt:
            return

        self._emit("phase", {"name": "qa_testing"})
        self._emit("qa_start", {"task_count": 1})

        self.git.checkout_main()

        source_files: dict[str, str] = {}
        for line in file_tree.split("\n"):
            fp = line.strip()
            if not fp or fp.startswith(".git"):
                continue
            ext = fp.rsplit(".", 1)[-1].lower() if "." in fp else ""
            if ext in ("py", "js", "ts", "jsx", "tsx", "html", "css", "go", "rs", "java", "rb", "php"):
                content = self.git.read_file(fp)
                if content:
                    source_files[fp] = content[:2000]
            if len(source_files) >= 15:
                break

        user_msg = f"""## File Tree
{file_tree}

## Source Files
{json.dumps(source_files, indent=2)[:8000]}

Generate automated tests for the key logic in this codebase. Use the appropriate testing framework for the detected language/stack."""

        try:
            result, err = await self._generate_json_retry(self._tester_prompt, user_msg)
            if result is None:
                self._phase_terminal("qa_done", err or "LLM failed")
                return

            test_files = result.get("test_files", [])
            files_to_commit: dict[str, str] = {}
            for tf in test_files:
                if isinstance(tf, dict):
                    path = tf.get("path", "")
                    content = tf.get("content", "")
                    if path and isinstance(content, str) and content.strip():
                        files_to_commit[path] = content

            if files_to_commit:
                gource_qa = "QA Tester" if self.config.gource_agent_ids else None
                commit_ok = self.git.commit_files(files_to_commit, "[QA] Add automated test files", author_name=gource_qa)
                if commit_ok:
                    self.metrics.total_commits += 1
                    url = self.config.git.authenticated_url
                    self.git._run("push", url, f"HEAD:refs/heads/{self.config.git.main_branch}")

                self._emit("qa_done", {
                    "status": "complete",
                    "test_files": len(files_to_commit),
                    "files": list(files_to_commit.keys())[:10],
                })
            else:
                self._emit("qa_done", {"status": "complete", "test_files": 0})

            coverage = result.get("coverage_summary", {})
            if coverage:
                logger.info("QA coverage: %s", json.dumps(coverage)[:300])

        except Exception as e:
            logger.error("QA phase failed: %s", e)
            self._phase_terminal("qa_done", str(e))

    # ------------------------------------------------------------------
    # Phase: Security Audit
    # ------------------------------------------------------------------

    async def _run_security_phase(self, file_tree: str) -> list[Task]:
        """Scan the codebase for security vulnerabilities. Returns fix tasks for critical/high issues."""
        if not self._phase_enabled("security") or not self._security_prompt:
            return []

        self._emit("phase", {"name": "security"})
        self._emit("security_start", {})

        self.git.checkout_main()

        all_files = file_tree.split("\n")
        code_files = [f for f in all_files if f.strip() and not f.startswith(".git")]
        file_contents: dict[str, str] = {}
        for fp in code_files[:30]:
            content = self.git.read_file(fp.strip())
            if content:
                file_contents[fp.strip()] = content[:3000]

        user_msg = f"""## File Tree
{file_tree}

## File Contents
{json.dumps(file_contents, indent=2)[:12000]}

Perform a comprehensive security audit following OWASP Top 10 and zero-trust principles."""

        fix_tasks: list[Task] = []

        try:
            result, err = await self._generate_json_retry(self._security_prompt, user_msg)
            if result is None:
                self._phase_terminal("security_done", err or "LLM failed")
                return []

            findings = result.get("findings", [])
            audit_summary = result.get("audit_summary", {})

            self._emit("security_done", {
                "status": "complete",
                "risk_level": audit_summary.get("risk_level", "unknown") if isinstance(audit_summary, dict) else "unknown",
                "total_findings": len(findings),
                "critical": sum(1 for f in findings if isinstance(f, dict) and f.get("severity") == "critical"),
                "high": sum(1 for f in findings if isinstance(f, dict) and f.get("severity") == "high"),
            })

            for finding in findings[:10]:
                if isinstance(finding, dict):
                    self._emit("security_finding", {
                        "id": finding.get("id", ""),
                        "severity": finding.get("severity", "info"),
                        "title": finding.get("title", "")[:100],
                        "file": finding.get("file", ""),
                    })

            raw_fix_tasks = result.get("fix_tasks", [])
            for ft in raw_fix_tasks[:5]:
                if isinstance(ft, dict):
                    fix_tasks.append(Task(
                        id=ft.get("task_id", f"sec-fix-{len(fix_tasks)}"),
                        description=ft.get("description", "Security fix"),
                        scope=ft.get("scope", []),
                        acceptance="Security vulnerability remediated",
                        branch=f"worker/{ft.get('task_id', f'sec-fix-{len(fix_tasks)}')}",
                        priority=ft.get("priority", 1),
                        status=TaskStatus.PENDING,
                    ))

        except Exception as e:
            logger.error("Security phase failed: %s", e)
            self._phase_terminal("security_done", str(e))

        return fix_tasks

    # ------------------------------------------------------------------
    # Phase: DevOps
    # ------------------------------------------------------------------

    async def _run_devops_phase(self, file_tree: str) -> None:
        """Generate CI/CD, Dockerfile, and deployment configs."""
        if not self._phase_enabled("devops") or not self._devops_prompt:
            return

        self._emit("phase", {"name": "devops"})
        self._emit("devops_start", {})

        self.git.checkout_main()

        existing_ci = self.git.read_file(".github/workflows/ci.yml") or ""
        existing_dockerfile = self.git.read_file("Dockerfile") or ""
        existing_gitignore = self.git.read_file(".gitignore") or ""

        user_msg = f"""## File Tree
{file_tree}

## Existing CI/CD Config
{existing_ci[:2000] if existing_ci else "(none)"}

## Existing Dockerfile
{existing_dockerfile[:2000] if existing_dockerfile else "(none)"}

## Existing .gitignore
{existing_gitignore[:1000] if existing_gitignore else "(none)"}

Generate deployment-ready configuration files for this project."""

        try:
            result, err = await self._generate_json_retry(self._devops_prompt, user_msg)
            if result is None:
                self._phase_terminal("devops_done", err or "LLM failed")
                return

            files_list = result.get("files", [])
            files_to_commit: dict[str, str] = {}
            for f in files_list:
                if isinstance(f, dict):
                    path = f.get("path", "")
                    content = f.get("content", "")
                    if path and isinstance(content, str) and content.strip():
                        files_to_commit[path] = content

            if files_to_commit:
                gource_devops = "DevOps Engineer" if self.config.gource_agent_ids else None
                commit_ok = self.git.commit_files(files_to_commit, "[DevOps] Add CI/CD and deployment configs", author_name=gource_devops)
                if commit_ok:
                    self.metrics.total_commits += 1
                    url = self.config.git.authenticated_url
                    self.git._run("push", url, f"HEAD:refs/heads/{self.config.git.main_branch}")

                self._emit("devops_done", {
                    "status": "complete",
                    "files_generated": list(files_to_commit.keys()),
                    "notes": result.get("notes", [])[:5],
                })
            else:
                self._emit("devops_done", {"status": "complete", "files_generated": []})

        except Exception as e:
            logger.error("DevOps phase failed: %s", e)
            self._phase_terminal("devops_done", str(e))

    # ------------------------------------------------------------------
    # Phase: Sandbox Execution (run build + tests)
    # ------------------------------------------------------------------

    async def _run_sandbox_execution_phase(self) -> list[Task]:
        """Run build and tests in the target repo. Returns fix tasks on failure."""
        self._emit("phase", {"name": "sandbox_execution"})
        self._emit("sandbox_exec_start", {})

        self.git.checkout_main()

        build_code, build_output = self.git.run_build()
        self._emit("sandbox_exec_build", {
            "exit_code": build_code,
            "output": build_output[:500],
        })

        test_code, test_output = self.git.run_tests()
        self._emit("sandbox_exec_test", {
            "exit_code": test_code,
            "output": test_output[:500],
        })

        if build_code == 0 and test_code == 0:
            self._emit("sandbox_exec_done", {
                "status": "pass",
                "build": "pass",
                "tests": "pass",
            })
            return []

        self._run_errors.append(
            f"Sandbox: build={'pass' if build_code == 0 else 'FAIL'}, "
            f"tests={'pass' if test_code == 0 else 'FAIL'}"
        )

        fix_tasks = await self.reconciler.sweep()
        self._emit("sandbox_exec_done", {
            "status": "fail",
            "build": "pass" if build_code == 0 else "fail",
            "tests": "pass" if test_code == 0 else "fail",
            "fix_tasks": len(fix_tasks),
        })
        return fix_tasks

    # ------------------------------------------------------------------
    # Phase: Integration (fix cross-file references)
    # ------------------------------------------------------------------

    async def _run_integration_phase(self, file_tree: str) -> None:
        """Read the merged codebase and fix all cross-file references."""
        if not self._integrator_prompt:
            return

        self._emit("phase", {"name": "integration"})
        self._emit("integration_start", {})

        self.git.checkout_main()

        all_lines = file_tree.split("\n")
        source_files: dict[str, str] = {}
        for fp_raw in all_lines:
            fp = fp_raw.strip()
            if not fp or fp.startswith(".git"):
                continue
            content = self.git.read_file(fp)
            if content:
                source_files[fp] = content[:4000]
            if len(source_files) >= 25:
                break

        if len(source_files) <= 1:
            self._emit("integration_done", {"status": "skipped", "reason": "single file"})
            return

        user_msg = f"""## File Tree
{file_tree}

## File Contents
{json.dumps(source_files, indent=2)[:15000]}

Review all cross-file references and fix any broken paths, imports, or wiring. Only output files that need changes."""

        try:
            result, err = await self._generate_json_retry(self._integrator_prompt, user_msg)
            if result is None:
                self._phase_terminal("integration_done", err or "LLM failed")
                return

            files = result.get("files", {})
            if not isinstance(files, dict) or not files:
                self._emit("integration_done", {"status": "complete", "files_fixed": 0})
                return

            valid_files: dict[str, str] = {}
            for path, content in files.items():
                if isinstance(content, str) and content.strip():
                    valid_files[path] = content

            if valid_files:
                gource_int = "Integrator" if self.config.gource_agent_ids else None
                commit_ok = self.git.commit_files(
                    valid_files,
                    f"[Integration] Fix cross-file references in {len(valid_files)} files",
                    author_name=gource_int,
                )
                if commit_ok:
                    self.metrics.total_commits += 1

            self._emit("integration_done", {
                "status": "complete",
                "files_fixed": len(valid_files),
                "files": list(valid_files.keys())[:10],
            })

        except Exception as e:
            logger.error("Integration phase failed: %s", e)
            self._phase_terminal("integration_done", str(e))

    # ------------------------------------------------------------------
    # Phase: Bundler (single-file output) — PROGRAMMATIC, no LLM needed
    # ------------------------------------------------------------------

    async def _run_bundler_phase(self, spec: str, file_tree: str) -> None:
        """If the spec requests single-file output, programmatically inline all
        external CSS/JS resources into a single HTML file."""
        import re

        single_file_keywords = [
            "single file", "single html", "one file", "one html",
            "single index.html", "single page", "one page",
            "single script", "one script", "single .html",
            "embedded css and js", "inline css", "all in one",
        ]
        spec_lower = spec.lower()
        needs_bundling = any(kw in spec_lower for kw in single_file_keywords)

        if not needs_bundling:
            return

        skip_keywords = [
            "api", "lambda", "serverless", "cdk", "backend", "microservice",
            "endpoint", "dynamodb", "rest", "graphql", "webhook", "express",
            "fastapi", "django", "flask", "nestjs", "infrastructure",
        ]
        if any(kw in spec_lower for kw in skip_keywords):
            return

        self._emit("phase", {"name": "bundler"})
        self._emit("bundler_start", {})

        self.git.checkout_main()

        all_lines = file_tree.split("\n")
        source_paths = [
            fp.strip() for fp in all_lines
            if fp.strip() and not fp.strip().startswith(".git")
        ]

        html_file = None
        for fp in source_paths:
            if fp.endswith(".html"):
                html_file = fp
                break

        if not html_file:
            self._emit("bundler_done", {"status": "skipped", "reason": "no HTML entry file"})
            return

        html_content = self.git.read_file(html_file) or ""
        if not html_content.strip():
            self._emit("bundler_done", {"status": "skipped", "reason": "empty HTML file"})
            return

        repo_files: dict[str, str] = {}
        for fp in source_paths:
            if fp == html_file or fp.startswith(".git"):
                continue
            content = self.git.read_file(fp)
            if content:
                repo_files[fp] = content

        if not repo_files:
            self._emit("bundler_done", {"status": "skipped", "reason": "already single file"})
            return

        inlined_paths: set[str] = set()

        basename_index: dict[str, str] = {}
        for fp in repo_files:
            bn = fp.rsplit("/", 1)[-1]
            basename_index.setdefault(bn, fp)

        def _strip_module_syntax(content: str) -> str:
            """Remove all ES module import/export syntax for inline <script> use."""
            content = re.sub(r'^\s*import\s+.*?from\s+["\'].*?["\'];?\s*$', '', content, flags=re.MULTILINE)
            content = re.sub(r'^\s*import\s+["\'].*?["\'];?\s*$', '', content, flags=re.MULTILINE)
            content = re.sub(r'^\s*import\s*\{[^}]*\}\s*from\s+["\'].*?["\'];?\s*$', '', content, flags=re.MULTILINE)
            content = re.sub(r'^\s*export\s+default\s+\w+\s*;?\s*$', '', content, flags=re.MULTILINE)
            content = re.sub(r'^\s*export\s*\{[^}]*\}\s*;?\s*$', '', content, flags=re.MULTILINE)
            content = re.sub(r'^export\s+(class|function|const|let|var)\s', r'\1 ', content, flags=re.MULTILINE)
            return content

        def _find_and_mark(ref_path: str) -> str | None:
            """Find a file matching ref_path via O(1) lookup and mark as inlined."""
            if ref_path in repo_files:
                inlined_paths.add(ref_path)
                return repo_files[ref_path]
            bn = ref_path.rsplit("/", 1)[-1]
            fp = basename_index.get(bn)
            if fp and fp not in inlined_paths:
                inlined_paths.add(fp)
                return repo_files[fp]
            return None

        css_pattern = re.compile(
            r'<link\s+[^>]*href=["\']([^"\']+\.css)["\'][^>]*/?>',
            re.IGNORECASE,
        )
        js_pattern = re.compile(
            r'<script\s+[^>]*src=["\']([^"\']+\.js)["\'][^>]*>\s*</script>',
            re.IGNORECASE,
        )

        inlined_css = 0
        inlined_js = 0

        def _replace_css(match: re.Match) -> str:
            nonlocal inlined_css
            href = match.group(1)
            content = _find_and_mark(href)
            if content:
                inlined_css += 1
                return f"<style>\n{content}\n</style>"
            return match.group(0)

        def _replace_js(match: re.Match) -> str:
            nonlocal inlined_js
            src = match.group(1)
            content = _find_and_mark(src)
            if content:
                inlined_js += 1
                content = _strip_module_syntax(content)
                return f"<script>\n{content}\n</script>"
            return match.group(0)

        bundled = css_pattern.sub(_replace_css, html_content)
        bundled = js_pattern.sub(_replace_js, bundled)

        unreferenced_css = [
            fp for fp in repo_files
            if fp.endswith(".css") and fp not in inlined_paths
        ]
        unreferenced_js = [
            fp for fp in repo_files
            if fp.endswith(".js") and fp not in inlined_paths
        ]

        if unreferenced_css:
            extra_styles = "\n".join(repo_files[fp] for fp in unreferenced_css)
            bundled = bundled.replace(
                "</head>",
                f"<style>\n{extra_styles}\n</style>\n</head>",
            )
            inlined_css += len(unreferenced_css)

        if unreferenced_js:
            extra_scripts = "\n".join(
                _strip_module_syntax(repo_files[fp]) for fp in unreferenced_js
            )
            bundled = bundled.replace(
                "</body>",
                f"<script>\n{extra_scripts}\n</script>\n</body>",
            )
            inlined_js += len(unreferenced_js)

        try:
            files_to_remove = [
                fp for fp in source_paths
                if fp != html_file and not fp.startswith(".git")
            ]
            if files_to_remove:
                self.git.remove_files(files_to_remove)

            gource_bundler = "Bundler" if self.config.gource_agent_ids else None
            commit_ok = self.git.commit_files(
                {html_file: bundled},
                f"[Bundler] Inline {inlined_css} CSS + {inlined_js} JS into {html_file}",
                author_name=gource_bundler,
            )
            if commit_ok:
                self.metrics.total_commits += 1

            self._emit("bundler_done", {
                "status": "complete",
                "output_file": html_file,
                "inlined_css": inlined_css,
                "inlined_js": inlined_js,
                "content_length": len(bundled),
                "files_removed": len(source_paths) - 1,
            })

        except Exception as e:
            logger.error("Bundler commit failed: %s", e)
            self._phase_terminal("bundler_done", str(e))

    # ------------------------------------------------------------------
    # Main run loop
    # ------------------------------------------------------------------

    async def run(self, spec: str) -> RunMetrics:
        """Execute the full orchestration loop for a given project spec."""
        logger.info("=== OnePromptAI Run Starting ===")
        self._emit("run_start", {
            "spec_preview": spec[:200],
            "template": self.config.template or "(none)",
            "vault": self.vault.vault_path.name if self.vault and self.vault.available else "(disabled)",
        })

        if self.vault and self.vault.available:
            vault_count = self.vault.file_count()
            self._emit("vault_loaded", {"path": str(self.vault.vault_path), "files": vault_count})
            logger.info("Vault loaded: %d files from %s", vault_count, self.vault.vault_path)

        self.db.connect()

        if not self.git.clone_or_pull():
            self._emit("error", {"message": "Failed to clone/pull target repo"})
            raise RuntimeError("Cannot access target repository")

        file_tree = self.git.get_file_tree()
        self._emit("repo_ready", {"files": file_tree[:500]})

        # ── Smart phase selection ─────────────────────────────────────
        self._phase_overrides = await self._select_phases(spec)
        active = [k for k, v in self._phase_overrides.items() if v]
        skipped = [k for k, v in self._phase_overrides.items() if not v]
        self._emit("phases_selected", {"active": active, "skipped": skipped})
        logger.info("Active SDLC phases: %s | Skipped: %s", active, skipped)

        # ── Phase 1: Planning ─────────────────────────────────────────
        self._emit("phase", {"name": "planning"})
        tasks = await self.planner.plan(spec, file_tree)

        if not tasks:
            self._emit("error", {"message": "Planner returned no tasks"})
            return self.metrics

        all_tasks: list[Task] = []
        for task in tasks:
            should_decompose = (
                len(task.scope) > 1
                or task.priority <= 3
                or len(task.description) > 200
            )
            if should_decompose:
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

        # ── Phase 1b: Architect ───────────────────────────────────────
        all_tasks = await self._run_architect_phase(all_tasks, file_tree)

        self.task_queue.add_tasks(all_tasks)
        self.metrics.total_tasks = self.task_queue.total_count
        self._emit("tasks_queued", {"count": self.metrics.total_tasks})

        # ── Phase 2: Execution ────────────────────────────────────────
        self._emit("phase", {"name": "execution"})
        worker_sem = asyncio.Semaphore(self.config.worker.max_workers)

        pushed_branches: list[str] = []

        max_worker_attempts = 3 if self.config.orchestrator.strict_sdlc else 2
        w_back = self.config.worker.retry_backoff_sec

        async def run_worker(task: Task) -> None:
            async with worker_sem:
                worker_id = f"w-{task.id}"
                branch_name = task.branch or f"worker/{task.id}"
                handoff: Handoff | None = None

                for attempt in range(1, max_worker_attempts + 1):
                    try:
                        wt_git = await asyncio.to_thread(self.sandbox.create_worktree, branch_name)
                    except Exception as wt_err:
                        logger.error(
                            "[%s] Worktree creation failed (attempt %d): %s",
                            worker_id, attempt, wt_err,
                        )
                        if attempt < max_worker_attempts:
                            self._emit("worker_retry", {
                                "worker": worker_id, "task": task.id,
                                "attempt": attempt, "reason": f"worktree: {wt_err}",
                            })
                            await asyncio.sleep(w_back * attempt)
                            continue
                        fail_handoff = Handoff(
                            status="failed",
                            summary=f"Worktree creation failed after {attempt} attempts: {wt_err}",
                            concerns=[str(wt_err)],
                        )
                        self.task_queue.fail_task(task.id, fail_handoff)
                        self.metrics.failed_tasks += 1
                        self._emit("worker_done", {
                            "worker": worker_id, "task": task.id,
                            "status": "failed",
                            "summary": f"Worktree creation failed: {wt_err}",
                            "files_changed": [], "committed": False,
                        })
                        return

                    gource_name = f"Worker {task.id}" if self.config.gource_agent_ids else None
                    worker = Worker(
                        worker_id, self.llm, wt_git, self._worker_prompt,
                        sandboxed=True,
                        gource_name=gource_name,
                    )
                    if attempt == 1:
                        self._agents.append(worker.state)
                    self.metrics.agents_active += 1

                    self._emit("worker_start", {
                        "worker": worker_id,
                        "task": task.id,
                        "role": "worker",
                        "sandboxed": True,
                    })

                    handoff = await worker.execute(task)
                    self.metrics.agents_active -= 1
                    self.metrics.total_tokens = self.llm.total_tokens

                    await asyncio.to_thread(self.sandbox.remove_worktree, branch_name)

                    if handoff.status == "complete":
                        break
                    if handoff.status == "partial":
                        if not self.config.orchestrator.strict_sdlc:
                            break
                        if attempt < max_worker_attempts:
                            logger.warning(
                                "[%s] Partial handoff (attempt %d/%d) — retrying for full completion",
                                worker_id, attempt, max_worker_attempts,
                            )
                            self._emit("worker_retry", {
                                "worker": worker_id,
                                "task": task.id,
                                "attempt": attempt,
                                "reason": "partial handoff — strict SDLC requires complete",
                            })
                            await asyncio.sleep(w_back * attempt)
                            continue
                        break

                    if attempt < max_worker_attempts:
                        logger.warning(
                            "[%s] Worker failed (attempt %d/%d): %s — retrying",
                            worker_id, attempt, max_worker_attempts, handoff.summary[:200],
                        )
                        self._emit("worker_retry", {
                            "worker": worker_id, "task": task.id,
                            "attempt": attempt,
                            "reason": handoff.summary[:300],
                        })
                        await asyncio.sleep(w_back * attempt)
                    else:
                        logger.error(
                            "[%s] Worker failed after %d attempts: %s",
                            worker_id, max_worker_attempts, handoff.summary[:200],
                        )

                if handoff and handoff.committed:
                    pushed_branches.append(branch_name)

                accept_partial = (
                    handoff
                    and handoff.status == "partial"
                    and not self.config.orchestrator.strict_sdlc
                )
                if handoff and (
                    handoff.status == "complete"
                    or accept_partial
                ):
                    self.task_queue.complete_task(task.id, handoff)
                    self.metrics.completed_tasks += 1
                    self.merge_queue.enqueue(task)
                else:
                    if handoff:
                        self._run_errors.append(f"Task {task.id} failed: {handoff.summary[:200]}")
                    self.task_queue.fail_task(task.id, handoff)
                    self.metrics.failed_tasks += 1

                wd_status = handoff.status if handoff else "failed"
                if (
                    handoff
                    and handoff.status == "partial"
                    and self.config.orchestrator.strict_sdlc
                    and not accept_partial
                ):
                    wd_status = "failed"
                if handoff and handoff.status == "blocked":
                    wd_status = "failed"
                self._emit("worker_done", {
                    "worker": worker_id,
                    "task": task.id,
                    "status": wd_status,
                    "summary": (handoff.summary[:2000] if handoff else "No handoff"),
                    "files_changed": handoff.files_changed if handoff else [],
                    "committed": handoff.committed if handoff else False,
                })

        worker_tasks: list[asyncio.Task] = []
        while not self.task_queue.is_all_done() and not self._stop:
            next_task = self.task_queue.get_next()
            if next_task is None:
                if worker_tasks:
                    await asyncio.gather(*worker_tasks)
                    worker_tasks.clear()

                    if self.task_queue.is_all_done():
                        break

                    replan_ctx = self.task_queue.get_replan_context()
                    if replan_ctx:
                        file_tree = self.git.get_file_tree()
                        new_tasks = await self.planner.plan(spec, file_tree, replan_ctx)
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

        # ── Phase 3: Merge (with conflict rework) ─────────────────────
        self._emit("phase", {"name": "merging"})
        await self._merge_and_rework(run_worker)

        if self.config.orchestrator.recovery_max_rounds > 0:
            await self._run_failure_recovery(spec, run_worker)

        # ── Phase 3b: Integration (fix cross-file references) ─────────
        file_tree = self.git.get_file_tree()
        await self._run_integration_phase(file_tree)

        completed_task_list = [
            tobj for tobj in self.task_queue._tasks.values()
            if tobj.handoff and tobj.handoff.status in ("complete", "partial")
        ]

        # ── Phase 4: Code Review (on merged main) ────────────────────
        approved_tasks, rework_tasks = await self._run_review_phase(completed_task_list)

        if rework_tasks:
            self.task_queue.add_tasks(rework_tasks)
            self.metrics.total_tasks = self.task_queue.total_count
            self._emit("rework_dispatched", {"count": len(rework_tasks)})

            rework_workers = [asyncio.create_task(run_worker(rt)) for rt in rework_tasks]
            await asyncio.gather(*rework_workers)

            self._emit("phase", {"name": "rework_merge"})
            await self._merge_and_rework(run_worker)

        # ── Phase 5: QA Testing (on merged main) ─────────────────────
        file_tree = self.git.get_file_tree()
        await self._run_qa_phase(file_tree)

        # ── Phase 5b: Sandbox Execution (run build + tests) ──────────
        sandbox_fix_tasks = await self._run_sandbox_execution_phase()
        if sandbox_fix_tasks:
            self.task_queue.add_tasks(sandbox_fix_tasks)
            self.metrics.total_tasks = self.task_queue.total_count
            self._emit("sandbox_fixes_dispatched", {"count": len(sandbox_fix_tasks)})
            fix_workers = [asyncio.create_task(run_worker(ft)) for ft in sandbox_fix_tasks]
            await asyncio.gather(*fix_workers)
            await self._merge_and_rework(run_worker)

        # ── Phase 6: Security Audit ───────────────────────────────────
        file_tree = self.git.get_file_tree()
        security_fix_tasks = await self._run_security_phase(file_tree)

        if security_fix_tasks:
            self.task_queue.add_tasks(security_fix_tasks)
            self.metrics.total_tasks = self.task_queue.total_count
            self._emit("security_fixes_dispatched", {"count": len(security_fix_tasks)})

            sec_workers = [asyncio.create_task(run_worker(ft)) for ft in security_fix_tasks]
            await asyncio.gather(*sec_workers)

            await self._merge_and_rework(run_worker)

        # ── Phase 7: Reconciliation ──────────────────────────────────
        if self.config.orchestrator.finalization_enabled:
            self._emit("phase", {"name": "reconciliation"})
            for attempt in range(self.config.orchestrator.finalization_max_attempts):
                fix_tasks = await self.reconciler.sweep()
                if not fix_tasks:
                    self._emit("reconciler_green", {"attempt": attempt + 1})
                    break

                self.task_queue.add_tasks(fix_tasks)
                self.metrics.total_tasks = self.task_queue.total_count
                self._emit("reconciler_fixes_dispatched", {"count": len(fix_tasks)})
                fix_workers = [
                    asyncio.create_task(run_worker(ft)) for ft in fix_tasks
                ]
                await asyncio.gather(*fix_workers)
                await self._merge_and_rework(run_worker)

        # ── Phase 8: Bundler (single-file projects) ──────────────────
        file_tree = self.git.get_file_tree()
        await self._run_bundler_phase(spec, file_tree)

        # ── Phase 9: DevOps ──────────────────────────────────────────
        file_tree = self.git.get_file_tree()
        await self._run_devops_phase(file_tree)

        # ── Final push + cleanup ─────────────────────────────────────
        self.git.checkout_main()
        url = self.config.git.authenticated_url
        self.git._run("push", url, f"HEAD:refs/heads/{self.config.git.main_branch}")

        if pushed_branches:
            self._emit("branch_cleanup", {"count": len(pushed_branches)})
            self._cleanup_remote_branches(pushed_branches)

        self.sandbox.cleanup_all()

        # Align run metrics with authoritative task queue (fixes completed > total in summary)
        self.metrics.total_tasks = self.task_queue.total_count
        self.metrics.completed_tasks = self.task_queue.completed_count
        self.metrics.failed_tasks = self.task_queue.failed_count
        self.metrics.failed_task_ids = [
            t.id for t in self.task_queue.get_all_tasks()
            if t.status == TaskStatus.FAILED
        ]

        self._emit("run_complete", {
            "total_tasks": self.metrics.total_tasks,
            "completed": self.metrics.completed_tasks,
            "failed": self.metrics.failed_tasks,
            "failed_task_ids": self.metrics.failed_task_ids,
            "commits": self.metrics.total_commits,
            "tokens": self.metrics.total_tokens,
            "elapsed": self.metrics.elapsed_seconds,
            "strict_phase_errors": self.metrics.strict_phase_errors,
        })

        self.db.save_run_metrics({
            "run_id": self.metrics.run_id,
            "started_at": self.metrics.started_at,
            "completed_at": time.time(),
            **self.metrics.__dict__,
        })

        # ── Phase 10: Vault Memory Write ─────────────────────────────
        if self.vault:
            try:
                self.vault.write_run_summary(
                    run_id=self.metrics.run_id,
                    metrics=self.metrics.__dict__,
                    decisions=self._architect_decisions[:10],
                    errors=self._run_errors[:10],
                )
                self._emit("vault_write", {"status": "complete"})
            except Exception as e:
                logger.warning("Vault write failed: %s", e)

        logger.info("=== OnePromptAI Run Complete ===")
        return self.metrics

    def stop(self) -> None:
        self._stop = True
        logger.info("Stop requested — finishing active workers...")
