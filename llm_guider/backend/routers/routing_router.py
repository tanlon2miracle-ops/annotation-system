from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from config import PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX
from database import get_db
from models import RoutingLog
from schemas import (
    ModelOut,
    NLRoutingRequest,
    PaginatedLogs,
    RoutingLogOut,
    RoutingMatch,
    RoutingResponse,
    RuleRoutingRequest,
)
from services.routing_service import log_routing, route_by_nl, route_by_rule

router = APIRouter(prefix="/routing", tags=["routing"])


def _to_matches(results: list[dict]) -> list[RoutingMatch]:
    matches = []
    for r in results:
        model = r["model"]
        model_out = ModelOut.model_validate(model)
        model_out.tags = r["tags"]
        matches.append(RoutingMatch(model=model_out, score=r["score"], match_reasons=r["reasons"]))
    return matches


@router.post("/rule", response_model=RoutingResponse)
def rule_route(body: RuleRoutingRequest, db: Session = Depends(get_db)):
    results = route_by_rule(db, body.modality, body.tags, body.max_latency_ms, body.min_qps, body.status)
    log_id = log_routing(db, "rule", str(body.model_dump()), results)
    return RoutingResponse(matches=_to_matches(results), log_id=log_id)


@router.post("/nl", response_model=RoutingResponse)
def nl_route(body: NLRoutingRequest, db: Session = Depends(get_db)):
    results = route_by_nl(db, body.query)
    log_id = log_routing(db, "nl", body.query, results)
    return RoutingResponse(matches=_to_matches(results), log_id=log_id)


@router.get("/logs", response_model=PaginatedLogs)
def list_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(PAGE_SIZE_DEFAULT, ge=1, le=PAGE_SIZE_MAX),
    query_type: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(RoutingLog)
    if query_type:
        q = q.filter(RoutingLog.query_type == query_type)
    total = q.count()
    items = q.order_by(RoutingLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return PaginatedLogs(items=items, total=total, page=page, page_size=page_size)
