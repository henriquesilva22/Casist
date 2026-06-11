'use client'
import React, { useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, CalendarClock, Gauge, LogIn, Dumbbell, Eye, FlagTriangleRight, Wallet } from 'lucide-react'
import DashboardShell from '../../components/layout/DashboardShell'
import { useLifeStore } from '../../lib/store'

const screens = [
  { href: '/dashboard/carteira', label: 'Carteira', icon: Wallet },
  { href: '/dashboard/academia', label: 'Academia', icon: Dumbbell },
  { href: '/dashboard/estudos', label: 'Estudos', icon: BookOpen },
  { href: '/dashboard/agenda', label: 'Agenda', icon: CalendarClock },
  { href: '/dashboard/espelho', label: 'Espelho', icon: Eye },
  { href: '/dashboard/prioridades', label: 'Prioridades', icon: FlagTriangleRight },
  { href: '/login', label: 'Login', icon: LogIn },
]

export default function DashboardPage() {
  const user = useLifeStore((s: any) => s.user)
  const carteira = useLifeStore((s: any) => s.carteira)
  const postits = useLifeStore((s: any) => s.postits)
  const events = useLifeStore((s: any) => s.events)

  const nextEvent = useMemo(() => {
    const sorted = [...events].sort((a, b) => a.eventDate.localeCompare(b.eventDate))
    return sorted[0]
  }, [events])

  return (
    <DashboardShell subtitle="" showTabs={false}>
      {/* stats strip inside the page, below header */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Saldo total</div>
          <div className="mt-1 text-xl font-semibold text-white">R$ {carteira.saldoTotal.toFixed(2)}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Bateria</div>
          <div className="mt-1 flex items-center gap-1 text-xl font-semibold text-white"><Gauge size={16} className="text-amber-300" />{user.battery}%</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Prioridades</div>
          <div className="mt-1 text-xl font-semibold text-white">{postits.length} ativas</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Próximo evento</div>
          <div className="mt-1 text-sm font-semibold text-white truncate">{nextEvent ? nextEvent.title : 'Nenhum'}</div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="text-sm uppercase tracking-[0.18em] text-slate-500">Navegação rápida</div>
        <h2 className="mt-2 text-2xl font-semibold text-white">Onde você quer ir?</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {screens.map((a) => {
            const Icon = a.icon
            return (
              <Link key={a.href} href={a.href} className="rounded-2xl border border-slate-700 bg-slate-950 p-4 text-sm font-semibold text-slate-100 transition hover:border-cyan-500/50 hover:bg-slate-800">
                <div className="flex items-center justify-between">
                  <Icon size={16} className="text-cyan-300" />
                  <ArrowRight size={16} className="text-slate-500" />
                </div>
                <div className="mt-3">{a.label}</div>
              </Link>
            )
          })}
        </div>
      </motion.div>
    </DashboardShell>
  )
}
