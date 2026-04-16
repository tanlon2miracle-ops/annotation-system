from __future__ import annotations

import json

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from config import PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX
from database import get_db
from schemas import (
    PaginatedSmartSessions,
    SmartRoutingDetailOut,
    SmartRoutingRequest,
    SmartRoutingSessionOut,
)
from services.session_repo import get_session_with_invocations, list_sessions
from services.smart_router_orchestrator import orchestrate

router = APIRouter(prefix="/route/smart", tags=["smart-routing"])


async def _sse_stream(query: str, db: Session):
    async for event in orchestrate(query, db):
        name = event.get("event", "message")
        data = json.dumps(event.get("data", {}), ensure_ascii=False)
        yield f"event: {name}\ndata: {data}\n\n"


@router.post("")
async def smart_route(body: SmartRoutingRequest, db: Session = Depends(get_db)):
    return StreamingResponse(
        _sse_stream(body.query, db),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/history", response_model=PaginatedSmartSessions)
def smart_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(PAGE_SIZE_DEFAULT, ge=1, le=PAGE_SIZE_MAX),
    db: Session = Depends(get_db),
):
    items, total = list_sessions(db, page=page, page_size=page_size)
    return PaginatedSmartSessions(
        items=[SmartRoutingSessionOut.model_validate(s) for s in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{session_id}", response_model=SmartRoutingDetailOut)
def smart_detail(session_id: int, db: Session = Depends(get_db)):
    from fastapi import HTTPException

    session = get_session_with_invocations(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="session not found")
    return SmartRoutingDetailOut(
        session=SmartRoutingSessionOut.model_validate(session),
        invocations=[inv for inv in session.invocations],
    )
