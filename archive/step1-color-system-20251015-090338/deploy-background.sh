#!/bin/bash

# Background deployment script that runs in a new terminal
# This allows Claude to continue working while deployment happens

PROJECT_DIR="/home/john/Projects/EarTrainer"
DEPLOY_SCRIPT="$HOME/.local/bin/deploy.sh"

# Check if we're already in a terminal
if [ -t 1 ]; then
    # Running in terminal, just execute directly
    cd "$PROJECT_DIR" && "$DEPLOY_SCRIPT"
else
    # Not in terminal, open a new one
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal -- bash -c "cd '$PROJECT_DIR' && '$DEPLOY_SCRIPT'; echo ''; echo 'Press Enter to close...'; read"
    elif command -v konsole &> /dev/null; then
        konsole -e bash -c "cd '$PROJECT_DIR' && '$DEPLOY_SCRIPT'; echo ''; echo 'Press Enter to close...'; read"
    elif command -v xterm &> /dev/null; then
        xterm -e bash -c "cd '$PROJECT_DIR' && '$DEPLOY_SCRIPT'; echo ''; echo 'Press Enter to close...'; read"
    else
        # Fallback: run in background and log output
        cd "$PROJECT_DIR" && "$DEPLOY_SCRIPT" > /tmp/deploy-eartrainer.log 2>&1 &
        echo "Deployment started in background. Check /tmp/deploy-eartrainer.log for output"
    fi
fi
