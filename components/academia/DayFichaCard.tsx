'use client'

import React from 'react'

type DayFichaCardProps = {
  dayLabel: string
  workoutLabel: string
  isToday?: boolean
  onClick?: () => void
}

export default function DayFichaCard({ dayLabel, workoutLabel, isToday, onClick }: DayFichaCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border p-3 text-left transition ${isToday ? 'border-cyan-400/50 bg-cyan-500/10' : 'border-slate-800 bg-slate-900 hover:border-slate-700'}`}
    >
      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{dayLabel}</p>
      <p className="mt-1 text-sm font-semibold text-slate-100">{workoutLabel}</p>
      <p className="mt-2 text-xs font-semibold text-cyan-300">Editar treino</p>
    </button>
  )
}
