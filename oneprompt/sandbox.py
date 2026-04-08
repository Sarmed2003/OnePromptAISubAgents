"""Local subprocess sandbox for running worker agents in isolation.

Instead of Modal's serverless GPU containers, we use local subprocess
isolation on the MacBook. Each worker gets its own git worktree so
branches don't collide.
"""

from __future__ import annotations

import logging
import shutil
import subprocess
from pathlib import Path

from .config import GitConfig
from .git_utils import GitRepo

logger = logging.getLogger(__name__)


class LocalSandbox:
    """Provides isolated workspace directories using git worktrees.

    This replaces Modal's cloud sandboxes with local filesystem isolation.
    Each worker gets a separate worktree pointing at the same repo, so they
    can work on different branches without interfering with each other.
    """

    def __init__(self, main_repo_path: str | Path, git_config: GitConfig):
        self.main_repo = Path(main_repo_path).resolve()
        self.git_config = git_config
        self._worktrees: dict[str, Path] = {}
        self._sandbox_root = (self.main_repo.parent / "sandboxes").resolve()

    def create_worktree(self, branch_name: str) -> GitRepo:
        """Create an isolated worktree for a worker branch.

        The worktree checks out a new branch from HEAD so the worker
        gets an independent directory with the full repo contents.
        """
        self._sandbox_root.mkdir(parents=True, exist_ok=True)
        safe_name = branch_name.replace("/", "-")
        worktree_path = self._sandbox_root / safe_name

        if worktree_path.exists():
            self.remove_worktree(branch_name)

        # Delete the branch if it exists from a prior run
        subprocess.run(
            ["git", "branch", "-D", branch_name],
            cwd=self.main_repo,
            capture_output=True, text=True,
        )

        result = subprocess.run(
            ["git", "worktree", "add", str(worktree_path), "-b", branch_name],
            cwd=self.main_repo,
            capture_output=True, text=True,
        )
        if result.returncode != 0:
            logger.error("Failed to create worktree %s: %s", branch_name, result.stderr)
            raise RuntimeError(f"git worktree add failed: {result.stderr.strip()}")

        self._worktrees[branch_name] = worktree_path
        logger.info("Created worktree: %s → %s", branch_name, worktree_path)

        return GitRepo(self.git_config, worktree_path)

    def remove_worktree(self, branch_name: str) -> None:
        safe_name = branch_name.replace("/", "-")
        worktree_path = self._sandbox_root / safe_name

        if worktree_path.exists():
            subprocess.run(
                ["git", "worktree", "remove", str(worktree_path), "--force"],
                cwd=self.main_repo,
                capture_output=True, text=True,
            )
            self._worktrees.pop(branch_name, None)
            logger.info("Removed worktree: %s", branch_name)

    def cleanup_all(self) -> None:
        """Remove all sandbox worktrees."""
        for branch in list(self._worktrees.keys()):
            self.remove_worktree(branch)

        subprocess.run(
            ["git", "worktree", "prune"],
            cwd=self.main_repo,
            capture_output=True, text=True,
        )

        if self._sandbox_root.exists():
            shutil.rmtree(self._sandbox_root, ignore_errors=True)

        logger.info("All sandboxes cleaned up")

    @property
    def active_count(self) -> int:
        return len(self._worktrees)
