'use client'
import React, { useMemo, useState } from 'react'
import DashboardShell from '../../../components/layout/DashboardShell'
import CardEventos from '../../../components/dashboard/CardEventos'
import EventStudioModal from '../../../components/dashboard/EventStudioModal'
import TimeCapsule from '../../../components/ui/TimeCapsule'
import type { LifeEvent } from '../../../lib/types'
import { useLifeStore } from '../../../lib/store'

export default function AgendaPage() {
  const events = useLifeStore((s: any) => s.events)
  const [eventOpen, setEventOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<LifeEvent | null>(null)

  const nextCapsule = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const upcoming = events
      .filter((e: LifeEvent) => new Date(e.eventDate) >= now)
      .sort((a: LifeEvent, b: LifeEvent) => a.eventDate.localeCompare(b.eventDate))
    if (!upcoming.length) return { title: '', daysUntil: 0, isToday: false }
    const target = new Date(upcoming[0].eventDate)
    target.setHours(0, 0, 0, 0)
    const daysUntil = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return { title: upcoming[0].title, daysUntil, isToday: daysUntil === 0 }
  }, [events])

  return (
    <DashboardShell subtitle="Página de agenda e eventos com edição dedicada.">
      <section className="space-y-6">
        <div className="flex justify-end">
          <button onClick={() => { setEditingEvent(null); setEventOpen(true) }} className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950">Novo evento</button>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <CardEventos onEdit={(event) => { setEditingEvent(event); setEventOpen(true) }} />
          <TimeCapsule title={nextCapsule.title} daysUntil={nextCapsule.daysUntil} isToday={nextCapsule.isToday} />
        </div>
      </section>
      <EventStudioModal isOpen={eventOpen} onClose={() => { setEventOpen(false); setEditingEvent(null) }} editingEvent={editingEvent} />
    </DashboardShell>
  )
}
