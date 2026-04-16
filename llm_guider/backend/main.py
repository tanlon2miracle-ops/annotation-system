from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import SessionLocal, init_db
from routers import models_router, playground_router, smart_router
from seed import seed_models


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        seed_models(db)
    finally:
        db.close()
    yield


app = FastAPI(title="NexusRegistry", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(models_router.router, prefix="/api/v1")
app.include_router(playground_router.router, prefix="/api/v1")
app.include_router(smart_router.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}
