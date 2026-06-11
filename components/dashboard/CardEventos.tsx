'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import { useLifeStore } from '../../lib/store'
import type { LifeEvent } from '../../lib/types'

export default function CardEventos({ onEdit }: { onEdit?: (event: LifeEvent) => void }) {
  const events = useLifeStore((s: any) => s.events)
  const deleteEvent = useLifeStore((s: any) => s.deleteEvent)

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const daysUntil = (iso: string) => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const target = new Date(iso)
    target.setHours(0, 0, 0, 0)
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl">
      <h3 className="text-lg font-semibold">Eventos</h3>
      <ul className="mt-3 space-y-2">
        {events.length ? events.map((e: LifeEvent) => {
          const days = daysUntil(e.eventDate)
          return (
            <li key={e.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">{e.title}</div>
                  <div className="mt-1 text-xs text-slate-400">{formatDate(e.eventDate)} · {e.category}</div>
                  <div className="mt-1 text-xs text-cyan-300">{days === 0 ? 'Hoje' : days > 0 ? `Em ${days} dias` : 'Passou'}</div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {onEdit && <button onClick={() => onEdit(e)} title="Editar" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800"><Pencil size={14} /></button>}
                  <button onClick={() => deleteEvent(e.id)} title="Excluir" className="rounded-lg p-1.5 text-red-400 hover:bg-slate-800"><Trash2 size={14} /></button>
                </div>
              </div>
            </li>
          )
        }) : (
          <li className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-3 text-sm text-slate-400">Nenhum evento cadastrado. Use &quot;Novo Evento&quot; para criar.</li>
        )}
      </ul>
    </motion.div>
  )
}
