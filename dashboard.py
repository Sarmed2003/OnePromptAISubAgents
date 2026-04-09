"""Rich-powered terminal dashboard replicating the Longshot AGENTSWARM UI.

Layout matches the Longshot Rich terminal exactly:
- Header: title, timer, active agents, commits/hr
- Left: METRICS panel with key stats
- Center: Agent Grid with In Progress tree (planner → subplanner → worker)
- Right: Completed agents list
- Bottom-left: MERGE QUEUE with success bar
- Bottom-center: FEATURES/TASKS progress bar
- Bottom-right: CONTROLS info
"""

from __future__ import annotations

import json
import time
from typing import Any

from rich.console import Console, Group
from rich.layout import Layout
from rich.live import Live
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.columns import Columns
from rich import box


ROLE_STYLES = {
    "planner":    ("bold white",  "Planner"),
    "subplanner": ("dim white",   "SubPlanner"),
    "worker":     ("green",       "Worker"),
    "reconciler": ("magenta",     "Reconciler"),
    "architect":  ("bold blue",   "Architect"),
    "reviewer":   ("bold yellow", "Reviewer"),
    "qa_tester":  ("bold magenta","QA Tester"),
    "security":   ("bold red",    "Security"),
    "devops":     ("bold cyan",   "DevOps"),
    "integrator": ("bold white",  "Integrator"),
    "bundler":    ("bold white",  "Bundler"),
    "sandbox":    ("bold green",  "Sandbox"),
}


# ── Agent record stored per agent ────────────────────────────────────────────

class AgentRecord:
    __slots__ = (
        "agent_id", "role", "task_id", "status", "progress",
        "parent_id", "children", "started_at",
    )

    def __init__(
        self, agent_id: str, role: str = "worker", task_id: str = "",
        status: str = "running", parent_id: str | None = None,
    ):
        self.agent_id = agent_id
        self.role = role
        self.task_id = task_id
        self.status = status
        self.progress = 0
        self.parent_id = parent_id
        self.children: list[str] = []
        self.started_at = time.time()


# ── Dashboard ────────────────────────────────────────────────────────────────

