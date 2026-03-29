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
        self.activity_log: list[str] = []

    # ── Event processing ─────────────────────────────────────────────────

    def process_event(self, event: dict[str, Any]) -> None:
        etype = event.get("type", "")
        data = event.get("data", {})

        if etype == "run_start":
            self._log(f"[bold green]Run started[/]")

        elif etype == "phase":
            self.phase = data.get("name", "unknown")
            self._log(f"[cyan]Phase: {self.phase}[/]")

        elif etype == "tasks_queued":
            count = data.get("count", 0)
            self.total_tasks = count
            self.pending_tasks = count
            self._log(f"[yellow]{count} tasks queued[/]")

        elif etype == "worker_start":
            wid = data.get("worker", "?")
            tid = data.get("task", "?")
            role = "worker"
            parent = None

            if "sub" in tid:
                role = "subplanner"
            if "planner" in wid or tid.count("-") <= 1:
                role = "planner"

            rec = AgentRecord(agent_id=wid, role=role, task_id=tid, status="running", parent_id=parent)
            self.agents[wid] = rec
            self.agents_active = sum(1 for a in self.agents.values() if a.status == "running")
            self.in_progress_tasks += 1
            self.pending_tasks = max(0, self.pending_tasks - 1)
            self._log(f"[green]{wid}[/] started {tid}")

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
                self._log(f"[green]{wid}[/] complete")
            else:
                self.failed_tasks += 1
                self._log(f"[red]{wid}[/] {status}")

        elif etype == "merge":
            branch = data.get("branch", "?")
            if data.get("success"):
                self.merge_merged += 1
                self.commits += 1
                self._log(f"[green]Merged[/] {branch}")
            elif data.get("conflict"):
                self.merge_conflicts += 1
                self._log(f"[red]Conflict[/] {branch}")
            else:
                self.merge_failed += 1

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
            self._log(f"[green]Reconciler[/] all green")

        elif etype == "run_complete":
            self.completed_tasks = data.get("completed", self.completed_tasks)
            self.failed_tasks = data.get("failed", self.failed_tasks)
            self.tokens = data.get("tokens", self.tokens)
            self._log(f"[bold green]Run complete![/]")

        elif etype == "error":
            self._log(f"[bold red]Error:[/] {data.get('message', '?')}")

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
        t.append(f"  {time_str} ", style="bold white")
        t.append("    ")
        t.append(f"{self.agents_active} agents in parallel", style="white")

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
        total = self.total_tasks or 1
        done = self.completed_tasks + self.failed_tasks
        pct = int(done / total * 100) if total > 0 else 0
        merge_total = self.merge_merged + self.merge_conflicts + self.merge_failed
        merge_rate = (self.merge_merged / merge_total * 100) if merge_total > 0 else 0
        tokens_k = self.tokens / 1000

        tbl = Table(show_header=False, box=None, padding=(0, 1), expand=True)
        tbl.add_column("Key", style="bold white", min_width=12)
        tbl.add_column("Val", justify="right", style="white", min_width=10)

        tbl.add_row("Iteration", str(self.iteration))
        tbl.add_row("Commits/hr", f"{cph:,.0f}")
        tbl.add_row("Agents done", f"{done}/{total}")
        tbl.add_row("", f"[bold]{pct}%[/bold]")
        tbl.add_row("", "")
        tbl.add_row("Failed", f"[red]{self.failed_tasks}[/red]")
        tbl.add_row("Pending", str(self.pending_tasks))
        tbl.add_row("Merge rate", f"[green]{merge_rate:.1f}%[/green]")
        tbl.add_row("Tokens", f"{tokens_k:,.1f}K")
        tbl.add_row("Est. cost", f"[yellow]${self.est_cost:.2f}[/yellow]")

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
        total_agents = len(self.agents)
        text.append(f"\n  1-{min(count,25)}/{count}", style="dim")
        text.append(" (u/d to scroll)", style="dim")

        return Panel(text, title="[bold]In Progress[/bold]", border_style="cyan", box=box.ROUNDED)

    # ── Completed ────────────────────────────────────────────────────────

    def _render_completed(self) -> Panel:
        text = Text()
        done = [
            a for a in self.agents.values()
            if a.status in ("complete", "partial", "failed", "blocked")
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

        if agent.status == "running":
            bar_style = "yellow"
            bar = "━━━━"
            status_text = "running"
            pct = f"{agent.progress}%"
        elif agent.status == "complete":
            bar_style = "green"
            bar = "████"
            status_text = "complete"
            pct = "100%"
        elif agent.status == "failed":
            bar_style = "red"
            bar = "████"
            status_text = "failed"
            pct = "100%"
        elif agent.status == "partial":
            bar_style = "yellow"
            bar = "██░░"
            status_text = "partial"
            pct = f"{agent.progress}%"
        else:
            bar_style = "dim"
            bar = "░░░░"
            status_text = agent.status
            pct = "0%"

        text.append(prefix)
        text.append(bar, style=bar_style)
        text.append(f" {agent.agent_id}", style="bold white")
        text.append(f" ({agent.role})", style="dim")
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
        total = self.total_tasks or 1
        done = self.completed_tasks

        bar_width = 50
        filled_green = int(done / total * bar_width)
        filled_yellow = int(self.in_progress_tasks / total * bar_width)
        remaining = bar_width - filled_green - filled_yellow

        bar = Text()
        bar.append("  FEATURES  ", style="bold white")
        bar.append("█" * filled_green, style="green")
        bar.append("█" * filled_yellow, style="yellow")
        bar.append("░" * max(0, remaining), style="dim")
        bar.append(f"  {done}", style="bold white")
        bar.append(f"/{total}", style="dim white")

        return Panel(bar, border_style="green", box=box.ROUNDED)

    # ── Controls ─────────────────────────────────────────────────────────

    def _render_controls(self) -> Panel:
        t = Text()
        t.append("CONTROLS\n", style="bold underline white")
        t.append(f"Showing levels 2/2\n", style="dim")
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
