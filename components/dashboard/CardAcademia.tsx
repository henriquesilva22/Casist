'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { Dumbbell } from 'lucide-react'
import { useLifeStore } from '../../lib/store'

export default function CardAcademia() {
  const academia = useLifeStore((s: any) => s.academia)
  const muscles = academia.today.muscles.length ? academia.today.muscles.join(', ') : 'Sem treino definido'
  const effortLabel = academia.today.effort > 0 ? (academia.today.effort >= 7 ? 'Alto' : 'Moderado') : 'Sem dados'
  return <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl"><div className="flex items-center gap-2 text-slate-100"><Dumbbell size={18} className="text-amber-300" /><h3 className="text-lg font-semibold">Academia</h3></div><div className="mt-2 text-sm text-slate-400">Treino do dia</div><div className="font-medium">{muscles}</div><div className="mt-3 flex items-center gap-2 text-sm"><span className="h-3 w-3 rounded-full bg-amber-400" />Esforço: {effortLabel}</div></motion.div>
}
