from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.security import get_current_user
from ..database import get_db
from ..deps import get_or_create_user
from ..models.core import Event
from ..schemas.core import EventCreate, EventUpdate, EventResponse

router = APIRouter(prefix='/api/v1/events', tags=['events'], dependencies=[Depends(get_current_user)])

def _to_response(event: Event) -> EventResponse:
  return EventResponse(id=event.id, title=event.title, event_date=event.event_date, category=event.category, notification_sound=event.notification_sound, reminder_days=event.reminder_days, created_at=event.created_at)

@router.get('', response_model=list[EventResponse])
def list_events(db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  items = db.query(Event).filter(Event.user_id == user.id).order_by(Event.event_date.asc()).all()
  return [_to_response(e) for e in items]

@router.get('/upcoming', response_model=EventResponse | None)
def next_event(db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  now = datetime.utcnow()
  event = db.query(Event).filter(Event.user_id == user.id, Event.event_date >= now).order_by(Event.event_date.asc()).first()
  return _to_response(event) if event else None

@router.get('/today', response_model=list[EventResponse])
def today_events(db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  now = datetime.utcnow()
  start = now.replace(hour=0, minute=0, second=0, microsecond=0)
  end = start + timedelta(days=1)
  items = db.query(Event).filter(Event.user_id == user.id, Event.event_date >= start, Event.event_date < end).order_by(Event.event_date.asc()).all()
  return [_to_response(e) for e in items]

@router.post('', response_model=EventResponse, status_code=201)
def create_event(payload: EventCreate, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  event = Event(title=payload.title, event_date=payload.event_date, category=payload.category, notification_sound=payload.notification_sound, reminder_days=payload.reminder_days, user_id=user.id)
  db.add(event)
  db.commit()
  db.refresh(event)
  return _to_response(event)

@router.patch('/{event_id}', response_model=EventResponse)
def update_event(event_id: int, payload: EventUpdate, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  event = db.query(Event).filter(Event.id == event_id, Event.user_id == user.id).first()
  if not event:
    raise HTTPException(status_code=404, detail='Evento não encontrado')
  if payload.title is not None:
    event.title = payload.title
  if payload.event_date is not None:
    event.event_date = payload.event_date
  if payload.category is not None:
    event.category = payload.category
  if payload.notification_sound is not None:
    event.notification_sound = payload.notification_sound
  if payload.reminder_days is not None:
    event.reminder_days = payload.reminder_days
  db.commit()
  db.refresh(event)
  return _to_response(event)

@router.delete('/{event_id}', status_code=204)
def delete_event(event_id: int, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  event = db.query(Event).filter(Event.id == event_id, Event.user_id == user.id).first()
  if not event:
    raise HTTPException(status_code=404, detail='Evento não encontrado')
  db.delete(event)
  db.commit()
