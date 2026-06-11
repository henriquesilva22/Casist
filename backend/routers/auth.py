from datetime import timedelta
from fastapi import APIRouter, HTTPException, status
from ..core.security import create_access_token
from ..schemas.auth import LoginRequest, TokenResponse

router = APIRouter(prefix='/api/v1/auth', tags=['auth'])

@router.post('/login', response_model=TokenResponse)
def login(payload: LoginRequest):
  if not payload.username.strip() or not payload.password.strip():
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Informe usuário e senha')
  return TokenResponse(access_token=create_access_token({'sub': payload.username}, expires_delta=timedelta(days=1)))
