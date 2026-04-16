import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from config import PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX
from database import get_db
from models import MLModel, ModelTag
from schemas import ModelCreate, ModelOut, ModelUpdate, PaginatedModels

router = APIRouter(prefix="/models", tags=["models"])


def _model_to_out(model: MLModel) -> dict:
    return model


@router.get("", response_model=PaginatedModels)
def list_models(
    search: str | None = None,
    modality: str | None = None,
    status: str | None = None,
    tag: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(PAGE_SIZE_DEFAULT, ge=1, le=PAGE_SIZE_MAX),
    db: Session = Depends(get_db),
):
    q = db.query(MLModel)
    if modality:
        q = q.filter(MLModel.modality == modality)
    if status:
        q = q.filter(MLModel.status == status)
    if tag:
        q = q.join(ModelTag).filter(ModelTag.tag == tag)
    if search:
        like = f"%{search}%"
        q = q.filter(
            MLModel.name.ilike(like)
            | MLModel.description.ilike(like)
            | MLModel.model_id.ilike(like)
        )
    total = q.count()
    items = q.order_by(MLModel.id).offset((page - 1) * page_size).limit(page_size).all()
    return PaginatedModels(items=items, total=total, page=page, page_size=page_size)


@router.get("/{model_pk}", response_model=ModelOut)
def get_model(model_pk: int, db: Session = Depends(get_db)):
    obj = db.get(MLModel, model_pk)
    if not obj:
        raise HTTPException(404, "model not found")
    return obj


@router.post("", response_model=ModelOut, status_code=201)
def create_model(body: ModelCreate, db: Session = Depends(get_db)):
    if db.query(MLModel).filter(MLModel.model_id == body.model_id).first():
        raise HTTPException(409, f"model_id '{body.model_id}' already exists")
    data = body.model_dump(exclude={"tags"})
    data["input_schema"] = json.dumps(data["input_schema"], ensure_ascii=False)
    data["output_schema"] = json.dumps(data["output_schema"], ensure_ascii=False)
    obj = MLModel(**data)
    db.add(obj)
    db.flush()
    for t in body.tags:
        db.add(ModelTag(model_id=obj.id, tag=t))
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{model_pk}", response_model=ModelOut)
def update_model(model_pk: int, body: ModelUpdate, db: Session = Depends(get_db)):
    obj = db.get(MLModel, model_pk)
    if not obj:
        raise HTTPException(404, "model not found")
    updates = body.model_dump(exclude_none=True, exclude={"tags"})
    if "input_schema" in updates:
        updates["input_schema"] = json.dumps(updates["input_schema"], ensure_ascii=False)
    if "output_schema" in updates:
        updates["output_schema"] = json.dumps(updates["output_schema"], ensure_ascii=False)
    for k, v in updates.items():
        setattr(obj, k, v)
    if body.tags is not None:
        db.query(ModelTag).filter(ModelTag.model_id == obj.id).delete()
        for t in body.tags:
            db.add(ModelTag(model_id=obj.id, tag=t))
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{model_pk}", status_code=204)
def delete_model(model_pk: int, db: Session = Depends(get_db)):
    obj = db.get(MLModel, model_pk)
    if not obj:
        raise HTTPException(404, "model not found")
    db.delete(obj)
    db.commit()
