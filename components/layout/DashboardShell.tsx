'use client'
import React, { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home } from 'lucide-react'
import Header from '../header/Header'
import ModuleTabs from '../navigation/ModuleTabs'
import FloatAssistant from '../ui/FloatAssistant'
import { useLifeStore } from '../../lib/store'

export default function DashboardShell({ children, subtitle, showTabs = true }: { children: React.ReactNode; subtitle: string; showTabs?: boolean }) {
  const user = useLifeStore((s: any) => s.user)
  const setUserName = useLifeStore((s: any) => s.setUserName)
  const hydrateDashboard = useLifeStore((s: any) => s.hydrateDashboard)
  const pathname = usePathname()
  const isSubPage = pathname !== '/dashboard'

  useEffect(() => {
    const savedUser = localStorage.getItem('lifeos_user')
    if (savedUser) setUserName(savedUser)
    hydrateDashboard()
  }, [setUserName, hydrateDashboard])

  return (
    <main className="space-y-8 pb-16">
      <Header name={user.name} />
      <p className="text-sm text-slate-400">{subtitle}</p>
      {showTabs && <ModuleTabs />}
      {children}
      <FloatAssistant />
      {isSubPage && (
        <Link href="/dashboard" className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 bg-slate-900 shadow-xl hover:bg-slate-800">
          <Home size={20} className="text-cyan-300" />
        </Link>
      )}
    </main>
  )
}
