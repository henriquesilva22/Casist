from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class UserConfigBase(BaseModel):
  mmr: int = Field(..., example=1200)
  bateria_pessoal: float = Field(..., example=75.5)
  saldo_livre_diario: float = Field(..., example=35.0)
  custom_ai_name: str = Field('Carinne')

class UserConfigResponse(UserConfigBase):
  id: int
  updated_at: Optional[datetime]
  class Config: from_attributes = True

class PostitCreate(BaseModel):
  title: str
  priority: int = Field(1, ge=1, le=5)
  color: str = 'cyan'

class PostitUpdate(BaseModel):
  title: Optional[str] = None
  priority: Optional[int] = Field(None, ge=1, le=5)
  color: Optional[str] = None
  completed: Optional[bool] = None

class PostitResponse(BaseModel):
  id: int
  title: str
  priority: int
  color: str
  completed: bool
  created_at: Optional[datetime]
  class Config: from_attributes = True

class EventCreate(BaseModel):
  title: str
  event_date: datetime
  category: str
  notification_sound: str = 'Sino Suave'
  reminder_days: int = Field(7, ge=1, le=30)

class EventUpdate(BaseModel):
  title: Optional[str] = None
  event_date: Optional[datetime] = None
  category: Optional[str] = None
  notification_sound: Optional[str] = None
  reminder_days: Optional[int] = Field(None, ge=1, le=30)

class EventResponse(BaseModel):
  id: int
  title: str
  event_date: datetime
  category: str
  notification_sound: str
  reminder_days: int
  created_at: Optional[datetime]
  class Config: from_attributes = True

class MirrorYesterdayResponse(BaseModel):
  studied: Optional[str] = None
  trained: List[str] = []
  spent: float = 0.0
  has_data: bool = False
