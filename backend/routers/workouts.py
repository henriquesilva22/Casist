from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..core.security import get_current_user
from ..database import get_db
from ..deps import get_or_create_user
from ..models.core import EffortLevel, WorkoutSession

router = APIRouter(prefix='/api/v1/workouts', tags=['workouts'], dependencies=[Depends(get_current_user)])

class WorkoutCreate(BaseModel):
  muscle_group: str
  duration_minutes: int = 45
  effort_level: str = 'Medio'

class WorkoutResponse(BaseModel):
  id: int
  date: datetime
  muscle_group: str
  duration_minutes: int
  effort_level: str
  class Config: from_attributes = True

@router.get('', response_model=List[WorkoutResponse])
def list_workouts(db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  items = db.query(WorkoutSession).filter(WorkoutSession.user_id == user.id).order_by(WorkoutSession.date.desc()).limit(20).all()
  return [WorkoutResponse(id=w.id, date=w.date, muscle_group=w.muscle_group, duration_minutes=w.duration_minutes or 45, effort_level=w.effort_level.value) for w in items]

@router.post('', response_model=WorkoutResponse, status_code=201)
def create_workout(payload: WorkoutCreate, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  effort_map = {'Leve': EffortLevel.Leve, 'Medio': EffortLevel.Medio, 'Pesado': EffortLevel.Pesado, 'Falha': EffortLevel.Falha}
  effort = effort_map.get(payload.effort_level, EffortLevel.Medio)
  w = WorkoutSession(muscle_group=payload.muscle_group, duration_minutes=payload.duration_minutes, effort_level=effort, user_id=user.id)
  db.add(w)
  db.commit()
  db.refresh(w)
  return WorkoutResponse(id=w.id, date=w.date, muscle_group=w.muscle_group, duration_minutes=w.duration_minutes, effort_level=w.effort_level.value)
