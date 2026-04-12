from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import SessionLocal, init_db
from routers import annotations, enums, items, sessions
from routers.enums import seed_defaults


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        seed_defaults(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Annotation System", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(items.router, prefix="/api/v1")
app.include_router(sessions.router, prefix="/api/v1")
app.include_router(annotations.router, prefix="/api/v1")
app.include_router(enums.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}
