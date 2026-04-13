"""DINOLAB scientific Q&A — Amazon Bedrock + optional DynamoDB query log + S3 (bucket ARN passed for future presigns)."""

from __future__ import annotations

import json
import logging
import os
import time
import uuid
from typing import Any

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "")
TABLE_NAME = os.environ.get("QUERY_LOG_TABLE", "")

SYSTEM_PROMPT = """You are a dinosaur science assistant for DINOLAB, a college-level learning interface. \
Write in clear, approachable language for students who are new to paleontology, while staying scientifically accurate. \
Explain terms briefly when first used, and use short sections: What we know, Main evidence, Open questions. \
Discuss uncertainty and competing ideas when relevant. Do not invent specimen numbers or fake citations. \
If a user asks for medical or veterinary advice, decline and refocus on fossil science."""

bedrock = boto3.client("bedrock-runtime")
ddb = boto3.resource("dynamodb") if TABLE_NAME else None


def _json_response(status: int, body: dict[str, Any]) -> dict[str, Any]:
    """Format a JSON response with CORS headers."""
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": os.environ.get("CORS_ORIGIN", "*"),
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "OPTIONS,POST",
        },
        "body": json.dumps(body),
    }


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """AWS Lambda handler for research questions via Bedrock Converse API.
    
    Accepts POST requests with JSON body containing 'question' and optional
    'speciesBinomial', 'boneContext', 'boneScientificName'. Returns formatted
    answer from Bedrock with request metadata. Handles errors gracefully with
    appropriate HTTP status codes and error messages.
    
    Args:
        event: API Gateway Lambda proxy integration event
        context: Lambda context object
        
    Returns:
        dict with statusCode, headers, and JSON body
    """
    # Handle CORS preflight
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return _json_response(200, {"ok": True})

    # Parse request body
    try:
        raw = event.get("body") or "{}"
        payload = json.loads(raw)
    except json.JSONDecodeError:
        logger.warning("Invalid JSON body received")
        return _json_response(400, {"error": "Invalid JSON body"})

    # Validate and extract question
    question = (payload.get("question") or "").strip()
    if not question or len(question) > 8000:
        logger.warning("Question validation failed: empty or too long")
        return _json_response(400, {"error": "question required, max 8000 chars"})

    # Extract optional context fields
    species_binomial = (payload.get("speciesBinomial") or "").strip() or "Unknown taxon"
    bone_ctx = (payload.get("boneContext") or "").strip()[:6000]
    bone_name = (payload.get("boneScientificName") or "").strip()

    # Build user message with context
    user_block = f"""Taxon: {species_binomial}
Bone focus: {bone_name or "General / whole-animal"}
UI context (may truncate):
{bone_ctx}

Research question:
{question}"""

    # Verify Bedrock model is configured
    if not BEDROCK_MODEL_ID:
        logger.error("BEDROCK_MODEL_ID not configured")
        return _json_response(500, {"error": "BEDROCK_MODEL_ID not configured"})

    # Call Bedrock Converse API
    try:
        resp = bedrock.converse(
            modelId=BEDROCK_MODEL_ID,
            system=[{"text": SYSTEM_PROMPT}],
            messages=[
                {
                    "role": "user",
                    "content": [{"text": user_block}],
                }
            ],
            inferenceConfig={
                "maxTokens": 4096,
                "temperature": 0.35,
            },
        )
    except Exception as e:
        logger.exception("Bedrock converse failed")
        return _json_response(502, {"error": str(e)[:500]})

    # Extract text from response
    parts = (resp.get("output") or {}).get("message", {}).get("content") or []
    text = ""
    for p in parts:
        if isinstance(p, dict) and "text" in p:
            text += p["text"]

    # Generate request ID and timestamp
    rid = str(uuid.uuid4())
    now = int(time.time())

    # Log query to DynamoDB if configured
    if ddb and TABLE_NAME:
        try:
            table = ddb.Table(TABLE_NAME)
            table.put_item(
                Item={
                    "id": rid,
                    "ts": now,
                    "ttl": now + 60 * 60 * 24 * 90,
                    "species": species_binomial[:200],
                    "bone": bone_name[:200],
                    "question": question[:2000],
                    "answer_preview": text[:500],
                }
            )
        except Exception:
            logger.exception("DynamoDB log failed (non-fatal)")

    # Return successful response
    return _json_response(
        200,
        {
            "answer": text or "(empty model output)",
            "modelId": BEDROCK_MODEL_ID,
            "requestId": rid,
        },
    )
