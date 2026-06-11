'use client'
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mic } from 'lucide-react'

export default function ActiveBrainSession({ onComplete }: { onComplete?: () => void }) {
  const [listening, setListening] = useState(false)
  const [feedback, setFeedback] = useState('')
  const start = () => { setListening(true); setFeedback('') }
  const stop = () => { setListening(false); setFeedback('Resposta Correta! Próxima revisão em 6h'); onComplete?.() }
  return <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"><div className="w-full max-w-3xl rounded-3xl border border-slate-700 bg-slate-900 p-8"><div className="text-center"><h2 className="text-2xl font-semibold">Treinar Cérebro — Sessão Ativa</h2><p className="mt-2 text-sm text-slate-400">Pressione e fale a resposta</p></div><div className="mt-6 rounded-2xl border border-slate-700 bg-slate-800 p-6 text-lg">No Método Simplex, se a variável X1 entrar na base com valor 4, qual o impacto na função objetivo Z = 3X1 + 5X2?</div><div className="mt-8 flex flex-col items-center gap-4"><motion.button onMouseDown={start} onMouseUp={stop} onTouchStart={start} onTouchEnd={stop} animate={listening ? { scale: [1, 1.06, 1] } : { scale: 1 }} transition={{ repeat: listening ? Infinity : 0, duration: 1 }} className="flex h-32 w-32 items-center justify-center rounded-full bg-rose-500 text-white shadow-2xl"><Mic size={40} /></motion.button>{listening && <div className="text-sm text-emerald-400">Ouvindo...</div>}{feedback && <div className="text-sm text-slate-200">{feedback}</div>}</div></div></div>
}
