"""Display roles for terminal dashboard / worker_start events (not LLM system roles)."""


def worker_display_role(task_id: str) -> str:
    """Map queue task id to a dashboard role label key (matches dashboard.ROLE_STYLES)."""
    tid = (task_id or "").lower()
    if "-sub-" in tid:
        return "subplanner"
    if tid.startswith("consolidation-"):
        return "integrator"
    if tid.startswith("fix-") or tid.startswith("sec-fix-"):
        return "reconciler"
    if tid.startswith("recover-"):
        return "engineer"
    if tid.startswith("rework-"):
        return "engineer"
    return "engineer"
