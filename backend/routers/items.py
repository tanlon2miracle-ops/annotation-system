import json

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from models import ImportBatch
from schemas import BatchOut, ExportRequest
from services.export_service import export_session
from services.import_service import import_json

router = APIRouter(tags=["items"])


@router.post("/import", response_model=BatchOut, status_code=201)
async def import_data(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename or not file.filename.endswith(".json"):
        raise HTTPException(400, "Only JSON files are accepted")

    content = await file.read()
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid JSON")

    if not isinstance(data, list):
        raise HTTPException(400, "JSON root must be an array")

    if len(data) == 0:
        raise HTTPException(400, "Empty dataset")

    batch = import_json(db, file.filename, data)
    return batch


@router.get("/batches", response_model=list[BatchOut])
def list_batches(db: Session = Depends(get_db)):
    return db.query(ImportBatch).order_by(ImportBatch.imported_at.desc()).all()


@router.post("/export")
def export_data(body: ExportRequest, db: Session = Depends(get_db)):
    result = export_session(db, body.session_id, body.include_skipped, body.include_unannotated)
    if not result:
        raise HTTPException(404, "Session not found or no data")

    content = json.dumps(result, ensure_ascii=False, indent=2)

    return StreamingResponse(
        iter([content]),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=export_session_{body.session_id}.json"},
    )
