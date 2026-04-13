"""Configuration management loaded from environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class LLMConfig:
    provider: str = "bedrock"
    temperature: float = 0.7
    max_tokens: int = 8192
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "qwen2.5-coder:7b"
    fallback_to_ollama: bool = False
    bedrock_model_id: str = ""
    bedrock_region: str = ""
    bedrock_max_output_tokens: int = 8192
    max_concurrent_requests: int = 0
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_session_token: str = ""

    @classmethod
    def from_env(cls) -> LLMConfig:
        return cls(
            provider=os.getenv("LLM_PROVIDER", "bedrock").lower().strip(),
            temperature=float(os.getenv("LLM_TEMPERATURE", "0.7")),
            max_tokens=int(os.getenv("LLM_MAX_TOKENS", "8192")),
            ollama_url=os.getenv("OLLAMA_URL", "http://localhost:11434"),
            ollama_model=os.getenv("OLLAMA_MODEL", "qwen2.5-coder:7b"),
            fallback_to_ollama=os.getenv("FALLBACK_TO_OLLAMA", "false").lower() == "true",
            bedrock_model_id=os.getenv(
                "BEDROCK_MODEL_ID",
                "us.anthropic.claude-haiku-4-5-20251001-v1:0",
            ),
            bedrock_region=os.getenv("BEDROCK_REGION", os.getenv("AWS_REGION", "us-east-1")),
            bedrock_max_output_tokens=int(
                os.getenv("BEDROCK_MAX_OUTPUT_TOKENS", "8192")
            ),
            max_concurrent_requests=int(os.getenv("LLM_MAX_CONCURRENT", "0")),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", ""),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", ""),
            aws_session_token=os.getenv("AWS_SESSION_TOKEN", ""),
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
    max_workers: int = 8
    timeout: int = 600
    merge_strategy: str = "merge-commit"
    retry_backoff_sec: float = 1.0

    @classmethod
    def from_env(cls) -> WorkerConfig:
        return cls(
            max_workers=int(os.getenv("MAX_WORKERS", "8")),
            timeout=int(os.getenv("WORKER_TIMEOUT", "600")),
            merge_strategy=os.getenv("MERGE_STRATEGY", "merge-commit"),
            retry_backoff_sec=float(os.getenv("WORKER_RETRY_BACKOFF_SEC", "1.0")),
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
    recovery_max_rounds: int = 0
    json_retry_backoff_sec: float = 0.75
    log_level: str = "info"
    architect_enabled: bool = True
    review_enabled: bool = True
    qa_enabled: bool = True
    security_enabled: bool = True
    devops_enabled: bool = True
    # When true: no LLM-based phase skipping; phase LLM failures surface as errors;
    # partial worker handoffs retry until complete or hard fail. See STRICT_SDLC in .env.
    strict_sdlc: bool = True
    smart_phase_selection: bool = True
    # 0 = unlimited. Large monorepos can stall the planner for many minutes without this.
    max_file_tree_lines: int = 600
    # Parallel subplanner LLM calls (speeds up pre-worker phase vs strict sequential).
    subplanner_max_parallel: int = 4

    @classmethod
    def from_env(cls) -> OrchestratorConfig:
        _bool = lambda key, default="true": os.getenv(key, default).lower() == "true"
        strict = _bool("STRICT_SDLC", "true")
        smart = _bool("SMART_PHASE_SELECTION", "false" if strict else "true")
        if strict:
            smart = False
        return cls(
            target_repo_path=os.getenv("TARGET_REPO_PATH", "./target-repo"),
            health_check_interval=int(os.getenv("HEALTH_CHECK_INTERVAL", "30")),
            finalization_enabled=_bool("FINALIZATION_ENABLED"),
            finalization_max_attempts=int(os.getenv("FINALIZATION_MAX_ATTEMPTS", "3")),
            recovery_max_rounds=int(os.getenv("RECOVERY_MAX_ROUNDS", "0")),
            json_retry_backoff_sec=float(os.getenv("ORCHESTRATOR_JSON_RETRY_BACKOFF_SEC", "0.75")),
            log_level=os.getenv("LOG_LEVEL", "info"),
            architect_enabled=_bool("ARCHITECT_ENABLED"),
            review_enabled=_bool("REVIEW_ENABLED"),
            qa_enabled=_bool("QA_ENABLED"),
            security_enabled=_bool("SECURITY_ENABLED"),
            devops_enabled=_bool("DEVOPS_ENABLED"),
            strict_sdlc=strict,
            smart_phase_selection=smart,
            max_file_tree_lines=int(os.getenv("MAX_FILE_TREE_LINES", "600")),
            subplanner_max_parallel=max(1, int(os.getenv("SUBPLANNER_MAX_PARALLEL", "4"))),
        )


@dataclass(frozen=True)
class VaultConfig:
    enabled: bool = True
    path: str = "./vault"
    max_context_chars: int = 6000

    @classmethod
    def from_env(cls) -> VaultConfig:
        return cls(
            enabled=os.getenv("VAULT_ENABLED", "true").lower() == "true",
            path=os.getenv("VAULT_PATH", "./vault"),
            max_context_chars=int(os.getenv("VAULT_MAX_CONTEXT_CHARS", "6000")),
        )


@dataclass
class AppConfig:
    llm: LLMConfig = field(default_factory=LLMConfig)
    git: GitConfig = field(default_factory=GitConfig)
    worker: WorkerConfig = field(default_factory=WorkerConfig)
    aws: AWSConfig = field(default_factory=AWSConfig)
    database: DatabaseConfig = field(default_factory=DatabaseConfig)
    orchestrator: OrchestratorConfig = field(default_factory=OrchestratorConfig)
    vault: VaultConfig = field(default_factory=VaultConfig)
    template: str = ""
    gource_agent_ids: bool = False

    @classmethod
    def from_env(cls) -> AppConfig:
        return cls(
            llm=LLMConfig.from_env(),
            git=GitConfig.from_env(),
            worker=WorkerConfig.from_env(),
            aws=AWSConfig.from_env(),
            database=DatabaseConfig.from_env(),
            orchestrator=OrchestratorConfig.from_env(),
            vault=VaultConfig.from_env(),
            template=os.getenv("TEMPLATE", ""),
            gource_agent_ids=os.getenv("GOURCE_AGENT_IDS", "false").lower() == "true",
        )

    def validate(self) -> list[str]:
        errors: list[str] = []
        prov = (self.llm.provider or "").lower().strip()
        if prov not in ("bedrock", "ollama"):
            errors.append("LLM_PROVIDER must be bedrock or ollama")
        if prov == "bedrock" and not (self.llm.bedrock_model_id or "").strip():
            errors.append("BEDROCK_MODEL_ID is required when LLM_PROVIDER=bedrock")
        if prov == "ollama" and not (self.llm.ollama_model or "").strip():
            errors.append("OLLAMA_MODEL is required when LLM_PROVIDER=ollama")
        if not self.git.repo_url:
            errors.append("GIT_REPO_URL is required")
        if not self.git.token:
            errors.append("GIT_TOKEN is required")
        url = self.git.repo_url.lower()
        if self.git.repo_url and not (url.startswith("https://") or url.startswith("git@")):
            errors.append("GIT_REPO_URL should start with https:// or git@")
        if self.worker.max_workers < 1:
            errors.append("MAX_WORKERS must be >= 1")
        if self.llm.max_concurrent_requests < 0:
            errors.append("LLM_MAX_CONCURRENT must be >= 0")
        return errors
