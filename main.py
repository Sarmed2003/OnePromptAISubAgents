"""OnePromptAI CLI — autonomous multi-agent coding orchestrator."""

from __future__ import annotations

import asyncio
import logging
import subprocess
import sys
import time
import threading
from pathlib import Path

from oneprompt.config import AppConfig
from oneprompt.types import RunMetrics

import click
from dotenv import load_dotenv

load_dotenv()


def setup_logging(level: str = "info", to_stderr: bool = False) -> None:
    numeric_level = getattr(logging, level.upper(), logging.INFO)
    handler = logging.StreamHandler(sys.stderr if to_stderr else sys.stdout)
    handler.setFormatter(logging.Formatter(
        "%(asctime)s [%(name)s] %(levelname)s: %(message)s", datefmt="%H:%M:%S"
    ))
    logging.root.handlers.clear()
    logging.root.addHandler(handler)
    logging.root.setLevel(numeric_level)


def _print_run_summary(config: AppConfig, metrics: RunMetrics) -> None:
    click.echo(f"\n{'='*60}")
    click.echo("  OnePromptAI Run Complete")
    click.echo(f"{'='*60}")
    scheduled = max(metrics.total_tasks, metrics.completed_tasks + metrics.failed_tasks)
    if scheduled == 0:
        click.echo("  Tasks:      none scheduled (planner returned no tasks — see logs)")
    else:
        click.echo(f"  Tasks:      {metrics.completed_tasks}/{scheduled} completed")
    click.echo(f"  Failed:     {metrics.failed_tasks}")
    click.echo(f"  Commits:    {metrics.total_commits}")
    click.echo(f"  Tokens:     {metrics.total_tokens:,}")
    click.echo(f"  Duration:   {metrics.elapsed_seconds:.1f}s")
    click.echo(f"  Success:    {metrics.success_rate:.1f}%")
    if metrics.strict_phase_errors:
        click.echo(f"  Phase errors: {metrics.strict_phase_errors} (strict SDLC)")
    if metrics.failed_tasks and getattr(metrics, "failed_task_ids", None):
        ids = metrics.failed_task_ids[:15]
        extra = len(metrics.failed_task_ids) - len(ids)
        suffix = f" (+{extra} more)" if extra > 0 else ""
        click.echo(f"  Failed IDs:  {', '.join(ids)}{suffix}")
    click.echo(f"{'='*60}")


def _print_output_hints(config: AppConfig) -> None:
    """Where generated code and artifacts live (target repo, vault, Gource)."""
    root = Path.cwd()
    target = Path(config.orchestrator.target_repo_path)
    if not target.is_absolute():
        target = (root / target).resolve()
    click.echo("\n  Output & next steps:")
    click.echo(f"    Target repo (clone):  {target}")
    if target.is_dir() and (target / ".git").is_dir():
        click.echo(f"    Gource (run here):    cd {target} && gource")
        click.echo(
            "    Gource (helper):      ./scripts/gource-dinolab.sh   "
            "(use integer --auto-skip-seconds ≥ 1; 0 is invalid)"
        )
        click.echo(
            "    Gource → MP4:         brew install ffmpeg; then from target dir: "
            "gource -1920x1080 -o - | ffmpeg -y -r 60 -f image2pipe -vcodec ppm -i - "
            "-c:v libx264 -preset ultrafast -pix_fmt yuv420p demo.mp4"
        )
    else:
        click.echo("    (Target path missing — check TARGET_REPO_PATH and last run logs.)")
    if config.vault.enabled:
        vp = Path(config.vault.path)
        if not vp.is_absolute():
            vp = (root / vp).resolve()
        click.echo(f"    Vault run summaries:  {vp / 'runs'}")
    try:
        r = subprocess.run(
            ["git", "remote", "-v"],
            cwd=root,
            capture_output=True,
            text=True,
            timeout=5,
        )
        if r.returncode != 0 or not r.stdout.strip():
            click.echo(
                "    Push OnePromptAI:       git remote add origin <url> && git push -u origin main"
            )
    except (OSError, subprocess.TimeoutExpired):
        pass
    click.echo("")


