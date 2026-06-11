export type WeekdayKey =
  | 'segunda'
  | 'terca'
  | 'quarta'
  | 'quinta'
  | 'sexta'
  | 'sabado'
  | 'domingo'

export type WorkoutStatus = 'completed' | 'skipped' | 'postponed'
export type TodayWorkoutStatus = WorkoutStatus | 'pending'

export const MUSCLE_GROUPS = ['Peito', 'Costas', 'Biceps', 'Triceps', 'Ombro', 'Perna', 'Abdomen', 'Cardio', 'Full Body']
export const FITNESS_OBJECTIVES = ['Hipertrofia', 'Emagrecimento', 'Forca', 'Condicionamento', 'Saude', 'Personalizado']

export const EXERCISE_LIBRARY: Record<string, string[]> = {
  Peito: ['Supino reto', 'Supino inclinado', 'Crucifixo', 'Crossover'],
  Costas: ['Puxada frontal', 'Remada baixa', 'Remada curvada', 'Pulldown'],
  Biceps: ['Rosca direta', 'Rosca alternada', 'Rosca martelo'],
  Triceps: ['Triceps corda', 'Triceps testa', 'Triceps banco'],
  Perna: ['Agachamento', 'Leg press', 'Cadeira extensora', 'Mesa flexora'],
  Ombro: ['Desenvolvimento', 'Elevacao lateral', 'Elevacao frontal'],
  Abdomen: ['Prancha', 'Abdominal infra', 'Abdominal obliquo'],
  Cardio: ['Esteira', 'Bike', 'Escada'],
  'Full Body': ['Burpee', 'Agachamento com halter', 'Remada com halter'],
}

export interface RoutineDayPlan {
  workoutName: string
  muscleGroup: string
  muscleGroups: string[]
  exercises: string[]
  estimatedDuration: number
  defaultEffort: string
  notes: string
  fitnessObjective?: string
}

export type WeeklyRoutine = Record<WeekdayKey, RoutineDayPlan | null>

export interface WorkoutHistoryEntry {
  id: string
  dateISO: string
  weekday: WeekdayKey
  status: WorkoutStatus
  plannedWorkoutName: string
  workoutName: string
  muscleGroup: string
  exercises: string[]
  durationReal: number
  effortReal: string
  notes?: string
  postponedToISO?: string
}

const ROUTINE_KEY = 'lifeos_academia_routine_v1'
const HISTORY_KEY = 'lifeos_academia_history_v1'

export const WEEK_ORDER: WeekdayKey[] = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo']

export const WEEK_LABEL: Record<WeekdayKey, string> = {
  segunda: 'Segunda',
  terca: 'Terca',
  quarta: 'Quarta',
  quinta: 'Quinta',
  sexta: 'Sexta',
  sabado: 'Sabado',
  domingo: 'Domingo',
}

