from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.security import get_current_user
from ..database import get_db
from ..deps import get_or_create_user
from ..models.core import Postit
from ..schemas.core import PostitCreate, PostitUpdate, PostitResponse

router = APIRouter(prefix='/api/v1/postits', tags=['postits'], dependencies=[Depends(get_current_user)])

@router.get('', response_model=list[PostitResponse])
def list_postits(db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  items = db.query(Postit).filter(Postit.user_id == user.id, Postit.completed == 0).order_by(Postit.priority.desc(), Postit.created_at.desc()).all()
  return [PostitResponse(id=p.id, title=p.title, priority=p.priority, color=p.color, completed=bool(p.completed), created_at=p.created_at) for p in items]

@router.post('', response_model=PostitResponse, status_code=201)
def create_postit(payload: PostitCreate, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  postit = Postit(title=payload.title, priority=payload.priority, color=payload.color, user_id=user.id)
  db.add(postit)
  db.commit()
  db.refresh(postit)
  return PostitResponse(id=postit.id, title=postit.title, priority=postit.priority, color=postit.color, completed=bool(postit.completed), created_at=postit.created_at)

@router.patch('/{postit_id}', response_model=PostitResponse)
def update_postit(postit_id: int, payload: PostitUpdate, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  postit = db.query(Postit).filter(Postit.id == postit_id, Postit.user_id == user.id).first()
  if not postit:
    raise HTTPException(status_code=404, detail='Post-it não encontrado')
  if payload.title is not None:
    postit.title = payload.title
  if payload.priority is not None:
    postit.priority = payload.priority
  if payload.color is not None:
    postit.color = payload.color
  if payload.completed is not None:
    postit.completed = 1 if payload.completed else 0
  db.commit()
  db.refresh(postit)
  return PostitResponse(id=postit.id, title=postit.title, priority=postit.priority, color=postit.color, completed=bool(postit.completed), created_at=postit.created_at)

@router.delete('/{postit_id}', status_code=204)
def delete_postit(postit_id: int, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  postit = db.query(Postit).filter(Postit.id == postit_id, Postit.user_id == user.id).first()
  if not postit:
    raise HTTPException(status_code=404, detail='Post-it não encontrado')
  db.delete(postit)
  db.commit()
