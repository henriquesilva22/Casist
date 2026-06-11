'use client'

import React from 'react'

type QuickActionButtonProps = {
  label: string
  onClick?: () => void
}

export default function QuickActionButton({ label, onClick }: QuickActionButtonProps) {
  return (
    <button onClick={onClick} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/40 hover:text-cyan-200">
      {label}
    </button>
  )
}
