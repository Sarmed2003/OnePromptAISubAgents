"""Git operations for cloning, branching, committing, and merging."""

from __future__ import annotations

import logging
import os
import subprocess
from pathlib import Path
from typing import Any

from .config import GitConfig

logger = logging.getLogger(__name__)


class GitRepo:
    """Manages git operations on a local repository clone."""

    def __init__(self, config: GitConfig, repo_path: str | Path):
        self.config = config
        self.repo_path = Path(repo_path)
        self._env = {
            **os.environ,
            "GIT_AUTHOR_NAME": config.commit_name,
            "GIT_AUTHOR_EMAIL": config.commit_email,
            "GIT_COMMITTER_NAME": config.commit_name,
            "GIT_COMMITTER_EMAIL": config.commit_email,
        }

    def _run(self, *args: str, cwd: Path | None = None) -> subprocess.CompletedProcess:
        cmd = ["git"] + list(args)
        result = subprocess.run(
            cmd,
            cwd=cwd or self.repo_path,
            capture_output=True,
            text=True,
            env=self._env,
            timeout=120,
        )
        if result.returncode != 0:
            logger.warning("git %s failed: %s", " ".join(args), result.stderr.strip())
        return result

    def clone_or_pull(self) -> bool:
        """Clone the repo if it doesn't exist, or pull latest."""
        if (self.repo_path / ".git").exists():
            result = self._run("pull", "--ff-only", "origin", self.config.main_branch)
            return result.returncode == 0

        self.repo_path.parent.mkdir(parents=True, exist_ok=True)
        result = self._run(
            "clone", self.config.authenticated_url,
            str(self.repo_path),
            cwd=self.repo_path.parent,
        )
        return result.returncode == 0

    def checkout_main(self) -> bool:
        r = self._run("checkout", self.config.main_branch)
        self._run("pull", "--ff-only", "origin", self.config.main_branch)
        return r.returncode == 0

    def create_branch(self, branch_name: str) -> bool:
        self.checkout_main()
        self._run("branch", "-D", branch_name)
        r = self._run("checkout", "-b", branch_name)
        return r.returncode == 0

    def commit_files(self, files: dict[str, str], message: str) -> bool:
        """Write files to disk and commit them."""
        for rel_path, content in files.items():
            full_path = self.repo_path / rel_path
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(content, encoding="utf-8")
            self._run("add", rel_path)

        r = self._run("commit", "-m", message)
        return r.returncode == 0

    def push_branch(self, branch_name: str) -> bool:
        r = self._run("push", "-u", "origin", branch_name, "--force")
        return r.returncode == 0

    def merge_branch(self, branch_name: str, strategy: str = "merge-commit") -> dict[str, Any]:
        """Attempt to merge a worker branch into main."""
        self.checkout_main()
        self._run("fetch", "origin")

        if strategy == "fast-forward":
            r = self._run("merge", "--ff-only", f"origin/{branch_name}")
        elif strategy == "rebase":
            r = self._run("rebase", f"origin/{branch_name}")
        else:
            r = self._run("merge", "--no-ff", f"origin/{branch_name}",
                          "-m", f"Merge {branch_name} into {self.config.main_branch}")

        if r.returncode != 0:
            self._run("merge", "--abort")
            return {
                "success": False,
                "conflict": True,
                "error": r.stderr.strip(),
            }

        push_r = self._run("push", "origin", self.config.main_branch)
        return {
            "success": push_r.returncode == 0,
            "conflict": False,
            "error": push_r.stderr.strip() if push_r.returncode != 0 else "",
        }

    def get_file_tree(self) -> str:
        """Return a text representation of the repo file tree."""
        r = self._run("ls-tree", "-r", "--name-only", "HEAD")
        if r.returncode != 0:
            try:
                files = []
                for p in self.repo_path.rglob("*"):
                    if p.is_file() and ".git" not in p.parts:
                        files.append(str(p.relative_to(self.repo_path)))
                return "\n".join(sorted(files))
            except Exception:
                return "(empty repository)"
        return r.stdout.strip()

    def get_recent_commits(self, count: int = 20) -> str:
        r = self._run("log", f"--oneline", f"-{count}")
        return r.stdout.strip() if r.returncode == 0 else "(no commits)"

    def read_file(self, rel_path: str) -> str | None:
        full_path = self.repo_path / rel_path
        if full_path.exists():
            return full_path.read_text(encoding="utf-8")
        return None

    def read_files_in_scope(self, scope: list[str]) -> dict[str, str]:
        result = {}
        for rel_path in scope:
            content = self.read_file(rel_path)
            if content is not None:
                result[rel_path] = content
        return result

    def run_build(self) -> tuple[int, str]:
        """Run the project's build command. Returns (exit_code, output)."""
        build_cmds = [
            ["npm", "run", "build"],
            ["python", "-m", "py_compile"],
            ["make", "build"],
        ]
        pkg_json = self.repo_path / "package.json"
        if pkg_json.exists():
            r = subprocess.run(
                ["npm", "run", "build"],
                cwd=self.repo_path,
                capture_output=True, text=True, timeout=120,
            )
            return r.returncode, r.stdout + r.stderr

        return 0, "No build system detected — skipping."

    def run_tests(self) -> tuple[int, str]:
        """Run the project's test suite. Returns (exit_code, output)."""
        pkg_json = self.repo_path / "package.json"
        if pkg_json.exists():
            r = subprocess.run(
                ["npm", "test"],
                cwd=self.repo_path,
                capture_output=True, text=True, timeout=120,
            )
            return r.returncode, r.stdout + r.stderr

        pytest_cfg = any(
            (self.repo_path / f).exists()
            for f in ["pytest.ini", "pyproject.toml", "setup.cfg"]
        )
        if pytest_cfg:
            r = subprocess.run(
                ["python", "-m", "pytest", "--tb=short", "-q"],
                cwd=self.repo_path,
                capture_output=True, text=True, timeout=120,
            )
            return r.returncode, r.stdout + r.stderr

        return 0, "No test framework detected — skipping."
