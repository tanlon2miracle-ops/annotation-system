from __future__ import annotations

import json
from datetime import datetime

from pydantic import BaseModel, field_validator


# ---------- Model ----------

class ModelCreate(BaseModel):
    model_id: str
    name: str
    modality: str
    tags: list[str] = []
    description: str = ""
    status: str = "healthy"
    qps: int = 0
    latency_ms: int = 0
    owner: str = ""
    input_schema: dict = {}
    output_schema: dict = {}

    @field_validator("modality")
    @classmethod
    def _valid_modality(cls, v: str) -> str:
        allowed = {"text", "image", "llm", "multimodal"}
        if v not in allowed:
            raise ValueError(f"modality must be one of {allowed}")
        return v

    @field_validator("status")
    @classmethod
    def _valid_status(cls, v: str) -> str:
        allowed = {"healthy", "warning", "offline"}
        if v not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return v


class ModelUpdate(BaseModel):
    name: str | None = None
    modality: str | None = None
    tags: list[str] | None = None
    description: str | None = None
    status: str | None = None
    qps: int | None = None
    latency_ms: int | None = None
    owner: str | None = None
    input_schema: dict | None = None
    output_schema: dict | None = None


class ModelOut(BaseModel):
    id: int
    model_id: str
    name: str
    modality: str
    tags: list[str]
    description: str
    status: str
    qps: int
    latency_ms: int
    owner: str
    input_schema: dict
    output_schema: dict
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("tags", mode="before")
    @classmethod
    def _tags_from_orm(cls, v):
        if v and hasattr(v[0], "tag"):
            return [t.tag for t in v]
        return v

    @field_validator("input_schema", "output_schema", mode="before")
    @classmethod
    def _parse_json(cls, v):
        if isinstance(v, str):
            return json.loads(v)
        return v


class PaginatedModels(BaseModel):
    items: list[ModelOut]
    total: int
    page: int
    page_size: int


# ---------- Playground ----------

class PlaygroundRequest(BaseModel):
    model_id: str
    input: dict


class PlaygroundResponse(BaseModel):
    output: dict
    latency_ms: int
    status_code: int
    model_id: str


# ---------- Smart Routing ----------

class SmartRoutingRequest(BaseModel):
    query: str


class SelectedModelOut(BaseModel):
    model_id: str
    model_name: str
    reason: str


class InvocationResultOut(BaseModel):
    model_id: str
    input_data: dict
    output_data: dict
    latency_ms: int
    success: bool
    error_message: str | None = None

    model_config = {"from_attributes": True}

    @field_validator("input_data", "output_data", mode="before")
    @classmethod
    def _parse_json(cls, v):
        if isinstance(v, str):
            return json.loads(v)
        return v


class SmartRoutingSessionOut(BaseModel):
    id: int
    user_query: str
    llm_model: str
    llm_reasoning: str
    selected_models: list[SelectedModelOut]
    total_llm_latency_ms: int
    total_invoke_latency_ms: int
    status: str
    error_message: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("selected_models", mode="before")
    @classmethod
    def _parse_selected(cls, v):
        if isinstance(v, str):
            return json.loads(v)
        return v


class SmartRoutingDetailOut(BaseModel):
    session: SmartRoutingSessionOut
    invocations: list[InvocationResultOut]


class PaginatedSmartSessions(BaseModel):
    items: list[SmartRoutingSessionOut]
    total: int
    page: int
    page_size: int
