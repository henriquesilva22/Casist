'use client'

import React, { useEffect, useMemo, useState } from 'react'
import DayFichaCard from '../../../components/academia/DayFichaCard'
import SelectableOptionCard from '../../../components/academia/SelectableOptionCard'
import WorkoutHistoryCard from '../../../components/academia/WorkoutHistoryCard'
import DashboardShell from '../../../components/layout/DashboardShell'
import BottomSheet from '../../../components/wallet/BottomSheet'
import DetailModal from '../../../components/wallet/DetailModal'
import EmptyState from '../../../components/wallet/EmptyState'
import {
  EXERCISE_LIBRARY,
  FITNESS_OBJECTIVES,
  MUSCLE_GROUPS,
  RoutineDayPlan,
  TodayWorkoutStatus,
  WEEK_LABEL,
  WEEK_ORDER,
  WeekdayKey,
  WorkoutHistoryEntry,
  dateToWeekday,
  defaultWeeklyFicha,
  groupsToLabel,
  lastCompletedForWorkout,
  loadHistory,
  loadRoutine,
  markTodayCompleted,
  markTodaySkipped,
  nextPlannedWorkout,
  postponeToday,
  saveRoutine,
  todayPlan,
  todayWorkoutStatus,
} from '../../../lib/academia-routine'

const MAIN_FICHA_DAYS: WeekdayKey[] = ['segunda', 'terca', 'quarta', 'quinta', 'sexta']

type DetailKey = 'ficha' | 'today' | 'history' | 'carinne' | null

function unique(items: string[]) {
  return Array.from(new Set(items))
}

function createEmptyPlan(day: WeekdayKey): RoutineDayPlan {
  const defaults = defaultWeeklyFicha()[day]
  if (defaults) return defaults
  return {
    workoutName: `Treino de ${WEEK_LABEL[day]}`,
    muscleGroup: '',
    muscleGroups: [],
    exercises: [],
    estimatedDuration: 45,
    defaultEffort: 'Medio',
    notes: '',
    fitnessObjective: 'Hipertrofia',
  }
}

function statusLabel(status: TodayWorkoutStatus) {
  if (status === 'pending') return 'pendente'
  if (status === 'completed') return 'concluido'
  if (status === 'skipped') return 'pulado'
  return 'adiado'
}

function statusStyle(status: TodayWorkoutStatus) {
  if (status === 'completed') return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
  if (status === 'skipped') return 'border-rose-400/40 bg-rose-500/10 text-rose-200'
  if (status === 'postponed') return 'border-amber-400/40 bg-amber-500/10 text-amber-200'
  return 'border-slate-600 bg-slate-800 text-slate-200'
}

function shortDate(dateISO: string) {
  return new Date(dateISO).toLocaleDateString('pt-BR')
}

