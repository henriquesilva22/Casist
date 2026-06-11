'use client'

import React from 'react'
import { Check } from 'lucide-react'

type SelectableOptionCardProps = {
  label: string
  selected: boolean
  onClick?: () => void
}

export default function SelectableOptionCard({ label, selected, onClick }: SelectableOptionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${selected ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100' : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'}`}
    >
      <span className="inline-flex items-center gap-1">
        {selected && <Check size={14} />}
        {label}
      </span>
    </button>
  )
}
