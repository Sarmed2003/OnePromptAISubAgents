"""Local DINOLAB research API server (Bedrock-backed).

Run:
  BEDROCK_MODEL_ID=<model-or-inference-profile> python local_ask_server.py --port 8080
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import signal
import sys
import urllib.parse
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
        self.send_header("Access-Control-Allow-Methods", "OPTIONS,POST,GET")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _send_html(self, status: int, html: str) -> None:
        raw = html.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self._send(200, {"ok": True})

    def do_GET(self) -> None:  # noqa: N802
        """Browser checks often hit GET / — explain that the UI runs via Vite, not here."""
        parsed = urllib.parse.urlparse(self.path)
        path = (parsed.path or "/").rstrip("/") or "/"

        if path == "/favicon.ico":
            self.send_response(204)
            self.end_headers()
            return

        if path == "/health":
            self._send(200, {"ok": True, "service": "dinolab-local-ask", "askPath": "/lab/ask"})
            return

        if path == "/":
            port = self.server.server_address[1]
            html = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>DINOLAB local API</title>
<style>body{{font-family:system-ui,sans-serif;max-width:42rem;margin:2rem;line-height:1.45}}
code,pre{{background:#f4f4f5;padding:0.15em 0.35em;border-radius:4px}}pre{{padding:0.75em;overflow:auto}}</style></head>
<body>
<h1>DINOLAB local API is running</h1>
<p>This address (<strong>port {port}</strong>) is the <em>research backend</em> only. There is no web app here — a <code>501</code> on GET used to mean "wrong place"; you are in the right place now.</p>
<h2>To use the research console</h2>
<ol>
<li>Keep this terminal process running.</li>
<li>Open a <strong>second</strong> terminal and run:<pre>cd dinolab/web
cp .env.example .env
# Edit .env — set:</pre>
<pre>VITE_API_URL=http://127.0.0.1:{port}</pre>
<pre>npm install
npm run dev</pre></li>
<li>Open the URL Vite prints (e.g. <code>http://localhost:5173</code>), then use <strong>Research</strong> in the app — it sends <code>POST /lab/ask</code> here.</li>
</ol>
<p><a href="/health">GET /health</a> — JSON status for scripts.</p>
</body></html>"""
            self._send_html(200, html)
            return

        self.send_response(404)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"error":"not_found"}')

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
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()
    
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    
    # Print startup message with test URL
    test_url = f"http://{args.host}:{args.port}/lab/ask"
    LOG.info("DINOLAB local API listening on http://%s:%d", args.host, args.port)
    LOG.info("Test URL: %s", test_url)
    LOG.info("Example request: curl -X POST %s -H 'Content-Type: application/json' -d '{\"question\":\"What is a dinosaur?\"}'" , test_url)
    
    # Setup clean shutdown
    def signal_handler(signum: int, frame: Any) -> None:
        LOG.info("Shutdown signal received, stopping server...")
        server.shutdown()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        LOG.info("Server stopped")


if __name__ == "__main__":
    main()
