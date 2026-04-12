from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from config import PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX
from database import get_db
from models import Annotation, AnnotationSession, Item
from schemas import (
    ItemWithAnnotation,
    PaginatedItems,
    ProgressOut,
    SessionCreate,
    SessionOut,
)
from services.progress_service import get_progress

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=SessionOut, status_code=201)
def create_session(body: SessionCreate, db: Session = Depends(get_db)):
    if body.mode not in ("review_correct", "independent", "arbitration"):
        raise HTTPException(400, "Invalid mode")
    sess = AnnotationSession(**body.model_dump())
    db.add(sess)
    db.commit()
    db.refresh(sess)
    return sess


@router.get("", response_model=list[SessionOut])
def list_sessions(db: Session = Depends(get_db)):
    return db.query(AnnotationSession).order_by(AnnotationSession.created_at.desc()).all()


@router.get("/{session_id}", response_model=SessionOut)
def get_session(session_id: int, db: Session = Depends(get_db)):
    sess = db.get(AnnotationSession, session_id)
    if not sess:
        raise HTTPException(404, "Session not found")
    return sess


@router.delete("/{session_id}", status_code=204)
def delete_session(session_id: int, db: Session = Depends(get_db)):
    sess = db.get(AnnotationSession, session_id)
    if not sess:
        raise HTTPException(404, "Session not found")
    db.delete(sess)
    db.commit()


@router.get("/{session_id}/progress", response_model=ProgressOut)
def session_progress(session_id: int, db: Session = Depends(get_db)):
    p = get_progress(db, session_id)
    if not p:
        raise HTTPException(404, "Session not found")
    return p


@router.get("/{session_id}/items", response_model=PaginatedItems)
def session_items(
    session_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(PAGE_SIZE_DEFAULT, ge=1, le=PAGE_SIZE_MAX),
    status: str = Query("all"),
    db: Session = Depends(get_db),
):
    sess = db.get(AnnotationSession, session_id)
    if not sess:
        raise HTTPException(404, "Session not found")

    query = db.query(Item).filter(Item.batch_id == sess.batch_id)

    if sess.mode == "arbitration":
        query = query.filter(Item.result != Item.result_2)

    query = query.order_by(Item.id)
    total = query.count()

    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()

    ann_map: dict[int, Annotation] = {}
    if items:
        item_ids = [i.id for i in items]
        anns = (
            db.query(Annotation)
            .filter(Annotation.session_id == session_id, Annotation.item_id.in_(item_ids))
            .all()
        )
        ann_map = {a.item_id: a for a in anns}

    result_items = []
    for item in items:
        ann = ann_map.get(item.id)

        if status == "pending" and ann is not None:
            continue
        if status == "annotated" and (ann is None or ann.is_skipped):
            continue
        if status == "skipped" and (ann is None or not ann.is_skipped):
            continue
        if status == "flagged" and (ann is None or not ann.is_flagged):
            continue

        item_dict = ItemWithAnnotation.model_validate(item)

        if sess.mode == "independent":
            item_dict.result = None
            item_dict.result_2 = None
            item_dict.vote_result = None

        if ann:
            from schemas import AnnotationOut
            item_dict.annotation = AnnotationOut.model_validate(ann)

        result_items.append(item_dict)

    return PaginatedItems(items=result_items, total=total, page=page, page_size=page_size)


@router.get("/{session_id}/next")
def next_item(
    session_id: int,
    after_item_id: int = Query(0),
    db: Session = Depends(get_db),
):
    sess = db.get(AnnotationSession, session_id)
    if not sess:
        raise HTTPException(404, "Session not found")

    annotated_ids = (
        db.query(Annotation.item_id)
        .filter(Annotation.session_id == session_id)
        .subquery()
    )

    query = (
        db.query(Item)
        .filter(Item.batch_id == sess.batch_id, Item.id > after_item_id)
        .filter(~Item.id.in_(annotated_ids))
    )

    if sess.mode == "arbitration":
        query = query.filter(Item.result != Item.result_2)

    item = query.order_by(Item.id).first()
    if not item:
        return {"item": None, "finished": True}

    return {"item": ItemWithAnnotation.model_validate(item), "finished": False}
