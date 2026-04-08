#!/usr/bin/env bash
# Run Gource on the OnePrompt *output* clone (agent commits), not on OnePromptAI itself.
# Usage:
#   ./scripts/gource-dinolab.sh              # uses ../target-repo from repo root
#   ./scripts/gource-dinolab.sh /path/to/clone
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="${1:-$ROOT/target-repo}"
if [[ ! -d "$REPO/.git" ]]; then
  echo "No git repository at: $REPO" >&2
  echo "Fix: run OnePrompt with a build first, or pass the clone path:" >&2
  echo "  $0 /path/to/your/target-repo" >&2
  exit 1
fi
cd "$REPO"
# --auto-skip-seconds must be > 0 (integer); 0 or floats are rejected by Gource.
exec gource \
  --title "DINOLAB Multi-Agent Build" \
  --seconds-per-day "${GOURCE_SECONDS_PER_DAY:-0.2}" \
  --auto-skip-seconds "${GOURCE_AUTO_SKIP:-1}"
