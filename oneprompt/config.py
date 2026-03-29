"""Configuration management loaded from environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class LLMConfig:
    api_key: str = ""
    model: str = "gemini-2.0-flash"
    temperature: float = 0.7
    max_tokens: int = 8192

    @classmethod
    def from_env(cls) -> LLMConfig:
        return cls(
            api_key=os.getenv("GEMINI_API_KEY", ""),
            model=os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
            temperature=float(os.getenv("LLM_TEMPERATURE", "0.7")),
            max_tokens=int(os.getenv("LLM_MAX_TOKENS", "8192")),
        )


@dataclass(frozen=True)
class GitConfig:
    repo_url: str = ""
    token: str = ""
    main_branch: str = "main"
    branch_prefix: str = "worker/"
    commit_name: str = "OnePromptAI Bot"
    commit_email: str = "agent@onepromptai.bot"

    @classmethod
    def from_env(cls) -> GitConfig:
        return cls(
            repo_url=os.getenv("GIT_REPO_URL", ""),
            token=os.getenv("GIT_TOKEN", ""),
            main_branch=os.getenv("GIT_MAIN_BRANCH", "main"),
            branch_prefix=os.getenv("GIT_BRANCH_PREFIX", "worker/"),
            commit_name=os.getenv("GIT_COMMIT_NAME", "OnePromptAI Bot"),
            commit_email=os.getenv("GIT_COMMIT_EMAIL", "agent@onepromptai.bot"),
        )

    @property
    def authenticated_url(self) -> str:
        if self.token and "github.com" in self.repo_url:
            return self.repo_url.replace(
                "https://", f"https://x-access-token:{self.token}@"
            )
        return self.repo_url


@dataclass(frozen=True)
class WorkerConfig:
    max_workers: int = 3
    timeout: int = 600
    merge_strategy: str = "merge-commit"

    @classmethod
    def from_env(cls) -> WorkerConfig:
        return cls(
            max_workers=int(os.getenv("MAX_WORKERS", "3")),
            timeout=int(os.getenv("WORKER_TIMEOUT", "600")),
            merge_strategy=os.getenv("MERGE_STRATEGY", "merge-commit"),
        )


@dataclass(frozen=True)
class AWSConfig:
    region: str = "us-east-1"
    access_key_id: str = ""
    secret_access_key: str = ""
    session_token: str = ""
    dynamodb_table_prefix: str = "onepromptai"

    @classmethod
    def from_env(cls) -> AWSConfig:
        return cls(
            region=os.getenv("AWS_REGION", "us-east-1"),
            access_key_id=os.getenv("AWS_ACCESS_KEY_ID", ""),
            secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", ""),
            session_token=os.getenv("AWS_SESSION_TOKEN", ""),
            dynamodb_table_prefix=os.getenv("DYNAMODB_TABLE_PREFIX", "onepromptai"),
        )


@dataclass(frozen=True)
class DatabaseConfig:
    backend: str = "dynamodb"
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "onepromptai"

    @classmethod
    def from_env(cls) -> DatabaseConfig:
        return cls(
            backend=os.getenv("DB_BACKEND", "dynamodb"),
            mongodb_uri=os.getenv("MONGODB_URI", "mongodb://localhost:27017"),
            mongodb_db=os.getenv("MONGODB_DB", "onepromptai"),
        )


@dataclass(frozen=True)
class OrchestratorConfig:
    target_repo_path: str = "./target-repo"
    health_check_interval: int = 30
    finalization_enabled: bool = True
    finalization_max_attempts: int = 3
    log_level: str = "info"

    @classmethod
    def from_env(cls) -> OrchestratorConfig:
        return cls(
            target_repo_path=os.getenv("TARGET_REPO_PATH", "./target-repo"),
            health_check_interval=int(os.getenv("HEALTH_CHECK_INTERVAL", "30")),
            finalization_enabled=os.getenv("FINALIZATION_ENABLED", "true").lower() == "true",
            finalization_max_attempts=int(os.getenv("FINALIZATION_MAX_ATTEMPTS", "3")),
            log_level=os.getenv("LOG_LEVEL", "info"),
        )


@dataclass
class AppConfig:
    llm: LLMConfig = field(default_factory=LLMConfig)
    git: GitConfig = field(default_factory=GitConfig)
    worker: WorkerConfig = field(default_factory=WorkerConfig)
    aws: AWSConfig = field(default_factory=AWSConfig)
    database: DatabaseConfig = field(default_factory=DatabaseConfig)
    orchestrator: OrchestratorConfig = field(default_factory=OrchestratorConfig)

    @classmethod
    def from_env(cls) -> AppConfig:
        return cls(
            llm=LLMConfig.from_env(),
            git=GitConfig.from_env(),
            worker=WorkerConfig.from_env(),
            aws=AWSConfig.from_env(),
            database=DatabaseConfig.from_env(),
            orchestrator=OrchestratorConfig.from_env(),
        )

    def validate(self) -> list[str]:
        errors: list[str] = []
        if not self.llm.api_key:
            errors.append("GEMINI_API_KEY is required")
        if not self.git.repo_url:
            errors.append("GIT_REPO_URL is required")
        if not self.git.token:
            errors.append("GIT_TOKEN is required")
        return errors
