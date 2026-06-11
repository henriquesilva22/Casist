'use client'
import React from 'react'
import { motion } from 'framer-motion'

export default function TimeCapsule({ title, daysUntil, isToday = false }: { title: string; daysUntil: number; isToday?: boolean }) {
  const nearing = daysUntil <= 7 && daysUntil > 0
  return <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border p-4 shadow-xl ${isToday ? 'border-cyan-400 bg-cyan-500/10' : nearing ? 'border-violet-400 bg-violet-500/10' : 'border-slate-700 bg-slate-900'}`}><div className="text-xs uppercase tracking-[0.25em] text-slate-400">Cápsula do Tempo</div><h3 className="mt-2 text-xl font-semibold">{title || 'Sem evento agendado'}</h3><p className="mt-2 text-sm text-slate-400">{daysUntil > 0 ? `Faltam ${daysUntil} dias` : 'Sem contagem no momento'}</p>{isToday && <div className="mt-4 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">A cápsula se abriu. Hoje é o dia do evento.</div>}</motion.div>
}
