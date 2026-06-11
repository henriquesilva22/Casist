'use client'

import React from 'react'

type MetricCardProps = {
  label: string
  value: string
  tone?: 'default' | 'good' | 'warn' | 'bad'
}

const TONE_STYLE: Record<NonNullable<MetricCardProps['tone']>, string> = {
  default: 'border-slate-800 bg-slate-950 text-slate-100',
  good: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100',
  warn: 'border-amber-400/30 bg-amber-500/10 text-amber-100',
  bad: 'border-rose-400/30 bg-rose-500/10 text-rose-100',
}

export default function MetricCard({ label, value, tone = 'default' }: MetricCardProps) {
  return (
    <div className={`rounded-2xl border p-3 ${TONE_STYLE[tone]}`}>
      <p className="text-xs uppercase tracking-[0.14em] opacity-80">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  )
}
