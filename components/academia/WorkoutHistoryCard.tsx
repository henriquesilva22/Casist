'use client'

import React from 'react'

type WorkoutHistoryCardProps = {
  dateLabel: string
  workoutName: string
  statusLabel: string
  statusTone: 'completed' | 'skipped' | 'postponed'
  meta: string
}

const STATUS_STYLE: Record<WorkoutHistoryCardProps['statusTone'], string> = {
  completed: 'bg-emerald-500/20 text-emerald-300',
  skipped: 'bg-rose-500/20 text-rose-300',
  postponed: 'bg-amber-500/20 text-amber-300',
}

export default function WorkoutHistoryCard({ dateLabel, workoutName, statusLabel, statusTone, meta }: WorkoutHistoryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-slate-100">{workoutName}</p>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[statusTone]}`}>{statusLabel}</span>
      </div>
      <p className="mt-1 text-xs text-slate-400">{dateLabel}</p>
      <p className="mt-1 text-slate-300">{meta}</p>
    </div>
  )
}
