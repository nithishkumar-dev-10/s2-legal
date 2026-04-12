#!/bin/bash
set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║       S2 Legal AI Pro — Startup      ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Step 1: Check .env ────────────────────────────────────────────────────────
if [ ! -f "backend/.env" ]; then
  echo "⚠️  No .env found. Creating one now..."
  cp backend/.env.example backend/.env
  echo ""
  echo "  ➡  Open  backend/.env  and paste your Gemini API key:"
  echo "     GEMINI_API_KEY=AIza...your_key_here"
  echo ""
  read -p "  Press Enter after you have saved the key..." 
fi

# ── Step 2: Python venv ───────────────────────────────────────────────────────
echo "▶  Setting up Python environment..."
if [ ! -d "backend/venv" ]; then
  python3 -m venv backend/venv
fi
source backend/venv/bin/activate
pip install -r backend/requirements.txt -q
echo "   Python ✓"

# ── Step 3: Build frontend ────────────────────────────────────────────────────
echo "▶  Building frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
  npm install --silent
fi
npm run build --silent
cd ..
echo "   Frontend ✓"

# ── Step 4: Launch ────────────────────────────────────────────────────────────
echo ""
echo "✅  Starting server..."
echo "   Open  http://localhost:8000  in your browser"
echo ""
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