function normalizeText(v: string) {
  return v
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function titleCase(v: string) {
  return v
    .split(' ')
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
    .join(' ')
}

function unique(items: string[]) {
  return Array.from(new Set(items))
}

function normalizeGroupsFromString(raw: string) {
  const chunks = raw
    .split(/[+,]/g)
    .map((x) => x.trim())
    .filter(Boolean)
  return unique(chunks.map((c) => titleCase(c)))
}

export function groupsToLabel(groups: string[]) {
  return groups.join(' + ')
}

function defaultPlan(groups: string[], exercises: string[], duration = 50): RoutineDayPlan {
  return {
    workoutName: groups.length === 1 ? `Treino de ${groups[0]}` : `Treino de ${groupsToLabel(groups)}`,
    muscleGroup: groupsToLabel(groups),
    muscleGroups: groups,
    exercises,
    estimatedDuration: duration,
    defaultEffort: 'Medio',
    notes: '',
    fitnessObjective: 'Hipertrofia',
  }
}

export function defaultWeeklyFicha(): WeeklyRoutine {
  return {
    segunda: defaultPlan(['Peito', 'Triceps'], ['Supino reto', 'Supino inclinado', 'Triceps corda', 'Triceps testa']),
    terca: defaultPlan(['Costas', 'Biceps'], ['Puxada frontal', 'Remada baixa', 'Rosca direta', 'Rosca martelo']),
    quarta: defaultPlan(['Perna'], ['Agachamento', 'Leg press', 'Cadeira extensora', 'Mesa flexora']),
    quinta: defaultPlan(['Ombro'], ['Desenvolvimento', 'Elevacao lateral', 'Elevacao frontal']),
    sexta: defaultPlan(['Full Body'], ['Burpee', 'Agachamento com halter', 'Remada com halter'], 55),
    sabado: null,
    domingo: null,
  }
}

function normalizePlan(plan: RoutineDayPlan | null): RoutineDayPlan | null {
  if (!plan) return null
  const muscleGroups = plan.muscleGroups && plan.muscleGroups.length ? unique(plan.muscleGroups.map((g) => titleCase(g.trim())).filter(Boolean)) : normalizeGroupsFromString(plan.muscleGroup || '')
  const muscleGroup = muscleGroups.length ? groupsToLabel(muscleGroups) : (plan.muscleGroup || '').trim()
  return {
    ...plan,
    muscleGroup,
    muscleGroups,
    workoutName: plan.workoutName?.trim() || (muscleGroup ? `Treino de ${muscleGroup}` : 'Treino personalizado'),
    exercises: unique((plan.exercises || []).map((e) => e.trim()).filter(Boolean)),
    estimatedDuration: Number(plan.estimatedDuration) || 45,
    defaultEffort: plan.defaultEffort || 'Medio',
    notes: plan.notes || '',
    fitnessObjective: plan.fitnessObjective || 'Hipertrofia',
  }
}

function dayFromText(text: string): WeekdayKey | null {
  const t = normalizeText(text)
  if (t.includes('segunda')) return 'segunda'
  if (t.includes('terca')) return 'terca'
  if (t.includes('quarta')) return 'quarta'
  if (t.includes('quinta')) return 'quinta'
  if (t.includes('sexta')) return 'sexta'
  if (t.includes('sabado')) return 'sabado'
  if (t.includes('domingo')) return 'domingo'
  return null
}

function ensureDefaultRoutineIfNeeded(routine: WeeklyRoutine) {
  const hasAny = WEEK_ORDER.some((k) => routine[k])
  return hasAny ? routine : defaultWeeklyFicha()
}

export function emptyRoutine(): WeeklyRoutine {
  return {
    segunda: null,
    terca: null,
    quarta: null,
    quinta: null,
    sexta: null,
    sabado: null,
    domingo: null,
  }
}

export function dateToWeekday(date: Date): WeekdayKey {
  const d = date.getDay()
  if (d === 1) return 'segunda'
  if (d === 2) return 'terca'
  if (d === 3) return 'quarta'
  if (d === 4) return 'quinta'
  if (d === 5) return 'sexta'
  if (d === 6) return 'sabado'
  return 'domingo'
}

export function loadRoutine(): WeeklyRoutine {
  try {
    const raw = localStorage.getItem(ROUTINE_KEY)
    if (!raw) return defaultWeeklyFicha()
    const parsed = JSON.parse(raw)
    const merged = { ...emptyRoutine(), ...parsed }
    const normalized = WEEK_ORDER.reduce((acc, day) => {
      acc[day] = normalizePlan(merged[day])
      return acc
    }, {} as WeeklyRoutine)
    return ensureDefaultRoutineIfNeeded(normalized)
  } catch {
    return defaultWeeklyFicha()
  }
}

export function saveRoutine(routine: WeeklyRoutine) {
  const normalized = WEEK_ORDER.reduce((acc, day) => {
    acc[day] = normalizePlan(routine[day])
    return acc
  }, {} as WeeklyRoutine)
  localStorage.setItem(ROUTINE_KEY, JSON.stringify(normalized))
}

export function loadHistory(): WorkoutHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveHistory(history: WorkoutHistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

export function addHistoryEntry(entry: WorkoutHistoryEntry) {
  const history = loadHistory()
  saveHistory([entry, ...history].slice(0, 200))
}

export function todayPlan(routine: WeeklyRoutine, now = new Date()) {
  const weekday = dateToWeekday(now)
  return { weekday, plan: routine[weekday] }
}

export function latestHistoryForDay(weekday: WeekdayKey, date = new Date()) {
  const target = date.toISOString().slice(0, 10)
  const history = loadHistory()
  return history.find((h) => h.weekday === weekday && h.dateISO.slice(0, 10) === target) || null
}

export function todayWorkoutStatus(now = new Date()): TodayWorkoutStatus {
  const weekday = dateToWeekday(now)
  const latest = latestHistoryForDay(weekday, now)
  if (!latest) return 'pending'
  return latest.status
}

export function nextPlannedWorkout(routine: WeeklyRoutine, now = new Date()) {
  const currentIdx = WEEK_ORDER.indexOf(dateToWeekday(now))
  for (let offset = 1; offset <= 7; offset += 1) {
    const idx = (currentIdx + offset) % 7
    const key = WEEK_ORDER[idx]
    const plan = routine[key]
    if (plan) {
      return { weekday: key, plan, daysUntil: offset }
    }
  }
  return null
}

export function lastCompletedForWorkout(workoutName: string) {
  const history = loadHistory()
  return history.find((h) => h.status === 'completed' && h.workoutName.toLowerCase() === workoutName.toLowerCase()) || null
}

export function markTodayCompleted(options?: { durationReal?: number; effortReal?: string; muscleGroupOverride?: string; workoutNameOverride?: string }) {
  const routine = loadRoutine()
  const now = new Date()
  const weekday = dateToWeekday(now)
  const plan = routine[weekday]
  if (!plan) return { ok: false, message: 'Nao existe treino planejado para hoje.' }

  const workoutName = options?.workoutNameOverride || plan.workoutName
  const muscleGroup = options?.muscleGroupOverride || plan.muscleGroup || groupsToLabel(plan.muscleGroups || [])

  addHistoryEntry({
    id: `${Date.now()}-${Math.random()}`,
    dateISO: now.toISOString(),
    weekday,
    status: 'completed',
    plannedWorkoutName: plan.workoutName,
    workoutName,
    muscleGroup,
    exercises: [...plan.exercises],
    durationReal: options?.durationReal ?? plan.estimatedDuration,
    effortReal: options?.effortReal ?? plan.defaultEffort,
    notes: plan.notes,
  })

  return { ok: true, message: `Treino de hoje registrado como concluido: ${workoutName}.` }
}

export function markTodaySkipped() {
  const routine = loadRoutine()
  const now = new Date()
  const weekday = dateToWeekday(now)
  const plan = routine[weekday]
  if (!plan) return { ok: false, message: 'Nao existe treino planejado para hoje.' }

  addHistoryEntry({
    id: `${Date.now()}-${Math.random()}`,
    dateISO: now.toISOString(),
    weekday,
    status: 'skipped',
    plannedWorkoutName: plan.workoutName,
    workoutName: plan.workoutName,
    muscleGroup: plan.muscleGroup,
    exercises: [...plan.exercises],
    durationReal: 0,
    effortReal: 'Nao feito',
    notes: plan.notes,
  })

  return { ok: true, message: 'Treino de hoje marcado como nao feito.' }
}

export function postponeToday(toDateISO: string) {
  const routine = loadRoutine()
  const now = new Date()
  const weekday = dateToWeekday(now)
  const plan = routine[weekday]
  if (!plan) return { ok: false, message: 'Nao existe treino planejado para hoje.' }

  addHistoryEntry({
    id: `${Date.now()}-${Math.random()}`,
    dateISO: now.toISOString(),
    weekday,
    status: 'postponed',
    plannedWorkoutName: plan.workoutName,
    workoutName: plan.workoutName,
    muscleGroup: plan.muscleGroup,
    exercises: [...plan.exercises],
    durationReal: 0,
    effortReal: 'Adiado',
    notes: plan.notes,
    postponedToISO: toDateISO,
  })

  return { ok: true, message: 'Treino adiado com sucesso.' }
}

export function handleAcademiaCommand(command: string): { handled: boolean; message: string } {
  const text = normalizeText(command.toLowerCase())

  if (text.includes('treino de hoje')) {
    const routine = loadRoutine()
    const t = todayPlan(routine)
    if (!t.plan) return { handled: true, message: `Hoje (${WEEK_LABEL[t.weekday]}) nao ha treino planejado.` }
    return {
      handled: true,
      message: `Hoje (${WEEK_LABEL[t.weekday]}) seu treino e ${t.plan.workoutName} (${t.plan.muscleGroup}), ${t.plan.estimatedDuration} min.`,
    }
  }

  if (text.includes('treino completo') || text.includes('ja treinei')) {
    const res = markTodayCompleted()
    return { handled: true, message: res.message }
  }

  if (text.includes('pulei o treino')) {
    const res = markTodaySkipped()
    return { handled: true, message: res.message }
  }

  if (text.includes('adia para amanha')) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const res = postponeToday(tomorrow.toISOString())
    return { handled: true, message: res.message }
  }

  const mTodayTrained = text.match(/hoje treinei\s+([a-z\s]+)/)
  if (mTodayTrained) {
    const muscle = mTodayTrained[1].trim()
    const res = markTodayCompleted({ muscleGroupOverride: muscle, workoutNameOverride: `Treino de ${muscle}` })
    return { handled: true, message: res.message }
  }

  const mChangeMonday = text.match(/muda meu treino de segunda para\s+([a-z\s]+)/)
  if (mChangeMonday) {
    const muscle = titleCase(mChangeMonday[1].trim())
    const routine = loadRoutine()
    const current = routine.segunda
    const groups = normalizeGroupsFromString(muscle)
    routine.segunda = {
      workoutName: `Treino de ${groupsToLabel(groups)}`,
      muscleGroup: groupsToLabel(groups),
      muscleGroups: groups,
      exercises: current?.exercises || ['Exercicio principal 1', 'Exercicio principal 2'],
      estimatedDuration: current?.estimatedDuration || 45,
      defaultEffort: current?.defaultEffort || 'Medio',
      notes: current?.notes || '',
      fitnessObjective: current?.fitnessObjective || 'Hipertrofia',
    }
    saveRoutine(routine)
    return { handled: true, message: 'Treino de segunda atualizado com sucesso.' }
  }

  const mAddExercise = text.match(/adicione\s+(.+)\s+no treino de\s+(segunda|terca|quarta|quinta|sexta|sabado|domingo)/)
  if (mAddExercise) {
    const exercise = titleCase(mAddExercise[1].trim())
    const day = dayFromText(mAddExercise[2])
    if (!day) return { handled: true, message: 'Nao consegui identificar o dia do treino.' }
    const routine = loadRoutine()
    const current = routine[day]
    if (!current) {
      routine[day] = defaultPlan(['Full Body'], [exercise], 45)
      saveRoutine(routine)
      return { handled: true, message: `Criei um treino em ${WEEK_LABEL[day]} e adicionei ${exercise}.` }
    }
    const nextExercises = unique([...(current.exercises || []), exercise])
    routine[day] = { ...current, exercises: nextExercises }
    saveRoutine(routine)
    return { handled: true, message: `${exercise} adicionado ao treino de ${WEEK_LABEL[day]}.` }
  }

  return { handled: false, message: '' }
}
