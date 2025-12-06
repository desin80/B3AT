import os
from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.getenv("DB_PATH", "../arena.db")
MAX_MANUAL_COUNT = 2000

SECRET_KEY = os.getenv("SECRET_KEY", "unsafe-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin")

ALLOWED_ORIGINS = [os.getenv("FRONTEND_URL", "http://localhost:5173")]
