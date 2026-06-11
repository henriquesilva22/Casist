'use client'
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Check } from 'lucide-react'
import { useLifeStore } from '../../lib/store'

const COLORS = [
  { id: 'cyan', label: 'Ciano', border: 'border-cyan-500' },
  { id: 'amber', label: 'Âmbar', border: 'border-amber-500' },
  { id: 'violet', label: 'Violeta', border: 'border-violet-500' },
  { id: 'emerald', label: 'Esmeralda', border: 'border-emerald-500' },
]

export default function CardPostits() {
  const postits = useLifeStore((s: any) => s.postits)
  const addPostit = useLifeStore((s: any) => s.addPostit)
  const updatePostit = useLifeStore((s: any) => s.updatePostit)
  const deletePostit = useLifeStore((s: any) => s.deletePostit)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState(3)
  const [color, setColor] = useState('cyan')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const colorBorder = (c: string) => COLORS.find((x) => x.id === c)?.border || 'border-cyan-500'

  const handleCreate = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await addPostit(title.trim(), priority, color)
      setTitle('')
      setPriority(3)
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (p: { id: string; title: string }) => {
    setEditingId(p.id)
    setEditTitle(p.title)
  }

  const handleSaveEdit = async (id: string) => {
    if (!editTitle.trim()) return
    setSaving(true)
    try {
      await updatePostit(id, { title: editTitle.trim() })
      setEditingId(null)
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async (id: string) => {
    await updatePostit(id, { completed: true })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl">
      <h3 className="text-lg font-semibold">Post-its (Tarefas Vivas)</h3>

      <div className="mt-3 flex flex-wrap gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nova tarefa..." className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
        <select value={priority} onChange={(e) => setPriority(Number(e.target.value))} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>P{n}</option>)}
        </select>
        <select value={color} onChange={(e) => setColor(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
          {COLORS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <button onClick={handleCreate} disabled={saving || !title.trim()} className="inline-flex items-center gap-1 rounded-xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">
          <Plus size={16} /> Adicionar
        </button>
      </div>

      <ul className="mt-3 space-y-2">
        {postits.length ? postits.map((p: any) => (
          <li key={p.id} className={`rounded-2xl border-l-4 ${colorBorder(p.color)} bg-slate-950 p-3`}>
            {editingId === p.id ? (
              <div className="flex gap-2">
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm" autoFocus />
                <button onClick={() => handleSaveEdit(p.id)} className="rounded-lg bg-cyan-500 px-2 py-1 text-xs font-semibold text-slate-950">Salvar</button>
                <button onClick={() => setEditingId(null)} className="rounded-lg border border-slate-700 px-2 py-1 text-xs">Cancelar</button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">{p.title}</div>
                  <div className="text-xs text-slate-400">Prioridade: {p.priority}</div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => handleComplete(p.id)} title="Concluir" className="rounded-lg p-1.5 text-emerald-400 hover:bg-slate-800"><Check size={14} /></button>
                  <button onClick={() => startEdit(p)} title="Editar" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800"><Pencil size={14} /></button>
                  <button onClick={() => deletePostit(p.id)} title="Excluir" className="rounded-lg p-1.5 text-red-400 hover:bg-slate-800"><Trash2 size={14} /></button>
                </div>
              </div>
            )}
          </li>
        )) : (
          <li className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-3 text-sm text-slate-400">Sem tarefas ainda. Crie a primeira entrada acima.</li>
        )}
      </ul>
    </motion.div>
  )
}
