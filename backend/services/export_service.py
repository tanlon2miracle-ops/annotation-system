import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from models import Annotation, AnnotationSession, Item


def export_session(
    db: Session,
    session_id: int,
    include_skipped: bool = False,
    include_unannotated: bool = False,
) -> list[dict[str, Any]]:
    sess = db.get(AnnotationSession, session_id)
    if not sess:
        return []

    query = db.query(Item).filter(Item.batch_id == sess.batch_id).order_by(Item.id)
    items = query.all()

    annotations_map: dict[int, Annotation] = {}
    for ann in db.query(Annotation).filter(Annotation.session_id == session_id).all():
        annotations_map[ann.item_id] = ann

    result = []
    for item in items:
        ann = annotations_map.get(item.id)

        if ann is None and not include_unannotated:
            continue
        if ann and ann.is_skipped and not include_skipped:
            continue

        row: dict[str, Any] = {
            "event_id": item.event_id,
            "uid": item.uid,
            "mall_id": item.mall_id,
            "chat_list": item.chat_list,
            "text": item.text,
            "reason": item.reason,
            "result": item.result,
            "result_2": item.result_2,
            "vote_result": item.vote_result,
        }

        if item.extra_fields:
            row.update(json.loads(item.extra_fields))

        if ann:
            row["annotation"] = {
                "result": ann.result,
                "reason": ann.reason,
                "notes": ann.notes,
                "status": "skipped" if ann.is_skipped else ("flagged" if ann.is_flagged else "annotated"),
                "annotated_at": ann.updated_at.isoformat() if ann.updated_at else None,
            }
        else:
            row["annotation"] = None

        result.append(row)

    return result
