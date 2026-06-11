'use client'

import React, { useEffect, useState } from 'react'
import DashboardShell from '../../../../components/layout/DashboardShell'
import { brainApi, BrainKnowledge } from '../../../../lib/brain-api'

const categories = ['geral', 'programacao', 'matematica', 'idiomas', 'academia']
const difficulties = ['facil', 'medio', 'dificil']

export default function EstudosTopicoPage() {
  const [topicId, setTopicId] = useState(0)
    useEffect(() => {
      if (typeof window === 'undefined') return
      const value = Number(new URLSearchParams(window.location.search).get('id') || 0)
      setTopicId(value)
    }, [])

  const [items, setItems] = useState<BrainKnowledge[]>([])
  const [form, setForm] = useState({ question: '', expected_answer: '', category: 'geral', difficulty: 'medio', notes_optional: '', advanced_mode_enabled: false })

  const load = async () => {
    if (!topicId) return
    const data = await brainApi.listKnowledge(topicId)
    setItems(data)
  }

  useEffect(() => {
    load().catch(() => null)
  }, [topicId])

  return (
    <DashboardShell subtitle="Cadastre conhecimentos dentro do topico com pergunta, resposta e modo avancado.">
      {!topicId ? (
        <section className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-4 text-sm text-slate-400">Topico invalido. Volte para Estudos e abra um topico ativo.</section>
      ) : (
        <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 space-y-3">
            <h3 className="text-xl font-semibold">Novo conhecimento</h3>
            <input value={form.question} onChange={(e) => setForm((s) => ({ ...s, question: e.target.value }))} placeholder="Pergunta" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
            <textarea value={form.expected_answer} onChange={(e) => setForm((s) => ({ ...s, expected_answer: e.target.value }))} placeholder="Resposta esperada" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <select value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm">{categories.map((c) => <option key={c}>{c}</option>)}</select>
              <select value={form.difficulty} onChange={(e) => setForm((s) => ({ ...s, difficulty: e.target.value }))} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm">{difficulties.map((d) => <option key={d}>{d}</option>)}</select>
            </div>
            <input value={form.notes_optional} onChange={(e) => setForm((s) => ({ ...s, notes_optional: e.target.value }))} placeholder="Observacao opcional" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={form.advanced_mode_enabled} onChange={(e) => setForm((s) => ({ ...s, advanced_mode_enabled: e.target.checked }))} />Modo avancado (perguntas dinamicas)</label>
            <button
              onClick={async () => {
                if (!form.question.trim() || !form.expected_answer.trim()) return
                await brainApi.createKnowledge(topicId, {
                  question: form.question,
                  expected_answer: form.expected_answer,
                  category: form.category,
                  difficulty: form.difficulty,
                  notes_optional: form.notes_optional || null,
                  advanced_mode_enabled: form.advanced_mode_enabled,
                })
                setForm({ question: '', expected_answer: '', category: 'geral', difficulty: 'medio', notes_optional: '', advanced_mode_enabled: false })
                await load()
              }}
              className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950"
            >
              Salvar conhecimento
            </button>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="text-xl font-semibold">Conhecimentos cadastrados</h3>
            <ul className="mt-4 space-y-2">
              {items.map((item) => (
                <li key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                  <p className="font-semibold text-white">{item.question}</p>
                  <p className="mt-1 text-sm text-slate-300">{item.expected_answer}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-lg border border-slate-700 px-2 py-1">{item.category}</span>
                    <span className="rounded-lg border border-slate-700 px-2 py-1">{item.difficulty}</span>
                    <span className={`rounded-lg px-2 py-1 ${item.advanced_mode_enabled ? 'bg-violet-500/20 text-violet-200' : 'border border-slate-700'}`}>{item.advanced_mode_enabled ? 'Avancado' : 'Padrao'}</span>
                    <span className="rounded-lg border border-slate-700 px-2 py-1">Proxima: {item.next_review_at ? new Date(item.next_review_at).toLocaleString('pt-BR') : '--'}</span>
                  </div>
                </li>
              ))}
              {!items.length && <li className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-3 text-sm text-slate-400">Sem conhecimentos neste topico.</li>}
            </ul>
          </div>
        </section>
      )}
    </DashboardShell>
  )
}
