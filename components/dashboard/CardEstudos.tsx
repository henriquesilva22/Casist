'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { useLifeStore } from '../../lib/store'

export default function CardEstudos() {
  const estudos = useLifeStore((s: any) => s.estudos)
  const subject = estudos.current.subject?.trim() || 'Nenhum foco definido'
  const pending = estudos.flashcardsPending.length ? estudos.flashcardsPending : ['Adicione seu primeiro tópico de estudo']
  return <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl"><div className="flex items-center gap-2 text-slate-100"><BookOpen size={18} className="text-cyan-300" /><h3 className="text-lg font-semibold">Estudos & Treinar Cérebro</h3></div><div className="mt-3 text-sm text-slate-400">Foco Principal</div><div className="font-medium">{subject}</div><ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-300">{pending.map((f: string) => <li key={f}>{f}</li>)}</ul></motion.div>
}
