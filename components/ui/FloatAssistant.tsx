'use client'
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import CarinneChat from './CarinneChat'
import { useLifeStore } from '../../lib/store'
import { brainApi, DueReview } from '../../lib/brain-api'
import ReviewSessionPanel from '../brain/ReviewSessionPanel'

export default function FloatAssistant() {
  const [open, setOpen] = useState(false)
  const [dueReview, setDueReview] = useState<DueReview | null>(null)
  const aiName = useLifeStore((s: any) => s.aiName)

  React.useEffect(() => {
    let mounted = true
    const checkDue = async () => {
      try {
        const due = await brainApi.getDue(1)
        if (mounted) setDueReview(due[0] || null)
      } catch {
        if (mounted) setDueReview(null)
      }
    }
    checkDue()
    const id = setInterval(checkDue, 60000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3">
      {dueReview && (
        <div className="w-[24rem]">
          <ReviewSessionPanel
            compact
            review={dueReview}
            onResolved={async () => {
              const next = await brainApi.getDue(1)
              setDueReview(next[0] || null)
            }}
          />
        </div>
      )}
      {!open && (
        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={{ scale: 1.05 }} onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-3 font-semibold text-slate-950 shadow-lg">
          <MessageCircle size={18} /> {aiName}
        </motion.button>
      )}
      {open && <CarinneChat onClose={() => setOpen(false)} />}
    </div>
  )
}
