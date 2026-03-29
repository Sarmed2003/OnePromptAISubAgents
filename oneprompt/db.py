"""Database abstraction layer supporting DynamoDB, MongoDB, or in-memory storage.

DynamoDB is the default when running with AWS (serverless, zero setup).
MongoDB is supported as a fallback. In-memory mode runs with no external deps.
"""

from __future__ import annotations

import json
import logging
import time
from typing import Any, Protocol

logger = logging.getLogger(__name__)


class DatabaseBackend(Protocol):
    """Interface all storage backends must implement."""

    def connect(self) -> bool: ...
    def upsert_task(self, task_dict: dict[str, Any]) -> None: ...
    def log_event(self, event_type: str, data: dict[str, Any]) -> None: ...
    def save_run_metrics(self, metrics: dict[str, Any]) -> None: ...
    def get_tasks(self, status: str | None = None) -> list[dict[str, Any]]: ...
    def get_run_history(self, limit: int = 10) -> list[dict[str, Any]]: ...
    @property
    def is_connected(self) -> bool: ...


class DynamoDBBackend:
    """AWS DynamoDB storage backend — serverless, no setup required."""

    def __init__(
        self,
        region: str = "us-east-1",
        table_prefix: str = "onepromptai",
        access_key_id: str = "",
        secret_access_key: str = "",
        session_token: str = "",
    ):
        self.region = region
        self.table_prefix = table_prefix
        self._access_key_id = access_key_id
        self._secret_access_key = secret_access_key
        self._session_token = session_token
        self._dynamodb = None
        self._connected = False
        self._tables: dict[str, Any] = {}

    def _boto_kwargs(self) -> dict[str, str]:
        kw: dict[str, str] = {"region_name": self.region}
        if self._access_key_id:
            kw["aws_access_key_id"] = self._access_key_id
        if self._secret_access_key:
            kw["aws_secret_access_key"] = self._secret_access_key
        if self._session_token:
            kw["aws_session_token"] = self._session_token
        return kw

    def connect(self) -> bool:
        try:
            import boto3
            bkw = self._boto_kwargs()
            self._dynamodb = boto3.resource("dynamodb", **bkw)
            client = boto3.client("dynamodb", **bkw)
            client.list_tables(Limit=1)
            self._ensure_tables(client)
            self._connected = True
            logger.info("DynamoDB connected (region=%s, prefix=%s)", self.region, self.table_prefix)
            return True
        except Exception as e:
            logger.warning("DynamoDB unavailable: %s — falling back to in-memory", e)
            self._connected = False
            return False

    def _ensure_tables(self, client) -> None:
        existing = {t for t in client.list_tables().get("TableNames", [])}
        table_defs = {
            "tasks": {"pk": "id", "pk_type": "S"},
            "events": {"pk": "event_id", "pk_type": "S"},
            "runs": {"pk": "run_id", "pk_type": "S"},
        }
        for suffix, schema in table_defs.items():
            table_name = f"{self.table_prefix}_{suffix}"
            if table_name not in existing:
                try:
                    client.create_table(
                        TableName=table_name,
                        KeySchema=[{"AttributeName": schema["pk"], "KeyType": "HASH"}],
                        AttributeDefinitions=[
                            {"AttributeName": schema["pk"], "AttributeType": schema["pk_type"]}
                        ],
                        BillingMode="PAY_PER_REQUEST",
                    )
                    waiter = client.get_waiter("table_exists")
                    waiter.wait(TableName=table_name, WaiterConfig={"Delay": 2, "MaxAttempts": 30})
                    logger.info("Created DynamoDB table: %s", table_name)
                except Exception as e:
                    logger.warning("Could not create table %s: %s", table_name, e)

            self._tables[suffix] = self._dynamodb.Table(table_name)

    @property
    def is_connected(self) -> bool:
        return self._connected

    def upsert_task(self, task_dict: dict[str, Any]) -> None:
        if not self._connected:
            return
        try:
            clean = self._sanitize_for_dynamo(task_dict)
            self._tables["tasks"].put_item(Item=clean)
        except Exception as e:
            logger.debug("DynamoDB upsert_task failed: %s", e)

    def log_event(self, event_type: str, data: dict[str, Any]) -> None:
        if not self._connected:
            return
        try:
            import uuid
            self._tables["events"].put_item(Item={
                "event_id": str(uuid.uuid4()),
                "type": event_type,
                "data": json.dumps(data),
                "timestamp": str(time.time()),
            })
        except Exception as e:
            logger.debug("DynamoDB log_event failed: %s", e)

    def save_run_metrics(self, metrics: dict[str, Any]) -> None:
        if not self._connected:
            return
        try:
            clean = self._sanitize_for_dynamo(metrics)
            self._tables["runs"].put_item(Item=clean)
        except Exception as e:
            logger.debug("DynamoDB save_run_metrics failed: %s", e)

    def get_tasks(self, status: str | None = None) -> list[dict[str, Any]]:
        if not self._connected:
            return []
        try:
            if status:
                resp = self._tables["tasks"].scan(
                    FilterExpression="task_status = :s",
                    ExpressionAttributeValues={":s": status},
                )
            else:
                resp = self._tables["tasks"].scan()
            return resp.get("Items", [])
        except Exception:
            return []

    def get_run_history(self, limit: int = 10) -> list[dict[str, Any]]:
        if not self._connected:
            return []
        try:
            resp = self._tables["runs"].scan(Limit=limit)
            items = resp.get("Items", [])
            items.sort(key=lambda x: float(x.get("started_at", 0)), reverse=True)
            return items[:limit]
        except Exception:
            return []

    @staticmethod
    def _sanitize_for_dynamo(d: dict[str, Any]) -> dict[str, Any]:
        """DynamoDB cannot store empty strings or float NaN/Inf."""
        clean = {}
        for k, v in d.items():
            if k == "status":
                k = "task_status"
            if isinstance(v, str):
                clean[k] = v if v else "(empty)"
            elif isinstance(v, float):
                clean[k] = str(v)
            elif isinstance(v, dict):
                clean[k] = json.dumps(v)
            elif isinstance(v, list):
                clean[k] = json.dumps(v)
            elif v is None:
                continue
            else:
                clean[k] = v
        return clean


