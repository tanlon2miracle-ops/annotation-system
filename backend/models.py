from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class ReasonEnum(Base):
    __tablename__ = "reason_enum"

    id = Column(Integer, primary_key=True)
    value = Column(String, unique=True, nullable=False)
    label = Column(String, nullable=False)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_utcnow)


class ImportBatch(Base):
    __tablename__ = "import_batch"

    id = Column(Integer, primary_key=True)
    filename = Column(String, nullable=False)
    item_count = Column(Integer, nullable=False, default=0)
    imported_at = Column(DateTime, default=_utcnow)

    items = relationship("Item", back_populates="batch", cascade="all, delete-orphan")


class Item(Base):
    __tablename__ = "item"

    id = Column(Integer, primary_key=True)
    batch_id = Column(Integer, ForeignKey("import_batch.id", ondelete="CASCADE"), nullable=False)
    event_id = Column(String, nullable=False)
    uid = Column(String, nullable=False)
    mall_id = Column(String)
    chat_list = Column(Text)
    text = Column(Text)
    text_type = Column(String, default="text")
    reason = Column(String)
    result = Column(String)
    result_2 = Column(String)
    vote_result = Column(String)
    extra_fields = Column(Text)
    created_at = Column(DateTime, default=_utcnow)

    batch = relationship("ImportBatch", back_populates="items")
    annotations = relationship("Annotation", back_populates="item", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_item_batch", "batch_id"),
        Index("idx_item_event", "event_id"),
        Index("idx_item_disagreement", "result", "result_2"),
    )


class AnnotationSession(Base):
    __tablename__ = "annotation_session"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    mode = Column(String, nullable=False)
    batch_id = Column(Integer, ForeignKey("import_batch.id"), nullable=False)
    annotator_id = Column(String, default="default")
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    batch = relationship("ImportBatch")
    annotations = relationship("Annotation", back_populates="session", cascade="all, delete-orphan")


class Annotation(Base):
    __tablename__ = "annotation"

    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("annotation_session.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(Integer, ForeignKey("item.id", ondelete="CASCADE"), nullable=False)
    annotator_id = Column(String, default="default")
    result = Column(String)
    reason = Column(String)
    notes = Column(Text)
    is_skipped = Column(Boolean, default=False)
    is_flagged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    session = relationship("AnnotationSession", back_populates="annotations")
    item = relationship("Item", back_populates="annotations")

    __table_args__ = (
        UniqueConstraint("session_id", "item_id", name="uq_session_item"),
        Index("idx_annotation_session", "session_id"),
        Index("idx_annotation_item", "item_id"),
    )
