# CLAUDE.md

## Project Overview

NexusRegistry — 内部 ML 模型注册与智能路由平台。提供模型目录浏览、规则路由、**LLM 驱动的智能路由**和 mock playground。

## Tech Stack

- **Backend**: FastAPI + SQLAlchemy + SQLite (WAL mode)
- **Frontend**: React 19 + TypeScript + Zustand + TailwindCSS + Vite
- **LLM Integration**: OpenAI 兼容 API (httpx, tool_use/function calling)

## Architecture

### Backend (`backend/`)

```
main.py              — FastAPI app, lifespan, CORS, router registration
config.py            — DB paths, pagination, LLM env vars (LLM_BASE_URL, LLM_API_KEY, LLM_MODEL)
database.py          — SQLAlchemy engine, session, WAL pragma
models.py            — ORM: MLModel, ModelTag, RoutingLog, SmartRoutingSession, InvocationRecord
schemas.py           — Pydantic: CRUD schemas + smart routing schemas
seed.py              — 4 seed models (spam, NSFW, intent, live audit)

routers/
  models_router.py       — CRUD /api/v1/models
  playground_router.py   — POST /api/v1/playground/invoke (mock)
  routing_router.py      — POST /api/v1/routing/rule, /nl (keyword-based, legacy)
  smart_router.py        — POST /api/v1/route/smart (SSE), GET history, GET detail

services/
  llm_client.py                  — [I/O] OpenAI-compat LLM API client (httpx)
  tool_builder.py                — [转换] model registry → tool definitions (JSON Schema conversion)
  response_parser.py             — [解析] LLM response → ParsedRouting(reasoning, selections)
  model_invoker.py               — [调用] async model invocation wrapper (mock_invoke)
  session_repo.py                — [持久化] SmartRoutingSession CRUD
  smart_router_orchestrator.py   — [编排] orchestrate() yields SSE events
  routing_service.py             — legacy keyword-based NL/rule routing
  mock_inference.py              — mock model invocation with hardcoded responses
```

### Frontend (`frontend/src/`)

```
App.tsx              — React Router: /, /smart, /routing, /logs
api/client.ts        — fetch wrapper with get/post/put/del

stores/
  modelStore.ts       — model list, search, pagination (Zustand)
  uiStore.ts          — drawer, playground state
  routingStore.ts     — legacy rule/NL routing
  smartRoutingStore.ts — smart routing SSE state

hooks/
  useSSE.ts           — POST-based SSE streaming (fetch + ReadableStream + AbortController)

pages/
  RegistryPage.tsx      — model catalog grid
  SmartRoutingPage.tsx  — AI smart routing (query → LLM → invoke)
  RoutingPage.tsx       — legacy rule/NL routing
  LogsPage.tsx          — routing logs

components/
  smart/QueryInput.tsx        — query textarea + example chips
  smart/RoutingProgress.tsx   — reasoning + model cards + invocation results
  layout/AppShell.tsx         — nav bar
  registry/                   — ModelCard, ModelGrid, SearchBar, ModalityFilter
  detail/                     — ModelDrawer, SchemaTab, PlaygroundTab
  common/                     — Badge, EmptyState
```

## Smart Routing Flow

```
User query → POST /api/v1/route/smart (SSE stream)
  1. ToolBuilder: load models from DB → build OpenAI tool definitions
  2. LLMClient: call LLM API with system prompt + tools
  3. ResponseParser: extract reasoning (text) + model selections (tool_calls)
  4. ModelInvoker: invoke each selected model (mock)
  5. SessionRepo: persist session + invocation results
  6. SSE events: routing_start → reasoning → models_selected → invocation_start → invocation_result → complete | error
```

## Key Design Patterns

- **Tool Use routing**: each registered model becomes an LLM tool definition; LLM decides which to call via function calling
- **Schema conversion**: `tool_builder._to_json_schema()` converts simplified DB schemas (`{"text": "string"}`) to proper JSON Schema
- **SSE over POST**: frontend uses `fetch + ReadableStream` (not EventSource) with line-buffer parsing and AbortController
- **Module isolation**: 6 services have no cross-dependencies; only orchestrator imports them

## Common Commands

```bash
# Backend
cd backend && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# Frontend
cd frontend
npm install
npm run dev          # dev server on :5173
npm run build        # production build
npx tsc --noEmit     # type check

# Test SSE endpoint
curl -N -X POST http://localhost:8001/api/v1/route/smart \
  -H 'Content-Type: application/json' \
  -d '{"query":"检测图片违规"}'
```

## Environment Variables

```bash
LLM_BASE_URL=https://api.openai.com/v1   # any OpenAI-compatible endpoint
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o                          # or claude-sonnet-4-20250514, qwen-plus, etc.
LLM_TIMEOUT_S=30                           # LLM API timeout
MODEL_INVOKE_TIMEOUT_S=10                  # per-model invocation timeout
```

## SSE Event Protocol

| Event | Data | Description |
|---|---|---|
| `routing_start` | `{session_id, query}` | Session created |
| `reasoning` | `{text}` | LLM reasoning (complete) |
| `models_selected` | `{models: [{model_id, model_name, reason}]}` | Routing decision |
| `invocation_start` | `{model_id}` | Model invocation started |
| `invocation_result` | `{model_id, output, latency_ms, success}` | Invocation result |
| `complete` | `{session_id, total_latency_ms}` | All done |
| `error` | `{message, phase}` | Error with phase (routing/invocation) |

## Database Tables

- `ml_model` — model registry (model_id, name, modality, status, qps, latency_ms, input/output_schema)
- `model_tag` — many-to-many tags
- `routing_log` — legacy routing logs
- `smart_routing_session` — smart routing sessions (query, reasoning, selected_models, latency, status)
- `invocation_result` — per-model invocation results (input, output, latency, success)
