'use client'
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useLifeStore } from '../../lib/store'

export default function ManualEntryModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const store = useLifeStore()
  const [tab, setTab] = useState<'carteira' | 'academia' | 'estudos'>('carteira')
  const [saldoTotal, setSaldoTotal] = useState('')
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [materia, setMateria] = useState('')
  const [tempo, setTempo] = useState('20')
  const [dificuldade, setDificuldade] = useState(false)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-4 flex gap-2">
          {(['carteira', 'academia', 'estudos'] as const).map((item) => (
            <button key={item} onClick={() => setTab(item)} className={`rounded-lg px-3 py-2 text-sm ${tab === item ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-200'}`}>
              {item}
            </button>
          ))}
        </div>

        {tab === 'carteira' && (
          <div className="space-y-3">
            <input value={saldoTotal} onChange={(e) => setSaldoTotal(e.target.value)} placeholder="Saldo total (R$)" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3" />
            <input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Valor do gasto (R$)" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3" />
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3" />
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { store.setSaldoTotal(Number(saldoTotal) || 0); onClose() }} className="rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950">
                Salvar saldo total
              </button>
              <button onClick={() => { store.registrarGasto(Number(valor) || 0); onClose() }} className="rounded-xl bg-rose-500 px-4 py-3 font-semibold text-slate-950">
                Lançar gasto
              </button>
              <button onClick={onClose} className="rounded-xl bg-slate-800 px-4 py-3 font-semibold text-slate-100">
                Fechar
              </button>
            </div>
          </div>
        )}

        {tab === 'academia' && <div className="text-sm text-slate-300">Formulário de academia pode ser expandido na próxima etapa.</div>}

        {tab === 'estudos' && (
          <div className="space-y-3">
            <input value={materia} onChange={(e) => setMateria(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3" />
            <input value={tempo} onChange={(e) => setTempo(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3" />
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={dificuldade} onChange={(e) => setDificuldade(e.target.checked)} /> Tive dificuldade
            </label>
            <div className="flex gap-2">
              <button onClick={() => { store.registrarEstudoStatus(); onClose() }} className="rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950">
                Salvar Estudo
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
