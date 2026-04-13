"""Optional knowledge vault: markdown context for planner/architect; run summaries on disk."""

from __future__ import annotations

import logging
import time
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

_SKIP_DIR_NAMES = frozenset({".git", ".obsidian", "runs", "__pycache__"})

# Top-level folders first (Obsidian-friendly “memory” / MOC layout). Rest follow alphabetically.
_KNOWLEDGE_TOP_PRIORITY = ("memory", "decisions", "patterns", "architecture", "errors")


def _top_level_priority(root: Path, path: Path) -> tuple[int, str]:
    try:
        rel = path.relative_to(root).as_posix()
    except ValueError:
        return (99, path.as_posix())
    parts = rel.split("/")
    if not parts:
        return (99, rel)
    top = parts[0].lower()
    for i, name in enumerate(_KNOWLEDGE_TOP_PRIORITY):
        if top == name:
            return (i, rel)
    return (len(_KNOWLEDGE_TOP_PRIORITY), rel)


def _strip_obsidian_frontmatter(body: str) -> str:
    """Remove leading YAML block (Obsidian properties) so the LLM sees prose only."""
    if not body.startswith("---\n"):
        return body
    close = body.find("\n---\n", 4)
    if close == -1:
        return body
    return body[close + 5 :].lstrip()


def _is_knowledge_markdown(root: Path, path: Path) -> bool:
    if not path.is_file() or path.suffix.lower() != ".md":
        return False
    try:
        rel = path.relative_to(root)
    except ValueError:
        return False
    for part in rel.parts:
        if part in _SKIP_DIR_NAMES or part.startswith("."):
            return False
    return True


def _list_knowledge_files(root: Path) -> list[Path]:
    if not root.is_dir():
        return []
    found = [p for p in root.rglob("*.md") if _is_knowledge_markdown(root, p)]
    return sorted(found, key=lambda p: (_top_level_priority(root, p), p.as_posix().lower()))


def _read_files_capped(files: list[Path], root: Path, max_chars: int) -> str:
    if max_chars <= 0 or not files:
        return ""
    parts: list[str] = []
    total = 0
    for f in files:
        try:
            raw = f.read_text(encoding="utf-8", errors="replace")
            body = _strip_obsidian_frontmatter(raw)
        except OSError as e:
            logger.debug("Vault skip %s: %s", f, e)
            continue
        header = f"\n\n## vault/{f.relative_to(root).as_posix()}\n\n"
        block = header + body
        if total + len(block) <= max_chars:
            parts.append(block)
            total += len(block)
            continue
        room = max_chars - total - len(header)
        if room < 80:
            break
        parts.append(header + body[:room] + "\n\n…(truncated)\n")
        break
    out = "".join(parts).strip()
    if out:
        return "## Knowledge vault (reference)\n" + out
    return ""


class VaultReader:
    """Load markdown knowledge for prompts; append run summaries under vault/runs/."""

    def __init__(self, path: str | Path, max_context_chars: int = 6000):
        self.vault_path = Path(path).expanduser().resolve()
        self.max_context_chars = max(0, int(max_context_chars))
        self.available = self.vault_path.is_dir()

    def load_for_planner(self) -> str:
        if not self.available:
            return ""
        files = _list_knowledge_files(self.vault_path)
        return _read_files_capped(files, self.vault_path, self.max_context_chars)

    def load_for_architect(self) -> str:
        if not self.available:
            return ""
        root = self.vault_path
        all_files = _list_knowledge_files(root)
        arch = root / "architecture"
        preferred = sorted(
            (p for p in all_files if arch in p.parents or p.parent == arch),
            key=lambda p: p.as_posix().lower(),
        )
        rest = [p for p in all_files if p not in preferred]
        rest_sorted = sorted(rest, key=lambda p: (_top_level_priority(root, p), p.as_posix().lower()))
        ordered = preferred + rest_sorted
        return _read_files_capped(ordered, root, self.max_context_chars)

    def file_count(self) -> int:
        if not self.available:
            return 0
        return len(_list_knowledge_files(self.vault_path))

    def write_run_summary(
        self,
        *,
        run_id: str,
        metrics: dict[str, Any],
        decisions: list[str],
        errors: list[str],
    ) -> None:
        if not self.available:
            self.vault_path.mkdir(parents=True, exist_ok=True)
            self.available = True
        runs_dir = self.vault_path / "runs"
        runs_dir.mkdir(parents=True, exist_ok=True)

        ts = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
        stamp = time.strftime("%Y%m%d-%H%M%S", time.localtime())
        safe_id = "".join(c if c.isalnum() or c in "-_" else "-" for c in run_id)[:64]
        path = runs_dir / f"{stamp}-{safe_id}.md"

        total = int(metrics.get("total_tasks", 0) or 0)
        done = int(metrics.get("completed_tasks", 0) or 0)
        failed = int(metrics.get("failed_tasks", 0) or 0)
        commits = int(metrics.get("total_commits", 0) or 0)
        tokens = int(metrics.get("total_tokens", 0) or 0)
        started = float(metrics.get("started_at", time.time()) or time.time())
        elapsed = max(0.0, time.time() - started)
        denom = done + failed
        rate = (done / denom * 100.0) if denom > 0 else 0.0

        lines = [
            f"# Run Summary: {safe_id}",
            "",
            f"**Date**: {ts}",
            f"**Tasks**: {done}/{total} completed",
            f"**Failed**: {failed}",
            f"**Commits**: {commits}",
            f"**Tokens**: {tokens:,}",
            f"**Duration**: {elapsed:.1f}s",
            f"**Success Rate**: {rate:.1f}%",
            "",
            "## Key Decisions",
            "",
        ]
        if decisions:
            for d in decisions:
                lines.append(f"- {d}")
        else:
            lines.append("- (none recorded)")
        lines.extend(["", "## Errors Encountered", ""])
        if errors:
            for e in errors:
                lines.append(f"- {e}")
        else:
            lines.append("- (none)")

        text = "\n".join(lines) + "\n"
        path.write_text(text, encoding="utf-8")
        logger.info("Vault run summary written: %s", path)
