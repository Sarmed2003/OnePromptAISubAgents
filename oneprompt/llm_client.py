"""Multi-provider LLM: AWS Bedrock (primary), Gemini, Ollama (fallback)."""

from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Any

import aiohttp

from .config import LLMConfig

logger = logging.getLogger(__name__)

MAX_RETRIES = 5
BASE_RETRY_DELAY = 10

_JSON_SUFFIX = (
    "\n\nRespond with valid JSON only. Do not wrap in markdown code fences."
)


def _find_json_string_end(text: str, start: int) -> int:
    """Find the closing quote of a JSON string value, respecting escape sequences.

    Returns the index of the closing quote, or -1 if the string is unterminated.
    """
    i = start
    while i < len(text):
        ch = text[i]
        if ch == "\\":
            i += 2
            continue
        if ch == '"':
            return i
        i += 1
    return -1


class LLMClient:
    """Unified LLM interface: Bedrock Converse, Gemini, or Ollama.

    Bedrock: AWS retired the old Model access page; access is automatic with
    correct IAM/Marketplace permissions. Anthropic models need a one-time FTU
    form (console or PutUseCaseForModelAccess). See model-access.html on AWS.

    Converse API:
    https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html

    FALLBACK_TO_OLLAMA: throttling only, not AccessDeniedException.
    """

    def __init__(self, config: LLMConfig):
        self.config = config
        self.total_tokens = 0
        self._request_count = 0
        self._gemini_client = None
        self._bedrock_client = None
        self._ollama_available: bool | None = None
        self._ollama_session: aiohttp.ClientSession | None = None

        if config.provider == "gemini":
            try:
                from google import genai
                self._gemini_client = genai.Client(api_key=config.api_key)
            except Exception as e:
                logger.warning("Gemini client init failed: %s", e)

        if config.provider == "bedrock":
            self._bedrock_client = self._make_bedrock_client()

        mc = config.max_concurrent_requests or 0
        self._llm_limit: asyncio.Semaphore | None = (
            asyncio.Semaphore(mc) if mc > 0 else None
        )

    def _make_bedrock_client(self):
        import boto3
        kw: dict[str, str] = {"region_name": self.config.bedrock_region}
        if self.config.aws_access_key_id:
            kw["aws_access_key_id"] = self.config.aws_access_key_id
        if self.config.aws_secret_access_key:
            kw["aws_secret_access_key"] = self.config.aws_secret_access_key
        if self.config.aws_session_token:
            kw["aws_session_token"] = self.config.aws_session_token
        return boto3.client("bedrock-runtime", **kw)

    # ------------------------------------------------------------------
    # Core generation
    # ------------------------------------------------------------------

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        response_format: str = "text",
    ) -> str:
        if self._llm_limit is not None:
            async with self._llm_limit:
                return await self._generate_inner(
                    system_prompt, user_prompt, response_format
                )
        return await self._generate_inner(
            system_prompt, user_prompt, response_format
        )

    async def _generate_inner(
        self,
        system_prompt: str,
        user_prompt: str,
        response_format: str = "text",
    ) -> str:
        if self.config.provider == "ollama":
            return await self._generate_ollama(system_prompt, user_prompt, response_format)

        if self.config.provider == "bedrock":
            try:
                return await self._generate_bedrock(system_prompt, user_prompt, response_format)
            except Exception as e:
                if self.config.fallback_to_ollama and self._is_cloud_throttle(e):
                    logger.warning("Bedrock throttled or unavailable — falling back to Ollama")
                    return await self._generate_ollama(system_prompt, user_prompt, response_format)
                raise

        try:
            return await self._generate_gemini(system_prompt, user_prompt, response_format)
        except Exception as e:
            if self.config.fallback_to_ollama and self._is_cloud_throttle(e):
                logger.warning("Gemini rate-limited — falling back to Ollama")
                return await self._generate_ollama(system_prompt, user_prompt, response_format)
            raise

    # ------------------------------------------------------------------
    # AWS Bedrock (Converse API)
    # ------------------------------------------------------------------

    async def _generate_bedrock(
        self,
        system_prompt: str,
        user_prompt: str,
        response_format: str = "text",
    ) -> str:
        if self._bedrock_client is None:
            self._bedrock_client = self._make_bedrock_client()

        user_text = user_prompt
        if response_format == "json":
            user_text = user_prompt + _JSON_SUFFIX

        sys_text = system_prompt or "You are a helpful assistant."
        if response_format == "json":
            sys_text = sys_text + " Always output strictly valid JSON."

        cap = max(256, self.config.bedrock_max_output_tokens)
        max_out = min(max(self.config.max_tokens, 1), cap)

        def _call():
            kwargs: dict[str, Any] = {
                "modelId": self.config.bedrock_model_id,
                "messages": [
                    {"role": "user", "content": [{"text": user_text}]},
                ],
                "inferenceConfig": {
                    "maxTokens": max_out,
                    "temperature": self.config.temperature,
                },
            }
            if sys_text.strip():
                kwargs["system"] = [{"text": sys_text}]
            return self._bedrock_client.converse(**kwargs)

        last_err: Exception | None = None
        for attempt in range(MAX_RETRIES):
            try:
                self._request_count += 1
                response = await asyncio.to_thread(_call)
                text = self._extract_bedrock_text(response)
                usage = response.get("usage") or {}
                self.total_tokens += int(usage.get("inputTokens") or 0)
                self.total_tokens += int(usage.get("outputTokens") or 0)
                stop = response.get("stopReason", "")
                if stop == "max_tokens":
                    logger.warning(
                        "Bedrock output truncated (hit %d token limit). "
                        "Consider increasing BEDROCK_MAX_OUTPUT_TOKENS.",
                        max_out,
                    )
                return text
            except Exception as e:
                last_err = e
                if self._is_bedrock_access_pending(e):
                    wait = 45
                    logger.warning(
                        "Bedrock AccessDenied (subscription/FTU may be pending). "
                        "Retry %d/%d in %.0fs — see "
                        "https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html",
                        attempt + 1, min(3, MAX_RETRIES), wait,
                    )
                    if attempt < 3:
                        await asyncio.sleep(wait)
                        continue
                if self._is_bedrock_throttle(e):
                    wait = BASE_RETRY_DELAY * (2 ** attempt)
                    logger.warning(
                        "Bedrock throttled (attempt %d/%d). Waiting %.0fs...",
                        attempt + 1, MAX_RETRIES, wait,
                    )
                    await asyncio.sleep(wait)
                    continue
                self._log_bedrock_configuration_hint(e)
                logger.error("Bedrock Converse error: %s", e)
                raise

        logger.error("All %d Bedrock retries exhausted: %s", MAX_RETRIES, last_err)
        raise last_err  # type: ignore[misc]

    @staticmethod
    def _extract_bedrock_text(response: dict[str, Any]) -> str:
        msg = response.get("output", {}).get("message", {})
        blocks = msg.get("content") or []
        parts: list[str] = []
        for b in blocks:
            if isinstance(b, dict) and "text" in b:
                parts.append(b["text"])
        return "".join(parts)

    @staticmethod
    def _is_bedrock_access_pending(err: Exception) -> bool:
        """AccessDenied while Marketplace subscription or Anthropic FTU is finishing."""
        try:
            from botocore.exceptions import ClientError
            if isinstance(err, ClientError):
                code = err.response.get("Error", {}).get("Code", "")
                return code == "AccessDeniedException"
        except ImportError:
            pass
        return "AccessDeniedException" in str(err)

    @staticmethod
    def _log_bedrock_configuration_hint(err: Exception) -> None:
        try:
            from botocore.exceptions import ClientError
            if not isinstance(err, ClientError):
                return
            code = err.response.get("Error", {}).get("Code", "")
            if code == "AccessDeniedException":
                logger.error(
                    "Bedrock AccessDenied: submit Anthropic First Time Use in the "
                    "Bedrock console model catalog; ensure IAM allows bedrock:InvokeModel "
                    "and (for first use) aws-marketplace:Subscribe / ViewSubscriptions. "
                    "https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html"
                )
            elif code == "ValidationException":
                em = str(err)
                if "inference profile" in em.lower():
                    logger.error(
                        "This model must be called with an inference profile ID "
                        "(e.g. us.anthropic.claude-3-5-haiku-20241022-v1:0). "
                        "Set BEDROCK_MODEL_ID in .env to the profile from Bedrock console."
                    )
                else:
                    logger.error(
                        "Bedrock ValidationException: if this mentions maxTokens, "
                        "lower BEDROCK_MAX_OUTPUT_TOKENS or LLM_MAX_TOKENS in .env."
                    )
        except ImportError:
            pass

    @staticmethod
    def _is_bedrock_throttle(err: Exception) -> bool:
        try:
            from botocore.exceptions import ClientError
            if isinstance(err, ClientError):
                code = err.response.get("Error", {}).get("Code", "")
                if code in (
                    "ThrottlingException",
                    "TooManyRequestsException",
                    "ServiceUnavailableException",
                ):
                    return True
        except ImportError:
            pass
        s = str(err)
        return "ThrottlingException" in s or "TooManyRequests" in s

    # ------------------------------------------------------------------
    # Gemini backend
    # ------------------------------------------------------------------

    async def _generate_gemini(
        self,
        system_prompt: str,
        user_prompt: str,
        response_format: str = "text",
    ) -> str:
        from google.genai import types

        if self._gemini_client is None:
            from google import genai
            self._gemini_client = genai.Client(api_key=self.config.api_key)

        last_err = None
        for attempt in range(MAX_RETRIES):
            try:
                self._request_count += 1
                config = types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=self.config.temperature,
                    max_output_tokens=self.config.max_tokens,
                    response_mime_type=(
                        "application/json" if response_format == "json" else "text/plain"
                    ),
                )
                response = await asyncio.to_thread(
                    self._gemini_client.models.generate_content,
                    model=self.config.model,
                    contents=user_prompt,
                    config=config,
                )

                if response.usage_metadata:
                    self.total_tokens += response.usage_metadata.total_token_count or 0

                return response.text or ""

            except Exception as e:
                last_err = e
                if self._is_gemini_rate_limit(e):
                    wait = self._parse_retry_delay(e, attempt)
                    logger.warning(
                        "Gemini rate-limited (attempt %d/%d). Waiting %.0fs...",
                        attempt + 1, MAX_RETRIES, wait,
                    )
                    await asyncio.sleep(wait)
                    continue
                logger.error("Gemini API error: %s", e)
                raise

        logger.error("All %d Gemini retries exhausted. Last error: %s", MAX_RETRIES, last_err)
        raise last_err  # type: ignore[misc]

    # ------------------------------------------------------------------
    # Ollama backend
    # ------------------------------------------------------------------

    async def _generate_ollama(
        self,
        system_prompt: str,
        user_prompt: str,
        response_format: str = "text",
    ) -> str:
        url = f"{self.config.ollama_url}/api/chat"
        payload: dict[str, Any] = {
            "model": self.config.ollama_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "stream": False,
            "options": {
                "temperature": self.config.temperature,
                "num_predict": self.config.max_tokens,
            },
        }

        if response_format == "json":
            payload["format"] = "json"

        self._request_count += 1
        if self._ollama_session is None or self._ollama_session.closed:
            self._ollama_session = aiohttp.ClientSession()
        async with self._ollama_session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=300)) as resp:
            if resp.status != 200:
                body = await resp.text()
                raise RuntimeError(f"Ollama returned {resp.status}: {body[:300]}")
            data = await resp.json()

        text = data.get("message", {}).get("content", "")
        if data.get("eval_count"):
            self.total_tokens += data["eval_count"]
        return text

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _is_gemini_rate_limit(err: Exception) -> bool:
        s = str(err)
        return "429" in s or "RESOURCE_EXHAUSTED" in s

    @staticmethod
    def _is_cloud_throttle(err: Exception) -> bool:
        if LLMClient._is_gemini_rate_limit(err):
            return True
        return LLMClient._is_bedrock_throttle(err)

    @staticmethod
    def _parse_retry_delay(err: Exception, attempt: int) -> float:
        m = re.search(r"retry in ([\d.]+)s", str(err), re.IGNORECASE)
        if m:
            return float(m.group(1)) + 2
        return BASE_RETRY_DELAY * (2 ** attempt)

    # ------------------------------------------------------------------
    # Structured JSON generation
    # ------------------------------------------------------------------

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> dict[str, Any] | list[Any]:
        raw = await self.generate(system_prompt, user_prompt, response_format="json")
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]
            raw = raw.strip()
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("Failed to parse JSON, attempting extraction...")
            json_match = re.search(r'[\[{].*[\]}]', raw, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group(0))
                except json.JSONDecodeError:
                    pass
            repaired = self._repair_truncated_json(raw)
            if repaired is not None:
                logger.info("Repaired truncated JSON — salvaged partial output")
                return repaired
            raise

    @staticmethod
    def _repair_truncated_json(raw: str) -> dict[str, Any] | None:
        """Attempt to salvage a truncated JSON worker response.

        When the LLM hits the max_tokens limit, the JSON is cut mid-string.
        This extracts complete "path": "content" pairs from the "files" object
        and builds a valid partial response so the worker can commit whatever
        files were fully generated.
        """
        files_match = re.search(r'"files"\s*:\s*\{', raw)
        if not files_match:
            return None

        files: dict[str, str] = {}
        pos = files_match.end()
        file_pattern = re.compile(
            r'"([^"]+)"\s*:\s*"',
            re.DOTALL,
        )

        while pos < len(raw):
            m = file_pattern.search(raw, pos)
            if not m:
                break
            path = m.group(1)
            content_start = m.end()
            content_end = _find_json_string_end(raw, content_start)
            if content_end == -1:
                break
            content = raw[content_start:content_end]
            content = content.replace("\\n", "\n").replace('\\"', '"').replace("\\\\", "\\").replace("\\t", "\t")
            files[path] = content
            pos = content_end + 1

        if not files:
            return None

        return {
            "files": files,
            "handoff": {
                "status": "partial",
                "summary": f"Output was truncated by token limit; salvaged {len(files)} complete file(s).",
                "filesChanged": list(files.keys()),
                "concerns": ["LLM output was truncated — some files may be missing."],
                "suggestions": [],
            },
        }

    # ------------------------------------------------------------------
    # High-level agent methods
    # ------------------------------------------------------------------

    async def plan_tasks(
        self,
        system_prompt: str,
        spec: str,
        file_tree: str,
        context: str = "",
    ) -> dict[str, Any]:
        user_msg = f"""## Project Specification
{spec}

## Current File Tree
{file_tree}

## Additional Context
{context if context else 'Initial planning — no prior work.'}

Respond with a JSON object containing "scratchpad" (string) and "tasks" (array of task objects).
Each task: {{"id": "task-NNN", "description": "...", "scope": ["file1.py"], "acceptance": "...", "branch": "worker/task-NNN-slug", "priority": N}}"""

        return await self.generate_json(system_prompt, user_msg)

    async def execute_worker_task(
        self,
        system_prompt: str,
        task: dict[str, Any],
        file_contents: dict[str, str],
    ) -> dict[str, Any]:
        files_section = "\n".join(
            f"\n### {path}\n```\n{content}\n```\n"
            for path, content in file_contents.items()
        )

        scope_list = task.get("scope", []) or []
        if not isinstance(scope_list, list):
            scope_list = [str(scope_list)]
        scope_list = [str(x) for x in scope_list if str(x).strip()]
        scope_str = ", ".join(scope_list) if scope_list else "(empty — repo-wide; use any paths needed)"
        if scope_list:
            scope_rule = (
                f"**CRITICAL:** Only output files under your scope: {scope_str}. "
                "Keys outside scope are dropped by the runner."
            )
            example_path = scope_list[0]
            files_instruction = (
                f'Your \"files\" keys MUST be within scope. Example key: \"{example_path}\"'
            )
        else:
            scope_rule = (
                "**CRITICAL:** Scope is empty — this is a repo-wide task (e.g. consolidation). "
                "Use Current File Contents; output every file path you change with full content."
            )
            files_instruction = 'Use real paths as \"files\" keys (e.g. \"src/app.ts\").'
        user_msg = f"""## Your Task
- **ID**: {task['id']}
- **Description**: {task['description']}
- **Scope**: {scope_str}
- **Acceptance Criteria**: {task.get('acceptance', 'N/A')}

{scope_rule}

## Current File Contents
{files_section if files_section else 'No files loaded — infer from task or create minimal structure.'}

Generate the complete implementation. {files_instruction} Respond with a JSON object:
{{
  "files": {{
    "{example_path if scope_list else 'path/to/real/file.ext'}": "complete file content..."
  }},
  "handoff": {{
    "status": "complete|partial|blocked|failed",
    "summary": "What you did...",
    "filesChanged": ["{example_path if scope_list else 'path/to/real/file.ext'}"],
    "concerns": ["any concerns"],
    "suggestions": ["follow-up ideas"]
  }}
}}"""

        return await self.generate_json(system_prompt, user_msg)

    async def run_reconciler(
        self,
        system_prompt: str,
        build_output: str,
        test_output: str,
        recent_commits: str,
    ) -> list[dict[str, Any]]:
        user_msg = f"""## Build Output
{build_output}

## Test Output
{test_output}

## Recent Commits
{recent_commits}

Analyze the outputs. If everything passes, respond with an empty JSON array: []
If there are errors, respond with a JSON array of fix tasks."""

        result = await self.generate_json(system_prompt, user_msg)
        if isinstance(result, list):
            return result
        return result.get("tasks", [])
