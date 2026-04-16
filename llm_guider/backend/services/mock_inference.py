import json
import random
import time

from sqlalchemy.orm import Session

from models import MLModel

HARDCODED_RESPONSES: dict[str, dict] = {
    "ecomm_risk_my_spam_v2": {
        "is_spam": False,
        "confidence": 0.87,
        "risk_type": "normal",
    },
    "image_nsfw_v3": {
        "pass": True,
        "labels": ["safe"],
        "scores": {"safe": 0.99, "nsfw": 0.01},
    },
    "qwen_local_intent": {
        "intent": "product_inquiry",
        "entities": {"product": "手机壳", "attribute": "颜色"},
        "summary": "用户咨询手机壳颜色选项",
    },
    "llava_live_audit": {
        "decision": "pass",
        "reasoning": "画面内容正常，未检测到违规行为",
    },
}

TYPE_GENERATORS: dict[str, callable] = {
    "string": lambda: random.choice(["mock_value", "sample_text", "example"]),
    "boolean": lambda: random.choice([True, False]),
    "float": lambda: round(random.uniform(0, 1), 4),
    "integer": lambda: random.randint(0, 100),
    "int": lambda: random.randint(0, 100),
}


def _generate_from_schema(schema: dict | list | str) -> object:
    if isinstance(schema, str):
        if "|" in schema:
            return random.choice(schema.split("|"))
        gen = TYPE_GENERATORS.get(schema)
        return gen() if gen else f"mock_{schema}"
    if isinstance(schema, list):
        if schema:
            return [_generate_from_schema(schema[0])]
        return []
    if isinstance(schema, dict):
        return {k: _generate_from_schema(v) for k, v in schema.items()}
    return None


def mock_invoke(model_id: str, _input: dict, db: Session) -> tuple[dict, int]:
    model = db.query(MLModel).filter(MLModel.model_id == model_id).first()
    if not model:
        return {"error": f"model '{model_id}' not found"}, 404

    start = time.monotonic()

    if model_id in HARDCODED_RESPONSES:
        output = HARDCODED_RESPONSES[model_id]
    else:
        output_schema = json.loads(model.output_schema) if isinstance(model.output_schema, str) else model.output_schema
        output = _generate_from_schema(output_schema)

    elapsed_ms = int((time.monotonic() - start) * 1000) + random.randint(30, 150)
    return {"output": output, "latency_ms": elapsed_ms, "status_code": 200, "model_id": model_id}, 200
