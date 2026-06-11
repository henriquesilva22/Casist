'use client'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { initialMockState } from './mocks'
import { request } from './api'
import type { Postit, LifeEvent, EspelhoData } from './types'

function mapPostit(p: { id: number; title: string; priority: number; color: string; completed?: boolean }): Postit {
  return { id: String(p.id), title: p.title, priority: p.priority, color: p.color, completed: p.completed }
}

function mapEvent(e: { id: number; title: string; event_date: string; category: string; notification_sound: string; reminder_days: number }): LifeEvent {
  return { id: String(e.id), title: e.title, eventDate: e.event_date, category: e.category, notificationSound: e.notification_sound, reminderDays: e.reminder_days }
}

export const useLifeStore = create<any>()(
  devtools((set) => ({
    ...initialMockState,
    aiName: 'Carinne',
    setUserName: (name: string) => set((state: any) => ({ user: { ...state.user, name } })),
    setAiName: (name: string) => set({ aiName: name }),
    setSaldoTotal: (valor: number) => set((state: any) => ({ carteira: { ...state.carteira, saldoTotal: Math.max(0, valor) } })),
    setBattery: (v: number) => set((state: any) => ({ user: { ...state.user, battery: v } })),
    setMMR: (v: number) => set((state: any) => ({ mmr: { ...state.mmr, value: v } })),
    updateMotorSuggestion: (s: string) => set((state: any) => ({ motor: { ...state.motor, suggestion: s } })),
    registrarGasto: async (valor: number) => {
      try { await request('/api/v1/carinne/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `gastei ${valor}`, user_id: null }) }) } catch {}
      set((state: any) => ({ carteira: { ...state.carteira, saldoLivre: Math.max(0, state.carteira.saldoLivre - valor), saldoTotal: Math.max(0, state.carteira.saldoTotal - valor) } }))
    },
    registrarTreino: (esforco: 'Alto' | 'Moderado' | 'Baixo') => set((state: any) => ({ user: { ...state.user, battery: esforco === 'Alto' ? Math.max(0, Math.round(state.user.battery * 0.85)) : state.user.battery } })),
    recalcularMMR: (tarefasConcluidas: number, totalTarefas: number) => set((state: any) => ({ mmr: { ...state.mmr, value: Math.max(0, state.mmr.value + Math.round(((tarefasConcluidas / Math.max(1, totalTarefas)) - 0.5) * 100)) } })),
    registrarEstudoStatus: () => {},
    fetchUserStatus: async () => {
      try {
        const data = await request('/api/v1/user/status')
        set((state: any) => ({ mmr: { ...state.mmr, value: data.mmr }, user: { ...state.user, battery: data.bateria_pessoal }, carteira: { ...state.carteira, saldoLivre: data.saldo_livre_diario ?? state.carteira.saldoLivre } }))
      } catch {}
    },
    fetchPostits: async () => {
      try {
        const data = await request('/api/v1/postits')
        set({ postits: data.map(mapPostit) })
      } catch {}
    },
    addPostit: async (title: string, priority: number, color: string) => {
      const data = await request('/api/v1/postits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, priority, color }) })
      set((state: any) => ({ postits: [...state.postits, mapPostit(data)] }))
    },
    updatePostit: async (id: string, updates: Partial<{ title: string; priority: number; color: string; completed: boolean }>) => {
      const data = await request(`/api/v1/postits/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) })
      if (updates.completed) {
        set((state: any) => ({ postits: state.postits.filter((p: Postit) => p.id !== id) }))
      } else {
        set((state: any) => ({ postits: state.postits.map((p: Postit) => (p.id === id ? mapPostit(data) : p)) }))
      }
    },
    deletePostit: async (id: string) => {
      await request(`/api/v1/postits/${id}`, { method: 'DELETE' })
      set((state: any) => ({ postits: state.postits.filter((p: Postit) => p.id !== id) }))
    },
    fetchEvents: async () => {
      try {
        const data = await request('/api/v1/events')
        set({ events: data.map(mapEvent) })
      } catch {}
    },
    addEvent: async (payload: { title: string; eventDate: string; category: string; notificationSound: string; reminderDays: number }) => {
      const data = await request('/api/v1/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: payload.title, event_date: payload.eventDate, category: payload.category, notification_sound: payload.notificationSound, reminder_days: payload.reminderDays }),
      })
      set((state: any) => ({ events: [...state.events, mapEvent(data)].sort((a: LifeEvent, b: LifeEvent) => a.eventDate.localeCompare(b.eventDate)) }))
    },
    updateEvent: async (id: string, updates: Partial<{ title: string; eventDate: string; category: string; notificationSound: string; reminderDays: number }>) => {
      const body: Record<string, unknown> = {}
      if (updates.title !== undefined) body.title = updates.title
      if (updates.eventDate !== undefined) body.event_date = updates.eventDate
      if (updates.category !== undefined) body.category = updates.category
      if (updates.notificationSound !== undefined) body.notification_sound = updates.notificationSound
      if (updates.reminderDays !== undefined) body.reminder_days = updates.reminderDays
      const data = await request(`/api/v1/events/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      set((state: any) => ({ events: state.events.map((e: LifeEvent) => (e.id === id ? mapEvent(data) : e)).sort((a: LifeEvent, b: LifeEvent) => a.eventDate.localeCompare(b.eventDate)) }))
    },
    deleteEvent: async (id: string) => {
      await request(`/api/v1/events/${id}`, { method: 'DELETE' })
      set((state: any) => ({ events: state.events.filter((e: LifeEvent) => e.id !== id) }))
    },
    fetchEspelho: async () => {
      try {
        const data = await request('/api/v1/mirror/yesterday')
        const espelho: EspelhoData = { studied: data.studied, trained: data.trained || [], spent: data.spent, hasData: data.has_data }
        set({ espelho })
      } catch {}
    },
    hydrateDashboard: async () => {
      const store = useLifeStore.getState()
      await Promise.all([store.fetchUserStatus(), store.fetchPostits(), store.fetchEvents(), store.fetchEspelho()])
    },
  }))
)
