'use client'
import React from 'react'
import { useLifeStore } from '../../lib/store'

export default function EspelhoOntem() {
  const espelho = useLifeStore((s: any) => s.espelho)
  const { studied, trained, spent, hasData } = espelho

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl">
      <h3 className="text-lg font-semibold">Espelho de Ontem</h3>
      <div className="mt-3 space-y-2 text-sm text-slate-300">
        {hasData ? (
          <>
            <div><strong>Estudou:</strong> {studied || 'Sem estudo registrado'}</div>
            <div><strong>Treinou:</strong> {trained.length ? trained.join(', ') : 'Sem treino registrado'}</div>
            <div><strong>Gastou:</strong> {spent > 0 ? `R$ ${spent.toFixed(2)}` : 'Sem gasto registrado'}</div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-3 text-slate-400">Sem histórico de ontem ainda.</div>
        )}
      </div>
      <div className="mt-4 rounded-2xl bg-slate-950 p-3 text-sm text-slate-300">
        {hasData ? 'Revise os dados de ontem para ajustar o dia de hoje.' : 'Quando houver dados, eu mostro o reflexo do dia anterior aqui.'}
      </div>
    </div>
  )
}
