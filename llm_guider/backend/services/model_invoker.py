from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy.orm import Session

import config
from services.mock_inference import mock_invoke


@dataclass(frozen=True, slots=True)
class InvocationResult:
    model_id: str
    input_data: dict[str, Any] = field(default_factory=dict)
    output_data: dict[str, Any] = field(default_factory=dict)
    latency_ms: int = 0
    success: bool = False
    error_message: str | None = None


async def invoke_model(
    model_id: str, input_data: dict[str, Any], db: Session,
) -> InvocationResult:
    started = time.monotonic()
    payload = input_data if isinstance(input_data, dict) else {"input": input_data}

    try:
        result, status = await asyncio.wait_for(
            asyncio.to_thread(mock_invoke, model_id, payload, db),
            timeout=config.MODEL_INVOKE_TIMEOUT_S,
        )
    except asyncio.TimeoutError:
        return InvocationResult(
            model_id=model_id, input_data=payload,
            latency_ms=_elapsed(started), success=False,
            error_message=f"timed out after {config.MODEL_INVOKE_TIMEOUT_S}s",
        )
    except Exception as exc:
        return InvocationResult(
            model_id=model_id, input_data=payload,
            latency_ms=_elapsed(started), success=False,
            error_message=str(exc),
        )

    ok = status == 200
    return InvocationResult(
        model_id=model_id,
        input_data=payload,
        output_data=result if ok else {},
        latency_ms=int(result.get("latency_ms", _elapsed(started))) if isinstance(result, dict) else _elapsed(started),
        success=ok,
        error_message=None if ok else f"invocation failed with status {status}",
    )


def _elapsed(started: float) -> int:
    return int((time.monotonic() - started) * 1000)