def _exit_strict_if_failed(config: AppConfig, metrics: RunMetrics) -> None:
    if not config.orchestrator.strict_sdlc:
        return
    if metrics.failed_tasks or metrics.strict_phase_errors:
        click.echo(
            f"\nStrict SDLC: process exited with errors "
            f"(failed_tasks={metrics.failed_tasks}, "
            f"strict_phase_errors={metrics.strict_phase_errors}).",
            err=True,
        )
        click.echo(
            "Fix the issues above or set STRICT_SDLC=false for a more forgiving run.",
            err=True,
        )
        sys.exit(1)


@click.command()
@click.argument("prompt", required=False, default="")
@click.option("--spec", type=click.Path(exists=True), help="Path to SPEC.md file")
@click.option("--dashboard", is_flag=True, help="Enable Rich terminal dashboard (inline; use another terminal for git)")
@click.option(
    "--dashboard-fullscreen",
    is_flag=True,
    help="Dashboard uses alternate screen (hides scrollback). Default: inline dashboard.",
)
@click.option(
    "--dashboard-auto-exit",
    is_flag=True,
    help="Close the dashboard after ~2s (default: keep it up until you press Enter)",
)
@click.option(
    "--reset",
    is_flag=True,
    help="Delete local target-repo clone and sandboxes, then exit (no PROMPT needed)",
)
@click.option("--debug", is_flag=True, help="Enable debug logging")
@click.option("--max-workers", type=int, default=None, help="Override max parallel workers")
@click.option("--template", type=str, default=None, help="Template pack under templates/<name>/ (optional)")
@click.option("--vault", type=click.Path(), default=None, help="Path to knowledge vault directory")
@click.option("--gource", is_flag=True, help="Use per-agent git identities for Gource visualization")
def cli(
    prompt: str,
    spec: str | None,
    dashboard: bool,
    dashboard_fullscreen: bool,
    dashboard_auto_exit: bool,
    reset: bool,
    debug: bool,
    max_workers: int | None,
    template: str | None,
    vault: str | None,
    gource: bool,
):
    """Run OnePromptAI with a build prompt.

    \b
    Examples:
        python main.py "Build a REST API with user auth"
        python main.py --spec examples/example/SPEC.md "Build the project"
        python main.py --dashboard "Build a todo app"
        python main.py --reset
    """
    from oneprompt.config import WorkerConfig, VaultConfig

    config = AppConfig.from_env()

    overrides: dict = {}
    if max_workers is not None:
        overrides["worker"] = WorkerConfig(
            max_workers=max_workers,
            timeout=config.worker.timeout,
            merge_strategy=config.worker.merge_strategy,
        )
    if template is not None:
        overrides["template"] = template
    if vault is not None:
        overrides["vault"] = VaultConfig(
            enabled=True,
            path=vault,
            max_context_chars=config.vault.max_context_chars,
        )
    if gource:
        overrides["gource_agent_ids"] = True
    if overrides:
        config = AppConfig(
            llm=config.llm,
            git=config.git,
            worker=overrides.get("worker", config.worker),
            aws=config.aws,
            database=config.database,
            orchestrator=config.orchestrator,
            vault=overrides.get("vault", config.vault),
            template=overrides.get("template", config.template),
            gource_agent_ids=overrides.get("gource_agent_ids", config.gource_agent_ids),
        )

    errors = config.validate()
    if errors:
        for e in errors:
            click.echo(f"Configuration error: {e}", err=True)
        sys.exit(1)

    if reset:
        _reset_target_repo(config)
        if not spec and not (prompt or "").strip() and not dashboard:
            click.echo("Reset complete. Run again with a PROMPT or --spec to start the orchestrator.")
            return

    build_spec = (prompt or "").strip()
    if spec:
        spec_path = Path(spec)
        build_spec = spec_path.read_text(encoding="utf-8")
        if (prompt or "").strip() and (prompt or "").strip() != "Build the project":
            build_spec = f"# User Prompt\n{prompt}\n\n{build_spec}"

    if not (build_spec or "").strip():
        click.echo(
            "Error: Missing build specification. Provide PROMPT and/or --spec FILE.md",
            err=True,
        )
        sys.exit(1)

    if dashboard:
        _run_with_dashboard(
            config, build_spec, debug, dashboard_auto_exit, dashboard_fullscreen
        )
    else:
        setup_logging("debug" if debug else "info")
        asyncio.run(_run_orchestrator(config, build_spec))


