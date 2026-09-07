#!/usr/bin/env zsh

# Antigravity System Dashboard Launcher Script
# Path: /Users/suboooz/Antigrav/system-dashboard/bin/start.sh

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

echo "========================================================"
echo " 🚀 Starting Antigravity System & Ollama Dashboard..."
echo "========================================================"

# 1. Check & Start Ollama if not running
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "🤖 Starting Ollama AI engine background daemon..."
    ollama serve > /dev/null 2>&1 &
    sleep 2
else
    echo "🤖 Ollama AI engine is already running."
fi

# 2. Check & Start Backend API Server
if lsof -i :5055 > /dev/null; then
    echo "⚡ Backend API Server (port 5055) is already running."
else
    echo "⚡ Starting Backend API Server (port 5055)..."
    cd "$DIR/server" && npm start > /dev/null 2>&1 &
    sleep 2
fi

# 3. Check & Start Frontend Vite Server
if lsof -i :3050 > /dev/null; then
    echo "🎨 Frontend Dashboard (port 3050) is already running."
else
    echo "🎨 Starting Frontend Dashboard (port 3050)..."
    cd "$DIR/client" && npm run dev -- --port 3050 > /dev/null 2>&1 &
    sleep 2
fi

echo "========================================================"
echo " ✅ Dashboard started successfully!"
echo " 🌐 URL: http://localhost:3050"
echo " ⚡ API: http://localhost:5055"
echo "========================================================"

# Open in default browser
open "http://localhost:3050"
