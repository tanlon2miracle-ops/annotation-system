import json

from sqlalchemy.orm import Session

from models import MLModel, ModelTag


SEED_MODELS = [
    {
        "model_id": "ecomm_risk_my_spam_v2",
        "name": "MY/SG 评论风控模型",
        "modality": "text",
        "tags": ["马来西亚", "风控", "NLP"],
        "description": "检测马来西亚和新加坡市场的电商评论垃圾信息，重点覆盖站外引流、刷单与虚假好评、当地黑产变体词汇。",
        "status": "healthy",
        "qps": 500,
        "latency_ms": 45,
        "owner": "@algorithm_nlp",
        "input_schema": {"text": "string"},
        "output_schema": {"is_spam": "boolean", "confidence": "float", "risk_type": "string"},
    },
    {
        "model_id": "image_nsfw_v3",
        "name": "通用视觉合规引擎",
        "modality": "image",
        "tags": ["通用", "合规", "CV"],
        "description": "识别商品主图和评论晒图中的色情、血腥、违禁品等违规内容。支持高并发，已在全站链路部署。",
        "status": "healthy",
        "qps": 2000,
        "latency_ms": 120,
        "owner": "@cv_team",
        "input_schema": {"image_url": "string (url)"},
        "output_schema": {"pass": "boolean", "labels": ["string"], "scores": {"label": "float"}},
    },
    {
        "model_id": "qwen_local_intent",
        "name": "本地意图解析大模型",
        "modality": "llm",
        "tags": ["通用", "NLU", "LLM"],
        "description": "基于 Qwen 微调的本地大模型，部署于 H800 集群。专用于复杂长文本的业务意图抽取和情感深度分析。",
        "status": "warning",
        "qps": 50,
        "latency_ms": 800,
        "owner": "@llm_infra",
        "input_schema": {"messages": [{"role": "user|assistant", "content": "string"}]},
        "output_schema": {"intent": "string", "entities": {}, "summary": "string"},
    },
    {
        "model_id": "llava_live_audit",
        "name": "直播多模态巡检",
        "modality": "multimodal",
        "tags": ["直播", "风控", "VLM"],
        "description": "结合直播画面关键帧与主播 ASR 话术，综合判断是否存在擦边、诱导私下交易等复杂违规行为。",
        "status": "healthy",
        "qps": 20,
        "latency_ms": 1500,
        "owner": "@multimodal_lab",
        "input_schema": {"image_list": ["url"], "prompt": "string", "asr_text": "string"},
        "output_schema": {"decision": "review|reject|pass", "reasoning": "string"},
    },
]


def seed_models(db: Session):
    if db.query(MLModel).first():
        return
    for data in SEED_MODELS:
        tags = data.pop("tags")
        data["input_schema"] = json.dumps(data["input_schema"], ensure_ascii=False)
        data["output_schema"] = json.dumps(data["output_schema"], ensure_ascii=False)
        model = MLModel(**data)
        db.add(model)
        db.flush()
        for t in tags:
            db.add(ModelTag(model_id=model.id, tag=t))
    db.commit()
