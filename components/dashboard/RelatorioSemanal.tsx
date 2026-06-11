'use client'
import React from 'react'
import { useLifeStore } from '../../lib/store'

export default function RelatorioSemanal() {
  const mmr = useLifeStore((s: any) => s.mmr.value)
  const flashcards = useLifeStore((s: any) => s.flashcards)
  const carteira = useLifeStore((s: any) => s.carteira)
  return <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl"><h3 className="text-lg font-semibold">Relatório Semanal</h3><div className="mt-3 text-sm text-slate-400">MMR da Vida Real</div><div className="text-2xl font-bold">{mmr} <span className="text-sm text-emerald-400">{mmr > 0 ? 'Seu progresso está sendo monitorado' : 'Sem histórico ainda'}</span></div><div className="mt-4 text-sm text-slate-400">Estudos</div><div className="text-sm">Flashcards ativos: {flashcards.active}</div><div className="mt-2 h-3 rounded-full bg-slate-800"><div className="h-full rounded-full bg-rose-500" style={{ width: `${flashcards.active > 0 ? Math.min(100, flashcards.active * 5) : 0}%` }} /></div><div className="mt-4 text-sm text-slate-400">Finanças</div><div className="text-sm">Saldo total: R$ {carteira.saldoTotal.toFixed(2)}</div><div className="mt-4 rounded-2xl bg-slate-950 p-3 text-sm">{carteira.saldoTotal > 0 ? 'Use esse espaço para acompanhar seu ritmo financeiro.' : 'Adicione seus primeiros dados financeiros.'}</div></div>
}
