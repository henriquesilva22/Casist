'use client'

import React from 'react'

type EmptyStateProps = {
  title: string
  description: string
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-4 text-sm text-slate-400">
      <p className="font-semibold text-slate-300">{title}</p>
      <p className="mt-1">{description}</p>
    </div>
  )
}
