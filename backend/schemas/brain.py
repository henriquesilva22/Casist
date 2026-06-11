from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field

ReviewMode = Literal['text', 'voice', 'hybrid']
FrequencyPreset = Literal['30m', '1h', '3h', '6h', 'daily', 'custom']
ResultType = Literal['correct', 'partial', 'wrong']


class TopicCreate(BaseModel):
  name: str = Field(..., min_length=2, max_length=120)


class TopicUpdate(BaseModel):
  name: Optional[str] = Field(None, min_length=2, max_length=120)
  is_active: Optional[bool] = None


class TopicResponse(BaseModel):
  id: int
  name: str
  is_active: bool
  knowledge_count: int = 0


class KnowledgeCreate(BaseModel):
  question: str = Field(..., min_length=3)
  expected_answer: str = Field(..., min_length=3)
  category: str = Field('geral', min_length=2)
  difficulty: str = Field('medio', min_length=2)
  notes_optional: Optional[str] = None
  advanced_mode_enabled: bool = False


class KnowledgeUpdate(BaseModel):
  question: Optional[str] = None
  expected_answer: Optional[str] = None
  category: Optional[str] = None
  difficulty: Optional[str] = None
  notes_optional: Optional[str] = None
  advanced_mode_enabled: Optional[bool] = None
  is_active: Optional[bool] = None


class KnowledgeResponse(BaseModel):
  id: int
  topic_id: int
  question: str
  expected_answer: str
  category: str
  difficulty: str
  notes_optional: Optional[str]
  advanced_mode_enabled: bool
  is_active: bool
  next_review_at: Optional[datetime] = None


class PolicyUpdate(BaseModel):
  mode: ReviewMode
  frequency_preset: FrequencyPreset
  custom_minutes: int = Field(60, ge=5, le=1440)
  allowed_start_time: str = Field('08:00', pattern='^([01]\\d|2[0-3]):([0-5]\\d)$')
  allowed_end_time: str = Field('22:00', pattern='^([01]\\d|2[0-3]):([0-5]\\d)$')
  timezone: str = 'America/Sao_Paulo'


class PolicyResponse(BaseModel):
  mode: ReviewMode
  frequency_preset: FrequencyPreset
  custom_minutes: int
  allowed_start_time: str
  allowed_end_time: str
  timezone: str


class ReviewTodayResponse(BaseModel):
  pending_count: int
  next_review_at: Optional[datetime] = None
  accuracy_today: float


class ReviewEventResponse(BaseModel):
  event_id: int
  knowledge_item_id: int
  topic: str
  question: str
  expected_answer: str
  delivery_mode: ReviewMode
  scheduled_at: datetime


class AnswerRequest(BaseModel):
  answer_text: str


class AnswerResponse(BaseModel):
  result: ResultType
  score: int
  feedback: str
  next_review_at: datetime


class SnoozeRequest(BaseModel):
  minutes: int = Field(15, ge=5, le=180)


class StatsOverviewResponse(BaseModel):
  total_questions: int
  hits: int
  misses: int
  accuracy_rate: float
  strongest_topic: Optional[str] = None
  weakest_topic: Optional[str] = None


class RecentErrorResponse(BaseModel):
  review_event_id: int
  question: str
  user_answer: Optional[str]
  expected_answer: str
  result: ResultType
  answered_at: datetime


class CarinneIntentRequest(BaseModel):
  command: str


class CarinneIntentResponse(BaseModel):
  intent: str
  message: str
  payload: dict
