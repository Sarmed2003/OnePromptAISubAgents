"""Git operations for cloning, branching, committing, and merging."""

from __future__ import annotations

import logging
import os
import subprocess
import time
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
            "GIT_TERMINAL_PROMPT": "0",
            "GIT_CONFIG_NOSYSTEM": "1",
            "GIT_CONFIG_GLOBAL": "/dev/null",
        }

    def _run(self, *args: str, cwd: Path | None = None) -> subprocess.CompletedProcess:
        cmd = ["git", "-c", "credential.helper="] + list(args)
        result = subprocess.run(
            cmd,
            cwd=cwd or self.repo_path,
            capture_output=True,
            text=True,
            env=self._env,
            timeout=120,
        )
        if result.returncode != 0:
            safe_args = " ".join(
                a if "://" not in a else a.split("@")[0] + "@..." if "@" in a else a
                for a in args
            )
            logger.warning("git %s failed: %s", safe_args, result.stderr.strip()[:300])
        return result

    def clone_or_pull(self) -> bool:
        """Clone the repo if it doesn't exist, or pull latest."""
        if (self.repo_path / ".git").exists():
            self._run("remote", "set-url", "origin", self.config.authenticated_url)
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
        if r.returncode != 0:
            self._run("checkout", "-f", self.config.main_branch)
        pull = self._run("pull", "--ff-only", "origin", self.config.main_branch)
        if pull.returncode != 0:
            logger.warning("Pull failed (non-fatal, proceeding with local state)")
        return r.returncode == 0

    def create_branch(self, branch_name: str) -> bool:
        self.checkout_main()
        self._run("branch", "-D", branch_name)
        r = self._run("checkout", "-b", branch_name)
        return r.returncode == 0

    def commit_files(
        self,
        files: dict[str, str],
        message: str,
        author_name: str | None = None,
    ) -> bool:
        """Write files to disk and commit them.

        Retries up to 3 times to handle git lock contention when multiple
        worktrees share the same .git directory.

        If *author_name* is provided and Gource mode is active, the commit
        uses that name as the git author so Gource renders distinct avatars.
        """
        for rel_path, content in files.items():
            full_path = self.repo_path / rel_path
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(content, encoding="utf-8")

        self._run("add", "--all")

        commit_args = ["-m", message]
        if author_name:
            commit_args = ["--author", f"{author_name} <{author_name.lower().replace(' ', '-')}@onepromptai.bot>"] + commit_args

        for attempt in range(3):
            r = self._run("commit", *commit_args)
            if r.returncode == 0:
                return True
            if "lock" in r.stderr.lower() or "index.lock" in r.stderr.lower():
                logger.info("Git lock contention (attempt %d/3), retrying...", attempt + 1)
                time.sleep(0.5 * (attempt + 1))
                continue
            logger.warning("commit_files failed: %s", r.stderr.strip()[:200])
            return False
        return False

    def push_branch(self, branch_name: str) -> bool:
        url = self.config.authenticated_url
        r = self._run("push", url, f"HEAD:refs/heads/{branch_name}", "--force")
        return r.returncode == 0

    def merge_branch(self, branch_name: str, strategy: str = "merge-commit") -> dict[str, Any]:
        """Attempt to merge a worker branch into main."""
        self.checkout_main()
        self._run("remote", "set-url", "origin", self.config.authenticated_url)
        self._run("fetch", "origin")

        remote_ref = f"origin/{branch_name}"
        check = self._run("rev-parse", "--verify", remote_ref)
        if check.returncode != 0:
            local_check = self._run("rev-parse", "--verify", branch_name)
            if local_check.returncode == 0:
                remote_ref = branch_name
                logger.info("Using local branch %s (remote not found)", branch_name)
            else:
                return {
                    "success": False,
                    "conflict": False,
                    "error": f"Branch {branch_name} not found locally or on remote",
                }

        if strategy == "fast-forward":
            r = self._run("merge", "--ff-only", remote_ref)
        elif strategy == "rebase":
            r = self._run("rebase", remote_ref)
        else:
            r = self._run("merge", "--no-ff", remote_ref,
                          "-m", f"Merge {branch_name} into {self.config.main_branch}")

        if r.returncode != 0:
            self._run("merge", "--abort")
            return {
                "success": False,
                "conflict": True,
                "error": r.stderr.strip(),
            }

        url = self.config.authenticated_url
        push_r = self._run("push", url, f"HEAD:refs/heads/{self.config.main_branch}")
        if push_r.returncode != 0:
            logger.warning("Push to remote failed (merge is local-only): %s",
                           push_r.stderr.strip()[:200])
        return {
            "success": True,
            "conflict": False,
            "pushed": push_r.returncode == 0,
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

    def remove_file(self, rel_path: str) -> bool:
        """Remove a file from the working tree and stage the removal."""
        full_path = self.repo_path / rel_path
        if full_path.exists():
            r = self._run("rm", "-f", rel_path)
            return r.returncode == 0
        return True

    def remove_files(self, rel_paths: list[str]) -> bool:
        """Batch remove multiple files in a single git rm call."""
        existing = [p for p in rel_paths if (self.repo_path / p).exists()]
        if not existing:
            return True
        r = self._run("rm", "-f", "--", *existing)
        return r.returncode == 0

    def read_files_in_scope(self, scope: list[str]) -> dict[str, str]:
        result = {}
        for rel_path in scope:
            content = self.read_file(rel_path)
            if content is not None:
                result[rel_path] = content
        return result

    def read_repo_snapshot(
        self,
        max_files: int = 55,
        per_file_cap: int = 8000,
    ) -> dict[str, str]:
        """Load a capped slice of repo text files (for consolidation/recovery with empty scope)."""
        skip_pfx = (
            "node_modules/", ".git/", "dist/", "build/", ".next/", "coverage/",
            "vendor/", ".venv/", "__pycache__/",
        )
        skip_sfx = (
            ".png", ".jpg", ".jpeg", ".gif", ".ico", ".woff", ".woff2", ".mp4",
            ".pdf", ".zip", ".lock", ".min.js", ".map",
        )
        paths = [l.strip() for l in self.get_file_tree().split("\n") if l.strip()]

        def sort_key(p: str) -> tuple[int, str]:
            if p.startswith("src/") or p.startswith("lib/"):
                return (0, p)
            if p.startswith("tests/") or p.startswith("test/"):
                return (1, p)
            return (2, p)

        paths.sort(key=sort_key)
        out: dict[str, str] = {}
        for fp in paths:
            low = fp.lower()
            if any(fp.startswith(sp) for sp in skip_pfx):
                continue
            if any(low.endswith(s) for s in skip_sfx):
                continue
            content = self.read_file(fp)
            if not content:
                continue
            out[fp] = content[:per_file_cap]
            if len(out) >= max_files:
                break
        return out

    def run_build(self) -> tuple[int, str]:
        """Run the project's build command. Returns (exit_code, output)."""
        cdk_json = self.repo_path / "cdk.json"
        if cdk_json.exists():
            r = subprocess.run(
                ["npx", "cdk", "synth", "--quiet"],
                cwd=self.repo_path,
                capture_output=True, text=True, timeout=180,
            )
            return r.returncode, r.stdout + r.stderr

        tsconfig = self.repo_path / "tsconfig.json"
        if tsconfig.exists():
            r = subprocess.run(
                ["npx", "tsc", "--noEmit"],
                cwd=self.repo_path,
                capture_output=True, text=True, timeout=120,
            )
            return r.returncode, r.stdout + r.stderr

        pkg_json = self.repo_path / "package.json"
        if pkg_json.exists():
            r = subprocess.run(
                ["npm", "run", "build"],
                cwd=self.repo_path,
                capture_output=True, text=True, timeout=120,
            )
            return r.returncode, r.stdout + r.stderr

        go_mod = self.repo_path / "go.mod"
        if go_mod.exists():
            r = subprocess.run(
                ["go", "build", "./..."],
                cwd=self.repo_path,
                capture_output=True, text=True, timeout=120,
            )
            return r.returncode, r.stdout + r.stderr

        py_files = list(self.repo_path.glob("**/*.py"))
        if py_files:
            errors = []
            for pf in py_files[:20]:
                r = subprocess.run(
                    ["python", "-m", "py_compile", str(pf)],
                    cwd=self.repo_path,
                    capture_output=True, text=True, timeout=30,
                )
                if r.returncode != 0:
                    errors.append(r.stderr)
            if errors:
                return 1, "\n".join(errors)
            return 0, f"Python syntax OK ({len(py_files)} files checked)"

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

        go_mod = self.repo_path / "go.mod"
        if go_mod.exists():
            r = subprocess.run(
                ["go", "test", "./..."],
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
