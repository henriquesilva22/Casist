from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session
import re

from ..core.security import get_current_user
from ..database import get_db
from ..deps import get_or_create_user
from ..models.core import (
  BrainCardState,
  BrainFrequencyPreset,
  BrainKnowledgeItem,
  BrainResult,
  BrainReviewAttempt,
  BrainReviewEvent,
  BrainReviewEventStatus,
  BrainReviewMode,
  BrainReviewPolicy,
  BrainTopic,
)
from ..schemas.brain import (
  AnswerRequest,
  AnswerResponse,
  CarinneIntentRequest,
  CarinneIntentResponse,
  KnowledgeCreate,
  KnowledgeResponse,
  KnowledgeUpdate,
  PolicyResponse,
  PolicyUpdate,
  RecentErrorResponse,
  ReviewEventResponse,
  ReviewTodayResponse,
  SnoozeRequest,
  StatsOverviewResponse,
  TopicCreate,
  TopicResponse,
  TopicUpdate,
)
from ..services.audio_service import transcribe_audio
from ..services.brain_engine import (
  compute_next_step,
  evaluate_answer,
  generate_advanced_question,
  move_to_allowed_window,
  next_review_time,
  preset_to_minutes,
)

router = APIRouter(prefix='/api/v1/brain', tags=['brain'], dependencies=[Depends(get_current_user)])


def _get_or_create_policy(db: Session, user_id: int) -> BrainReviewPolicy:
  policy = db.query(BrainReviewPolicy).filter(BrainReviewPolicy.user_id == user_id).first()
  if policy:
    return policy
  policy = BrainReviewPolicy(user_id=user_id)
  db.add(policy)
  db.commit()
  db.refresh(policy)
  return policy


def _ensure_card_state(db: Session, knowledge_item_id: int) -> BrainCardState:
  state = db.query(BrainCardState).filter(BrainCardState.knowledge_item_id == knowledge_item_id).first()
  if state:
    return state
  state = BrainCardState(knowledge_item_id=knowledge_item_id, next_review_at=datetime.utcnow())
  db.add(state)
  db.commit()
  db.refresh(state)
  return state


def _schedule_event_if_missing(db: Session, knowledge: BrainKnowledgeItem, policy: BrainReviewPolicy) -> BrainReviewEvent:
  state = _ensure_card_state(db, knowledge.id)
  pending = (
    db.query(BrainReviewEvent)
    .filter(
      BrainReviewEvent.knowledge_item_id == knowledge.id,
      BrainReviewEvent.status.in_([BrainReviewEventStatus.pending, BrainReviewEventStatus.snoozed]),
    )
    .order_by(BrainReviewEvent.scheduled_at.asc())
    .first()
  )
  if pending:
    return pending

  mode = policy.mode
  delivery = BrainReviewMode.text if mode == BrainReviewMode.hybrid else mode
  question = knowledge.question
  if knowledge.advanced_mode_enabled:
    question = generate_advanced_question(knowledge.question, knowledge.category)

  event = BrainReviewEvent(
    knowledge_item_id=knowledge.id,
    scheduled_at=state.next_review_at,
    status=BrainReviewEventStatus.pending,
    delivery_mode=delivery,
    generated_question=question,
  )
  db.add(event)
  db.commit()
  db.refresh(event)
  return event


def _build_event_response(event: BrainReviewEvent) -> ReviewEventResponse:
  item = event.knowledge_item
  return ReviewEventResponse(
    event_id=event.id,
    knowledge_item_id=item.id,
    topic=item.topic.name,
    question=event.generated_question or item.question,
    expected_answer=item.expected_answer,
    delivery_mode=event.delivery_mode.value,
    scheduled_at=event.scheduled_at,
  )


