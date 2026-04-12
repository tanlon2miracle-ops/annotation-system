from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# ---------- Reason Enum ----------
class ReasonCreate(BaseModel):
    value: str
    label: str
    sort_order: int = 0


class ReasonUpdate(BaseModel):
    label: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class ReasonOut(BaseModel):
    id: int
    value: str
    label: str
    sort_order: int
    is_active: bool

    model_config = {"from_attributes": True}


# ---------- Import Batch ----------
class BatchOut(BaseModel):
    id: int
    filename: str
    item_count: int
    imported_at: datetime

    model_config = {"from_attributes": True}


# ---------- Item ----------
class ItemOut(BaseModel):
    id: int
    batch_id: int
    event_id: str
    uid: str
    mall_id: Optional[str] = None
    chat_list: Optional[str] = None
    text: Optional[str] = None
    text_type: str = "text"
    reason: Optional[str] = None
    result: Optional[str] = None
    result_2: Optional[str] = None
    vote_result: Optional[str] = None
    extra_fields: Optional[str] = None

    model_config = {"from_attributes": True}


class ItemWithAnnotation(ItemOut):
    annotation: Optional["AnnotationOut"] = None


# ---------- Annotation Session ----------
class SessionCreate(BaseModel):
    name: str
    mode: str  # review_correct | independent | arbitration
    batch_id: int


class SessionOut(BaseModel):
    id: int
    name: str
    mode: str
    batch_id: int
    annotator_id: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ProgressOut(BaseModel):
    total: int
    annotated: int
    skipped: int
    flagged: int
    remaining: int
    percent: float


# ---------- Annotation ----------
class AnnotationUpsert(BaseModel):
    session_id: int
    item_id: int
    result: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    is_skipped: bool = False
    is_flagged: bool = False


class AnnotationBatchUpsert(BaseModel):
    session_id: int
    annotations: list[AnnotationUpsert]


class AnnotationOut(BaseModel):
    id: int
    session_id: int
    item_id: int
    result: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    is_skipped: bool
    is_flagged: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------- Pagination ----------
class PaginatedItems(BaseModel):
    items: list[ItemWithAnnotation]
    total: int
    page: int
    page_size: int


# ---------- Export ----------
class ExportRequest(BaseModel):
    session_id: int
    include_skipped: bool = False
    include_unannotated: bool = False
