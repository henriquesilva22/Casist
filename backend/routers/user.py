from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..core.security import get_current_user
from ..database import get_db
from ..models.core import UserConfig
from ..schemas.core import UserConfigResponse

router = APIRouter(prefix='/api/v1/user', tags=['user'], dependencies=[Depends(get_current_user)])

@router.get('/status', response_model=UserConfigResponse)
def status(db: Session = Depends(get_db)):
  user = db.query(UserConfig).first()
  if user:
    return user
  return UserConfigResponse(id=1, mmr=2450, bateria_pessoal=72.0, saldo_livre_diario=35.0, custom_ai_name='Carinne', updated_at=None)
