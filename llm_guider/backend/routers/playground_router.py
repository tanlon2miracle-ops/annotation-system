from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from database import get_db
from schemas import PlaygroundRequest
from services.mock_inference import mock_invoke

router = APIRouter(prefix="/playground", tags=["playground"])


@router.post("/invoke")
def invoke(body: PlaygroundRequest, db: Session = Depends(get_db)):
    result, status = mock_invoke(body.model_id, body.input, db)
    return JSONResponse(content=result, status_code=status)
