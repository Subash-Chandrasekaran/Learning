#!/usr/bin/env zsh

# Antigravity System Dashboard Status Script
# Path: /Users/suboooz/Antigrav/system-dashboard/bin/status.sh

echo "========================================================"
echo " 📊 System Dashboard Service Status Check"
echo "========================================================"

if lsof -i :3050 > /dev/null; then
    echo "🟢 Frontend UI (Port 3050): ACTIVE -> http://localhost:3050"
else
    echo "🔴 Frontend UI (Port 3050): INACTIVE"
fi

if lsof -i :5055 > /dev/null; then
    echo "🟢 Backend API (Port 5055): ACTIVE -> http://localhost:5055"
else
    echo "🔴 Backend API (Port 5055): INACTIVE"
fi

if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "🟢 Ollama Engine (Port 11434): ACTIVE -> http://localhost:11434"
else
    echo "🔴 Ollama Engine (Port 11434): INACTIVE"
fi

echo "========================================================"
