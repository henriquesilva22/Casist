'use client'
import React from 'react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDownLeft, PlusCircle, Wallet } from 'lucide-react'
import { useLifeStore } from '../../lib/store'

export default function CardCarteira() {
  const carteira = useLifeStore((s: any) => s.carteira)
  const setSaldoTotal = useLifeStore((s: any) => s.setSaldoTotal)
  const registrarGasto = useLifeStore((s: any) => s.registrarGasto)
  const [saldoInput, setSaldoInput] = useState('')
  const [gastoInput, setGastoInput] = useState('')
  const [mode, setMode] = useState<null | 'adicionar' | 'gastar'>(null)
  return <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl"><div className="flex items-center gap-2 text-slate-100"><Wallet size={18} className="text-cyan-300" /><h3 className="text-lg font-semibold">Carteira</h3></div><div className="mt-2 text-sm text-slate-400">Saldo Total</div><div className="text-3xl font-bold">R$ {carteira.saldoTotal.toFixed(2)}</div><div className="mt-1 text-xs text-slate-500">Saldo livre diário: R$ {carteira.saldoLivre.toFixed(2)}</div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => setMode(mode === 'adicionar' ? null : 'adicionar')} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${mode === 'adicionar' ? 'bg-cyan-500 text-slate-950' : 'border border-slate-700 text-slate-100'}`}><PlusCircle size={16} />Adicionar</button><button onClick={() => setMode(mode === 'gastar' ? null : 'gastar')} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${mode === 'gastar' ? 'bg-rose-500 text-slate-950' : 'border border-slate-700 text-slate-100'}`}><ArrowDownLeft size={16} />Gastar</button><button className="rounded-lg border border-slate-700 px-3 py-2 text-sm">Posso comprar?</button></div>{mode === 'adicionar' && <div className="mt-3 flex gap-2"><input value={saldoInput} onChange={(e) => setSaldoInput(e.target.value)} placeholder="Valor a adicionar" className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none" /><button onClick={() => { setSaldoTotal(Number(saldoInput) || 0); setSaldoInput(''); setMode(null) }} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">OK</button></div>}{mode === 'gastar' && <div className="mt-3 flex gap-2"><input value={gastoInput} onChange={(e) => setGastoInput(e.target.value)} placeholder="Valor do gasto" className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none" /><button onClick={() => { registrarGasto(Number(gastoInput) || 0); setGastoInput(''); setMode(null) }} className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-slate-950">OK</button></div>}</motion.div>
}
