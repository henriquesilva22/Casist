import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LifeOS Assistant | Dashboard',
  description: 'Painel completo com Carinne, produtividade, finanças, estudos e eventos.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="absolute right-[-6rem] top-24 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="absolute bottom-[-8rem] left-1/3 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </body>
    </html>
  )
}
