'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import DashboardShell from '../../../components/layout/DashboardShell'
import ReviewSessionPanel from '../../../components/brain/ReviewSessionPanel'
import { brainApi, BrainPolicy, BrainTopic, DueReview, ReviewStats, ReviewToday } from '../../../lib/brain-api'

export default function EstudosPage() {
  const [topics, setTopics] = useState<BrainTopic[]>([])
  const [today, setToday] = useState<ReviewToday | null>(null)
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [due, setDue] = useState<DueReview | null>(null)
  const [policy, setPolicy] = useState<BrainPolicy | null>(null)
  const [newTopic, setNewTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [commandResult, setCommandResult] = useState('')

  const load = async () => {
    try {
      const [topicData, todayData, statsData, dueData, policyData] = await Promise.all([
        brainApi.listTopics(),
        brainApi.getToday(),
        brainApi.statsOverview(),
        brainApi.getDue(1),
        brainApi.getPolicy(),
      ])
      setTopics(topicData)
      setToday(todayData)
      setStats(statsData)
      setDue(dueData[0] || null)
      setPolicy(policyData)
    } catch {
      setCommandResult('Nao foi possivel carregar os dados do modulo.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const todayHits = useMemo(() => {
    if (!stats || !today) return 0
    return Math.round((today.accuracy_today / 100) * Math.max(1, stats.total_questions))
  }, [stats, today])

  const todayMisses = useMemo(() => {
    if (!today || !stats) return 0
    return Math.max(0, Math.max(1, stats.total_questions) - todayHits)
  }, [today, stats, todayHits])

  return (
    <DashboardShell subtitle="Treinar Cerebro com repeticao espacada, IA e revisao por texto/voz.">
      <section className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Topicos ativos</p>
            <p className="mt-1 text-2xl font-semibold">{topics.filter((t) => t.is_active).length}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Revisoes pendentes</p>
            <p className="mt-1 text-2xl font-semibold">{today?.pending_count ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Acertos do dia</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-300">{todayHits}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Erros do dia</p>
            <p className="mt-1 text-2xl font-semibold text-rose-300">{todayMisses}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Proxima pergunta</p>
            <p className="mt-1 text-lg font-semibold">{today?.next_review_at ? new Date(today.next_review_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
          </div>
          <div className="rounded-2xl border border-cyan-500/40 bg-cyan-500/10 p-4">
            <button
              onClick={async () => {
                setLoading(true)
                try {
                  await brainApi.reviewNow()
                  await load()
                  setCommandResult('Revisao iniciada agora.')
                } catch {
                  setCommandResult('Nao foi possivel iniciar revisao agora.')
                } finally {
                  setLoading(false)
                }
              }}
              disabled={loading}
              className="w-full rounded-xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
            >
              Revisar Agora
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold">Topicos</h3>
              <div className="flex gap-2 text-xs">
                <Link className="rounded-lg border border-slate-700 px-3 py-1.5" href="/dashboard/estudos/hoje">Hoje</Link>
                <Link className="rounded-lg border border-slate-700 px-3 py-1.5" href="/dashboard/estudos/estatisticas">Estatisticas</Link>
                <Link className="rounded-lg border border-slate-700 px-3 py-1.5" href="/dashboard/estudos/erros">Erros recentes</Link>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <input value={newTopic} onChange={(e) => setNewTopic(e.target.value)} placeholder="Novo topico (ex: AWS)" className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <button
                onClick={async () => {
                  if (!newTopic.trim()) return
                  setLoading(true)
                  try {
                    await brainApi.createTopic(newTopic.trim())
                    setNewTopic('')
                    await load()
                  } finally {
                    setLoading(false)
                  }
                }}
                className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                Criar
              </button>
            </div>
            <ul className="mt-4 space-y-2">
              {topics.map((topic) => (
                <li key={topic.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-white">{topic.name}</p>
                      <p className="text-xs text-slate-400">{topic.knowledge_count} conhecimentos</p>
                    </div>
                    <div className="flex gap-2">
                      <Link className="rounded-lg border border-slate-700 px-2 py-1 text-xs" href={`/dashboard/estudos/topico?id=${topic.id}`}>
                        Abrir
                      </Link>
                      <button
                        onClick={async () => {
                          await brainApi.updateTopic(topic.id, { is_active: !topic.is_active })
                          await load()
                        }}
                        className={`rounded-lg px-2 py-1 text-xs font-semibold ${topic.is_active ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-200'}`}
                      >
                        {topic.is_active ? 'Ativo' : 'Pausado'}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
              {!topics.length && <li className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-3 text-sm text-slate-400">Nenhum topico criado ainda.</li>}
            </ul>
          </div>

          <div className="space-y-4">
            {due ? (
              <ReviewSessionPanel review={due} onResolved={load} />
            ) : (
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
                <h3 className="text-lg font-semibold">Sem pergunta pendente no momento</h3>
                <p className="mt-2 text-sm text-slate-400">Quando chegar o horario da revisao, a Carinne trara a pergunta automaticamente.</p>
              </div>
            )}

            {policy && (
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
                <h3 className="text-lg font-semibold">Configuracao de revisao</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <select value={policy.mode} onChange={(e) => setPolicy((s) => (s ? { ...s, mode: e.target.value as BrainPolicy['mode'] } : s))} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
                    <option value="text">Apenas texto</option>
                    <option value="voice">Apenas voz</option>
                    <option value="hybrid">Texto e voz</option>
                  </select>
                  <select value={policy.frequency_preset} onChange={(e) => setPolicy((s) => (s ? { ...s, frequency_preset: e.target.value as BrainPolicy['frequency_preset'] } : s))} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
                    <option value="30m">A cada 30 minutos</option>
                    <option value="1h">A cada 1 hora</option>
                    <option value="3h">A cada 3 horas</option>
                    <option value="6h">A cada 6 horas</option>
                    <option value="daily">Diario</option>
                    <option value="custom">Personalizado</option>
                  </select>
                  <input value={policy.allowed_start_time} onChange={(e) => setPolicy((s) => (s ? { ...s, allowed_start_time: e.target.value } : s))} type="time" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
                  <input value={policy.allowed_end_time} onChange={(e) => setPolicy((s) => (s ? { ...s, allowed_end_time: e.target.value } : s))} type="time" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
                </div>
                {policy.frequency_preset === 'custom' && (
                  <div className="mt-2">
                    <input value={policy.custom_minutes} onChange={(e) => setPolicy((s) => (s ? { ...s, custom_minutes: Number(e.target.value) || 60 } : s))} type="number" min={5} max={1440} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" placeholder="Minutos personalizados" />
                  </div>
                )}
                <button
                  onClick={async () => {
                    if (!policy) return
                    setLoading(true)
                    try {
                      const saved = await brainApi.savePolicy(policy)
                      setPolicy(saved)
                      setCommandResult('Configuracao de revisao atualizada.')
                    } catch {
                      setCommandResult('Falha ao salvar configuracao da revisao.')
                    } finally {
                      setLoading(false)
                    }
                  }}
                  className="mt-3 rounded-xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950"
                >
                  Salvar configuracao
                </button>
              </div>
            )}

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
              <h3 className="text-lg font-semibold">Comandos da Carinne</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {['Carinne, revisar agora', 'Carinne, o que eu errei hoje?', 'Carinne, iniciar revisao de AWS', 'Carinne, adiar revisao 15 minutos', 'Carinne, repetir pergunta'].map((cmd) => (
                  <button
                    key={cmd}
                    onClick={async () => {
                      setLoading(true)
                      try {
                        const res = await brainApi.runIntent(cmd)
                        setCommandResult(`${res.intent}: ${res.message}`)
                        await load()
                      } catch {
                        setCommandResult('Falha ao executar comando da Carinne.')
                      } finally {
                        setLoading(false)
                      }
                    }}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-left text-sm"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
              {commandResult && <p className="mt-3 rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-300">{commandResult}</p>}
            </div>
          </div>
        </div>
      </section>
    </DashboardShell>
  )
}
