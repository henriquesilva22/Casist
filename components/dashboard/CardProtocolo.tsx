'use client'
import React, { useState } from 'react'
import { motion } from 'framer-motion'

export default function CardProtocolo({ title = '', day = 0, totalDays = 0, mission = '' }: { title?: string; day?: number; totalDays?: number; mission?: string }) {
  const [completed, setCompleted] = useState(false)
  const progress = totalDays > 0 ? Math.round((day / totalDays) * 100) : 0
  return <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl"><h3 className="text-lg font-semibold">{title || 'Protocolo'}</h3><div className="mt-2 text-sm text-slate-400">{totalDays > 0 ? `Progresso: Dia ${day} de ${totalDays}` : 'Adicione um protocolo para começar'}</div><div className="mt-3 h-3 rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${progress}%` }} /></div><div className="mt-2 text-sm">{mission ? `Missão de Hoje: ${mission}` : 'Nenhuma missão definida'}</div><button onClick={() => setCompleted(true)} className="mt-4 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950">Concluir Missão do Dia</button>{completed && <div className="mt-3 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-200">Missão concluída! 🎉</div>}</motion.div>
}
