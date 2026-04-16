from __future__ import annotations

import json
from typing import Any

from sqlalchemy.orm import Session, selectinload

from config import PAGE_SIZE_DEFAULT
from models import InvocationRecord, SmartRoutingSession


def create_session(
    db: Session, user_query: str, llm_model: str = "", status: str = "pending",
) -> SmartRoutingSession:
    row = SmartRoutingSession(user_query=user_query, llm_model=llm_model, status=status)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_session(db: Session, session_id: int, **updates: Any) -> None:
    row = db.get(SmartRoutingSession, session_id)
    if not row:
        return
    for key, value in updates.items():
        if key == "selected_models" and not isinstance(value, str):
            value = json.dumps(value, ensure_ascii=False)
        setattr(row, key, value)
    db.commit()


def save_invocation(db: Session, session_id: int, inv: Any) -> InvocationRecord:
    record = InvocationRecord(
        session_id=session_id,
        model_id=_attr(inv, "model_id", ""),
        input_data=json.dumps(_attr(inv, "input_data", {}), ensure_ascii=False),
        output_data=json.dumps(_attr(inv, "output_data", {}), ensure_ascii=False),
        latency_ms=int(_attr(inv, "latency_ms", 0)),
        success=bool(_attr(inv, "success", False)),
        error_message=_attr(inv, "error_message"),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_session_with_invocations(db: Session, session_id: int) -> SmartRoutingSession | None:
    return (
        db.query(SmartRoutingSession)
        .options(selectinload(SmartRoutingSession.invocations))
        .filter(SmartRoutingSession.id == session_id)
        .first()
    )


def list_sessions(
    db: Session, page: int = 1, page_size: int = PAGE_SIZE_DEFAULT,
) -> tuple[list[SmartRoutingSession], int]:
    q = db.query(SmartRoutingSession)
    total = q.count()
    items = (
        q.order_by(SmartRoutingSession.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def _attr(source: Any, key: str, default: Any = None) -> Any:
    if isinstance(source, dict):
        return source.get(key, default)
    return getattr(source, key, default)
