'use client'

import React from 'react'

type SummaryCardProps = {
  title: string
  value: string
  subtitle?: string
  status?: 'seguro' | 'atencao' | 'critico'
  onClick?: () => void
  actionLabel?: string
}

const STATUS_STYLE: Record<NonNullable<SummaryCardProps['status']>, string> = {
  seguro: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
  atencao: 'border-amber-400/40 bg-amber-500/10 text-amber-200',
  critico: 'border-rose-400/40 bg-rose-500/10 text-rose-200',
}

export default function SummaryCard({ title, value, subtitle, status, onClick, actionLabel = 'Ver detalhes' }: SummaryCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-4 text-left shadow-xl transition hover:border-slate-700 hover:bg-slate-800/70"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{title}</p>
        {status && <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[status]}`}>{status}</span>}
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-100">{value}</p>
      {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      <p className="mt-3 text-xs font-semibold text-cyan-300">{actionLabel}</p>
    </button>
  )
}
