'use client'

import React from 'react'
import { X } from 'lucide-react'

type BottomSheetProps = {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}

export default function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button onClick={onClose} aria-label="Fechar" className="absolute inset-0 bg-black/60" />
      <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          <button onClick={onClose} className="rounded-full border border-slate-700 p-1 text-slate-300">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
