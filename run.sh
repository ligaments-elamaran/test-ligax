#!/usr/bin/env bash
set -e

echo "Starting Weekly Report Agent services..."

# Start backend FastAPI
export PYTHONPATH=.
python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "Backend started on PID $BACKEND_PID (http://localhost:8000)"

# Start frontend Vite
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

echo "Frontend started on PID $FRONTEND_PID (http://localhost:5173)"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