class MongoDBBackend:
    """MongoDB storage backend — use when you have a Mongo instance available."""

    def __init__(self, uri: str = "mongodb://localhost:27017", db_name: str = "onepromptai"):
        self.uri = uri
        self.db_name = db_name
        self._db = None
        self._connected = False

    def connect(self) -> bool:
        try:
            from pymongo import MongoClient
            client = MongoClient(self.uri, serverSelectionTimeoutMS=3000)
            client.admin.command("ping")
            self._db = client[self.db_name]
            self._connected = True
            logger.info("MongoDB connected: %s/%s", self.uri, self.db_name)
            return True
        except Exception as e:
            logger.warning("MongoDB unavailable: %s", e)
            self._connected = False
            return False

    @property
    def is_connected(self) -> bool:
        return self._connected

    def upsert_task(self, task_dict: dict[str, Any]) -> None:
        if not self._connected:
            return
        self._db["tasks"].update_one(
            {"id": task_dict["id"]}, {"$set": task_dict}, upsert=True
        )

    def log_event(self, event_type: str, data: dict[str, Any]) -> None:
        if not self._connected:
            return
        self._db["events"].insert_one({
            "type": event_type, "data": data, "timestamp": time.time()
        })

    def save_run_metrics(self, metrics: dict[str, Any]) -> None:
        if not self._connected:
            return
        self._db["runs"].update_one(
            {"run_id": metrics.get("run_id")}, {"$set": metrics}, upsert=True
        )

    def get_tasks(self, status: str | None = None) -> list[dict[str, Any]]:
        if not self._connected:
            return []
        query = {"status": status} if status else {}
        return list(self._db["tasks"].find(query, {"_id": 0}))

    def get_run_history(self, limit: int = 10) -> list[dict[str, Any]]:
        if not self._connected:
            return []
        return list(
            self._db["runs"].find({}, {"_id": 0}).sort("started_at", -1).limit(limit)
        )


class InMemoryBackend:
    """Fallback when no external database is available."""

    def __init__(self):
        self._tasks: dict[str, dict] = {}
        self._events: list[dict] = []
        self._runs: dict[str, dict] = {}
        self._connected = True

    def connect(self) -> bool:
        logger.info("Using in-memory storage (no persistence)")
        return True

    @property
    def is_connected(self) -> bool:
        return self._connected

    def upsert_task(self, task_dict: dict[str, Any]) -> None:
        self._tasks[task_dict["id"]] = task_dict

    def log_event(self, event_type: str, data: dict[str, Any]) -> None:
        self._events.append({"type": event_type, "data": data, "timestamp": time.time()})
        if len(self._events) > 1000:
            self._events = self._events[-500:]

    def save_run_metrics(self, metrics: dict[str, Any]) -> None:
        self._runs[metrics.get("run_id", "default")] = metrics

    def get_tasks(self, status: str | None = None) -> list[dict[str, Any]]:
        if status:
            return [t for t in self._tasks.values() if t.get("status") == status]
        return list(self._tasks.values())

    def get_run_history(self, limit: int = 10) -> list[dict[str, Any]]:
        runs = sorted(self._runs.values(), key=lambda x: x.get("started_at", 0), reverse=True)
        return runs[:limit]


def create_database(backend: str = "dynamodb", **kwargs) -> DatabaseBackend:
    """Factory function to create the appropriate database backend."""
    if backend == "dynamodb":
        return DynamoDBBackend(
            region=kwargs.get("region", "us-east-1"),
            table_prefix=kwargs.get("table_prefix", "onepromptai"),
            access_key_id=kwargs.get("access_key_id", ""),
            secret_access_key=kwargs.get("secret_access_key", ""),
            session_token=kwargs.get("session_token", ""),
        )
    elif backend == "mongodb":
        return MongoDBBackend(
            uri=kwargs.get("uri", "mongodb://localhost:27017"),
            db_name=kwargs.get("db_name", "onepromptai"),
        )
    else:
        return InMemoryBackend()
