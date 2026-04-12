@echo off
echo.
echo  S2 Legal AI Pro — Startup
echo  ============================
echo.

:: Step 1: Check .env
if not exist "backend\.env" (
    echo  No .env found. Creating one...
    copy backend\.env.example backend\.env
    echo.
    echo   Open backend\.env and paste your Gemini API key:
    echo   GEMINI_API_KEY=AIza...your_key_here
    echo.
    pause
)

:: Step 2: Python venv
echo  Setting up Python environment...
if not exist "backend\venv" (
    python -m venv backend\venv
)
call backend\venv\Scripts\activate
pip install -r backend\requirements.txt -q
echo   Python OK

:: Step 3: Build frontend
echo  Building frontend...
cd frontend
if not exist "node_modules" (
    npm install --silent
)
npm run build --silent
cd ..
echo   Frontend OK

:: Step 4: Launch
echo.
echo  Starting server...
echo  Open http://localhost:8000 in your browser
echo.
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
