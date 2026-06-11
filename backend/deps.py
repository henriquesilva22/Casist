from sqlalchemy.orm import Session
from .models.core import UserConfig

def get_or_create_user(db: Session) -> UserConfig:
  user = db.query(UserConfig).first()
  if not user:
    user = UserConfig()
    db.add(user)
    db.commit()
    db.refresh(user)
  return user