def _reset_target_repo(config):
    """Delete and re-clone the target repo for a fresh start."""
    import shutil
    target = Path(config.orchestrator.target_repo_path)
    sandbox_dir = target.parent / "sandboxes"
    if target.exists():
        shutil.rmtree(target)
        click.echo(f"Removed {target}")
    if sandbox_dir.exists():
        shutil.rmtree(sandbox_dir)
        click.echo(f"Removed {sandbox_dir}")
    click.echo("Target repo reset — will re-clone on next run.")


async def _run_orchestrator(config, spec: str):
    """Run the orchestrator directly with stdout NDJSON events."""
    from oneprompt.orchestrator import Orchestrator

    orchestrator = Orchestrator(config)

    try:
        metrics = await orchestrator.run(spec)
        _print_run_summary(config, metrics)
        _print_output_hints(config)
        _exit_strict_if_failed(config, metrics)
    except KeyboardInterrupt:
        click.echo("\nStopping...")
        orchestrator.stop()
    except Exception as e:
        click.echo(f"Fatal error: {e}", err=True)
        raise


def _run_with_dashboard(
    config,
    spec: str,
    debug: bool,
    dashboard_auto_exit: bool,
    dashboard_fullscreen: bool,
):
    """Run orchestrator in-process, feeding NDJSON events directly to the Rich dashboard."""
    from dashboard import Dashboard
    from rich.live import Live
    from oneprompt.orchestrator import Orchestrator
    from oneprompt.types import NdjsonEvent

    setup_logging("debug" if debug else "warning", to_stderr=True)

    dashboard = Dashboard()
    lock = threading.Lock()

    def on_event(event: NdjsonEvent):
        with lock:
            dashboard.process_event(event.to_dict())

    orchestrator = Orchestrator(config, on_event=on_event)

    async def run_orchestrator():
        try:
            await orchestrator.run(spec)
        except Exception as e:
            dashboard.process_event({
                "type": "error", "data": {"message": str(e)}
            })

    loop = asyncio.new_event_loop()
    orch_thread = threading.Thread(
        target=lambda: loop.run_until_complete(run_orchestrator()),
        daemon=True,
    )
    orch_thread.start()

    try:
        with Live(
            dashboard.render(),
            console=dashboard.console,
            refresh_per_second=4,
            screen=dashboard_fullscreen,
        ) as live:
            while orch_thread.is_alive():
                with lock:
                    live.update(dashboard.render())
                time.sleep(0.25)

            with lock:
                dashboard.phase = "complete"
                live.update(dashboard.render())

            if dashboard_auto_exit or not sys.stdin.isatty():
                time.sleep(2)
            else:
                import select

                while True:
                    with lock:
                        live.update(dashboard.render())
                    ready, _, _ = select.select([sys.stdin], [], [], 0.25)
                    if ready:
                        try:
                            sys.stdin.readline()
                        except (OSError, ValueError):
                            pass
                        break

    except KeyboardInterrupt:
        orchestrator.stop()
        click.echo("\nDashboard stopped.")

    orch_thread.join(timeout=10)

    om = orchestrator.metrics
    _print_run_summary(config, om)
    _print_output_hints(config)
    _exit_strict_if_failed(config, om)


if __name__ == "__main__":
    cli()
