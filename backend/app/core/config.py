import base64
import hashlib
import os
from pathlib import Path
from typing import List

from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_DIR = BASE_DIR.parent
TEMPLATES_DIR = BASE_DIR / "templates"
DEFAULT_DB_PATH = PROJECT_DIR / "app.db"


def _default_database_url() -> str:
    return f"sqlite:///{DEFAULT_DB_PATH.as_posix()}"


DATABASE_URL: str = os.getenv("DATABASE_URL") or _default_database_url()
JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me")
JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
VAULT_KEY_ENV: str | None = os.getenv("VAULT_KEY")

_default_origins = "http://localhost:3000,http://127.0.0.1:3000,http://0.0.0.0:3000"

ALLOWED_ORIGINS: List[str] = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", _default_origins).split(",")
    if origin.strip()
]


def derived_vault_key() -> bytes:
    return base64.urlsafe_b64encode(hashlib.sha256(JWT_SECRET.encode("utf-8")).digest())
