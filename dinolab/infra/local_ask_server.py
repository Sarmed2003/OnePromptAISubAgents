"""Local DINOLAB research API server (Bedrock-backed).

Run:
  BEDROCK_MODEL_ID=<model-or-inference-profile> python local_ask_server.py --port 8787
"""

from __future__ import annotations

import argparse
import json
import logging
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

import boto3

LOG = logging.getLogger("dinolab.local_api")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

try:
    from dotenv import load_dotenv
except Exception:  # pragma: no cover - optional helper
    load_dotenv = None

if load_dotenv is not None:
    repo_env = Path(__file__).resolve().parents[2] / ".env"
    if repo_env.exists():
        load_dotenv(repo_env)

for _k in ("HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"):
    # Local Bedrock calls should use direct AWS endpoints.
    os.environ.pop(_k, None)

SYSTEM_PROMPT = (
    "You are a dinosaur science assistant for DINOLAB, a college-level learning interface. "
    "Write in clear, approachable language for students who are new to paleontology, while staying scientifically accurate. "
    "Explain terms briefly when first used, and use short sections: What we know, Main evidence, Open questions. "
    "Discuss uncertainty and competing ideas when relevant. Do not invent specimen numbers or fake citations."
)


class Handler(BaseHTTPRequestHandler):
    region = os.environ.get("BEDROCK_REGION", os.environ.get("AWS_REGION", "us-east-1"))
    bedrock = boto3.client("bedrock-runtime", region_name=region)
    model_id = os.environ.get("BEDROCK_MODEL_ID", "us.anthropic.claude-haiku-4-5-20251001-v1:0")

    def _send(self, status: int, body: dict[str, Any]) -> None:
        raw = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type,Authorization")
        self.send_header("Access-Control-Allow-Methods", "OPTIONS,POST")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self._send(200, {"ok": True})

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/lab/ask":
            self._send(404, {"error": "not_found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length).decode("utf-8") or "{}")
        except Exception:
            self._send(400, {"error": "Invalid JSON"})
            return

        question = str(payload.get("question") or "").strip()
        if not question:
            self._send(400, {"error": "question required"})
            return

        species = str(payload.get("speciesBinomial") or "Unknown taxon").strip()
        bone = str(payload.get("boneScientificName") or "").strip()
        ctx = str(payload.get("boneContext") or "").strip()[:5000]
        user_text = (
            f"Taxon: {species}\n"
            f"Bone focus: {bone or 'General'}\n"
            f"Context:\n{ctx}\n\n"
            f"Question:\n{question}"
        )
        try:
            resp = self.bedrock.converse(
                modelId=self.model_id,
                system=[{"text": SYSTEM_PROMPT}],
                messages=[{"role": "user", "content": [{"text": user_text}]}],
                inferenceConfig={"maxTokens": 1500, "temperature": 0.35},
            )
            parts = (resp.get("output") or {}).get("message", {}).get("content") or []
            answer = "".join(p.get("text", "") for p in parts if isinstance(p, dict))
            self._send(200, {"answer": answer, "modelId": self.model_id})
        except Exception as exc:  # pragma: no cover - runtime diagnostics
            LOG.exception("Bedrock request failed")
            self._send(502, {"error": f"Bedrock request failed: {exc}"})

    def log_message(self, fmt: str, *args: Any) -> None:  # silence default logs
        LOG.info("%s - %s", self.address_string(), fmt % args)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8787)
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    LOG.info("DINOLAB local API listening on http://%s:%d", args.host, args.port)
    server.serve_forever()


if __name__ == "__main__":
    main()
