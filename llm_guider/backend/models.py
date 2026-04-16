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


class MLModel(Base):
    __tablename__ = "ml_model"

    id = Column(Integer, primary_key=True)
    model_id = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    modality = Column(String, nullable=False)
    description = Column(Text, default="")
    status = Column(String, nullable=False, default="healthy")
    qps = Column(Integer, default=0)
    latency_ms = Column(Integer, default=0)
    owner = Column(String, default="")
    input_schema = Column(Text, default="{}")
    output_schema = Column(Text, default="{}")
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    tags = relationship("ModelTag", back_populates="model", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_model_modality", "modality"),
        Index("idx_model_status", "status"),
    )


class ModelTag(Base):
    __tablename__ = "model_tag"

    id = Column(Integer, primary_key=True)
    model_id = Column(Integer, ForeignKey("ml_model.id", ondelete="CASCADE"), nullable=False)
    tag = Column(String, nullable=False)

    model = relationship("MLModel", back_populates="tags")

    __table_args__ = (
        UniqueConstraint("model_id", "tag", name="uq_model_tag"),
        Index("idx_tag", "tag"),
    )


class SmartRoutingSession(Base):
    __tablename__ = "smart_routing_session"

    id = Column(Integer, primary_key=True)
    user_query = Column(Text, nullable=False)
    llm_model = Column(String, default="")
    llm_reasoning = Column(Text, default="")
    selected_models = Column(Text, default="[]")
    total_llm_latency_ms = Column(Integer, default=0)
    total_invoke_latency_ms = Column(Integer, default=0)
    status = Column(String, nullable=False, default="pending")
    error_message = Column(Text)
    created_at = Column(DateTime, default=_utcnow)

    invocations = relationship(
        "InvocationRecord", back_populates="session", cascade="all, delete-orphan",
    )

    __table_args__ = (Index("idx_smart_session_status", "status"),)


class InvocationRecord(Base):
    __tablename__ = "invocation_result"

    id = Column(Integer, primary_key=True)
    session_id = Column(
        Integer,
        ForeignKey("smart_routing_session.id", ondelete="CASCADE"),
        nullable=False,
    )
    model_id = Column(String, nullable=False)
    input_data = Column(Text, default="{}")
    output_data = Column(Text, default="{}")
    latency_ms = Column(Integer, default=0)
    success = Column(Boolean, nullable=False, default=True)
    error_message = Column(Text)
    created_at = Column(DateTime, default=_utcnow)

    session = relationship("SmartRoutingSession", back_populates="invocations")
