from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Annotation, AnnotationSession, Item
from schemas import AnnotationBatchUpsert, AnnotationOut, AnnotationUpsert

router = APIRouter(prefix="/annotations", tags=["annotations"])


def _validate_item_in_session(db: Session, session_id: int, item_id: int) -> None:
    sess = db.get(AnnotationSession, session_id)
    if not sess:
        raise HTTPException(404, "Session not found")
    item = db.get(Item, item_id)
    if not item or item.batch_id != sess.batch_id:
        raise HTTPException(400, "Item does not belong to this session's batch")


def _upsert_one(db: Session, data: AnnotationUpsert, skip_validation: bool = False) -> Annotation:
    if not skip_validation:
        _validate_item_in_session(db, data.session_id, data.item_id)

    existing = (
        db.query(Annotation)
        .filter(Annotation.session_id == data.session_id, Annotation.item_id == data.item_id)
        .first()
    )
    if existing:
        for k, v in data.model_dump(exclude={"session_id", "item_id"}).items():
            setattr(existing, k, v)
        db.flush()
        return existing

    obj = Annotation(**data.model_dump())
    db.add(obj)
    db.flush()
    return obj


@router.put("", response_model=AnnotationOut)
def upsert_annotation(body: AnnotationUpsert, db: Session = Depends(get_db)):
    ann = _upsert_one(db, body)
    db.commit()
    db.refresh(ann)
    return ann


@router.post("/batch", response_model=list[AnnotationOut])
def batch_upsert(body: AnnotationBatchUpsert, db: Session = Depends(get_db)):
    sess = db.get(AnnotationSession, body.session_id)
    if not sess:
        raise HTTPException(404, "Session not found")

    item_ids = [a.item_id for a in body.annotations]
    valid_ids = set(
        r[0] for r in db.query(Item.id).filter(Item.id.in_(item_ids), Item.batch_id == sess.batch_id).all()
    )
    invalid = set(item_ids) - valid_ids
    if invalid:
        raise HTTPException(400, f"Items {invalid} do not belong to this session's batch")

    results = []
    for item in body.annotations:
        item.session_id = body.session_id
        results.append(_upsert_one(db, item, skip_validation=True))
    db.commit()
    for r in results:
        db.refresh(r)
    return results


@router.get("/{session_id}/{item_id}", response_model=AnnotationOut)
def get_annotation(session_id: int, item_id: int, db: Session = Depends(get_db)):
    ann = (
        db.query(Annotation)
        .filter(Annotation.session_id == session_id, Annotation.item_id == item_id)
        .first()
    )
    if not ann:
        raise HTTPException(404, "Annotation not found")
    return ann


@router.delete("/{session_id}/{item_id}", status_code=204)
def delete_annotation(session_id: int, item_id: int, db: Session = Depends(get_db)):
    ann = (
        db.query(Annotation)
        .filter(Annotation.session_id == session_id, Annotation.item_id == item_id)
        .first()
    )
    if not ann:
        raise HTTPException(404, "Annotation not found")
    db.delete(ann)
    db.commit()
