import json
import re
from typing import Any

from sqlalchemy.orm import Session

from models import ImportBatch, Item

IMAGE_RE = re.compile(r"\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$", re.I)
VIDEO_RE = re.compile(r"\.(mp4|webm|mov|avi)(\?.*)?$|youtube\.com|youtu\.be|vimeo\.com", re.I)

KNOWN_FIELDS = {
    "event_id", "uid", "mall_id", "chat_list", "text",
    "reason", "result", "result_2", "vote_result",
}


def _detect_text_type(text: str | None) -> str:
    if not text:
        return "text"
    if IMAGE_RE.search(text):
        return "image"
    if VIDEO_RE.search(text):
        return "video"
    return "text"


def import_json(db: Session, filename: str, data: list[dict[str, Any]]) -> ImportBatch:
    batch = ImportBatch(filename=filename, item_count=len(data))
    db.add(batch)
    db.flush()

    items = []
    for row in data:
        extra = {k: v for k, v in row.items() if k not in KNOWN_FIELDS}
        items.append(
            Item(
                batch_id=batch.id,
                event_id=str(row.get("event_id", "")),
                uid=str(row.get("uid", "")),
                mall_id=str(row.get("mall_id", "")) if row.get("mall_id") else None,
                chat_list=row.get("chat_list"),
                text=row.get("text"),
                text_type=_detect_text_type(row.get("text")),
                reason=row.get("reason"),
                result=row.get("result"),
                result_2=row.get("result_2"),
                vote_result=row.get("vote_result"),
                extra_fields=json.dumps(extra, ensure_ascii=False) if extra else None,
            )
        )

    db.bulk_save_objects(items)
    db.commit()
    db.refresh(batch)
    return batch
