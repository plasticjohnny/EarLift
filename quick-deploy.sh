#!/bin/bash
# Quick helper that delegates to the universal deploy script.
# Forces a full upload so every tracked asset (JS, CSS, lib, images, sounds, etc.)
# goes out using the patterns in .deploy.json.

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_SCRIPT="$HOME/.local/bin/deploy.sh"

if [[ ! -x "$DEPLOY_SCRIPT" ]]; then
    echo "Missing deploy script at $DEPLOY_SCRIPT"
    exit 1
fi

(
    cd "$PROJECT_ROOT"
    exec "$DEPLOY_SCRIPT" --project "$(basename "$PROJECT_ROOT")" -a "$@"
)
