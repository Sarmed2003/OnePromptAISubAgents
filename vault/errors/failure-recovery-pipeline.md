# Failure, blocked, consolidation, and who fixes what

_Last updated: 2026-04-05_

## Worker outcomes: `complete`, `partial`, `failed`, `blocked`

- **`complete`**: Handoff says done; if files were committed, the branch is queued for **merge into `main`**.
- **`partial`**: Incomplete but the model admitted it. With **`STRICT_SDLC=true`**, the orchestrator **retries** the same task (same id) up to 3 times with backoff; if still partial → task is **FAILED** (not merged).
- **`failed`**: Error or exhausted retries → **`fail_task`** in the queue; branch is **not** merged automatically.
- **`blocked`**: The model returned a handoff status meaning “cannot proceed” (dependency, missing info). Treated like a retryable failure: **backoff retries**, then **FAILED** if still blocked. The terminal UI maps **`blocked` → `failed`** on `worker_done` so you do not see a stuck “blocked 0%” for a terminal state.

**There is no separate “fixer” agent** assigned to task `w-task-001`. Recovery paths are:

1. **Replan** (idle queue + completed handoffs) may add **new** tasks from the planner.
2. **Consolidation** runs when **merges conflict** — one `consolidation-N` worker unifies branches.
3. **Review rework**, **sandbox fix**, **security fix**, **reconciler** tasks — each is a **new** task id run by a worker.
4. **`RECOVERY_MAX_ROUNDS`** (optional): after the first big merge, spawn **`recover-<task-id>-R0`** workers that re-read the repo snapshot and try to satisfy failed tasks’ descriptions.

## Why consolidation used to fail often

Earlier, consolidation tasks used a **narrow `scope`** (only ~20 files). The worker **filters model output to scope**, so edits to other files were **dropped**, and the model sometimes saw **too little context**.

**Fix (code):** consolidation and consolidation retries use **`scope=[]`**. For ids `consolidation-*` and `recover-*`, the worker loads **`read_repo_snapshot()`** (capped list of source files) instead of an empty scope read. Retries: up to **three** consolidation attempts (`consolidation-retry`, `consolidation-retry-2`).

## How can the integrator run if some workers failed?

Phases are **mostly sequential on `main`**. After execution, **`_merge_and_rework`** merges whatever branches **succeeded**. Failed tasks **do not** merge. **Integrator** then runs on **current `main` + file tree** — it does **not** require every planned task to be green. It only fixes cross-references in what **already landed** on `main`.

Implication: **failed workers = missing intent on `main`** unless consolidation, recovery, or a later fix task addressed it.

## Strict SDLC exit code

`main.py` exits **1** if `failed_tasks > 0` or `strict_phase_errors > 0`. To iterate faster (not for production gating), set **`STRICT_SDLC=false`** or disable heavy phases (`REVIEW_ENABLED`, etc.).

## Speed knobs

- **`WORKER_RETRY_BACKOFF_SEC`** — lower (e.g. `0.5`) for faster retries (more API pressure).
- **`MAX_WORKERS`** — higher if the machine and provider limits allow.
- **Disable phases** you do not need for the test (`ARCHITECT_ENABLED`, `QA_ENABLED`, …).
- **`RECOVERY_MAX_ROUNDS`** — `0` for fastest runs; `1+` when you want automatic follow-up for failures (adds time and tokens).

## Related

- [[run-process-issues-2026-04-06]] — dashboard metrics and workflow map.
