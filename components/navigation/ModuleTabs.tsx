'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NavigationIconButton from './NavigationIconButton'

const modules = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/dashboard/carteira', label: 'Carteira', icon: '💰' },
  { href: '/dashboard/academia', label: 'Academia', icon: '🏋️' },
  { href: '/dashboard/estudos', label: 'Estudos', icon: '📚' },
  { href: '/dashboard/agenda', label: 'Agenda', icon: '📅' },
  { href: '/dashboard/espelho', label: 'Espelho', icon: '👁️' },
  { href: '/dashboard/prioridades', label: 'Prioridades', icon: '🚩' },
]

export default function ModuleTabs() {
  const pathname = usePathname()
  return (
    <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-2 shadow-xl backdrop-blur-xl md:p-3">
      <div className="flex flex-wrap gap-2 md:gap-2.5">
        {modules.map((module) => {
          const active = pathname === module.href
          return (
            <Link key={module.href} href={module.href} className="inline-flex">
              <NavigationIconButton icon={module.icon} label={module.label} active={active} />
            </Link>
          )
        })}
      </div>
    </section>
  )
}
