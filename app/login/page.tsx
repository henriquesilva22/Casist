'use client'
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { BASE_URL } from '../../lib/api'
import { useLifeStore } from '../../lib/store'

export default function LoginPage() {
  const router = useRouter()
  const setUserName = useLifeStore((s: any) => s.setUserName)
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const savedUser = localStorage.getItem('lifeos_user')
    const savedToken = localStorage.getItem('lifeos_token')
    if (savedUser && savedToken) {
      setUserName(savedUser)
      router.replace('/dashboard')
    }
  }, [router, setUserName])

  const login = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return setError('Digite seu nome de usuário')
    setError('')
    const token = `local:${username.trim()}`
    document.cookie = `lifeos_token=${encodeURIComponent(token)}; path=/; max-age=86400; SameSite=Lax`
    document.cookie = `lifeos_user=${encodeURIComponent(username.trim())}; path=/; max-age=86400; SameSite=Lax`
    localStorage.setItem('lifeos_token', token)
    localStorage.setItem('lifeos_user', username.trim())
    setUserName(username.trim())
    router.replace('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">LifeOS Assistant</p>
        <h1 className="mt-3 text-3xl font-semibold">Olá, eu sou a Carinne.</h1>
        <p className="mt-2 text-sm text-slate-400">Me diga seu nome para abrir seu espaço.</p>
        <form onSubmit={login} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-slate-300">Nome de usuário</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Digite seu nome" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3" />
          </div>
          {error && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
          <button className="w-full rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-slate-950">Entrar no LifeOS</button>
        </form>
      </motion.div>
    </div>
  )
}
