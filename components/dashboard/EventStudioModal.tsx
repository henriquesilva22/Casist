'use client'
import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Mic } from 'lucide-react'
import { useLifeStore } from '../../lib/store'
import { BASE_URL, authHeaders } from '../../lib/api'
import type { LifeEvent } from '../../lib/types'

export default function EventStudioModal({ isOpen, onClose, editingEvent }: { isOpen: boolean; onClose: () => void; editingEvent?: LifeEvent | null }) {
  const addEvent = useLifeStore((s: any) => s.addEvent)
  const updateEvent = useLifeStore((s: any) => s.updateEvent)
  const [title, setTitle] = useState('')
  const [listeningTitle, setListeningTitle] = useState(false)
  const titleRecorderRef = useRef<MediaRecorder | null>(null)
  const titleChunksRef = useRef<Blob[]>([])
  const [date, setDate] = useState('')
  const [category, setCategory] = useState('Meta')
  const [customCategory, setCustomCategory] = useState('')
  const [categoryMode, setCategoryMode] = useState<'select' | 'custom'>('select')
  const [sound, setSound] = useState('Sino Suave')
  const [days, setDays] = useState(7)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    if (editingEvent) {
      setTitle(editingEvent.title)
      setDate(editingEvent.eventDate.slice(0, 10))
      setCategory(editingEvent.category)
      setCustomCategory('')
      setCategoryMode('select')
      setSound(editingEvent.notificationSound)
      setDays(editingEvent.reminderDays)
    } else {
      setTitle('')
      setDate('')
      setCategory('Meta')
      setCustomCategory('')
      setCategoryMode('select')
      setSound('Sino Suave')
      setDays(7)
    }
    setError('')
  }, [isOpen, editingEvent])

  const handleSave = async () => {
    if (!title.trim() || !date) {
      setError('Preencha título e data.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const finalCategory = categoryMode === 'custom' && customCategory.trim() ? customCategory.trim() : category
      const eventDate = new Date(`${date}T12:00:00`).toISOString()
      if (editingEvent) {
        await updateEvent(editingEvent.id, { title: title.trim(), eventDate, category: finalCategory, notificationSound: sound, reminderDays: days })
      } else {
        await addEvent({ title: title.trim(), eventDate, category: finalCategory, notificationSound: sound, reminderDays: days })
      }
      onClose()
    } catch {
      setError('Não foi possível salvar. Verifique se o backend está online.')
    } finally {
      setSaving(false)
    }
  }

  const startVoiceTitle = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      titleChunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size) titleChunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        const blob = new Blob(titleChunksRef.current, { type: 'audio/webm' })
        const form = new FormData()
        form.append('file', blob, 'title.webm')
        try {
          const res = await fetch(`${BASE_URL}/api/v1/voice/command`, { method: 'POST', body: form, headers: authHeaders() })
          const data = await res.json()
          if (data.transcript) setTitle(data.transcript)
        } catch {}
        stream.getTracks().forEach((t) => t.stop())
        setListeningTitle(false)
      }
      titleRecorderRef.current = recorder
      recorder.start()
      setListeningTitle(true)
    } catch {}
  }
  const stopVoiceTitle = () => { titleRecorderRef.current?.stop() }

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h2 className="text-2xl font-semibold">{editingEvent ? 'Editar Evento' : 'Estúdio de Eventos'}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2 flex gap-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do evento" className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3" />
            <motion.button type="button" onMouseDown={startVoiceTitle} onMouseUp={stopVoiceTitle} onTouchStart={startVoiceTitle} onTouchEnd={stopVoiceTitle} animate={listeningTitle ? { scale: [1, 1.1, 1] } : { scale: 1 }} transition={{ repeat: listeningTitle ? Infinity : 0, duration: 1 }} className={`rounded-xl p-3 ${listeningTitle ? 'bg-rose-600' : 'bg-rose-500'}`}><Mic size={18} /></motion.button>
          </div>
          <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3" />
          <div className="space-y-2">
            <div className="flex gap-2">
              <button type="button" onClick={() => setCategoryMode('select')} className={`flex-1 rounded-lg py-2 text-xs font-semibold ${categoryMode === 'select' ? 'bg-cyan-500 text-slate-950' : 'border border-slate-700 text-slate-300'}`}>Padrão</button>
              <button type="button" onClick={() => setCategoryMode('custom')} className={`flex-1 rounded-lg py-2 text-xs font-semibold ${categoryMode === 'custom' ? 'bg-cyan-500 text-slate-950' : 'border border-slate-700 text-slate-300'}`}>Personalizada</button>
            </div>
            {categoryMode === 'select' ? (
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3">
                <option>Aniversário</option>
                <option>Meta</option>
                <option>Lançamento</option>
                <option>Compromisso</option>
                <option>Saúde</option>
                <option>Viagem</option>
                <option>Trabalho</option>
              </select>
            ) : (
              <input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Digite a categoria" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none" />
            )}
          </div>
          <select value={sound} onChange={(e) => setSound(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3">
            <option>Sino Suave</option>
            <option>Alarme Tech</option>
            <option>Bateria</option>
          </select>
          <label className="md:col-span-2">
            <div className="flex justify-between text-sm text-slate-300">
              <span>Dias de Antecipação</span>
              <span>{days} dias antes</span>
            </div>
            <input type="range" min={1} max={30} value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-full" />
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-slate-700 px-4 py-3">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar Evento'}</button>
        </div>
      </motion.div>
    </div>
  )
}
