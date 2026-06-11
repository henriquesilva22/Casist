from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from ..core.security import get_current_user
from ..database import get_db
from ..deps import get_or_create_user
from ..models.core import StudySession, WorkoutSession, Transaction, TransactionType
from ..schemas.core import MirrorYesterdayResponse

router = APIRouter(prefix='/api/v1/mirror', tags=['mirror'], dependencies=[Depends(get_current_user)])

@router.get('/yesterday', response_model=MirrorYesterdayResponse)
def yesterday_summary(db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  now = datetime.utcnow()
  start = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
  end = start + timedelta(days=1)

  study = db.query(StudySession).filter(
    StudySession.user_id == user.id,
    StudySession.date >= start,
    StudySession.date < end,
  ).order_by(StudySession.date.desc()).first()

  workouts = db.query(WorkoutSession).filter(
    WorkoutSession.user_id == user.id,
    WorkoutSession.date >= start,
    WorkoutSession.date < end,
  ).all()

  spent = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
    Transaction.user_id == user.id,
    Transaction.type == TransactionType.expense,
    Transaction.date >= start,
    Transaction.date < end,
  ).scalar() or 0.0

  trained = [w.muscle_group for w in workouts]
  studied = study.topic if study else None
  has_data = bool(studied or trained or spent > 0)

  return MirrorYesterdayResponse(studied=studied, trained=trained, spent=float(spent), has_data=has_data)
