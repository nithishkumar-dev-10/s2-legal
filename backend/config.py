import os
import sys
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if not GEMINI_API_KEY:
    print("ERROR: GEMINI_API_KEY not found in .env — server cannot start.")
    sys.exit(1)

MODEL_NAME         = "gemini-2.0-flash"   # fastest model, ~0.3s first token
TEMPERATURE        = 0.0                   # deterministic legal output
MAX_OUTPUT_TOKENS  = 2048
DATABASE_URL       = "sqlite:///./s2_legal.db"
ALLOWED_ORIGINS    = ["http://localhost:5173", "http://localhost:3000"]