@router.post('/topics', response_model=TopicResponse, status_code=201)
def create_topic(payload: TopicCreate, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  topic = BrainTopic(user_id=user.id, name=payload.name.strip())
  db.add(topic)
  db.commit()
  db.refresh(topic)
  return TopicResponse(id=topic.id, name=topic.name, is_active=topic.is_active, knowledge_count=0)


@router.get('/topics', response_model=list[TopicResponse])
def list_topics(db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  rows = (
    db.query(BrainTopic.id, BrainTopic.name, BrainTopic.is_active, func.count(BrainKnowledgeItem.id).label('knowledge_count'))
    .outerjoin(BrainKnowledgeItem, BrainKnowledgeItem.topic_id == BrainTopic.id)
    .filter(BrainTopic.user_id == user.id)
    .group_by(BrainTopic.id)
    .order_by(BrainTopic.created_at.desc())
    .all()
  )
  return [TopicResponse(id=r.id, name=r.name, is_active=r.is_active, knowledge_count=int(r.knowledge_count or 0)) for r in rows]


@router.patch('/topics/{topic_id}', response_model=TopicResponse)
def update_topic(topic_id: int, payload: TopicUpdate, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  topic = db.query(BrainTopic).filter(BrainTopic.id == topic_id, BrainTopic.user_id == user.id).first()
  if not topic:
    raise HTTPException(status_code=404, detail='Topico nao encontrado')
  if payload.name is not None:
    topic.name = payload.name.strip()
  if payload.is_active is not None:
    topic.is_active = payload.is_active
  db.commit()
  count = db.query(func.count(BrainKnowledgeItem.id)).filter(BrainKnowledgeItem.topic_id == topic.id).scalar() or 0
  return TopicResponse(id=topic.id, name=topic.name, is_active=topic.is_active, knowledge_count=int(count))


@router.delete('/topics/{topic_id}', status_code=204)
def delete_topic(topic_id: int, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  topic = db.query(BrainTopic).filter(BrainTopic.id == topic_id, BrainTopic.user_id == user.id).first()
  if not topic:
    raise HTTPException(status_code=404, detail='Topico nao encontrado')
  db.delete(topic)
  db.commit()


@router.post('/topics/{topic_id}/knowledge', response_model=KnowledgeResponse, status_code=201)
def create_knowledge(topic_id: int, payload: KnowledgeCreate, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  topic = db.query(BrainTopic).filter(BrainTopic.id == topic_id, BrainTopic.user_id == user.id).first()
  if not topic:
    raise HTTPException(status_code=404, detail='Topico nao encontrado')

  item = BrainKnowledgeItem(
    topic_id=topic.id,
    question=payload.question.strip(),
    expected_answer=payload.expected_answer.strip(),
    category=payload.category.strip(),
    difficulty=payload.difficulty.strip(),
    notes_optional=(payload.notes_optional or '').strip() or None,
    advanced_mode_enabled=payload.advanced_mode_enabled,
  )
  db.add(item)
  db.commit()
  db.refresh(item)

  policy = _get_or_create_policy(db, user.id)
  _ensure_card_state(db, item.id)
  _schedule_event_if_missing(db, item, policy)

  state = db.query(BrainCardState).filter(BrainCardState.knowledge_item_id == item.id).first()
  return KnowledgeResponse(
    id=item.id,
    topic_id=item.topic_id,
    question=item.question,
    expected_answer=item.expected_answer,
    category=item.category,
    difficulty=item.difficulty,
    notes_optional=item.notes_optional,
    advanced_mode_enabled=item.advanced_mode_enabled,
    is_active=item.is_active,
    next_review_at=state.next_review_at if state else None,
  )


@router.get('/topics/{topic_id}/knowledge', response_model=list[KnowledgeResponse])
def list_knowledge(topic_id: int, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  topic = db.query(BrainTopic).filter(BrainTopic.id == topic_id, BrainTopic.user_id == user.id).first()
  if not topic:
    raise HTTPException(status_code=404, detail='Topico nao encontrado')

  items = db.query(BrainKnowledgeItem).filter(BrainKnowledgeItem.topic_id == topic.id).order_by(BrainKnowledgeItem.created_at.desc()).all()
  state_map = {
    s.knowledge_item_id: s
    for s in db.query(BrainCardState).filter(BrainCardState.knowledge_item_id.in_([i.id for i in items] or [0])).all()
  }
  return [
    KnowledgeResponse(
      id=i.id,
      topic_id=i.topic_id,
      question=i.question,
      expected_answer=i.expected_answer,
      category=i.category,
      difficulty=i.difficulty,
      notes_optional=i.notes_optional,
      advanced_mode_enabled=i.advanced_mode_enabled,
      is_active=i.is_active,
      next_review_at=state_map.get(i.id).next_review_at if state_map.get(i.id) else None,
    )
    for i in items
  ]


@router.patch('/knowledge/{knowledge_id}', response_model=KnowledgeResponse)
def update_knowledge(knowledge_id: int, payload: KnowledgeUpdate, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  item = (
    db.query(BrainKnowledgeItem)
    .join(BrainTopic, BrainTopic.id == BrainKnowledgeItem.topic_id)
    .filter(BrainKnowledgeItem.id == knowledge_id, BrainTopic.user_id == user.id)
    .first()
  )
  if not item:
    raise HTTPException(status_code=404, detail='Conhecimento nao encontrado')

  if payload.question is not None:
    item.question = payload.question.strip()
  if payload.expected_answer is not None:
    item.expected_answer = payload.expected_answer.strip()
  if payload.category is not None:
    item.category = payload.category.strip()
  if payload.difficulty is not None:
    item.difficulty = payload.difficulty.strip()
  if payload.notes_optional is not None:
    item.notes_optional = payload.notes_optional.strip() or None
  if payload.advanced_mode_enabled is not None:
    item.advanced_mode_enabled = payload.advanced_mode_enabled
  if payload.is_active is not None:
    item.is_active = payload.is_active

  db.commit()
  state = _ensure_card_state(db, item.id)
  return KnowledgeResponse(
    id=item.id,
    topic_id=item.topic_id,
    question=item.question,
    expected_answer=item.expected_answer,
    category=item.category,
    difficulty=item.difficulty,
    notes_optional=item.notes_optional,
    advanced_mode_enabled=item.advanced_mode_enabled,
    is_active=item.is_active,
    next_review_at=state.next_review_at,
  )


@router.delete('/knowledge/{knowledge_id}', status_code=204)
def delete_knowledge(knowledge_id: int, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  item = (
    db.query(BrainKnowledgeItem)
    .join(BrainTopic, BrainTopic.id == BrainKnowledgeItem.topic_id)
    .filter(BrainKnowledgeItem.id == knowledge_id, BrainTopic.user_id == user.id)
    .first()
  )
  if not item:
    raise HTTPException(status_code=404, detail='Conhecimento nao encontrado')
  db.delete(item)
  db.commit()


@router.put('/policy', response_model=PolicyResponse)
def upsert_policy(payload: PolicyUpdate, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  policy = _get_or_create_policy(db, user.id)
  policy.mode = BrainReviewMode(payload.mode)
  policy.frequency_preset = BrainFrequencyPreset(payload.frequency_preset)
  policy.custom_minutes = payload.custom_minutes
  policy.allowed_start_time = payload.allowed_start_time
  policy.allowed_end_time = payload.allowed_end_time
  policy.timezone = payload.timezone
  db.commit()
  return PolicyResponse(
    mode=policy.mode.value,
    frequency_preset=policy.frequency_preset.value,
    custom_minutes=policy.custom_minutes,
    allowed_start_time=policy.allowed_start_time,
    allowed_end_time=policy.allowed_end_time,
    timezone=policy.timezone,
  )


@router.get('/policy', response_model=PolicyResponse)
def get_policy(db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  policy = _get_or_create_policy(db, user.id)
  return PolicyResponse(
    mode=policy.mode.value,
    frequency_preset=policy.frequency_preset.value,
    custom_minutes=policy.custom_minutes,
    allowed_start_time=policy.allowed_start_time,
    allowed_end_time=policy.allowed_end_time,
    timezone=policy.timezone,
  )


@router.get('/reviews/today', response_model=ReviewTodayResponse)
def review_today(db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  now = datetime.utcnow()
  start = now.replace(hour=0, minute=0, second=0, microsecond=0)
  end = start + timedelta(days=1)

  topic_ids = [t.id for t in db.query(BrainTopic.id).filter(BrainTopic.user_id == user.id, BrainTopic.is_active == True).all()]
  knowledge_ids = [k.id for k in db.query(BrainKnowledgeItem.id).filter(BrainKnowledgeItem.topic_id.in_(topic_ids or [0]), BrainKnowledgeItem.is_active == True).all()]

  pending_count = (
    db.query(func.count(BrainReviewEvent.id))
    .filter(
      BrainReviewEvent.knowledge_item_id.in_(knowledge_ids or [0]),
      BrainReviewEvent.status.in_([BrainReviewEventStatus.pending, BrainReviewEventStatus.snoozed]),
      BrainReviewEvent.scheduled_at >= start,
      BrainReviewEvent.scheduled_at < end,
    )
    .scalar()
    or 0
  )

  next_event = (
    db.query(BrainReviewEvent)
    .filter(
      BrainReviewEvent.knowledge_item_id.in_(knowledge_ids or [0]),
      BrainReviewEvent.status.in_([BrainReviewEventStatus.pending, BrainReviewEventStatus.snoozed]),
    )
    .order_by(BrainReviewEvent.scheduled_at.asc())
    .first()
  )

  attempts_today = (
    db.query(BrainReviewAttempt)
    .join(BrainReviewEvent, BrainReviewEvent.id == BrainReviewAttempt.review_event_id)
    .filter(
      BrainReviewEvent.knowledge_item_id.in_(knowledge_ids or [0]),
      BrainReviewAttempt.answered_at >= start,
      BrainReviewAttempt.answered_at < end,
    )
    .all()
  )
  if not attempts_today:
    accuracy = 0.0
  else:
    hits = sum(1 for a in attempts_today if a.ai_grade == BrainResult.correct)
    accuracy = round((hits / len(attempts_today)) * 100, 2)

  return ReviewTodayResponse(
    pending_count=int(pending_count),
    next_review_at=next_event.scheduled_at if next_event else None,
    accuracy_today=accuracy,
  )


@router.get('/reviews/due', response_model=list[ReviewEventResponse])
def due_reviews(limit: int = 1, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  policy = _get_or_create_policy(db, user.id)

  topics = db.query(BrainTopic).filter(BrainTopic.user_id == user.id, BrainTopic.is_active == True).all()
  for topic in topics:
    for item in topic.knowledge_items:
      if item.is_active:
        _schedule_event_if_missing(db, item, policy)

  topic_ids = [t.id for t in topics]
  knowledge_ids = [k.id for k in db.query(BrainKnowledgeItem.id).filter(BrainKnowledgeItem.topic_id.in_(topic_ids or [0]), BrainKnowledgeItem.is_active == True).all()]

  now = datetime.utcnow()
  events = (
    db.query(BrainReviewEvent)
    .filter(
      BrainReviewEvent.knowledge_item_id.in_(knowledge_ids or [0]),
      BrainReviewEvent.status.in_([BrainReviewEventStatus.pending, BrainReviewEventStatus.snoozed]),
      BrainReviewEvent.scheduled_at <= now,
    )
    .order_by(BrainReviewEvent.scheduled_at.asc())
    .limit(max(1, min(10, limit)))
    .all()
  )
  return [_build_event_response(e) for e in events]


@router.post('/review/now', response_model=ReviewEventResponse)
def review_now(topic: str | None = None, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  policy = _get_or_create_policy(db, user.id)

  query = db.query(BrainTopic).filter(BrainTopic.user_id == user.id, BrainTopic.is_active == True)
  if topic:
    query = query.filter(func.lower(BrainTopic.name) == topic.lower())
  topics = query.all()
  if not topics:
    raise HTTPException(status_code=404, detail='Nenhum topico ativo para revisao')

  for t in topics:
    for item in t.knowledge_items:
      if item.is_active:
        state = _ensure_card_state(db, item.id)
        state.next_review_at = datetime.utcnow()
  db.commit()

  first_item = next((k for t in topics for k in t.knowledge_items if k.is_active), None)
  if not first_item:
    raise HTTPException(status_code=404, detail='Nenhum conhecimento ativo para revisao')

  event = _schedule_event_if_missing(db, first_item, policy)
  event.scheduled_at = datetime.utcnow()
  db.commit()
  db.refresh(event)
  return _build_event_response(event)


@router.post('/reviews/{event_id}/answer', response_model=AnswerResponse)
def answer_review(event_id: int, payload: AnswerRequest, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  event = (
    db.query(BrainReviewEvent)
    .join(BrainKnowledgeItem, BrainKnowledgeItem.id == BrainReviewEvent.knowledge_item_id)
    .join(BrainTopic, BrainTopic.id == BrainKnowledgeItem.topic_id)
    .filter(BrainReviewEvent.id == event_id, BrainTopic.user_id == user.id)
    .first()
  )
  if not event:
    raise HTTPException(status_code=404, detail='Evento de revisao nao encontrado')

  item = event.knowledge_item
  policy = _get_or_create_policy(db, user.id)
  state = _ensure_card_state(db, item.id)

  result, score, feedback = evaluate_answer(item.expected_answer, payload.answer_text)
  now = datetime.utcnow()
  min_minutes = preset_to_minutes(policy.frequency_preset, policy.custom_minutes)

  next_step = compute_next_step(state.step_index, result)
  raw_next = next_review_time(now, next_step, min_minutes, result)
  adjusted_next = move_to_allowed_window(raw_next, policy.allowed_start_time, policy.allowed_end_time)

  state.step_index = next_step
  state.success_streak = state.success_streak + 1 if result == BrainResult.correct else 0
  state.last_result = result
  state.last_review_at = now
  state.next_review_at = adjusted_next

  event.status = BrainReviewEventStatus.validated
  event.answered_at = now

  attempt = BrainReviewAttempt(
    review_event_id=event.id,
    user_answer_text=payload.answer_text,
    ai_grade=result,
    ai_score=score,
    ai_feedback=feedback,
    expected_answer_snapshot=item.expected_answer,
    answered_at=now,
  )
  db.add(attempt)

  next_delivery = policy.mode
  if next_delivery == BrainReviewMode.hybrid:
    next_delivery = BrainReviewMode.voice if event.delivery_mode == BrainReviewMode.text else BrainReviewMode.text

  next_question = item.question
  if item.advanced_mode_enabled:
    next_question = generate_advanced_question(item.question, item.category)

  next_event = BrainReviewEvent(
    knowledge_item_id=item.id,
    scheduled_at=adjusted_next,
    status=BrainReviewEventStatus.pending,
    delivery_mode=next_delivery,
    generated_question=next_question,
  )
  db.add(next_event)
  db.commit()

  return AnswerResponse(
    result=result.value,
    score=score,
    feedback=f'{feedback} Proxima revisao em {adjusted_next.strftime("%H:%M")}.',
    next_review_at=adjusted_next,
  )


@router.post('/reviews/{event_id}/answer-audio', response_model=AnswerResponse)
async def answer_review_audio(event_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
  transcript = await transcribe_audio(await file.read())
  if not transcript:
    raise HTTPException(status_code=400, detail='Nao foi possivel transcrever o audio')
  return answer_review(event_id, AnswerRequest(answer_text=transcript), db)


@router.post('/reviews/{event_id}/snooze', response_model=ReviewEventResponse)
def snooze_review(event_id: int, payload: SnoozeRequest, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  event = (
    db.query(BrainReviewEvent)
    .join(BrainKnowledgeItem, BrainKnowledgeItem.id == BrainReviewEvent.knowledge_item_id)
    .join(BrainTopic, BrainTopic.id == BrainKnowledgeItem.topic_id)
    .filter(BrainReviewEvent.id == event_id, BrainTopic.user_id == user.id)
    .first()
  )
  if not event:
    raise HTTPException(status_code=404, detail='Evento de revisao nao encontrado')

  event.status = BrainReviewEventStatus.snoozed
  event.scheduled_at = datetime.utcnow() + timedelta(minutes=payload.minutes)
  db.commit()
  db.refresh(event)
  return _build_event_response(event)


@router.post('/reviews/{event_id}/repeat', response_model=ReviewEventResponse)
def repeat_review(event_id: int, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  event = (
    db.query(BrainReviewEvent)
    .join(BrainKnowledgeItem, BrainKnowledgeItem.id == BrainReviewEvent.knowledge_item_id)
    .join(BrainTopic, BrainTopic.id == BrainKnowledgeItem.topic_id)
    .filter(BrainReviewEvent.id == event_id, BrainTopic.user_id == user.id)
    .first()
  )
  if not event:
    raise HTTPException(status_code=404, detail='Evento de revisao nao encontrado')
  event.status = BrainReviewEventStatus.pending
  event.scheduled_at = datetime.utcnow()
  db.commit()
  db.refresh(event)
  return _build_event_response(event)


@router.get('/stats/overview', response_model=StatsOverviewResponse)
def stats_overview(db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  topic_ids = [t.id for t in db.query(BrainTopic.id).filter(BrainTopic.user_id == user.id).all()]
  knowledge_ids = [k.id for k in db.query(BrainKnowledgeItem.id).filter(BrainKnowledgeItem.topic_id.in_(topic_ids or [0])).all()]

  attempts = (
    db.query(BrainReviewAttempt)
    .join(BrainReviewEvent, BrainReviewEvent.id == BrainReviewAttempt.review_event_id)
    .filter(BrainReviewEvent.knowledge_item_id.in_(knowledge_ids or [0]))
    .all()
  )

  total = len(attempts)
  hits = sum(1 for a in attempts if a.ai_grade == BrainResult.correct)
  misses = sum(1 for a in attempts if a.ai_grade == BrainResult.wrong)
  accuracy = round((hits / total) * 100, 2) if total else 0.0

  topic_rows = (
    db.query(BrainTopic.name, BrainReviewAttempt.ai_grade, func.count(BrainReviewAttempt.id).label('qty'))
    .join(BrainKnowledgeItem, BrainKnowledgeItem.topic_id == BrainTopic.id)
    .join(BrainReviewEvent, BrainReviewEvent.knowledge_item_id == BrainKnowledgeItem.id)
    .join(BrainReviewAttempt, BrainReviewAttempt.review_event_id == BrainReviewEvent.id)
    .filter(BrainTopic.user_id == user.id)
    .group_by(BrainTopic.name, BrainReviewAttempt.ai_grade)
    .all()
  )

  score_map: dict[str, dict[str, int]] = {}
  for row in topic_rows:
    base = score_map.setdefault(row.name, {'correct': 0, 'wrong': 0, 'total': 0})
    base['total'] += int(row.qty)
    if row.ai_grade == BrainResult.correct:
      base['correct'] += int(row.qty)
    if row.ai_grade == BrainResult.wrong:
      base['wrong'] += int(row.qty)

  strongest = None
  weakest = None
  strongest_rate = -1.0
  weakest_rate = 101.0
  for topic_name, values in score_map.items():
    rate = (values['correct'] / values['total']) * 100 if values['total'] else 0.0
    if rate > strongest_rate:
      strongest_rate = rate
      strongest = topic_name
    if rate < weakest_rate:
      weakest_rate = rate
      weakest = topic_name

  return StatsOverviewResponse(
    total_questions=total,
    hits=hits,
    misses=misses,
    accuracy_rate=accuracy,
    strongest_topic=strongest,
    weakest_topic=weakest,
  )


@router.get('/stats/recent-errors', response_model=list[RecentErrorResponse])
def recent_errors(db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  rows = (
    db.query(BrainReviewAttempt, BrainReviewEvent, BrainKnowledgeItem, BrainTopic)
    .join(BrainReviewEvent, BrainReviewEvent.id == BrainReviewAttempt.review_event_id)
    .join(BrainKnowledgeItem, BrainKnowledgeItem.id == BrainReviewEvent.knowledge_item_id)
    .join(BrainTopic, BrainTopic.id == BrainKnowledgeItem.topic_id)
    .filter(BrainTopic.user_id == user.id, BrainReviewAttempt.ai_grade.in_([BrainResult.wrong, BrainResult.partial]))
    .order_by(BrainReviewAttempt.answered_at.desc())
    .limit(30)
    .all()
  )

  return [
    RecentErrorResponse(
      review_event_id=e.id,
      question=e.generated_question or k.question,
      user_answer=a.user_answer_text,
      expected_answer=a.expected_answer_snapshot,
      result=a.ai_grade.value,
      answered_at=a.answered_at,
    )
    for (a, e, k, _t) in rows
  ]


@router.post('/intent', response_model=CarinneIntentResponse)
def carinne_intent(payload: CarinneIntentRequest, db: Session = Depends(get_db)):
  command = (payload.command or '').strip().lower()

  if 'revisar agora' in command:
    event = review_now(db=db)
    return CarinneIntentResponse(intent='REVISAR_AGORA', message='Revisao iniciada agora.', payload=event.model_dump())

  if 'o que eu errei hoje' in command or 'errei hoje' in command:
    errors = recent_errors(db=db)
    summary = 'Voce nao errou nenhuma revisao recente.' if not errors else f'Voce teve {len(errors[:5])} erros recentes.'
    return CarinneIntentResponse(intent='CONSULTAR_ERROS_HOJE', message=summary, payload={'errors': [e.model_dump() for e in errors[:5]]})

  if 'iniciar revisao de' in command:
    topic_name = command.split('iniciar revisao de')[-1].strip()
    event = review_now(topic=topic_name, db=db)
    return CarinneIntentResponse(intent='INICIAR_REVISAO_TOPICO', message=f'Revisao de {topic_name} iniciada.', payload=event.model_dump())

  if 'adiar revisao' in command:
    match = re.sub(r'[^0-9]', '', command)
    minutes = 15
    try:
      minutes = int(match) if match else 15
    except Exception:
      minutes = 15
    due = due_reviews(limit=1, db=db)
    if not due:
      return CarinneIntentResponse(intent='ADIAR_REVISAO', message='Nao ha revisao pendente para adiar.', payload={})
    postponed = snooze_review(due[0].event_id, SnoozeRequest(minutes=minutes), db=db)
    return CarinneIntentResponse(intent='ADIAR_REVISAO', message=f'Revisao adiada por {minutes} minutos.', payload=postponed.model_dump())

  if 'repetir pergunta' in command:
    due = due_reviews(limit=1, db=db)
    if due:
      return CarinneIntentResponse(intent='REPETIR_PERGUNTA', message=due[0].question, payload=due[0].model_dump())
    return CarinneIntentResponse(intent='REPETIR_PERGUNTA', message='Nao existe pergunta pendente agora.', payload={})

  return CarinneIntentResponse(intent='UNKNOWN', message='Comando nao reconhecido para o modulo Treinar Cerebro.', payload={})
