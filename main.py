"""OnePromptAI CLI — autonomous multi-agent coding orchestrator."""

from __future__ import annotations

import asyncio
import logging
import sys
import time
import threading
from pathlib import Path

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


@click.command()
@click.argument("prompt")
@click.option("--spec", type=click.Path(exists=True), help="Path to SPEC.md file")
@click.option("--dashboard", is_flag=True, help="Enable Rich terminal dashboard")
@click.option(
    "--dashboard-auto-exit",
    is_flag=True,
    help="Close the dashboard after ~2s (default: keep it up until you press Enter)",
)
@click.option("--reset", is_flag=True, help="Reset target repo to initial commit")
@click.option("--debug", is_flag=True, help="Enable debug logging")
@click.option("--max-workers", type=int, default=None, help="Override max parallel workers")
def cli(
    prompt: str,
    spec: str | None,
    dashboard: bool,
    dashboard_auto_exit: bool,
    reset: bool,
    debug: bool,
    max_workers: int | None,
):
    """Run OnePromptAI with a build prompt.

    \b
    Examples:
        python main.py "Build a REST API with user auth"
        python main.py --spec examples/example/SPEC.md "Build the project"
        python main.py --dashboard "Build a todo app"
    """
    from oneprompt.config import AppConfig
    config = AppConfig.from_env()

    if max_workers is not None:
        from oneprompt.config import WorkerConfig
        config = AppConfig(
            llm=config.llm,
            git=config.git,
            worker=WorkerConfig(
                max_workers=max_workers,
                timeout=config.worker.timeout,
                merge_strategy=config.worker.merge_strategy,
            ),
            aws=config.aws,
            database=config.database,
            orchestrator=config.orchestrator,
        )

    errors = config.validate()
    if errors:
        for e in errors:
            click.echo(f"Configuration error: {e}", err=True)
        sys.exit(1)

    if reset:
        _reset_target_repo(config)

    build_spec = prompt
    if spec:
        spec_path = Path(spec)
        build_spec = spec_path.read_text(encoding="utf-8")
        if prompt and prompt != "Build the project":
            build_spec = f"# User Prompt\n{prompt}\n\n{build_spec}"

    if dashboard:
        _run_with_dashboard(config, build_spec, debug, dashboard_auto_exit)
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
        click.echo(f"\n{'='*60}")
        click.echo(f"  OnePromptAI Run Complete")
        click.echo(f"{'='*60}")
        click.echo(f"  Tasks:      {metrics.completed_tasks}/{metrics.total_tasks} completed")
        click.echo(f"  Failed:     {metrics.failed_tasks}")
        click.echo(f"  Commits:    {metrics.total_commits}")
        click.echo(f"  Tokens:     {metrics.total_tokens:,}")
        click.echo(f"  Duration:   {metrics.elapsed_seconds:.1f}s")
        click.echo(f"  Success:    {metrics.success_rate:.1f}%")
        click.echo(f"{'='*60}\n")
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
            screen=True,
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

    m = dashboard
    click.echo(f"\n{'='*60}")
    click.echo(f"  OnePromptAI Run Complete")
    click.echo(f"{'='*60}")
    click.echo(f"  Tasks:      {m.completed_tasks}/{m.total_tasks} completed")
    click.echo(f"  Failed:     {m.failed_tasks}")
    click.echo(f"  Commits:    {m.commits}")
    click.echo(f"  Tokens:     {m.tokens:,}")
    click.echo(f"{'='*60}\n")


if __name__ == "__main__":
    cli()
