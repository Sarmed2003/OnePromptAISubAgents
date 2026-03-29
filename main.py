"""OnePromptAI CLI — autonomous multi-agent coding orchestrator."""

from __future__ import annotations

import asyncio
import json
import logging
import subprocess
import sys
from pathlib import Path

import click
from dotenv import load_dotenv

load_dotenv()


def setup_logging(level: str = "info") -> None:
    numeric_level = getattr(logging, level.upper(), logging.INFO)
    logging.basicConfig(
        level=numeric_level,
        format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
        datefmt="%H:%M:%S",
    )


@click.command()
@click.argument("prompt")
@click.option("--spec", type=click.Path(exists=True), help="Path to SPEC.md file")
@click.option("--dashboard", is_flag=True, help="Enable Rich terminal dashboard")
@click.option("--reset", is_flag=True, help="Reset target repo to initial commit")
@click.option("--debug", is_flag=True, help="Enable debug logging")
@click.option("--max-workers", type=int, default=None, help="Override max parallel workers")
def cli(
    prompt: str,
    spec: str | None,
    dashboard: bool,
    reset: bool,
    debug: bool,
    max_workers: int | None,
):
    """Run OnePromptAI with a build prompt.

    Example:
        python main.py "Build a REST API with user auth"
        python main.py --spec examples/example/SPEC.md "Build the project"
        python main.py --dashboard "Build a todo app"
    """
    setup_logging("debug" if debug else "info")
    logger = logging.getLogger("onepromptai")

    from oneprompt.config import AppConfig
    config = AppConfig.from_env()

    if max_workers is not None:
        config = AppConfig(
            llm=config.llm,
            git=config.git,
            worker=config.worker.__class__(
                max_workers=max_workers,
                timeout=config.worker.timeout,
                merge_strategy=config.worker.merge_strategy,
            ),
            mongo=config.mongo,
            orchestrator=config.orchestrator,
        )

    errors = config.validate()
    if errors:
        for e in errors:
            click.echo(f"Configuration error: {e}", err=True)
        sys.exit(1)

    build_spec = prompt
    if spec:
        spec_path = Path(spec)
        build_spec = spec_path.read_text(encoding="utf-8")
        if prompt and prompt != "Build the project":
            build_spec = f"# User Prompt\n{prompt}\n\n{build_spec}"

    if dashboard:
        _run_with_dashboard(config, build_spec, debug)
    else:
        asyncio.run(_run_orchestrator(config, build_spec))


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
        sys.exit(1)


def _run_with_dashboard(config, spec: str, debug: bool):
    """Spawn orchestrator as subprocess, pipe NDJSON to Rich dashboard."""
    from dashboard import Dashboard
    from rich.live import Live

    dashboard = Dashboard()

    cmd = [
        sys.executable, "-c",
        f"""
import asyncio, json, sys
sys.path.insert(0, '.')
from oneprompt.config import AppConfig
from oneprompt.orchestrator import Orchestrator
from dotenv import load_dotenv
load_dotenv()
config = AppConfig.from_env()
spec = '''{spec.replace("'", "\\'")}'''
asyncio.run(Orchestrator(config).run(spec))
"""
    ]

    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE if not debug else None,
        text=True,
        bufsize=1,
    )

    try:
        with Live(dashboard.render(), console=dashboard.console, refresh_per_second=4) as live:
            for line in iter(process.stdout.readline, ""):
                line = line.strip()
                if not line:
                    continue
                try:
                    event = json.loads(line)
                    dashboard.process_event(event)
                    live.update(dashboard.render())
                except json.JSONDecodeError:
                    pass

        process.wait()
    except KeyboardInterrupt:
        process.terminate()
        click.echo("\nDashboard stopped.")


def cli_entry():
    """Entry point for installed CLI."""
    cli()


if __name__ == "__main__":
    cli()
