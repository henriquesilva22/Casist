from datetime import datetime
import enum
from sqlalchemy import Column, Integer, Float, String, DateTime, Enum, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from ..database import Base

class EffortLevel(enum.Enum): Leve='Leve'; Medio='Medio'; Pesado='Pesado'; Falha='Falha'
class DifficultyLevel(enum.Enum): Baixa='Baixa'; Media='Media'; Alta='Alta'
class TransactionType(enum.Enum): income='income'; expense='expense'

class UserConfig(Base):
  __tablename__ = 'user_config'
  id = Column(Integer, primary_key=True, index=True)
  mmr = Column(Integer, default=1200, nullable=False)
  bateria_pessoal = Column(Float, default=100.0, nullable=False)
  saldo_livre_diario = Column(Float, default=0.0, nullable=False)
  custom_ai_name = Column(String, default='Carinne', nullable=False)
  updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
  workouts = relationship('WorkoutSession', back_populates='user')
  studies = relationship('StudySession', back_populates='user')
  transactions = relationship('Transaction', back_populates='user')
  postits = relationship('Postit', back_populates='user')
  events = relationship('Event', back_populates='user')
  wallet_profile = relationship('WalletProfile', back_populates='user', uselist=False)
  wallet_bills = relationship('WalletBill', back_populates='user')
  savings_goals = relationship('SavingsGoal', back_populates='user')

class WorkoutSession(Base):
  __tablename__ = 'workout_session'
  id = Column(Integer, primary_key=True, index=True)
  date = Column(DateTime, default=datetime.utcnow)
  muscle_group = Column(String, nullable=False)
  duration_minutes = Column(Integer)
  effort_level = Column(Enum(EffortLevel), nullable=False)
  user_id = Column(Integer, ForeignKey('user_config.id'))
  user = relationship('UserConfig', back_populates='workouts')

class StudySession(Base):
  __tablename__ = 'study_session'
  id = Column(Integer, primary_key=True, index=True)
  date = Column(DateTime, default=datetime.utcnow)
  topic = Column(String, nullable=False)
  duration_minutes = Column(Integer)
  difficulty_level = Column(Enum(DifficultyLevel), nullable=False)
  user_id = Column(Integer, ForeignKey('user_config.id'))
  user = relationship('UserConfig', back_populates='studies')

class Transaction(Base):
  __tablename__ = 'transaction'
  id = Column(Integer, primary_key=True, index=True)
  date = Column(DateTime, default=datetime.utcnow)
  amount = Column(Float, nullable=False)
  type = Column(Enum(TransactionType), nullable=False)
  category = Column(String)
  description = Column(String)
  user_id = Column(Integer, ForeignKey('user_config.id'))
  user = relationship('UserConfig', back_populates='transactions')

class Postit(Base):
  __tablename__ = 'postit'
  id = Column(Integer, primary_key=True, index=True)
  title = Column(String, nullable=False)
  priority = Column(Integer, default=1, nullable=False)
  color = Column(String, default='cyan', nullable=False)
  completed = Column(Integer, default=0, nullable=False)
  created_at = Column(DateTime, default=datetime.utcnow)
  user_id = Column(Integer, ForeignKey('user_config.id'))
  user = relationship('UserConfig', back_populates='postits')

class Event(Base):
  __tablename__ = 'event'
  id = Column(Integer, primary_key=True, index=True)
  title = Column(String, nullable=False)
  event_date = Column(DateTime, nullable=False)
  category = Column(String, nullable=False)
  notification_sound = Column(String, default='Sino Suave', nullable=False)
  reminder_days = Column(Integer, default=7, nullable=False)
  created_at = Column(DateTime, default=datetime.utcnow)
  user_id = Column(Integer, ForeignKey('user_config.id'))
  user = relationship('UserConfig', back_populates='events')

class ChatMemory(Base):
  __tablename__ = 'chat_memory'
  id = Column(Integer, primary_key=True, index=True)
  user_name = Column(String, index=True, nullable=False)
  question = Column(String, nullable=False)
  reply = Column(String, nullable=False)
  created_at = Column(DateTime, default=datetime.utcnow, index=True)


class WalletProfile(Base):
  __tablename__ = 'wallet_profile'
  id = Column(Integer, primary_key=True, index=True)
  user_id = Column(Integer, ForeignKey('user_config.id'), unique=True, nullable=False, index=True)
  monthly_saving_target = Column(Float, default=0.0, nullable=False)
  updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

  user = relationship('UserConfig', back_populates='wallet_profile')


class WalletBill(Base):
  __tablename__ = 'wallet_bill'
  id = Column(Integer, primary_key=True, index=True)
  user_id = Column(Integer, ForeignKey('user_config.id'), nullable=False, index=True)
  title = Column(String, nullable=False)
  amount = Column(Float, nullable=False)
  due_date = Column(DateTime, nullable=False, index=True)
  category = Column(String, default='conta', nullable=False)
  paid = Column(Boolean, default=False, nullable=False)
  paid_at = Column(DateTime)
  created_at = Column(DateTime, default=datetime.utcnow)

  user = relationship('UserConfig', back_populates='wallet_bills')


class SavingsGoal(Base):
  __tablename__ = 'savings_goal'
  id = Column(Integer, primary_key=True, index=True)
  user_id = Column(Integer, ForeignKey('user_config.id'), nullable=False, index=True)
  title = Column(String, nullable=False)
  target_amount = Column(Float, nullable=False)
  current_amount = Column(Float, default=0.0, nullable=False)
  monthly_contribution = Column(Float, default=0.0, nullable=False)
  is_active = Column(Boolean, default=True, nullable=False)
  created_at = Column(DateTime, default=datetime.utcnow)

  user = relationship('UserConfig', back_populates='savings_goals')