export default function AcademiaPage() {
  const [routine, setRoutine] = useState(defaultWeeklyFicha())
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([])
  const [feedback, setFeedback] = useState('')

  const [activeDetail, setActiveDetail] = useState<DetailKey>(null)
  const [editingDay, setEditingDay] = useState<WeekdayKey>('segunda')
  const [editor, setEditor] = useState<RoutineDayPlan>(createEmptyPlan('segunda'))

  const [durationReal, setDurationReal] = useState('45')
  const [effortReal, setEffortReal] = useState('Medio')
  const [postponeDate, setPostponeDate] = useState('')

  const [customExerciseInput, setCustomExerciseInput] = useState('')
  const [clientNow, setClientNow] = useState<Date | null>(null)

  const stableNow = useMemo(() => {
    // Keep SSR and first client render deterministic; switch to real client time after mount.
    return clientNow || new Date('2000-01-03T12:00:00')
  }, [clientNow])

  const load = () => {
    const routineData = loadRoutine()
    const historyData = loadHistory()
    setRoutine(routineData)
    setHistory(historyData)
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    setClientNow(new Date())
  }, [])

  useEffect(() => {
    const current = routine[editingDay]
    setEditor(current ? { ...current, muscleGroups: [...(current.muscleGroups || [])], exercises: [...current.exercises] } : createEmptyPlan(editingDay))
  }, [editingDay, routine])

  const today = useMemo(() => todayPlan(routine, stableNow), [routine, stableNow])
  const todayStatus = useMemo(() => todayWorkoutStatus(stableNow), [history, routine, stableNow])
  const todayWeekday = dateToWeekday(stableNow)

  const lastDone = useMemo(() => {
    if (!today.plan) return null
    return lastCompletedForWorkout(today.plan.workoutName)
  }, [today.plan, history])

  const nextWorkout = useMemo(() => nextPlannedWorkout(routine, stableNow), [routine, history, stableNow])

  const selectedExerciseSuggestions = useMemo(() => {
    const options = editor.muscleGroups.flatMap((group) => EXERCISE_LIBRARY[group] || [])
    return unique(options)
  }, [editor.muscleGroups])

  const carinneSuggestion = useMemo(() => {
    if (!today.plan) return 'Hoje esta livre. Que tal mobilidade leve ou cardio curto para manter constancia?'
    if (todayStatus === 'pending') return `Seu treino de ${groupsToLabel(today.plan.muscleGroups || [])} esta pendente. Comece com o exercicio principal para ganhar tracao.`
    if (todayStatus === 'completed') return 'Treino concluido. Foque em hidratar e priorizar recuperacao para o proximo dia.'
    if (todayStatus === 'skipped') return 'Hoje foi pulado. Reorganize amanha com treino mais curto para manter o habito.'
    return 'Treino adiado. Mantenha o compromisso na nova data para evitar acumulacao.'
  }, [today.plan, todayStatus])

  const openFichaEditor = (day: WeekdayKey) => {
    setEditingDay(day)
    setActiveDetail('ficha')
  }

  const saveDay = () => {
    if (!editor.muscleGroups.length) {
      setFeedback('Selecione pelo menos um grupo muscular.')
      return
    }
    if (!editor.exercises.length) {
      setFeedback('Selecione ao menos um exercicio para montar a ficha.')
      return
    }
    const muscleGroup = groupsToLabel(editor.muscleGroups)
    const workoutName = editor.workoutName.trim() || `Treino de ${muscleGroup}`
    const updatedRoutine = {
      ...routine,
      [editingDay]: {
        ...editor,
        workoutName,
        muscleGroup,
        muscleGroups: unique(editor.muscleGroups),
        exercises: unique(editor.exercises),
        notes: editor.notes.trim(),
      },
    }
    setRoutine(updatedRoutine)
    saveRoutine(updatedRoutine)
    setFeedback(`Ficha de ${WEEK_LABEL[editingDay]} atualizada.`)
    setActiveDetail(null)
  }

  const removeDay = () => {
    const updated = { ...routine, [editingDay]: null }
    setRoutine(updated)
    saveRoutine(updated)
    setFeedback(`Treino de ${WEEK_LABEL[editingDay]} removido.`)
    setActiveDetail(null)
  }

  const toggleMuscleGroup = (group: string) => {
    setEditor((prev) => {
      const exists = prev.muscleGroups.includes(group)
      const next = exists ? prev.muscleGroups.filter((g) => g !== group) : [...prev.muscleGroups, group]
      return {
        ...prev,
        muscleGroups: next,
        muscleGroup: groupsToLabel(next),
        workoutName: next.length ? `Treino de ${groupsToLabel(next)}` : prev.workoutName,
      }
    })
  }

  const toggleExercise = (exercise: string) => {
    setEditor((prev) => {
      const exists = prev.exercises.includes(exercise)
      return {
        ...prev,
        exercises: exists ? prev.exercises.filter((x) => x !== exercise) : [...prev.exercises, exercise],
      }
    })
  }

  const completeToday = () => {
    const result = markTodayCompleted({ durationReal: Number(durationReal) || 45, effortReal })
    setFeedback(result.message)
    load()
  }

  const skipToday = () => {
    const result = markTodaySkipped()
    setFeedback(result.message)
    load()
  }

  const postponeToDate = (toISO?: string) => {
    const dateISO = toISO || (() => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow.toISOString()
    })()
    const result = postponeToday(dateISO)
    setFeedback(result.message)
    load()
  }

  const detailTitle: Record<Exclude<DetailKey, null>, string> = {
    ficha: `Minha Ficha - ${WEEK_LABEL[editingDay]}`,
    today: 'Treino de Hoje',
    history: 'Historico de Treinos',
    carinne: 'Consultoria da Carinne',
  }

  const renderDetail = () => {
    if (!activeDetail) return null

    if (activeDetail === 'ficha') {
      return (
        <div className="space-y-4 pb-2">
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
            {MUSCLE_GROUPS.map((group) => (
              <SelectableOptionCard key={group} label={group} selected={editor.muscleGroups.includes(group)} onClick={() => toggleMuscleGroup(group)} />
            ))}
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Objetivo fitness</p>
            <div className="mt-2 grid gap-2 grid-cols-2 sm:grid-cols-3">
              {FITNESS_OBJECTIVES.map((goal) => (
                <SelectableOptionCard
                  key={goal}
                  label={goal}
                  selected={editor.fitnessObjective === goal}
                  onClick={() => setEditor((prev) => ({ ...prev, fitnessObjective: goal }))}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Exercicios sugeridos</p>
            <div className="mt-2 grid gap-2 grid-cols-2 sm:grid-cols-3">
              {selectedExerciseSuggestions.map((exercise) => (
                <SelectableOptionCard
                  key={exercise}
                  label={exercise}
                  selected={editor.exercises.includes(exercise)}
                  onClick={() => toggleExercise(exercise)}
                />
              ))}
              {!selectedExerciseSuggestions.length && <EmptyState title="Selecione grupos musculares" description="As sugestoes de exercicios aparecem aqui automaticamente." />}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Exercicio personalizado</p>
            <div className="mt-2 flex gap-2">
              <input
                value={customExerciseInput}
                onChange={(e) => setCustomExerciseInput(e.target.value)}
                placeholder="Digite o exercicio"
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              />
              <button
                onClick={() => {
                  if (!customExerciseInput.trim()) return
                  toggleExercise(customExerciseInput.trim())
                  setCustomExerciseInput('')
                }}
                className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-100"
              >
                Adicionar
              </button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={editor.workoutName}
              onChange={(e) => setEditor((prev) => ({ ...prev, workoutName: e.target.value }))}
              placeholder="Nome da ficha"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={editor.estimatedDuration}
              onChange={(e) => setEditor((prev) => ({ ...prev, estimatedDuration: Number(e.target.value) || 45 }))}
              placeholder="Duracao estimada"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
          </div>

          <textarea
            value={editor.notes}
            onChange={(e) => setEditor((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Observacoes da ficha"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />

          <div className="flex flex-wrap gap-2">
            <button onClick={saveDay} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">Salvar ficha</button>
            <button onClick={removeDay} className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">Remover dia</button>
          </div>
        </div>
      )
    }

    if (activeDetail === 'today') {
      return (
        <div className="space-y-3">
          {today.plan ? (
            <>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <p className="text-lg font-semibold text-slate-100">{today.plan.workoutName}</p>
                <p className="text-sm text-slate-300">Grupo muscular: {groupsToLabel(today.plan.muscleGroups || [])}</p>
                <p className="text-sm text-slate-300">Duracao estimada: {today.plan.estimatedDuration} min</p>
                <p className="text-sm text-slate-300">Ultima vez: {lastDone ? new Date(lastDone.dateISO).toLocaleString('pt-BR') : 'Nunca'}</p>
                <p className="text-sm text-slate-300">Proximo treino: {nextWorkout ? `${WEEK_LABEL[nextWorkout.weekday]} (em ${nextWorkout.daysUntil} dia(s))` : 'Sem proximo treino definido'}</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Exercicios</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-200">
                  {today.plan.exercises.map((exercise) => <li key={exercise}>{exercise}</li>)}
                </ul>
              </div>
            </>
          ) : (
            <EmptyState title="Sem treino hoje" description="Edite sua ficha semanal para preencher o treino do dia." />
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <input value={durationReal} onChange={(e) => setDurationReal(e.target.value)} placeholder="Duracao real" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
            <select value={effortReal} onChange={(e) => setEffortReal(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
              {['Leve', 'Medio', 'Pesado', 'Falha'].map((effort) => <option key={effort}>{effort}</option>)}
            </select>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button onClick={() => setFeedback('Treino iniciado.')} className="rounded-xl border border-slate-700 px-3 py-2 text-sm">Iniciar</button>
            <button onClick={completeToday} className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950">Concluir</button>
            <button onClick={skipToday} className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">Pular</button>
            <button onClick={() => postponeToDate()} className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">Adiar</button>
            <button onClick={() => openFichaEditor(todayWeekday)} className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100 sm:col-span-2">Trocar treino de hoje</button>
          </div>

          <div className="flex gap-2">
            <input type="date" value={postponeDate} onChange={(e) => setPostponeDate(e.target.value)} className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
            <button
              onClick={() => {
                if (!postponeDate) return
                postponeToDate(new Date(`${postponeDate}T12:00:00`).toISOString())
              }}
              className="rounded-xl border border-slate-700 px-3 py-2 text-sm"
            >
              Adiar para data
            </button>
          </div>
        </div>
      )
    }

    if (activeDetail === 'history') {
      return (
        <div className="space-y-2">
          {history.slice(0, 30).map((h) => (
            <WorkoutHistoryCard
              key={h.id}
              dateLabel={`${new Date(h.dateISO).toLocaleString('pt-BR')} · ${WEEK_LABEL[h.weekday]}`}
              workoutName={h.workoutName}
              statusLabel={h.status === 'completed' ? 'concluido' : h.status === 'skipped' ? 'pulado' : 'adiado'}
              statusTone={h.status}
              meta={`Duracao: ${h.durationReal} min · Esforco: ${h.effortReal}`}
            />
          ))}
          {!history.length && <EmptyState title="Sem historico" description="Conclua ou marque treinos para criar historico visual." />}
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">{carinneSuggestion}</div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-200">
          Comandos aceitos: treino de hoje, treino completo, ja treinei, pulei o treino, adia para amanha, hoje treinei costas, muda meu treino de segunda para peito, adicione supino no treino de segunda.
        </div>
      </div>
    )
  }

  return (
    <DashboardShell subtitle="Ficha inteligente de treino mobile: leitura rapida no topo, edicao detalhada so ao tocar.">
      <section className="space-y-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Treino de hoje</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-100">{WEEK_LABEL[todayWeekday]} · {today.plan ? groupsToLabel(today.plan.muscleGroups || []) : 'Descanso'}</h2>
              <p className="mt-1 text-sm text-slate-300">{today.plan ? `${today.plan.exercises.length} exercicios · ${today.plan.estimatedDuration} min` : 'Sem ficha planejada para hoje'}</p>
              {today.plan?.exercises?.length ? <p className="mt-1 text-xs text-slate-400">Exercicios: {today.plan.exercises.slice(0, 3).join(' · ')}</p> : null}
              <p className="mt-1 text-xs text-slate-400">Ultima vez: {lastDone ? shortDate(lastDone.dateISO) : 'Nunca'} · Proximo: {nextWorkout ? WEEK_LABEL[nextWorkout.weekday] : '---'}</p>
            </div>
            <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusStyle(todayStatus)}`}>{statusLabel(todayStatus)}</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            <button onClick={() => setFeedback('Treino iniciado.')} className="rounded-xl border border-slate-700 px-2 py-2 text-xs">Iniciar</button>
            <button onClick={completeToday} className="rounded-xl bg-emerald-500 px-2 py-2 text-xs font-semibold text-slate-950">Concluir</button>
            <button onClick={skipToday} className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-2 py-2 text-xs text-rose-200">Pular</button>
            <button onClick={() => postponeToDate()} className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-2 py-2 text-xs text-amber-200">Adiar</button>
            <button onClick={() => openFichaEditor(todayWeekday)} className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-2 py-2 text-xs text-cyan-100">Trocar</button>
          </div>

          <button onClick={() => setActiveDetail('today')} className="mt-3 text-xs font-semibold text-cyan-300">Abrir ficha completa</button>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-100">Minha Ficha</h3>
            <button onClick={() => setActiveDetail('ficha')} className="text-xs font-semibold text-cyan-300">Editar</button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {MAIN_FICHA_DAYS.map((day) => (
              <DayFichaCard
                key={day}
                dayLabel={WEEK_LABEL[day]}
                workoutLabel={routine[day] ? groupsToLabel(routine[day]!.muscleGroups || []) : 'Sem treino'}
                isToday={day === todayWeekday}
                onClick={() => openFichaEditor(day)}
              />
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-100">Historico recente</h3>
            <button onClick={() => setActiveDetail('history')} className="text-xs font-semibold text-cyan-300">Ver tudo</button>
          </div>
          <div className="space-y-2">
            {history.slice(0, 4).map((h) => (
              <WorkoutHistoryCard
                key={h.id}
                dateLabel={`${shortDate(h.dateISO)} · ${WEEK_LABEL[h.weekday]}`}
                workoutName={h.workoutName}
                statusLabel={h.status === 'completed' ? 'concluido' : h.status === 'skipped' ? 'pulado' : 'adiado'}
                statusTone={h.status}
                meta={`${h.durationReal} min · ${h.effortReal}`}
              />
            ))}
            {!history.length && <EmptyState title="Sem historico ainda" description="Registre os treinos para acompanhar sua evolucao." />}
          </div>
        </div>

        <button onClick={() => setActiveDetail('carinne')} className="w-full rounded-3xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-left shadow-xl">
          <p className="text-xs uppercase tracking-[0.14em] text-cyan-200">Sugestao da Carinne</p>
          <p className="mt-2 text-sm font-semibold text-cyan-100">{carinneSuggestion}</p>
          <p className="mt-2 text-xs text-cyan-200">Toque para abrir consultoria completa</p>
        </button>

        {feedback && <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-slate-200">{feedback}</div>}
      </section>

      <BottomSheet open={Boolean(activeDetail)} title={activeDetail ? detailTitle[activeDetail] : ''} onClose={() => setActiveDetail(null)}>
        {renderDetail()}
      </BottomSheet>
      <DetailModal open={Boolean(activeDetail)} title={activeDetail ? detailTitle[activeDetail] : ''} onClose={() => setActiveDetail(null)}>
        {renderDetail()}
      </DetailModal>
    </DashboardShell>
  )
}
