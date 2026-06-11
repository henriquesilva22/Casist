'use client'

import React, { useRef, useState } from 'react'
import { Mic } from 'lucide-react'
import { brainApi, DueReview } from '../../lib/brain-api'

export default function ReviewSessionPanel({
  review,
  onResolved,
  compact = false,
}: {
  review: DueReview
  onResolved: () => void
  compact?: boolean
}) {
  const [answerText, setAnswerText] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const submitText = async () => {
    if (!answerText.trim()) return
    setLoading(true)
    try {
      const result = await brainApi.answerReview(review.event_id, answerText.trim())
      setFeedback(result.feedback)
      setAnswerText('')
      onResolved()
    } catch {
      setFeedback('Nao foi possivel validar sua resposta agora.')
    } finally {
      setLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setLoading(true)
        try {
          const result = await brainApi.answerReviewAudio(review.event_id, blob)
          setFeedback(result.feedback)
          onResolved()
        } catch {
          setFeedback('Falha ao avaliar audio. Tente novamente.')
        } finally {
          setLoading(false)
          stream.getTracks().forEach((track) => track.stop())
        }
      }
      recorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch {
      setFeedback('Nao foi possivel acessar o microfone.')
    }
  }

  const stopRecording = () => {
    recorderRef.current?.stop()
    setRecording(false)
  }

  return (
    <div className={`rounded-2xl border border-cyan-500/30 bg-slate-900/95 p-4 ${compact ? '' : 'shadow-xl'}`}>
      <p className="text-xs uppercase tracking-[0.16em] text-cyan-300">Carinne pergunta</p>
      <h3 className="mt-2 text-lg font-semibold text-white">{review.question}</h3>
      <p className="mt-1 text-xs text-slate-400">Topico: {review.topic}</p>

      {(review.delivery_mode === 'text' || review.delivery_mode === 'hybrid') && (
        <div className="mt-3 flex gap-2">
          <input
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Digite sua resposta"
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && submitText()}
          />
          <button onClick={submitText} disabled={loading} className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60">
            Enviar
          </button>
        </div>
      )}

      {(review.delivery_mode === 'voice' || review.delivery_mode === 'hybrid') && (
        <div className="mt-3">
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${recording ? 'bg-rose-600 text-white' : 'bg-rose-500 text-slate-950'} disabled:opacity-60`}
          >
            <Mic size={16} /> {recording ? 'Ouvindo...' : 'Responder por voz'}
          </button>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <button
          onClick={async () => {
            setLoading(true)
            try {
              await brainApi.snoozeReview(review.event_id, 15)
              setFeedback('Revisao adiada em 15 minutos.')
              onResolved()
            } finally {
              setLoading(false)
            }
          }}
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs"
        >
          Adiar 15 min
        </button>
      </div>

      {feedback && <p className="mt-3 rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-200">{feedback}</p>}
    </div>
  )
}
