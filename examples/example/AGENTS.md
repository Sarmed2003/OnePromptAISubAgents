# Agent Guidelines

## Coordination Rules
- Workers operate on isolated branches. Never touch files outside your assigned scope.
- Push at high confidence, not 100% confidence. Another worker or the reconciler can fix edge cases.
- Keep commits small and focused. One logical change per commit.

## Code Patterns
- Follow the existing codebase style exactly. If the project uses semicolons, use semicolons.
- Match error handling patterns already in the repo.
- Use existing utility functions — don't reinvent.

## Communication
- Workers do NOT communicate with each other. All coordination happens through the planner.
- Report concerns in your handoff. The planner uses this to adjust future tasks.
- If you discover broken code outside your scope, report it — don't fix it.
