from __future__ import annotations

import json
from typing import Any

from models import MLModel

_JSON_SCHEMA_KEYS = {"type", "properties", "required", "items", "enum", "additionalProperties"}


def build_tools(models: list[MLModel], tags_map: dict[Any, list[str]]) -> list[dict[str, Any]]:
    tools: list[dict[str, Any]] = []
    for model in models:
        tags = tags_map.get(model.model_id) or tags_map.get(model.id) or []
        tools.append({
            "type": "function",
            "function": {
                "name": f"invoke_{model.model_id}",
                "description": _build_description(model, tags),
                "parameters": _to_object_schema(_load_schema(model.input_schema)),
            },
        })
    return tools


def _build_description(model: MLModel, tags: list[str]) -> str:
    parts = [model.description or model.name]
    if tags:
        parts.append(f"Tags: {', '.join(str(t) for t in tags)}")
    parts.append(f"Status: {model.status}. Latency: {model.latency_ms}ms. QPS: {model.qps}")
    return ". ".join(parts)


def _load_schema(raw: Any) -> Any:
    if isinstance(raw, str):
        raw = raw.strip()
        return json.loads(raw) if raw else {}
    return raw or {}


def _to_object_schema(value: Any) -> dict[str, Any]:
    schema = _to_json_schema(value)
    if schema.get("type") == "object":
        schema.setdefault("properties", {})
        if schema.get("properties") and "required" not in schema:
            schema["required"] = list(schema["properties"].keys())
        return schema
    return {"type": "object", "properties": {"input": schema}, "required": ["input"]}


def _to_json_schema(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        if set(value.keys()) & _JSON_SCHEMA_KEYS:
            return value
        if not value:
            return {"type": "object", "additionalProperties": True}
        return {
            "type": "object",
            "properties": {k: _to_json_schema(v) for k, v in value.items()},
            "required": list(value.keys()),
        }
    if isinstance(value, list):
        return {"type": "array", "items": _to_json_schema(value[0]) if value else {}}
    if isinstance(value, str):
        return _string_to_schema(value)
    return {}


def _string_to_schema(spec: str) -> dict[str, Any]:
    lower = spec.strip().lower()
    if "|" in spec and "://" not in spec:
        options = [p.strip() for p in spec.split("|") if p.strip()]
        if options:
            return {"type": "string", "enum": options}
    type_map = {
        "string": "string", "str": "string",
        "boolean": "boolean", "bool": "boolean",
        "float": "number", "double": "number", "number": "number",
        "integer": "integer", "int": "integer",
    }
    if lower in type_map:
        return {"type": type_map[lower]}
    if "url" in lower or "uri" in lower:
        return {"type": "string", "format": "uri"}
    return {"type": "string"}
