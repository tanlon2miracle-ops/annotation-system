from sqlalchemy.orm import Session

from models import Annotation, AnnotationSession, Item
from schemas import ProgressOut


def get_progress(db: Session, session_id: int) -> ProgressOut | None:
    sess = db.get(AnnotationSession, session_id)
    if not sess:
        return None

    base_query = db.query(Item).filter(Item.batch_id == sess.batch_id)

    if sess.mode == "arbitration":
        base_query = base_query.filter(Item.result != Item.result_2)

    total = base_query.count()

    ann_query = db.query(Annotation).filter(Annotation.session_id == session_id)
    annotated = ann_query.filter(Annotation.is_skipped == False, Annotation.result.isnot(None)).count()
    skipped = ann_query.filter(Annotation.is_skipped == True).count()
    flagged = ann_query.filter(Annotation.is_flagged == True).count()
    remaining = total - annotated - skipped

    return ProgressOut(
        total=total,
        annotated=annotated,
        skipped=skipped,
        flagged=flagged,
        remaining=max(remaining, 0),
        percent=round(((annotated + skipped) / total * 100) if total > 0 else 0, 1),
    )
