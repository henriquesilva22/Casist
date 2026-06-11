'use client'
import React from 'react'
import DashboardShell from '../../../components/layout/DashboardShell'
import EspelhoOntem from '../../../components/dashboard/EspelhoOntem'

export default function EspelhoPage() {
  return (
    <DashboardShell subtitle="Página isolada do espelho de ontem para análise sem ruído.">
      <section className="max-w-3xl">
        <EspelhoOntem />
      </section>
    </DashboardShell>
  )
}
