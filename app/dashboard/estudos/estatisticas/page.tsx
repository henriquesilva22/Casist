'use client'

import React, { useEffect, useState } from 'react'
import DashboardShell from '../../../../components/layout/DashboardShell'
import { brainApi, ReviewStats } from '../../../../lib/brain-api'

export default function EstudosEstatisticasPage() {
  const [stats, setStats] = useState<ReviewStats | null>(null)

  useEffect(() => {
    brainApi.statsOverview().then(setStats).catch(() => null)
  }, [])

  return (
    <DashboardShell subtitle="Estatisticas completas do Treinar Cerebro.">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs text-slate-500">Total de perguntas</p><p className="text-2xl font-semibold">{stats?.total_questions ?? 0}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs text-slate-500">Acertos</p><p className="text-2xl font-semibold text-emerald-300">{stats?.hits ?? 0}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs text-slate-500">Erros</p><p className="text-2xl font-semibold text-rose-300">{stats?.misses ?? 0}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs text-slate-500">Taxa de acerto</p><p className="text-2xl font-semibold">{Math.round(stats?.accuracy_rate ?? 0)}%</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs text-slate-500">Topico mais forte</p><p className="text-lg font-semibold">{stats?.strongest_topic || '---'}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs text-slate-500">Topico mais fraco</p><p className="text-lg font-semibold">{stats?.weakest_topic || '---'}</p></div>
      </section>
    </DashboardShell>
  )
}
