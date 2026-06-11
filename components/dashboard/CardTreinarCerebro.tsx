'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { useLifeStore } from '../../lib/store'

export default function CardTreinarCerebro() {
  const flashcards = useLifeStore((s: any) => s.flashcards)
  return <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl"><h3 className="text-lg font-semibold">Treinar Cérebro</h3><div className="mt-2 text-sm text-slate-400">Flashcards ativos: {flashcards.active}</div><div className="text-sm">Taxa de acerto: {flashcards.accuracyPercent}%</div>{flashcards.active === 0 && <div className="mt-3 rounded-xl border border-dashed border-slate-700 bg-slate-950 p-3 text-sm text-slate-400">Nenhum flashcard ainda.</div>}</motion.div>
}
