from __future__ import annotations

import json
import re

from sqlalchemy.orm import Session

from models import MLModel, ModelTag, RoutingLog

# --- Keyword dictionary for NL routing ---
KEYWORD_MAP: dict[str, dict] = {
    # Modality
    "文本": {"modality": "text"}, "text": {"modality": "text"},
    "图片": {"modality": "image"}, "图像": {"modality": "image"}, "image": {"modality": "image"},
    "大模型": {"modality": "llm"}, "llm": {"modality": "llm"},
    "多模态": {"modality": "multimodal"}, "vlm": {"modality": "multimodal"}, "multimodal": {"modality": "multimodal"},
    # Domain tags
    "风控": {"tag": "风控"}, "合规": {"tag": "合规"}, "nlp": {"tag": "NLP"},
    "直播": {"tag": "直播"}, "cv": {"tag": "CV"}, "nlu": {"tag": "NLU"},
    "评论": {"tag": "风控"}, "spam": {"tag": "风控"},
    "马来": {"tag": "马来西亚"}, "新加坡": {"tag": "马来西亚"},
    # Performance
    "低延迟": {"max_latency_ms": 200}, "快": {"max_latency_ms": 200}, "fast": {"max_latency_ms": 200},
    "高吞吐": {"min_qps": 500}, "高并发": {"min_qps": 500},
}

STATUS_MULTIPLIER = {"healthy": 1.0, "warning": 0.3, "offline": 0.0}

# Sort keywords by length descending for greedy matching
_SORTED_KEYWORDS = sorted(KEYWORD_MAP.keys(), key=len, reverse=True)


def _extract_keywords(text: str) -> tuple[list[dict], str]:
    """Extract structured intents from text via substring matching (handles Chinese without spaces)."""
    lower = text.lower()
    matched: list[dict] = []
    remaining = lower
    for kw in _SORTED_KEYWORDS:
        if kw in remaining:
            matched.append(KEYWORD_MAP[kw])
            remaining = remaining.replace(kw, " ", 1)
    remaining_tokens = [t for t in remaining.split() if t.strip()]
    return matched, " ".join(remaining_tokens)


def _tokenize(text: str) -> list[str]:
    return [t.lower() for t in re.split(r'[\s,，。、；;：:!！?？()\[\]{}]+', text) if t]


def _text_overlap(query_tokens: list[str], model_text: str) -> float:
    model_lower = model_text.lower()
    if not query_tokens:
        return 0.0
    matched = sum(1 for t in query_tokens if t in model_lower)
    return matched / len(query_tokens)


def _score_model(
    model: MLModel,
    model_tags: list[str],
    required_tags: list[str],
    query_tokens: list[str],
    max_latency: int | None,
    min_qps: int | None,
) -> tuple[float, list[str]]:
    reasons: list[str] = []
    # Tag relevance (55%)
    if required_tags:
        tag_set = {t.lower() for t in model_tags}
        matched = [t for t in required_tags if t.lower() in tag_set]
        tag_score = len(matched) / len(required_tags)
        if matched:
            reasons.append(f"tag匹配: {', '.join(matched)}")
    else:
        tag_score = 0.5

    # Text similarity (15%)
    model_text = f"{model.name} {model.description} {' '.join(model_tags)}"
    text_score = _text_overlap(query_tokens, model_text)
    if text_score > 0:
        reasons.append(f"文本相似度: {text_score:.0%}")

    # Latency (15%)
    if max_latency and max_latency > 0:
        latency_score = max(0, 1 - model.latency_ms / max_latency)
        if latency_score > 0.5:
            reasons.append(f"延迟: {model.latency_ms}ms")
    else:
        latency_score = max(0, 1 - model.latency_ms / 2000)

    # QPS (15%)
    if min_qps and min_qps > 0:
        qps_score = min(1.0, model.qps / min_qps)
        if qps_score >= 1.0:
            reasons.append(f"QPS: {model.qps}")
    else:
        qps_score = min(1.0, model.qps / 2000)

    raw = tag_score * 0.55 + text_score * 0.15 + latency_score * 0.15 + qps_score * 0.15

    # Status as multiplicative gate (Codex feedback)
    multiplier = STATUS_MULTIPLIER.get(model.status, 0.0)
    if multiplier < 1.0:
        reasons.append(f"状态: {model.status}")
    final = raw * multiplier

    return round(final * 100, 2), reasons


def route_by_rule(
    db: Session,
    modality: str | None,
    tags: list[str],
    max_latency_ms: int | None,
    min_qps: int | None,
    status: str,
) -> list[dict]:
    q = db.query(MLModel)
    # Hard filters
    if modality:
        q = q.filter(MLModel.modality == modality)
    if status and status != "all":
        q = q.filter(MLModel.status == status)
    if max_latency_ms:
        q = q.filter(MLModel.latency_ms <= max_latency_ms)
    if min_qps:
        q = q.filter(MLModel.qps >= min_qps)

    candidates = q.all()

    # Tag filter: require at least one matching tag
    if tags:
        filtered = []
        for m in candidates:
            m_tags = [t.tag for t in m.tags]
            if any(t.lower() in [mt.lower() for mt in m_tags] for t in tags):
                filtered.append(m)
        candidates = filtered

    scored = []
    for m in candidates:
        m_tags = [t.tag for t in m.tags]
        score, reasons = _score_model(m, m_tags, tags, [], max_latency_ms, min_qps)
        scored.append({"model": m, "tags": m_tags, "score": score, "reasons": reasons})

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:10]


def route_by_nl(db: Session, query: str) -> list[dict]:
    # Use substring matching for Chinese text (no space-based tokenization)
    matched_intents, remaining_text = _extract_keywords(query)
    remaining_tokens = _tokenize(remaining_text)

    extracted_modality = None
    extracted_tags: list[str] = []
    max_latency: int | None = None
    min_qps: int | None = None

    for intent in matched_intents:
        if "modality" in intent:
            extracted_modality = intent["modality"]
        if "tag" in intent:
            extracted_tags.append(intent["tag"])
        if "max_latency_ms" in intent:
            max_latency = intent["max_latency_ms"]
        if "min_qps" in intent:
            min_qps = intent["min_qps"]

    q = db.query(MLModel)
    if extracted_modality:
        q = q.filter(MLModel.modality == extracted_modality)

    candidates = q.all()

    scored = []
    for m in candidates:
        m_tags = [t.tag for t in m.tags]
        score, reasons = _score_model(m, m_tags, extracted_tags, remaining_tokens, max_latency, min_qps)
        if score > 0:
            scored.append({"model": m, "tags": m_tags, "score": score, "reasons": reasons})

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:10]


def log_routing(
    db: Session,
    query_type: str,
    query_text: str,
    results: list[dict],
) -> int:
    matched_ids = [r["model"].model_id for r in results]
    scores_map = {r["model"].model_id: r["score"] for r in results}
    selected = matched_ids[0] if matched_ids else None

    log = RoutingLog(
        query_type=query_type,
        query_text=query_text,
        matched_model_ids=json.dumps(matched_ids),
        scores=json.dumps(scores_map),
        selected_model_id=selected,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log.id