class BrainReviewMode(enum.Enum):
  text = 'text'
  voice = 'voice'
  hybrid = 'hybrid'


class BrainFrequencyPreset(enum.Enum):
  m30 = '30m'
  h1 = '1h'
  h3 = '3h'
  h6 = '6h'
  daily = 'daily'
  custom = 'custom'


class BrainResult(enum.Enum):
  correct = 'correct'
  partial = 'partial'
  wrong = 'wrong'


class BrainReviewEventStatus(enum.Enum):
  pending = 'pending'
  asked = 'asked'
  answered = 'answered'
  validated = 'validated'
  snoozed = 'snoozed'
  missed = 'missed'


class BrainTopic(Base):
  __tablename__ = 'brain_topic'
  id = Column(Integer, primary_key=True, index=True)
  user_id = Column(Integer, ForeignKey('user_config.id'), nullable=False, index=True)
  name = Column(String, nullable=False)
  is_active = Column(Boolean, default=True, nullable=False)
  created_at = Column(DateTime, default=datetime.utcnow)

  user = relationship('UserConfig')
  knowledge_items = relationship('BrainKnowledgeItem', back_populates='topic', cascade='all, delete-orphan')


class BrainKnowledgeItem(Base):
  __tablename__ = 'brain_knowledge_item'
  id = Column(Integer, primary_key=True, index=True)
  topic_id = Column(Integer, ForeignKey('brain_topic.id'), nullable=False, index=True)
  question = Column(String, nullable=False)
  expected_answer = Column(Text, nullable=False)
  category = Column(String, nullable=False, default='geral')
  difficulty = Column(String, nullable=False, default='medio')
  notes_optional = Column(Text)
  advanced_mode_enabled = Column(Boolean, default=False, nullable=False)
  is_active = Column(Boolean, default=True, nullable=False)
  created_at = Column(DateTime, default=datetime.utcnow)

  topic = relationship('BrainTopic', back_populates='knowledge_items')
  card_state = relationship('BrainCardState', back_populates='knowledge_item', uselist=False, cascade='all, delete-orphan')
  review_events = relationship('BrainReviewEvent', back_populates='knowledge_item', cascade='all, delete-orphan')


class BrainReviewPolicy(Base):
  __tablename__ = 'brain_review_policy'
  id = Column(Integer, primary_key=True, index=True)
  user_id = Column(Integer, ForeignKey('user_config.id'), nullable=False, unique=True, index=True)
  mode = Column(Enum(BrainReviewMode), default=BrainReviewMode.hybrid, nullable=False)
  frequency_preset = Column(Enum(BrainFrequencyPreset), default=BrainFrequencyPreset.h1, nullable=False)
  custom_minutes = Column(Integer, nullable=False, default=60)
  allowed_start_time = Column(String, nullable=False, default='08:00')
  allowed_end_time = Column(String, nullable=False, default='22:00')
  timezone = Column(String, nullable=False, default='America/Sao_Paulo')
  updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class BrainCardState(Base):
  __tablename__ = 'brain_card_state'
  id = Column(Integer, primary_key=True, index=True)
  knowledge_item_id = Column(Integer, ForeignKey('brain_knowledge_item.id'), nullable=False, unique=True, index=True)
  step_index = Column(Integer, nullable=False, default=0)
  success_streak = Column(Integer, nullable=False, default=0)
  last_result = Column(Enum(BrainResult), nullable=False, default=BrainResult.wrong)
  next_review_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
  last_review_at = Column(DateTime)
  created_at = Column(DateTime, default=datetime.utcnow)

  knowledge_item = relationship('BrainKnowledgeItem', back_populates='card_state')


class BrainReviewEvent(Base):
  __tablename__ = 'brain_review_event'
  id = Column(Integer, primary_key=True, index=True)
  knowledge_item_id = Column(Integer, ForeignKey('brain_knowledge_item.id'), nullable=False, index=True)
  scheduled_at = Column(DateTime, nullable=False, index=True)
  status = Column(Enum(BrainReviewEventStatus), nullable=False, default=BrainReviewEventStatus.pending, index=True)
  delivery_mode = Column(Enum(BrainReviewMode), nullable=False, default=BrainReviewMode.text)
  generated_question = Column(Text)
  created_at = Column(DateTime, default=datetime.utcnow)
  answered_at = Column(DateTime)

  knowledge_item = relationship('BrainKnowledgeItem', back_populates='review_events')
  attempts = relationship('BrainReviewAttempt', back_populates='review_event', cascade='all, delete-orphan')


class BrainReviewAttempt(Base):
  __tablename__ = 'brain_review_attempt'
  id = Column(Integer, primary_key=True, index=True)
  review_event_id = Column(Integer, ForeignKey('brain_review_event.id'), nullable=False, index=True)
  user_answer_text = Column(Text)
  user_answer_audio_url_optional = Column(String)
  ai_grade = Column(Enum(BrainResult), nullable=False)
  ai_score = Column(Integer, nullable=False, default=0)
  ai_feedback = Column(Text, nullable=False)
  expected_answer_snapshot = Column(Text, nullable=False)
  answered_at = Column(DateTime, default=datetime.utcnow, index=True)

  review_event = relationship('BrainReviewEvent', back_populates='attempts')
