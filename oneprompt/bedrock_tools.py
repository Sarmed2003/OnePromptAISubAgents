"""CLI helpers for Bedrock (no AWS CLI binary required).

Loads credentials from .env so you don't need ``aws configure``.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path


def _load_env() -> None:
    """Load .env from the project root (two levels up from this file)."""
    from dotenv import load_dotenv

    env_path = Path(__file__).resolve().parent.parent / ".env"
    load_dotenv(env_path, override=False)


def _boto_kwargs(region: str) -> dict[str, str]:
    kw: dict[str, str] = {"region_name": region}
    ak = os.getenv("AWS_ACCESS_KEY_ID", "")
    sk = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    st = os.getenv("AWS_SESSION_TOKEN", "")
    if ak:
        kw["aws_access_key_id"] = ak
    if sk:
        kw["aws_secret_access_key"] = sk
    if st:
        kw["aws_session_token"] = st
    return kw


def list_inference_profiles(region: str | None = None) -> list[dict]:
    import boto3

    r = region or os.getenv("BEDROCK_REGION") or os.getenv("AWS_REGION") or "us-east-1"
    client = boto3.client("bedrock", **_boto_kwargs(r))
    summaries: list[dict] = []
    token: str | None = None
    while True:
        kwargs: dict = {"maxResults": 500}
        if token:
            kwargs["nextToken"] = token
        resp = client.list_inference_profiles(**kwargs)
        for s in resp.get("inferenceProfileSummaries", []):
            summaries.append(dict(s))
        token = resp.get("nextToken")
        if not token:
            break
    return summaries


def check_dynamodb(region: str | None = None, prefix: str = "onepromptai") -> None:
    """Quick connectivity check for DynamoDB tables."""
    import boto3

    r = region or os.getenv("AWS_REGION") or "us-east-1"
    client = boto3.client("dynamodb", **_boto_kwargs(r))
    tables = client.list_tables().get("TableNames", [])
    ours = [t for t in tables if t.startswith(prefix)]
    print(f"Region: {r}")
    print(f"All tables: {tables}")
    print(f"OnePromptAI tables (prefix={prefix}): {ours}")
    if not ours:
        print(f"\nNo tables with prefix '{prefix}_' found — they will be auto-created on first run.")


def check_bedrock_model(model_id: str | None = None, region: str | None = None) -> None:
    """Quick smoke-test: send a tiny Converse call to verify model access."""
    import boto3

    r = region or os.getenv("BEDROCK_REGION") or os.getenv("AWS_REGION") or "us-east-1"
    mid = model_id or os.getenv("BEDROCK_MODEL_ID", "us.anthropic.claude-3-5-haiku-20241022-v1:0")
    client = boto3.client("bedrock-runtime", **_boto_kwargs(r))
    print(f"Testing Converse with model={mid} region={r} ...")
    try:
        resp = client.converse(
            modelId=mid,
            messages=[{"role": "user", "content": [{"text": "Say hello in one word."}]}],
            inferenceConfig={"maxTokens": 32, "temperature": 0.0},
        )
        text = resp["output"]["message"]["content"][0]["text"]
        usage = resp.get("usage", {})
        print(f"Model responded: {text}")
        print(f"Tokens — input: {usage.get('inputTokens')}, output: {usage.get('outputTokens')}")
        print("Bedrock Converse is working.")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


def main() -> None:
    _load_env()

    if len(sys.argv) > 1 and sys.argv[1] in ("-h", "--help"):
        print(
            "Usage: python -m oneprompt.bedrock_tools [command]\n\n"
            "Commands:\n"
            "  profiles   List Bedrock inference profiles (default)\n"
            "  dynamo     Check DynamoDB connectivity & tables\n"
            "  test       Send a tiny Converse request to verify model access\n\n"
            "Credentials are loaded from .env (AWS_ACCESS_KEY_ID, etc.)."
        )
        sys.exit(0)

    cmd = sys.argv[1] if len(sys.argv) > 1 else "profiles"

    if cmd == "dynamo":
        check_dynamodb()
    elif cmd == "test":
        check_bedrock_model()
    else:
        try:
            profiles = list_inference_profiles()
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)
        print(json.dumps(profiles, indent=2, default=str))


if __name__ == "__main__":
    main()
