from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True, slots=True)
class ModelSelection:
    model_id: str
    tool_call_args: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class ParsedRouting:
    reasoning: str = ""
    selections: list[ModelSelection] = field(default_factory=list)


def parse_llm_response(raw: dict[str, Any]) -> ParsedRouting:
    choices = raw.get("choices")
    if not isinstance(choices, list) or not choices:
        raise ValueError("LLM response missing choices")

    message = choices[0].get("message")
    if not isinstance(message, dict):
        raise ValueError("LLM response missing message")

    return ParsedRouting(
        reasoning=_extract_reasoning(message.get("content")),
        selections=_extract_selections(message.get("tool_calls")),
    )


def _extract_reasoning(content: Any) -> str:
    if content is None:
        return ""
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                text = item.get("text") or item.get("content") or ""
                if text.strip():
                    parts.append(text.strip())
        return "\n".join(parts)
    return str(content).strip()


def _extract_selections(tool_calls: Any) -> list[ModelSelection]:
    if not isinstance(tool_calls, list):
        return []

    selections: list[ModelSelection] = []
    for call in tool_calls:
        if not isinstance(call, dict):
            continue
        func = call.get("function") or {}
        name = func.get("name") or ""
        if not name:
            continue
        selections.append(ModelSelection(
            model_id=name.removeprefix("invoke_"),
            tool_call_args=_parse_args(func.get("arguments")),
        ))
    return selections


def _parse_args(arguments: Any) -> dict[str, Any]:
    if isinstance(arguments, dict):
        return arguments
    if isinstance(arguments, str):
        text = arguments.strip()
        if not text:
            return {}
        try:
            parsed = json.loads(text)
            return parsed if isinstance(parsed, dict) else {"value": parsed}
        except json.JSONDecodeError:
            return {"raw": text}
    return {}
