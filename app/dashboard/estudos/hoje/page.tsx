'use client'

import React, { useEffect, useState } from 'react'
import DashboardShell from '../../../../components/layout/DashboardShell'
import { brainApi, DueReview, ReviewToday } from '../../../../lib/brain-api'
import ReviewSessionPanel from '../../../../components/brain/ReviewSessionPanel'

export default function EstudosHojePage() {
  const [today, setToday] = useState<ReviewToday | null>(null)
  const [due, setDue] = useState<DueReview | null>(null)

  const load = async () => {
    const [todayData, dueData] = await Promise.all([brainApi.getToday(), brainApi.getDue(1)])
    setToday(todayData)
    setDue(dueData[0] || null)
  }

  useEffect(() => {
    load().catch(() => null)
  }, [])

  return (
    <DashboardShell subtitle="Painel de revisao do dia.">
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Revisoes pendentes</p>
          <p className="mt-1 text-3xl font-semibold">{today?.pending_count ?? 0}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Proxima revisao</p>
          <p className="mt-1 text-3xl font-semibold">{today?.next_review_at ? new Date(today.next_review_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Taxa de acerto</p>
          <p className="mt-1 text-3xl font-semibold text-emerald-300">{Math.round(today?.accuracy_today ?? 0)}%</p>
        </div>
      </section>

      <section className="mt-6 max-w-3xl">
        {due ? (
          <ReviewSessionPanel review={due} onResolved={load} />
        ) : (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">Sem revisoes pendentes agora.</div>
        )}
      </section>
    </DashboardShell>
  )
}
