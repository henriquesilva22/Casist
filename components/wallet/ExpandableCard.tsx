'use client'

import React from 'react'
import { ChevronRight } from 'lucide-react'

type ExpandableCardProps = {
  title: string
  lines: string[]
  onClick?: () => void
  actionLabel?: string
}

export default function ExpandableCard({ title, lines, onClick, actionLabel = 'Abrir' }: ExpandableCardProps) {
  return (
    <button onClick={onClick} className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-4 text-left shadow-xl transition hover:border-slate-700 hover:bg-slate-800/70">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{title}</p>
        <ChevronRight size={16} className="text-slate-500" />
      </div>
      <div className="mt-2 space-y-1">
        {lines.slice(0, 3).map((line, idx) => (
          <p key={`${title}-${idx}`} className="text-sm text-slate-200">{line}</p>
        ))}
      </div>
      <p className="mt-3 text-xs font-semibold text-cyan-300">{actionLabel}</p>
    </button>
  )
}
