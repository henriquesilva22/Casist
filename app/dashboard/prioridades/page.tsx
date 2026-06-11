'use client'
import React from 'react'
import DashboardShell from '../../../components/layout/DashboardShell'
import CardPostits from '../../../components/dashboard/CardPostits'

export default function PrioridadesPage() {
  return (
    <DashboardShell subtitle="Página de prioridades com CRUD de post-its.">
      <section className="max-w-4xl">
        <CardPostits />
      </section>
    </DashboardShell>
  )
}
