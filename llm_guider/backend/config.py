import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "data" / "registry.db"
DB_URL = f"sqlite:///{DB_PATH}"

PAGE_SIZE_DEFAULT = 20
PAGE_SIZE_MAX = 100

LLM_BASE_URL = os.environ.get("LLM_BASE_URL", "")
LLM_API_KEY = os.environ.get("LLM_API_KEY", "")
LLM_MODEL = os.environ.get("LLM_MODEL", "")
LLM_TIMEOUT_S = int(os.environ.get("LLM_TIMEOUT_S", "30"))
MODEL_INVOKE_TIMEOUT_S = int(os.environ.get("MODEL_INVOKE_TIMEOUT_S", "10"))
