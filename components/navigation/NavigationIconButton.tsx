'use client'

import React from 'react'

type NavigationIconButtonProps = {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick?: () => void
}

export default function NavigationIconButton({ icon, label, active = false, onClick }: NavigationIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`group inline-flex h-12 w-12 items-center justify-center rounded-2xl border text-base font-semibold transition duration-200 md:h-12 md:w-auto md:min-w-[52px] md:gap-2 md:px-3 lg:h-14 lg:min-w-[60px] lg:px-4 ${
        active
          ? 'scale-[1.03] border-cyan-400/70 bg-cyan-500/25 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.35),0_8px_24px_rgba(34,211,238,0.25)]'
          : 'border-slate-700 bg-slate-950/80 text-slate-200 hover:border-slate-500 hover:bg-slate-900'
      }`}
    >
      <span aria-hidden="true" className="text-lg leading-none lg:text-xl">{icon}</span>
      <span className="hidden text-xs md:inline lg:text-sm">{label}</span>
    </button>
  )
}
