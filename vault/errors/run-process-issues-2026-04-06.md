# Run process: issues, dashboard quirks, and workflow map

_Last updated: 2026-04-05 (consolidation + recovery + UI notes appended)_

This note explains **why some agents show errors or “partial”** during a run, how **branches and phases** fit together, and what was fixed in OnePromptAI to make the dashboard more honest.

## Consolidation and recovery (2026-04-05)

- **Consolidation** tasks now use **empty `scope`** and a **repo snapshot** read in the worker so the model can touch any needed file and output is not stripped by a 20-file scope cap. Up to **three** consolidation attempts per conflict batch.
- Optional **`RECOVERY_MAX_ROUNDS`** (default `0`): after the first post-execution merge, **recover-*** tasks are queued for **FAILED** workers, then merged again. See [[failure-recovery-pipeline]].
- **`blocked`** handoffs are shown as **`failed`** in the terminal when the task ends unsuccessfully, so the UI does not imply work is still in progress.

## Why things are *not* always “all green”

1. **LLM phases can fail or skip**  
   DevOps, QA, Security, Architect, etc. call the model and expect **valid JSON**. If the model returns malformed JSON, empty payloads, or hits rate limits, the phase may emit `error` or `skipped`. That is a **real failure mode**, not a random bug.

2. **Worker “partial”**  
   A worker finishes with `partial` when the model reports partial completion or when work is **not fully satisfactory** but was accepted as handoff. The dashboard also warns if `committed: false` — the model returned little or no file payload, so **nothing useful was committed** and merge may not include that branch’s intent.

3. **DevOps “error” (common)**  
   Typical causes: JSON parse failure, timeout, model refusing long CI YAML, or **commit/push** failure after generation. Check the **Activity** log after the fix: DevOps errors now log the **error string** from the orchestrator.

4. **Merge queue can still be “100% success” while a phase failed**  
   Merge stats only reflect **worker branches merged into `main`**. A later **DevOps** failure does not roll back merges.

## Dashboard metrics that looked wrong (and fixes)

| Symptom | Cause | Mitigation (code) |
|--------|--------|-------------------|
| **FEATURES 13/10** or **Agents done** > 100% | `total_tasks` on the dashboard was only set from the first `tasks_queued`. Extra tasks from **reconciliation** did not bump the UI total. | Orchestrator now emits `reconciler_fixes_dispatched` and updates `metrics.total_tasks`. Dashboard uses `_effective_task_total()` so the denominator is at least **finished worker count**. |
| **DevOps error** with little context | `devops_done` always logged “done” even on `error`. | Dashboard branches on `status` and logs **error / skipped** messages. |

## End-to-end workflow (one run)

**Machine:** your laptop. **Target:** `GIT_REPO_URL` is cloned to `TARGET_REPO_PATH` (default `./target-repo`).

1. **Clone/pull** target repo; **planning** → planner (+ subplanner) produces tasks.  
2. **Architect** (optional, gated) enriches tasks.  
3. **Execution:** each task gets a **git worktree** under `sandboxes/` and branch `worker/<task-id>`. **Workers** commit and **push** that branch.  
4. **Merge queue (serial):** each successful worker branch is **merged into `main`** (`--no-ff` by default), then **push `main`**.  
5. **Conflict rework:** if merges conflict, **consolidation** worker(s) run (with repo-wide snapshot + up to 3 attempts) to unify work on `main`.
5b. **Failure recovery (optional):** if `RECOVERY_MAX_ROUNDS` > 0, **recover-*** workers may run for tasks still **FAILED**, then merge again.  
6. **Integrator** fixes cross-file references on `main`.  
7. **Review** → optional **rework** tasks (more worker cycles + merges).  
8. **QA** adds tests on `main` (commits + push).  
9. **Sandbox** runs build/tests; failures spawn **fix tasks**.  
10. **Security** audit may spawn **fix tasks**.  
11. **Reconciliation** (if enabled) may spawn more **fix tasks** — now synced to the dashboard task total.  
12. **Bundler** (only for certain single-file HTML specs).  
13. **DevOps** adds CI/deploy files on `main`.  
14. **Final push** of `main`; **vault** may write `runs/*.md` summary.

**Roles that commit:** workers (branches); merge commits on `main`; QA / DevOps / Integrator / Bundler (direct commits on `main` when applicable). **Planner / Subplanner / Architect** do not commit; they shape what workers do.

## Gource

Run **Gource** from the **target repo** directory (`target-repo`), not from OnePromptAI. Use `--gource` on runs if you want **distinct git author names** per role in the replay.

## Quick FAQ (technical)

- **Merge strategy if two workers touch the same file?** Serial merges; second merge may **conflict** → merge aborted → **one consolidation task** merges intent on `main`.  
- **Where is the target clone?** `TARGET_REPO_PATH`, default `./target-repo` (relative to cwd when you run `main.py`).  
- **Phases gated by env?** `ARCHITECT_ENABLED`, `REVIEW_ENABLED`, `QA_ENABLED`, `SECURITY_ENABLED`, `DEVOPS_ENABLED` (plus smart phase selection ANDed with these).  
- **Bedrock vs Gemini vs Ollama?** `LLM_PROVIDER` / `LLMClient`: one primary provider; optional **Ollama fallback** on throttling for cloud providers.  
- **DynamoDB vs `DB_BACKEND=memory`?** DynamoDB persists tasks/events/runs across processes; memory is **ephemeral**.  
- **`--reset`?** Deletes local **target repo** dir and **`sandboxes/`** next to it; next run reclones.

---

*If you see a new recurring failure, append a short subsection here or add a new file under `vault/errors/` so future planner context can reference it.*