class Dashboard:
    """Real-time terminal UI modeled after the Longshot AGENTSWARM interface."""

    def __init__(self):
        self.console = Console()
        self.started_at = time.time()

        self.iteration = 1
        self.commits = 0
        self.total_tasks = 0
        self.completed_tasks = 0
        self.failed_tasks = 0
        self.pending_tasks = 0
        self.in_progress_tasks = 0
        self.tokens = 0
        self.est_cost = 0.0
        self.merge_merged = 0
        self.merge_conflicts = 0
        self.merge_failed = 0
        self.agents_active = 0
        self.phase = "initializing"

        self.agents: dict[str, AgentRecord] = {}
        self.activity_log: list[str] = []  # trimmed in _log(); bounded to 200 entries
        self.template_name: str = ""
        self.vault_files: int = 0
        self.strict_phase_errors: int = 0

    def _effective_task_total(self) -> int:
        """Task count for progress bars when orchestrator adds tasks without resending tasks_queued."""
        finished = self.completed_tasks + self.failed_tasks
        return max(self.total_tasks, finished, 1)

    # ── Event processing ─────────────────────────────────────────────────

    def process_event(self, event: dict[str, Any]) -> None:
        etype = event.get("type", "")
        data = event.get("data", {})

        if etype == "run_start":
            tmpl = data.get("template", "")
            if tmpl and tmpl != "(none)":
                self.template_name = tmpl
                self._log(f"[bold green]Run started[/] — template: [bold cyan]{tmpl}[/]")
            else:
                self._log("[bold green]Run started[/]")

        elif etype == "phase":
            self.phase = data.get("name", "unknown")
            self._log(f"[cyan]Phase: {self.phase}[/]")

        elif etype == "llm_busy":
            phase = data.get("phase", "?")
            detail = (data.get("detail") or "").strip()
            if detail:
                self._log(f"[dim]LLM · {phase}[/] — {detail}")
            else:
                self._log(f"[dim]LLM · {phase}[/] (still working — workers start after planning)")

        elif etype == "planner_done":
            n = data.get("task_count", 0)
            self._log(f"[bold green]Planner[/] returned [bold]{n}[/] top-level task(s); subplanner/architect next")

        elif etype == "repo_ready":
            tc = data.get("tree_chars")
            if tc is not None:
                self._log(f"[dim]Repo file tree for LLM: {tc} chars (truncation via MAX_FILE_TREE_LINES)[/]")

        elif etype == "phases_selected":
            active = data.get("active", [])
            skipped = data.get("skipped", [])
            if active:
                labels = ", ".join(active)
                self._log(f"[bold green]Active agents[/] {labels}")
            if skipped:
                labels = ", ".join(skipped)
                self._log(f"[dim]Skipped agents (not needed): {labels}[/]")

        elif etype == "tasks_queued":
            count = data.get("count", 0)
            self.total_tasks = count
            self.pending_tasks = count
            self._log(f"[yellow]{count} tasks queued[/]")

        # ── Architect events ──────────────────────────────────────────
        elif etype == "architect_start":
            rec = AgentRecord(agent_id="architect", role="architect", task_id="architecture", status="running")
            self.agents["architect"] = rec
            self.agents_active += 1
            self._log(f"[bold blue]Architect[/] analyzing {data.get('task_count', '?')} tasks")

        elif etype == "architect_done":
            astatus = data.get("status", "complete")
            if "architect" in self.agents:
                self.agents["architect"].status = astatus
                self.agents["architect"].progress = 100
            self.agents_active = max(0, self.agents_active - 1)
            enriched = data.get("tasks_enriched", 0)
            pattern = data.get("architecture_pattern", "")
            if astatus == "error":
                self._log(
                    f"[bold red]Architect[/] error — {data.get('error', '?')}"
                )
            elif astatus == "skipped":
                self._log(
                    f"[dim]Architect[/] skipped — {data.get('reason', '?')}"
                )
            else:
                self._log(
                    f"[bold blue]Architect[/] done — enriched {enriched} tasks, pattern: {pattern}"
                )

        # ── Worker events ─────────────────────────────────────────────
        elif etype == "worker_start":
            wid = data.get("worker", "?")
            tid = data.get("task", "?")
            role = data.get("role", "worker")

            if role == "worker" and not data.get("role"):
                if "sub" in tid:
                    role = "subplanner"
                elif "planner" in wid or tid.count("-") <= 1:
                    role = "planner"

            rec = AgentRecord(agent_id=wid, role=role, task_id=tid, status="running")
            self.agents[wid] = rec
            self.agents_active = sum(1 for a in self.agents.values() if a.status == "running")
            self.in_progress_tasks += 1
            self.pending_tasks = max(0, self.pending_tasks - 1)

            style, label = ROLE_STYLES.get(role, ("green", "Worker"))
            self._log(f"[{style}]{label}[/] {wid} started {tid}")

        elif etype == "worker_retry":
            wid = data.get("worker", "?")
            attempt = data.get("attempt", 1)
            reason = (data.get("reason") or "unknown")[:200]
            self._log(f"[yellow]{wid}[/] retry {attempt} — {reason}")

        elif etype == "worker_done":
            wid = data.get("worker", "?")
            status = data.get("status", "?")
            if wid in self.agents:
                self.agents[wid].status = status
                self.agents[wid].progress = 100
            self.in_progress_tasks = max(0, self.in_progress_tasks - 1)
            self.agents_active = sum(1 for a in self.agents.values() if a.status == "running")
            if status in ("complete", "partial"):
                self.completed_tasks += 1
                self._log(f"[green]{wid}[/] {status}")
            else:
                self.failed_tasks += 1
                self._log(f"[red]{wid}[/] {status}")
            summ = (data.get("summary") or "").strip()
            if summ:
                one_line = summ.replace("\n", " ")[:280]
                self._log(f"[dim]  {one_line}[/]")
            paths = data.get("files_changed") or []
            if isinstance(paths, list) and paths:
                plist = ", ".join(str(p) for p in paths[:12])
                extra = f" (+{len(paths) - 12} more)" if len(paths) > 12 else ""
                self._log(f"[cyan]  files[/] {plist}{extra}")
            committed = data.get("committed")
            if committed is False and status in ("complete", "partial"):
                self._log("[yellow]  no successful git commit — merge may be skipped[/]")

        # ── Review events ─────────────────────────────────────────────
        elif etype == "review_start":
            rec = AgentRecord(agent_id="reviewer", role="reviewer", task_id="code-review", status="running")
            self.agents["reviewer"] = rec
            self.agents_active += 1
            self._log(f"[bold yellow]Code Reviewer[/] reviewing {data.get('task_count', '?')} branches")

        elif etype == "review_verdict":
            verdict = data.get("verdict", "?")
            tid = data.get("task", "?")
            summary = data.get("summary", "")[:120]
            if verdict == "approve":
                self._log(f"[green]Review[/] {tid}: approved — {summary}")
            else:
                issues = data.get("issues", 0)
                self._log(f"[yellow]Review[/] {tid}: changes requested ({issues} issues) — {summary}")

        elif etype == "review_done":
            rstatus = data.get("status", "complete")
            if "reviewer" in self.agents:
                self.agents["reviewer"].status = rstatus
                self.agents["reviewer"].progress = 100
            self.agents_active = max(0, self.agents_active - 1)
            if rstatus == "error":
                self._log(
                    f"[bold red]Code Reviewer[/] error — {data.get('error', '?')}"
                )
            elif rstatus == "skipped":
                self._log(
                    f"[dim]Code Reviewer[/] skipped — {data.get('reason', '?')}"
                )
            else:
                self._log(
                    f"[bold yellow]Code Reviewer[/] done — approved: {data.get('approved', 0)}, rework: {data.get('rework', 0)}"
                )

        elif etype == "rework_dispatched":
            count = data.get("count", 0)
            self.total_tasks += count
            self.pending_tasks += count
            self._log(f"[yellow]Rework[/] dispatched {count} tasks for fixes")

        elif etype == "recovery_dispatched":
            count = data.get("count", 0)
            rnd = data.get("round", 1)
            self.total_tasks += count
            self.pending_tasks += count
            self._log(f"[yellow]Recovery[/] round {rnd}: dispatched {count} tasks for prior failures")

        elif etype == "conflict_rework":
            count = data.get("count", 0)
            missed = data.get("missed_tasks", count)
            strategy = data.get("strategy", "per-task")
            self.total_tasks += count
            self.pending_tasks += count
            if strategy == "consolidation":
                self._log(f"[yellow]Consolidation[/] merging {missed} conflicting branches into 1 unified task")
            elif strategy.startswith("consolidation-retry"):
                self._log(f"[yellow]Consolidation retry[/] ({strategy}) for {missed} conflicting branches")
            else:
                self._log(f"[red]Merge Conflicts[/] dispatched {count} conflict-fix tasks")

        # ── QA events ─────────────────────────────────────────────────
        elif etype == "qa_start":
            rec = AgentRecord(agent_id="qa-tester", role="qa_tester", task_id="test-generation", status="running")
            self.agents["qa-tester"] = rec
            self.agents_active += 1
            self._log(f"[bold magenta]QA Tester[/] generating tests for {data.get('task_count', '?')} tasks")

        elif etype == "qa_done":
            qstatus = data.get("status", "complete")
            if "qa-tester" in self.agents:
                self.agents["qa-tester"].status = qstatus
                self.agents["qa-tester"].progress = 100
            self.agents_active = max(0, self.agents_active - 1)
            test_files = data.get("test_files", 0)
            files = data.get("files", [])
            if qstatus == "error":
                self._log(f"[bold red]QA Tester[/] error — {data.get('error', '?')}")
            elif qstatus == "skipped":
                self._log(f"[dim]QA Tester[/] skipped — {data.get('reason', '?')}")
            else:
                self._log(f"[bold magenta]QA Tester[/] done — {test_files} test files generated")
                if files:
                    self._log(f"[cyan]  test files[/] {', '.join(str(f) for f in files[:8])}")

        # ── Security events ───────────────────────────────────────────
        elif etype == "security_start":
            rec = AgentRecord(agent_id="security", role="security", task_id="security-audit", status="running")
            self.agents["security"] = rec
            self.agents_active += 1
            self._log("[bold red]Security Auditor[/] scanning codebase")

        elif etype == "security_finding":
            sev = data.get("severity", "?")
            title = data.get("title", "?")
            fpath = data.get("file", "")
            sev_style = {"critical": "bold red", "high": "red", "medium": "yellow", "low": "dim"}.get(sev, "dim")
            self._log(f"[{sev_style}]  [{sev.upper()}][/] {title} ({fpath})")

        elif etype == "security_done":
            sstatus = data.get("status", "complete")
            if "security" in self.agents:
                self.agents["security"].status = sstatus
                self.agents["security"].progress = 100
            self.agents_active = max(0, self.agents_active - 1)
            risk = data.get("risk_level", "?")
            total = data.get("total_findings", 0)
            critical = data.get("critical", 0)
            high = data.get("high", 0)
            if sstatus == "error":
                self._log(f"[bold red]Security Auditor[/] error — {data.get('error', '?')}")
            elif sstatus == "skipped":
                self._log(f"[dim]Security Auditor[/] skipped — {data.get('reason', '?')}")
            else:
                self._log(
                    f"[bold red]Security Auditor[/] done — risk: {risk}, findings: {total} (critical: {critical}, high: {high})"
                )

        elif etype == "security_fixes_dispatched":
            count = data.get("count", 0)
            self.total_tasks += count
            self.pending_tasks += count
            self._log(f"[red]Security[/] dispatched {count} fix tasks")

        elif etype == "reconciler_fixes_dispatched":
            count = data.get("count", 0)
            self.total_tasks += count
            self.pending_tasks += count
            self._log(f"[yellow]Reconciler[/] dispatched {count} fix tasks")

        # ── DevOps events ─────────────────────────────────────────────
        elif etype == "devops_start":
            rec = AgentRecord(agent_id="devops", role="devops", task_id="ci-cd", status="running")
            self.agents["devops"] = rec
            self.agents_active += 1
            self._log("[bold cyan]DevOps Engineer[/] generating deployment configs")

        elif etype == "devops_done":
            dstatus = data.get("status", "complete")
            if "devops" in self.agents:
                self.agents["devops"].status = dstatus
                self.agents["devops"].progress = 100
            self.agents_active = max(0, self.agents_active - 1)
            files = data.get("files_generated", [])
            if dstatus == "error":
                err = (data.get("error") or "").strip()
                self._log(f"[bold red]DevOps Engineer[/] error — {err[:300]}")
            elif dstatus == "skipped":
                self._log(
                    f"[dim]DevOps Engineer[/] skipped — {data.get('reason', '?')}"
                )
            else:
                self._log(f"[bold cyan]DevOps Engineer[/] done — {len(files)} files generated")
                if files:
                    self._log(
                        f"[cyan]  infra files[/] {', '.join(str(f) for f in files[:8])}"
                    )

        # ── Integration events ────────────────────────────────────────
        elif etype == "integration_start":
            rec = AgentRecord(agent_id="integrator", role="integrator", task_id="integration", status="running")
            self.agents["integrator"] = rec
            self.agents_active += 1
            self._log("[bold white]Integrator[/] fixing cross-file references")

        elif etype == "integration_done":
            istatus = data.get("status", "complete")
            if "integrator" in self.agents:
                self.agents["integrator"].status = istatus
                self.agents["integrator"].progress = 100
            self.agents_active = max(0, self.agents_active - 1)
            fixed = data.get("files_fixed", 0)
            files = data.get("files", [])
            if istatus == "error":
                self._log(f"[bold red]Integrator[/] error — {data.get('error', '?')}")
            elif istatus == "skipped":
                self._log(f"[dim]Integrator[/] skipped — {data.get('reason', '?')}")
            elif fixed:
                self._log(f"[bold white]Integrator[/] done — fixed {fixed} files: {', '.join(str(f) for f in files[:5])}")
            else:
                self._log(f"[bold white]Integrator[/] complete — no fixes needed")

        # ── Bundler events ───────────────────────────────────────────
        elif etype == "bundler_start":
            rec = AgentRecord(agent_id="bundler", role="bundler", task_id="bundle", status="running")
            self.agents["bundler"] = rec
            self.agents_active += 1
            self._log("[bold white]Bundler[/] combining modules into single output file")

        elif etype == "bundler_done":
            bstatus = data.get("status", "complete")
            if "bundler" in self.agents:
                self.agents["bundler"].status = bstatus
                self.agents["bundler"].progress = 100
            self.agents_active = max(0, self.agents_active - 1)
            output = data.get("output_file", "")
            css_count = data.get("inlined_css", 0)
            js_count = data.get("inlined_js", 0)
            if bstatus == "error":
                self._log(f"[bold red]Bundler[/] error — {data.get('error', '?')}")
            elif bstatus == "skipped":
                self._log(f"[dim]Bundler[/] skipped — {data.get('reason', '?')}")
            elif output:
                self._log(f"[bold white]Bundler[/] done — inlined {css_count} CSS + {js_count} JS → {output}")
            else:
                reason = data.get("reason", data.get("status", "skipped"))
                self._log(f"[bold white]Bundler[/] {reason}")

        # ── Sandbox Execution events ──────────────────────────────────
        elif etype == "sandbox_exec_start":
            rec = AgentRecord(agent_id="sandbox", role="sandbox", task_id="sandbox-exec", status="running")
            self.agents["sandbox"] = rec
            self.agents_active += 1
            self._log("[bold green]Sandbox[/] executing build + tests")

        elif etype == "sandbox_exec_build":
            exit_code = data.get("exit_code", -1)
            status = "[green]pass[/]" if exit_code == 0 else "[yellow]fail[/]"
            self._log(f"[bold green]Sandbox[/] build: {status}")

        elif etype == "sandbox_exec_test":
            exit_code = data.get("exit_code", -1)
            status = "[green]pass[/]" if exit_code == 0 else "[yellow]fail[/]"
            self._log(f"[bold green]Sandbox[/] tests: {status}")

        elif etype == "sandbox_exec_done":
            if "sandbox" in self.agents:
                self.agents["sandbox"].status = data.get("status", "complete")
                self.agents["sandbox"].progress = 100
            self.agents_active = max(0, self.agents_active - 1)
            build_s = data.get("build", "?")
            test_s = data.get("tests", "?")
            fix_count = data.get("fix_tasks", 0)
            self._log(f"[bold green]Sandbox[/] done — build: {build_s}, tests: {test_s}, fix tasks: {fix_count}")

        elif etype == "sandbox_fixes_dispatched":
            count = data.get("count", 0)
            self.total_tasks += count
            self.pending_tasks += count
            self._log(f"[bold green]Sandbox[/] dispatched {count} fix tasks")

        # ── Vault events ─────────────────────────────────────────────
        elif etype == "vault_loaded":
            self.vault_files = data.get("files", 0)
            path = data.get("path", "")
            self._log(f"[dim]Vault[/] loaded {self.vault_files} docs from {path}")

        elif etype == "vault_write":
            self._log("[dim]Vault[/] run summary saved")

        # ── Merge events ──────────────────────────────────────────────
        elif etype == "merge":
            branch = data.get("branch", "?")
            err = (data.get("error") or "").strip()
            if data.get("success"):
                self.merge_merged += 1
                self.commits += 1
                self._log(f"[green]Merged[/] {branch}")
            elif data.get("conflict"):
                self.merge_conflicts += 1
                detail = f" — {err[:160]}" if err else ""
                self._log(f"[red]Conflict[/] {branch}{detail}")
            else:
                self.merge_failed += 1
                detail = f": {err[:200]}" if err else ""
                self._log(f"[red]Merge failed[/] {branch}{detail}")

        elif etype == "merge_summary":
            self.merge_merged = max(self.merge_merged, data.get("merged", 0))
            self.merge_conflicts = max(self.merge_conflicts, data.get("conflicts", 0))
            self.merge_failed = max(self.merge_failed, data.get("failed", 0))
            self.commits = max(self.commits, self.merge_merged)
            total = data.get("total", 0)
            self._log(f"[bold green]Merge complete[/] {self.merge_merged}/{total} merged, {self.merge_conflicts} conflicts")

        elif etype == "subplan":
            parent = data.get("parent", "?")
            subs = data.get("subtasks", [])
            self._log(f"[cyan]Subplan[/] {parent} → {len(subs)} sub")

        elif etype == "replan":
            new = data.get("new_tasks", 0)
            self.total_tasks += new
            self.pending_tasks += new
            self.iteration += 1
            self._log(f"[cyan]Replan[/] iteration {self.iteration}: +{new}")

        elif etype == "reconciler_green":
            self._log("[green]Reconciler[/] all green")

        elif etype == "branch_cleanup":
            count = data.get("count", 0)
            self._log(f"[dim]Cleaning up {count} remote worker branches[/]")

        elif etype == "run_complete":
            self.total_tasks = data.get("total_tasks", self.total_tasks)
            self.completed_tasks = data.get("completed", self.completed_tasks)
            self.failed_tasks = data.get("failed", self.failed_tasks)
            self.tokens = data.get("tokens", self.tokens)
            self.strict_phase_errors = data.get("strict_phase_errors", 0)
            self._log("[bold green]Run complete![/]")
            ft_ids = data.get("failed_task_ids") or []
            if self.failed_tasks and ft_ids:
                shown = ", ".join(str(x) for x in ft_ids[:12])
                more = len(ft_ids) - 12
                if more > 0:
                    shown += f" (+{more} more)"
                self._log(f"[red]Failed task IDs:[/] {shown}")
            if self.strict_phase_errors:
                self._log(
                    f"[yellow]Strict SDLC: {self.strict_phase_errors} phase error(s) — see Activity log[/]"
                )

        elif etype == "error":
            self._log(f"[bold red]Error:[/] {data.get('message', '?')}")
            if data.get("hint"):
                self._log(f"[dim]{data['hint']}[/]")

        elif etype == "planner_retry":
            self._log("[yellow]Planner returned no tasks — retrying with nudge…[/]")

    def _log(self, message: str) -> None:
        elapsed = time.time() - self.started_at
        ts = f"{elapsed:6.1f}s"
        self.activity_log.append(f"[dim]{ts}[/dim] {message}")
        if len(self.activity_log) > 200:
            self.activity_log = self.activity_log[-100:]

    # ── Layout ───────────────────────────────────────────────────────────

    def render(self) -> Layout:
        layout = Layout()
        layout.split_column(
            Layout(name="header", size=3),
            Layout(name="tabs", size=1),
            Layout(name="body"),
            Layout(name="footer", size=7),
        )

        layout["body"].split_row(
            Layout(name="metrics", size=28),
            Layout(name="in_progress", ratio=3),
            Layout(name="completed", ratio=2),
        )

        layout["footer"].split_row(
            Layout(name="merge_queue", size=28),
            Layout(name="features_bar", ratio=2),
            Layout(name="controls", ratio=1),
        )

        layout["header"].update(self._render_header())
        layout["tabs"].update(self._render_tabs())
        layout["metrics"].update(self._render_metrics())
        layout["in_progress"].update(self._render_in_progress())
        layout["completed"].update(self._render_completed())
        layout["merge_queue"].update(self._render_merge_queue())
        layout["features_bar"].update(self._render_features_bar())
        layout["controls"].update(self._render_controls())

        return layout

    # ── Header ───────────────────────────────────────────────────────────

    def _render_header(self) -> Panel:
        elapsed = time.time() - self.started_at
        h, rem = divmod(int(elapsed), 3600)
        m, s = divmod(rem, 60)
        time_str = f"{h:02d}:{m:02d}:{s:02d}"

        cph = self.commits / (elapsed / 3600) if elapsed > 60 else 0

        t = Text()
        t.append(" AGENTSWARM ", style="bold black on green")
        if self.template_name:
            t.append(f" [{self.template_name}] ", style="bold cyan")
        t.append(f"  {time_str} ", style="bold white")
        t.append("    ")
        t.append(f"{self.agents_active} agents in parallel", style="white")
        if self.vault_files:
            t.append(f"  vault: {self.vault_files} docs", style="dim")

        right = Text(f"{cph:,.0f} commits/hr", style="bold white")
        right.justify = "right"

        table = Table(show_header=False, box=None, expand=True, padding=0)
        table.add_column(ratio=3)
        table.add_column(ratio=1, justify="right")
        table.add_row(t, right)

        return Panel(table, style="green", box=box.HEAVY)

    # ── Tabs ─────────────────────────────────────────────────────────────

    def _render_tabs(self) -> Text:
        t = Text()
        t.append("                            ")
        t.append(" Agent Grid ", style="bold underline white")
        t.append("   ")
        t.append(" Activity ", style="dim white")
        return t

    # ── Metrics ──────────────────────────────────────────────────────────

    def _render_metrics(self) -> Panel:
        elapsed = time.time() - self.started_at
        cph = self.commits / (elapsed / 3600) if elapsed > 60 else 0
        total = self._effective_task_total()
        done = self.completed_tasks + self.failed_tasks
        pct = min(100, int(done / total * 100)) if total > 0 else 0
        merge_total = self.merge_merged + self.merge_conflicts + self.merge_failed
        merge_rate = (self.merge_merged / merge_total * 100) if merge_total > 0 else 0
        tokens_k = self.tokens / 1000

        tbl = Table(show_header=False, box=None, padding=(0, 1), expand=True)
        tbl.add_column("Key", style="bold white", min_width=12)
        tbl.add_column("Val", justify="right", style="white", min_width=10)

        tbl.add_row("Iteration", str(self.iteration))
        tbl.add_row("Commits/hr", f"{cph:,.0f}")
        tbl.add_row(
            f"[yellow]${self.est_cost:.2f}[/yellow]",
            "[dim]Est. cost[/dim]",
        )
        tbl.add_row("Agents done", f"{done}/{total}")
        tbl.add_row("", f"[bold]{pct}%[/bold]")
        tbl.add_row("", "")
        tbl.add_row("Failed", f"[red]{self.failed_tasks}[/red]")
        if self.strict_phase_errors:
            tbl.add_row("Phase err", f"[red]{self.strict_phase_errors}[/red]")
        tbl.add_row("Pending", str(self.pending_tasks))
        tbl.add_row("Merge rate", f"[green]{merge_rate:.1f}%[/green]")
        tbl.add_row("Tokens", f"{tokens_k:,.1f}K")

        return Panel(tbl, title="[bold underline]METRICS[/bold underline]", border_style="green", box=box.ROUNDED)

    # ── In Progress ──────────────────────────────────────────────────────

    def _render_in_progress(self) -> Panel:
        text = Text()
        running = [a for a in self.agents.values() if a.status == "running"]
        running.sort(key=lambda a: a.started_at)

        if not running:
            text.append("  No agents running\n", style="dim")
        else:
            for i, agent in enumerate(running[:25]):
                self._render_agent_line(text, agent, indent=0)

        count = len(running)
        text.append(f"\n  1-{min(count,25)}/{count}", style="dim")
        text.append(" (u/d to scroll)", style="dim")

        return Panel(text, title="[bold]In Progress[/bold]", border_style="cyan", box=box.ROUNDED)

    # ── Completed ────────────────────────────────────────────────────────

    def _render_completed(self) -> Panel:
        text = Text()
        done = [
            a for a in self.agents.values()
            if a.status in ("complete", "partial", "failed", "blocked", "error", "skipped")
        ]
        done.sort(key=lambda a: a.started_at)

        if not done:
            text.append("  No completed agents\n", style="dim")
        else:
            for agent in done[:30]:
                self._render_agent_line(text, agent, indent=0)

        count = len(done)
        text.append(f"\n  1-{min(count,30)}/{count}", style="dim")
        text.append(" (u/d to scroll)", style="dim")

        return Panel(text, title="[bold]Completed[/bold]", border_style="green", box=box.ROUNDED)

    # ── Agent line renderer ──────────────────────────────────────────────

    def _render_agent_line(self, text: Text, agent: AgentRecord, indent: int = 0) -> None:
        prefix = "  " + "    " * indent

        role_style, role_label = ROLE_STYLES.get(agent.role, ("green", agent.role.title()))

        if agent.status == "running":
            bar_style = "yellow"
            bar = "━━━━"
            status_text = "running"
            pct = f"{agent.progress}%"
        elif agent.status == "complete":
            bar_style = "green"
            bar = "████"
            status_text = agent.status
            pct = "100%"
        elif agent.status == "skipped":
            bar_style = "dim"
            bar = "░░░░"
            status_text = "skipped"
            pct = "—"
        elif agent.status == "failed":
            bar_style = "red"
            bar = "████"
            status_text = "failed"
            pct = "100%"
        elif agent.status == "error":
            bar_style = "red"
            bar = "██░░"
            status_text = "error"
            pct = "100%"
        elif agent.status == "partial":
            bar_style = "yellow"
            bar = "██░░"
            status_text = "partial"
            pct = f"{agent.progress}%"
        elif agent.status == "blocked":
            bar_style = "red"
            bar = "░░░░"
            status_text = "blocked"
            pct = "0%"
        else:
            bar_style = "dim"
            bar = "░░░░"
            status_text = agent.status
            pct = "0%"

        text.append(prefix)
        text.append(bar, style=bar_style)
        text.append(f" {agent.agent_id}", style="bold white")
        text.append(f" ({role_label})", style=role_style)
        text.append(f" {status_text}", style=bar_style)
        text.append(f" {pct}", style="dim")
        text.append("\n")

    # ── Merge Queue ──────────────────────────────────────────────────────

    def _render_merge_queue(self) -> Panel:
        total = self.merge_merged + self.merge_conflicts + self.merge_failed
        success_pct = (self.merge_merged / total * 100) if total > 0 else 0

        tbl = Table(show_header=False, box=None, padding=(0, 1), expand=True)
        tbl.add_column("Key", style="bold white", min_width=12)
        tbl.add_column("Val", justify="right", min_width=8)

        bar_width = 12
        filled = int(success_pct / 100 * bar_width)
        bar = Text()
        bar.append("█" * filled, style="green")
        bar.append("░" * (bar_width - filled), style="dim")
        bar.append(f"  {success_pct:.0f}%", style="bold green")

        tbl.add_row(Text("Success", style="bold green"), bar)
        tbl.add_row("Merged", f"[white]{self.merge_merged}[/white]")
        tbl.add_row("Conflicts", f"[yellow]{self.merge_conflicts}[/yellow]")
        tbl.add_row("Failed", f"[red]{self.merge_failed}[/red]")

        return Panel(tbl, title="[bold green]MERGE QUEUE[/bold green]", border_style="green", box=box.ROUNDED)

    # ── Features / Tasks progress bar ────────────────────────────────────

    def _render_features_bar(self) -> Panel:
        total = self._effective_task_total()
        done = self.completed_tasks

        bar_width = 50
        filled_green = min(bar_width, int(done / total * bar_width)) if total else 0
        filled_yellow = min(
            bar_width - filled_green,
            int(self.in_progress_tasks / total * bar_width),
        ) if total else 0
        remaining = bar_width - filled_green - filled_yellow

        bar = Text()
        bar.append("  FEATURES  ", style="bold white")
        bar.append("█" * filled_green, style="green")
        bar.append("█" * filled_yellow, style="yellow")
        bar.append("░" * max(0, remaining), style="dim")
        bar.append(f"  {done}", style="bold white")
        bar.append(f"/{total}", style="dim white")
        if self.total_tasks == 0 and self.phase not in ("complete", "unknown"):
            bar.append("  (pre-worker: planning/LLM)", style="dim italic")

        return Panel(bar, border_style="green", box=box.ROUNDED)

    # ── Controls ─────────────────────────────────────────────────────────

    def _render_controls(self) -> Panel:
        t = Text()
        t.append("CONTROLS\n", style="bold underline white")
        if self.phase == "complete":
            t.append("Run finished — press Enter to exit\n", style="bold yellow")
            t.append("(or use --dashboard-auto-exit)\n", style="dim")
        else:
            t.append("Dashboard stays open until Enter\n", style="dim")
        t.append("+/- zoom levels\n", style="dim")
        t.append("tab=grid", style="dim")

        return Panel(t, border_style="dim", box=box.ROUNDED)


# ── Standalone NDJSON reader ─────────────────────────────────────────────────

def run_dashboard_from_stdin():
    """Read NDJSON events from stdin and render the dashboard."""
    import sys

    dashboard = Dashboard()

    with Live(
        dashboard.render(),
        console=dashboard.console,
        refresh_per_second=4,
        screen=True,
    ) as live:
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            try:
                event = json.loads(line)
                dashboard.process_event(event)
                live.update(dashboard.render())
            except json.JSONDecodeError:
                pass


if __name__ == "__main__":
    run_dashboard_from_stdin()
