'use client'
import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Mic } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLifeStore } from '../../lib/store'
import { BASE_URL, authHeaders } from '../../lib/api'
import { brainApi } from '../../lib/brain-api'
import { walletApi } from '../../lib/wallet-api'
import { handleAcademiaCommand } from '../../lib/academia-routine'

interface Message { id: string; from: 'user' | 'carinne'; text: string; nav?: string }

const NAV_RULES: { keywords: string[]; path: string; label: string }[] = [
  { keywords: ['carteira', 'saldo', 'gastar', 'gasto', 'dinheiro', 'comprar', 'financ'], path: '/dashboard/carteira', label: 'Carteira' },
  { keywords: ['academia', 'treino', 'treinar', 'muscula', 'exerc', 'gym'], path: '/dashboard/academia', label: 'Academia' },
  { keywords: ['estud', 'revis', 'flashcard', 'matéria', 'materia', 'prova', 'aprender'], path: '/dashboard/estudos', label: 'Estudos' },
  { keywords: ['agenda', 'evento', 'data', 'prazo', 'aniversar', 'meta', 'lançamento'], path: '/dashboard/agenda', label: 'Agenda' },
  { keywords: ['espelho', 'ontem', 'histórico', 'historico'], path: '/dashboard/espelho', label: 'Espelho' },
  { keywords: ['prioridade', 'postit', 'tarefa', 'pendencia', 'pendência'], path: '/dashboard/prioridades', label: 'Prioridades' },
]

const BRAIN_COMMANDS = ['revisar agora', 'o que eu errei hoje', 'iniciar revisão de', 'iniciar revisao de', 'adiar revisão', 'adiar revisao', 'repetir pergunta']
const FINANCE_COMMANDS = ['gastei', 'recebi', 'paguei a internet', 'posso comprar']
const ACADEMY_COMMANDS = ['treino de hoje', 'treino completo', 'ja treinei', 'pulei o treino', 'adia para amanha', 'hoje treinei', 'muda meu treino de segunda para', 'adicione']

function detectNav(text: string): { path: string; label: string } | null {
  const lower = text.toLowerCase()
  for (const rule of NAV_RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) return { path: rule.path, label: rule.label }
  }
  return null
}

export default function CarinneChat({ onClose }: { onClose: () => void }) {
  const userName = useLifeStore((s: any) => s.user?.name)
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([{ id: 'welcome', from: 'carinne', text: 'Olá! Eu sou a Carinne. Me diga o que você precisa e te levo até lá.' }])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }) }, [messages])
  const push = (from: Message['from'], message: string, nav?: string) => setMessages((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, from, text: message, nav }])

  const sendText = async () => {
    if (!text.trim()) return
    const userMsg = text
    push('user', userMsg)
    setLoading(true)
    setText('')
    const nav = detectNav(userMsg)
    try {
      const normalizedCommand = userMsg.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const isAcademyCommand = ACADEMY_COMMANDS.some((cmd) => normalizedCommand.includes(cmd)) && (normalizedCommand.includes('trein') || normalizedCommand.includes('academia'))
      if (isAcademyCommand) {
        const result = handleAcademiaCommand(userMsg)
        if (result.handled) {
          push('carinne', result.message, '/dashboard/academia')
          return
        }
      }

      const isFinanceCommand = FINANCE_COMMANDS.some((cmd) => userMsg.toLowerCase().includes(cmd))
      if (isFinanceCommand) {
        const intent = await walletApi.runIntent(userMsg)
        push('carinne', intent.message || 'Comando financeiro executado.', '/dashboard/carteira')
        return
      }

      const isBrainCommand = BRAIN_COMMANDS.some((cmd) => userMsg.toLowerCase().includes(cmd))
      if (isBrainCommand) {
        const intent = await brainApi.runIntent(userMsg)
        push('carinne', intent.message || 'Comando executado.', '/dashboard/estudos')
        return
      }
      const res = await fetch(`${BASE_URL}/api/v1/carinne/chat`, { method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ message: userMsg, user_name: userName || '', user_id: null }) })
      const data = await res.json()
      push('carinne', data.reply || 'Me diga mais para eu te ajudar.', nav?.path)
    } catch {
      push('carinne', 'Não consegui responder agora.', nav?.path)
    } finally {
      setLoading(false)
    }
  }

  const quickSuggest = async () => { setLoading(true); try { const res = await fetch(`${BASE_URL}/api/v1/carinne/suggest`, { headers: authHeaders() }); const data = await res.json(); push('carinne', data.suggestion || 'Sugestão indisponível.') } catch { push('carinne', 'Sugestão indisponível.') } finally { setLoading(false) } }
  const startRecording = async () => { try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const recorder = new MediaRecorder(stream); chunksRef.current = []; recorder.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data) }; recorder.onstop = async () => { const blob = new Blob(chunksRef.current, { type: 'audio/webm' }); const form = new FormData(); form.append('file', blob, 'voice.webm'); setLoading(true); try { const res = await fetch(`${BASE_URL}/api/v1/voice/command`, { method: 'POST', body: form, headers: authHeaders() }); const data = await res.json(); const navResult = detectNav(data.transcript || ''); push('user', '[Mensagem de voz]'); push('carinne', data.reply || data.transcript || 'Ok.', navResult?.path); if (data.audio_base64) new Audio(`data:audio/mpeg;base64,${data.audio_base64}`).play().catch(() => null) } catch { push('carinne', 'Falha ao processar áudio.') } finally { setLoading(false); stream.getTracks().forEach((t) => t.stop()) } }; recorderRef.current = recorder; recorder.start(); setRecording(true) } catch { push('carinne', 'Sem acesso ao microfone.') } }
  const stopRecording = () => { recorderRef.current?.stop(); setRecording(false) }

  return <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-[22rem] rounded-3xl border border-slate-700 bg-slate-900 p-4 shadow-2xl"><div className="mb-3 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Assistente</p><h3 className="text-xl font-semibold text-slate-50">Carinne</h3></div><button onClick={onClose} className="text-sm text-slate-400">Fechar</button></div><button onClick={quickSuggest} className="mb-3 w-full rounded-xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950">⚡ O que faço agora?</button><div ref={scrollRef} className="h-64 space-y-2 overflow-y-auto rounded-2xl bg-slate-950 p-3">{messages.map((m) => <div key={m.id} className={`rounded-2xl px-3 py-2 text-sm ${m.from === 'user' ? 'ml-auto w-fit bg-slate-700 text-right' : 'w-fit max-w-[90%] bg-slate-800'}`}><div>{m.text}</div>{m.nav && <button onClick={() => { router.push(m.nav!); onClose() }} className="mt-2 rounded-lg bg-cyan-500 px-2 py-1 text-xs font-semibold text-slate-950">Ir agora →</button>}</div>)}{loading && <div className="text-sm text-slate-400">Carinne está digitando...</div>}</div><div className="mt-3 flex items-center gap-2"><input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendText()} placeholder="Digite ou fale..." className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none" /><button onClick={sendText} className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950">Enviar</button><motion.button onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording} animate={recording ? { scale: [1, 1.05, 1] } : { scale: 1 }} transition={{ repeat: recording ? Infinity : 0, duration: 1.2 }} className={`rounded-xl p-2 ${recording ? 'bg-rose-600' : 'bg-rose-500'}`}><Mic size={18} /></motion.button></div></motion.div>
}
