from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import ReasonEnum
from schemas import ReasonCreate, ReasonOut, ReasonUpdate

router = APIRouter(prefix="/reasons", tags=["reasons"])

DEFAULT_REASONS = [
    {"value": "spam", "label": "垃圾信息/广告", "sort_order": 1},
    {"value": "hate_speech", "label": "仇恨言论", "sort_order": 2},
    {"value": "violence", "label": "暴力/威胁", "sort_order": 3},
    {"value": "sexual", "label": "色情内容", "sort_order": 4},
    {"value": "misinformation", "label": "虚假信息", "sort_order": 5},
    {"value": "harassment", "label": "骚扰", "sort_order": 6},
    {"value": "fraud", "label": "欺诈", "sort_order": 7},
    {"value": "other", "label": "其他", "sort_order": 99},
]


def seed_defaults(db: Session) -> None:
    if db.query(ReasonEnum).count() > 0:
        return
    for r in DEFAULT_REASONS:
        db.add(ReasonEnum(**r))
    db.commit()


@router.get("", response_model=list[ReasonOut])
def list_reasons(db: Session = Depends(get_db)):
    return db.query(ReasonEnum).filter(ReasonEnum.is_active == True).order_by(ReasonEnum.sort_order).all()


@router.post("", response_model=ReasonOut, status_code=201)
def create_reason(body: ReasonCreate, db: Session = Depends(get_db)):
    obj = ReasonEnum(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{reason_id}", response_model=ReasonOut)
def update_reason(reason_id: int, body: ReasonUpdate, db: Session = Depends(get_db)):
    obj = db.get(ReasonEnum, reason_id)
    if not obj:
        from fastapi import HTTPException
        raise HTTPException(404, "Reason not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj
