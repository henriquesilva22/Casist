from typing import Literal

def calculate_battery_impact(workout_effort: Literal['Leve', 'Medio', 'Pesado', 'Falha'], study_difficulty: Literal['Baixa', 'Media', 'Alta']) -> float:
  impact = 0.0
  if workout_effort in ('Pesado', 'Falha'): impact += 0.15
  elif workout_effort == 'Medio': impact += 0.07
  else: impact += 0.03
  if study_difficulty == 'Alta': impact += 0.10
  elif study_difficulty == 'Media': impact += 0.05
  return max(0.0, 1.0 - min(0.9, impact))

def update_mmr(current_mmr: int, tasks_completed: int, tasks_failed: int) -> int:
  total = max(1, tasks_completed + tasks_failed)
  ratio = tasks_completed / total
  return max(0, current_mmr + int((ratio - 0.5) * 100))
