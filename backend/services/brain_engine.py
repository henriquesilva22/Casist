from __future__ import annotations

from datetime import datetime, timedelta
import random
import re
from typing import Tuple

from ..models.core import BrainFrequencyPreset, BrainResult

SPACED_STEPS_MINUTES = [60, 180, 360, 720, 1440, 4320, 10080]


def preset_to_minutes(preset: BrainFrequencyPreset, custom_minutes: int) -> int:
  if preset == BrainFrequencyPreset.m30:
    return 30
  if preset == BrainFrequencyPreset.h1:
    return 60
  if preset == BrainFrequencyPreset.h3:
    return 180
  if preset == BrainFrequencyPreset.h6:
    return 360
  if preset == BrainFrequencyPreset.daily:
    return 1440
  return max(5, custom_minutes)


def normalize_text(value: str) -> str:
  base = (value or '').lower().strip()
  base = re.sub(r'[^a-z0-9\sà-úçãõâêîôû-]', ' ', base)
  base = re.sub(r'\s+', ' ', base)
  return base


def evaluate_answer(expected: str, user_answer: str) -> Tuple[BrainResult, int, str]:
  expected_norm = normalize_text(expected)
  answer_norm = normalize_text(user_answer)
  if not answer_norm:
    return (BrainResult.wrong, 0, 'Não consegui identificar sua resposta.')

  expected_words = {w for w in expected_norm.split(' ') if len(w) > 2}
  answer_words = {w for w in answer_norm.split(' ') if len(w) > 2}

  if not expected_words:
    return (BrainResult.partial, 60, 'Resposta recebida. Vou reforçar esse conhecimento em breve.')

  overlap = len(expected_words.intersection(answer_words))
  ratio = overlap / max(1, len(expected_words))
  score = int(min(100, max(0, ratio * 100)))

  if score >= 85:
    return (BrainResult.correct, score, 'Correto. Excelente retenção desse conteúdo.')
  if score >= 55:
    return (BrainResult.partial, score, 'Você acertou parcialmente. Vamos reforçar os pontos que faltaram.')
  return (BrainResult.wrong, score, 'Resposta incorreta. Vamos revisar novamente para consolidar.')


def compute_next_step(current_step: int, result: BrainResult) -> int:
  if result == BrainResult.correct:
    return min(len(SPACED_STEPS_MINUTES) - 1, current_step + 1)
  if result == BrainResult.wrong:
    return max(0, current_step - 1)
  return current_step


def next_review_time(now: datetime, next_step: int, minimum_minutes: int, result: BrainResult) -> datetime:
  step_minutes = SPACED_STEPS_MINUTES[next_step]
  if result == BrainResult.partial:
    minutes = min(step_minutes, 60)
  else:
    minutes = max(step_minutes, minimum_minutes)
  return now + timedelta(minutes=minutes)


def move_to_allowed_window(target: datetime, start_hhmm: str, end_hhmm: str) -> datetime:
  try:
    start_hour, start_min = [int(x) for x in start_hhmm.split(':')]
    end_hour, end_min = [int(x) for x in end_hhmm.split(':')]
  except Exception:
    return target

  start = target.replace(hour=start_hour, minute=start_min, second=0, microsecond=0)
  end = target.replace(hour=end_hour, minute=end_min, second=0, microsecond=0)

  if end <= start:
    return target

  if target < start:
    return start
  if target > end:
    next_day = (target + timedelta(days=1)).replace(hour=start_hour, minute=start_min, second=0, microsecond=0)
    return next_day
  return target


def generate_advanced_question(base_question: str, category: str) -> str:
  normalized_category = (category or '').lower().strip()

  if normalized_category in ('programacao', 'programação', 'matematica', 'matemática'):
    choices = [
      f'De um exemplo pratico: {base_question}',
      f'Aplique esse conceito em um caso real: {base_question}',
      f'Explique de outra forma, de modo objetivo: {base_question}',
    ]
    return random.choice(choices)

  return base_question
