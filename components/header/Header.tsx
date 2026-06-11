'use client'
import React from 'react'
import { BatteryFull } from 'lucide-react'
import { useLifeStore } from '../../lib/store'

export default function Header({ name }: { name: string }) {
  const { dailyProgress, battery } = useLifeStore((s: any) => s.user)
  const displayName = name?.trim() || 'usuário'
  return <header className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur md:flex-row md:items-center md:justify-between"><div><p className="text-sm text-slate-400">Hoje</p><h1 className="text-3xl font-semibold text-slate-50">Hoje, {displayName}</h1><p className="text-sm text-slate-400">Dashboard principal do LifeOS Assistant</p></div><div className="flex items-center gap-6"><div><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Progresso</p><div className="mt-2 h-2 w-48 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${dailyProgress}%` }} /></div></div><div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3"><BatteryFull className="text-amber-400" /><div><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Bateria</p><p className="font-semibold text-slate-100">{battery}%</p></div></div></div></header>
}
