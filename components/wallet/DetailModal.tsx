'use client'

import React from 'react'
import { X } from 'lucide-react'

type DetailModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}

export default function DetailModal({ open, title, onClose, children }: DetailModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 hidden items-center justify-center p-4 md:flex">
      <button onClick={onClose} aria-label="Fechar" className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          <button onClick={onClose} className="rounded-full border border-slate-700 p-1 text-slate-300">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
