#!/usr/bin/env zsh

# Antigravity System Dashboard Stopper Script
# Path: /Users/suboooz/Antigrav/system-dashboard/bin/stop.sh

echo "========================================================"
echo " 🛑 Stopping Antigravity System Dashboard Services..."
echo "========================================================"

# Kill process on port 5055 (backend)
PID_BACKEND=$(lsof -ti :5055)
if [ -n "$PID_BACKEND" ]; then
    kill -9 $PID_BACKEND 2>/dev/null
    echo "✔ Stopped Backend API (PID: $PID_BACKEND)"
else
    echo "• Backend API was not running."
fi

# Kill process on port 3050 (frontend)
PID_FRONTEND=$(lsof -ti :3050)
if [ -n "$PID_FRONTEND" ]; then
    kill -9 $PID_FRONTEND 2>/dev/null
    echo "✔ Stopped Frontend Dashboard (PID: $PID_FRONTEND)"
else
    echo "• Frontend Dashboard was not running."
fi

echo "========================================================"
echo " ✅ Dashboard services stopped successfully."
echo "========================================================"
