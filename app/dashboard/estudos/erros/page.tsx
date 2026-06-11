'use client'

import React, { useEffect, useState } from 'react'
import DashboardShell from '../../../../components/layout/DashboardShell'
import { brainApi, RecentError } from '../../../../lib/brain-api'

export default function EstudosErrosPage() {
  const [errors, setErrors] = useState<RecentError[]>([])

  useEffect(() => {
    brainApi.recentErrors().then(setErrors).catch(() => null)
  }, [])

  return (
    <DashboardShell subtitle="Erros e respostas parciais recentes.">
      <section className="space-y-3 max-w-5xl">
        {errors.map((item) => (
          <article key={`${item.review_event_id}-${item.answered_at}`} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm font-semibold text-white">Pergunta: {item.question}</p>
            <p className="mt-2 text-sm text-slate-300">Sua resposta: {item.user_answer || 'Sem resposta registrada'}</p>
            <p className="mt-1 text-sm text-cyan-200">Resposta correta: {item.expected_answer}</p>
            <p className="mt-2 text-xs text-slate-500">{new Date(item.answered_at).toLocaleString('pt-BR')} · {item.result}</p>
          </article>
        ))}
        {!errors.length && <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-4 text-sm text-slate-400">Nenhum erro recente encontrado.</div>}
      </section>
    </DashboardShell>
  )
}
