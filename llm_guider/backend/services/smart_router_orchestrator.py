from __future__ import annotations

import time
from typing import Any, AsyncGenerator

from sqlalchemy.orm import Session

import config
from models import MLModel
from services.llm_client import LLMClient
from services.model_invoker import invoke_model
from services.response_parser import parse_llm_response
from services.session_repo import create_session, save_invocation, update_session
from services.tool_builder import build_tools

SYSTEM_PROMPT = (
    "你是一个智能模型路由器。根据用户的自然语言需求，从可用工具中选择最合适的模型来处理请求。\n\n"
    "规则：\n"
    "- 优先选择 status=healthy 的模型\n"
    "- 考虑延迟和吞吐量特征\n"
    "- 可以同时选择多个互补的模型\n"
    "- 在回复文本中简要解释选择理由\n"
    "- 如果没有合适的模型，直接说明原因，不要强行选择\n"
    "- 最多选择 3 个模型\n"
    "- 根据用户描述合理填充工具参数，不要编造不存在的 URL 或数据"
)


def _event(name: str, data: dict[str, Any]) -> dict[str, Any]:
    return {"event": name, "data": data}


async def orchestrate(
    query: str, db: Session, llm: LLMClient | None = None,
) -> AsyncGenerator[dict[str, Any], None]:
    phase = "init"
    session = None

    try:
        client = llm or LLMClient()
        session = create_session(db, user_query=query, llm_model=client.model, status="routing")
        yield _event("routing_start", {"session_id": session.id, "query": query})

        phase = "build_tools"
        models = db.query(MLModel).all()
        if not models:
            raise ValueError("no models registered")
        tags_map = {m.model_id: [t.tag for t in m.tags] for m in models}
        tools = build_tools(models, tags_map)
        models_by_id = {m.model_id: m for m in models}

        phase = "routing"
        llm_start = time.monotonic()
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": query},
        ]
        raw = await client.chat_with_tools(messages, tools)
        llm_ms = int((time.monotonic() - llm_start) * 1000)

        phase = "parse"
        parsed = parse_llm_response(raw)
        selected = [
            {
                "model_id": s.model_id,
                "model_name": (models_by_id[s.model_id].name if s.model_id in models_by_id else s.model_id),
                "reason": parsed.reasoning or "Selected by LLM",
            }
            for s in parsed.selections
        ]
        update_session(
            db, session.id,
            llm_reasoning=parsed.reasoning,
            selected_models=selected,
            total_llm_latency_ms=llm_ms,
            status="invoking",
        )
        yield _event("reasoning", {"text": parsed.reasoning})
        yield _event("models_selected", {"models": selected})

        phase = "invocation"
        total_invoke_ms = 0
        for sel in parsed.selections:
            yield _event("invocation_start", {"model_id": sel.model_id})
            result = await invoke_model(sel.model_id, sel.tool_call_args, db)
            total_invoke_ms += result.latency_ms
            save_invocation(db, session.id, result)
            yield _event("invocation_result", {
                "model_id": result.model_id,
                "output": result.output_data,
                "latency_ms": result.latency_ms,
                "success": result.success,
                "error_message": result.error_message,
            })

        update_session(
            db, session.id,
            total_invoke_latency_ms=total_invoke_ms,
            status="completed",
        )
        yield _event("complete", {
            "session_id": session.id,
            "total_latency_ms": llm_ms + total_invoke_ms,
        })

    except Exception as exc:
        if session:
            try:
                update_session(db, session.id, status="error", error_message=str(exc))
            except Exception:
                pass
        yield _event("error", {"message": str(exc), "phase": phase})
