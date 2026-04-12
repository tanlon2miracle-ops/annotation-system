from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "data" / "annotation.db"
DB_URL = f"sqlite:///{DB_PATH}"

PAGE_SIZE_DEFAULT = 50
PAGE_SIZE_MAX = 200
