'use client'

import React, { useEffect, useMemo, useState } from 'react'
import DashboardShell from '../../../components/layout/DashboardShell'
import BottomSheet from '../../../components/wallet/BottomSheet'
import DetailModal from '../../../components/wallet/DetailModal'
import EmptyState from '../../../components/wallet/EmptyState'
import ExpandableCard from '../../../components/wallet/ExpandableCard'
import MetricCard from '../../../components/wallet/MetricCard'
import QuickActionButton from '../../../components/wallet/QuickActionButton'
import SummaryCard from '../../../components/wallet/SummaryCard'
import { WalletGoal, walletApi, WalletDashboard } from '../../../lib/wallet-api'

const EXPENSE_CATEGORIES = ['alimentacao', 'transporte', 'mercado', 'lazer', 'assinaturas', 'estudos', 'academia', 'outros']

type WalletDetailKey = 'disponivel' | 'hoje' | 'contas' | 'compra' | 'categorias' | 'metas' | 'registro' | 'carinne' | null

function money(value: number) {
  return `R$ ${value.toFixed(2)}`
}

function formatDate(dateISO?: string | null) {
  if (!dateISO) return '---'
  return new Date(dateISO).toLocaleDateString('pt-BR')
}

export default function CarteiraPage() {
  const [data, setData] = useState<WalletDashboard | null>(null)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [activeDetail, setActiveDetail] = useState<WalletDetailKey>(null)

  const [incomeValue, setIncomeValue] = useState('')
  const [incomeDesc, setIncomeDesc] = useState('')

  const [expenseValue, setExpenseValue] = useState('')
  const [expenseDesc, setExpenseDesc] = useState('')
  const [expenseCategory, setExpenseCategory] = useState('outros')

  const [billTitle, setBillTitle] = useState('')
  const [billAmount, setBillAmount] = useState('')
  const [billDate, setBillDate] = useState('')

  const [goalTitle, setGoalTitle] = useState('')
  const [goalTarget, setGoalTarget] = useState('')
  const [targetValue, setTargetValue] = useState('')

  const [buyProduct, setBuyProduct] = useState('')
  const [buyAmount, setBuyAmount] = useState('')
  const [buyResult, setBuyResult] = useState<{ message: string; recommended: boolean; impact: number; forecast: number } | null>(null)

  const load = async () => {
    try {
      const response = await walletApi.dashboard()
      setData(response)
      setTargetValue(String(response.summary.monthly_saving_target || 0))
    } catch {
      setFeedback('Nao foi possivel carregar o painel financeiro.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const topCategories = useMemo(() => (data?.category_breakdown || []).slice(0, 3), [data])

  const nextUrgentBill = useMemo(() => {
    const bills = [...(data?.upcoming_bills || [])]
    bills.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    return bills[0]
  }, [data])

  const mainGoal: WalletGoal | null = useMemo(() => {
    const active = (data?.goals || []).find((g) => g.is_active)
    return active || (data?.goals || [])[0] || null
  }, [data])

  const availableStatus: 'seguro' | 'atencao' | 'critico' = useMemo(() => {
    const real = data?.summary.real_available || 0
    if (real >= 1000) return 'seguro'
    if (real >= 250) return 'atencao'
    return 'critico'
  }, [data])

  const todayStatus: 'seguro' | 'atencao' | 'critico' = useMemo(() => {
    const diff = data?.today.difference || 0
    if (diff >= 0) return 'seguro'
    if (diff >= -40) return 'atencao'
    return 'critico'
  }, [data])

  const carinneSummary = data?.weekly_summary.carinne_summary || data?.insights?.[0]?.text || 'Mantenha foco em reduzir os gastos nao planejados hoje.'

  const detailTitle: Record<Exclude<WalletDetailKey, null>, string> = {
    disponivel: 'Disponivel agora',
    hoje: 'Hoje',
    contas: 'Proximas contas',
    compra: 'Posso comprar?',
    categorias: 'Categorias do mes',
    metas: 'Metas financeiras',
    registro: 'Registro rapido',
    carinne: 'Resumo da Carinne',
  }

  const analyzeBuy = async () => {
    if (!buyProduct.trim() || !Number(buyAmount)) return
    setLoading(true)
    try {
      const res = await walletApi.canBuy(buyProduct.trim(), Number(buyAmount))
      setBuyResult({
        message: res.message,
        recommended: res.recommended,
        impact: res.impact_saving_delta,
        forecast: res.projected_end_month_balance,
      })
    } finally {
      setLoading(false)
    }
  }

  const renderDetail = () => {
    if (!activeDetail) return null

    if (activeDetail === 'disponivel') {
      return (
        <div className="space-y-3">
          <MetricCard label="Dinheiro disponivel" value={money(data?.summary.real_available || 0)} tone={availableStatus === 'seguro' ? 'good' : availableStatus === 'atencao' ? 'warn' : 'bad'} />
          <MetricCard label="Saldo atual" value={money(data?.summary.current_balance || 0)} />
          <MetricCard label="Previsao fim do mes" value={money(data?.summary.month_end_forecast || 0)} />
          <MetricCard label="Meta mensal" value={`${money(data?.summary.monthly_saving_current || 0)} / ${money(data?.summary.monthly_saving_target || 0)}`} />
        </div>
      )
    }

    if (activeDetail === 'hoje') {
      return (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <MetricCard label="Gasto hoje" value={money(data?.today.spent_today || 0)} />
            <MetricCard label="Limite recomendado" value={money(data?.today.recommended_limit_today || 0)} />
            <MetricCard label="Diferenca" value={money(data?.today.difference || 0)} tone={todayStatus === 'seguro' ? 'good' : todayStatus === 'atencao' ? 'warn' : 'bad'} />
            <MetricCard label="Maior gasto" value={money(data?.today.biggest_expense_today || 0)} />
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Categorias de hoje</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-200">
              {Object.entries(data?.today.categories_today || {}).map(([category, amount]) => (
                <li key={category} className="flex justify-between">
                  <span className="capitalize">{category}</span>
                  <span>{money(amount)}</span>
                </li>
              ))}
              {!Object.keys(data?.today.categories_today || {}).length && <li className="text-slate-400">Sem gastos hoje.</li>}
            </ul>
          </div>
        </div>
      )
    }

    if (activeDetail === 'contas') {
      return (
        <div className="space-y-2">
          {(data?.upcoming_bills || []).map((bill) => (
            <div key={bill.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-100">{bill.title}</p>
                  <p className="text-sm text-slate-400">{money(bill.amount)} · vence em {formatDate(bill.due_date)}</p>
                </div>
                <button
                  onClick={async () => {
                    await walletApi.payBill(bill.id)
                    await load()
                  }}
                  className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950"
                >
                  Pagar
                </button>
              </div>
            </div>
          ))}
          {!data?.upcoming_bills?.length && <EmptyState title="Sem contas pendentes" description="Sua agenda de contas esta limpa no momento." />}
        </div>
      )
    }

    if (activeDetail === 'compra') {
      return (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
            <input value={buyProduct} onChange={(e) => setBuyProduct(e.target.value)} placeholder="Produto" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
            <input value={buyAmount} onChange={(e) => setBuyAmount(e.target.value)} placeholder="Valor" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
            <button onClick={analyzeBuy} disabled={loading} className="rounded-xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60">Analisar</button>
          </div>
          {buyResult && (
            <div className={`rounded-xl border p-3 text-sm ${buyResult.recommended ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100' : 'border-rose-400/40 bg-rose-500/10 text-rose-100'}`}>
              <p>{buyResult.message}</p>
              <p className="mt-1">Impacto na economia: {money(buyResult.impact)}</p>
              <p>Saldo final previsto: {money(buyResult.forecast)}</p>
            </div>
          )}
        </div>
      )
    }

    if (activeDetail === 'categorias') {
      return (
        <div className="space-y-2">
          {(data?.category_breakdown || []).map((item) => (
            <div key={item.category} className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <div className="flex justify-between text-sm">
                <span className="capitalize text-slate-200">{item.category}</span>
                <strong className="text-slate-100">{money(item.amount)} ({item.percentage.toFixed(1)}%)</strong>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.min(100, item.percentage)}%` }} />
              </div>
            </div>
          ))}
          {!data?.category_breakdown?.length && <EmptyState title="Sem categorias no periodo" description="Registre gastos para acompanhar seus padroes." />}
        </div>
      )
    }

    if (activeDetail === 'metas') {
      return (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
            <input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="Nome da meta" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
            <input value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} placeholder="Valor" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
            <button
              onClick={async () => {
                if (!goalTitle.trim() || !Number(goalTarget)) return
                await walletApi.createGoal(goalTitle.trim(), Number(goalTarget), 0, 0)
                setGoalTitle('')
                setGoalTarget('')
                await load()
              }}
              className="rounded-xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950"
            >
              Criar
            </button>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Meta de economia mensal</p>
            <div className="mt-2 flex gap-2">
              <input value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm" />
              <button
                onClick={async () => {
                  await walletApi.updateMonthlyTarget(Number(targetValue) || 0)
                  await load()
                }}
                className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-100"
              >
                Salvar
              </button>
            </div>
          </div>
          {(data?.goals || []).map((goal) => (
            <div key={goal.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm">
              <p className="font-semibold text-slate-100">{goal.title}</p>
              <p className="text-slate-300">{money(goal.current_amount)} / {money(goal.target_amount)}</p>
              <p className="text-cyan-200">ETA: {goal.eta_months ?? 0} mes(es)</p>
            </div>
          ))}
          {!data?.goals?.length && <EmptyState title="Nenhuma meta cadastrada" description="Crie metas para manter seu plano financeiro ativo." />}
        </div>
      )
    }

    if (activeDetail === 'registro') {
      return (
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Entrada</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-[120px_1fr_auto]">
              <input value={incomeValue} onChange={(e) => setIncomeValue(e.target.value)} placeholder="Valor" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm" />
              <input value={incomeDesc} onChange={(e) => setIncomeDesc(e.target.value)} placeholder="Descricao" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm" />
              <button
                onClick={async () => {
                  await walletApi.quickIncome(Number(incomeValue) || 0, incomeDesc || undefined)
                  setIncomeValue('')
                  setIncomeDesc('')
                  await load()
                }}
                className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950"
              >
                Salvar
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Gasto</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-[110px_1fr_140px_auto]">
              <input value={expenseValue} onChange={(e) => setExpenseValue(e.target.value)} placeholder="Valor" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm" />
              <input value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} placeholder="Descricao" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm" />
              <select value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm">{EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
              <button
                onClick={async () => {
                  await walletApi.quickExpense(Number(expenseValue) || 0, expenseDesc || undefined, expenseCategory)
                  setExpenseValue('')
                  setExpenseDesc('')
                  await load()
                }}
                className="rounded-xl bg-rose-500 px-3 py-2 text-sm font-semibold text-slate-950"
              >
                Salvar
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Conta</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_120px_150px_auto]">
              <input value={billTitle} onChange={(e) => setBillTitle(e.target.value)} placeholder="Nome da conta" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm" />
              <input value={billAmount} onChange={(e) => setBillAmount(e.target.value)} placeholder="Valor" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm" />
              <input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm" />
              <button
                onClick={async () => {
                  if (!billTitle || !Number(billAmount) || !billDate) return
                  await walletApi.createBill(billTitle, Number(billAmount), new Date(`${billDate}T12:00:00`).toISOString())
                  setBillTitle('')
                  setBillAmount('')
                  setBillDate('')
                  await load()
                }}
                className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-100"
              >
                Salvar
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
            Dica: registre por voz no chat com Carinne. Ex.: "gastei 20 reais no mercado".
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-200">
          {carinneSummary}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <MetricCard label="Entradas da semana" value={money(data?.weekly_summary.entries || 0)} />
          <MetricCard label="Saidas da semana" value={money(data?.weekly_summary.exits || 0)} />
          <MetricCard label="Economia da semana" value={money(data?.weekly_summary.savings || 0)} />
          <MetricCard label="Maior gasto" value={money(data?.weekly_summary.biggest_expense || 0)} />
        </div>
        <ul className="space-y-2">
          {(data?.insights || []).map((insight, idx) => (
            <li key={`${idx}-${insight.text}`} className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-200">{insight.text}</li>
          ))}
          {!data?.insights?.length && <EmptyState title="Sem insights suficientes" description="Registre mais movimentacoes para analises melhores." />}
        </ul>
      </div>
    )
  }

  return (
    <DashboardShell subtitle="Resumo primeiro. Detalhes somente quando voce toca no card.">
      <section className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryCard
            title="Disponivel agora"
            value={money(data?.summary.real_available || 0)}
            subtitle={`Saldo atual: ${money(data?.summary.current_balance || 0)}`}
            status={availableStatus}
            onClick={() => setActiveDetail('disponivel')}
          />

          <SummaryCard
            title="Hoje"
            value={money(data?.today.spent_today || 0)}
            subtitle={`Limite ${money(data?.today.recommended_limit_today || 0)} · Diferenca ${money(data?.today.difference || 0)}`}
            status={todayStatus}
            onClick={() => setActiveDetail('hoje')}
          />

          <ExpandableCard
            title="Proximas contas"
            lines={[
              `${data?.summary.pending_bills_count || 0} pendente(s)`,
              `Total ${money(data?.summary.pending_bills_total || 0)}`,
              nextUrgentBill ? `Mais urgente: ${nextUrgentBill.title}` : 'Sem urgencias',
            ]}
            actionLabel="Ver contas"
            onClick={() => setActiveDetail('contas')}
          />

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Posso comprar?</p>
            <div className="mt-2 grid grid-cols-[1fr_120px] gap-2">
              <input value={buyProduct} onChange={(e) => setBuyProduct(e.target.value)} placeholder="Produto" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <input value={buyAmount} onChange={(e) => setBuyAmount(e.target.value)} placeholder="Valor" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
            </div>
            <div className="mt-2 flex gap-2">
              <button onClick={analyzeBuy} disabled={loading} className="rounded-xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60">Analisar</button>
              <button onClick={() => setActiveDetail('compra')} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-100">Ver detalhes</button>
            </div>
            {buyResult && <p className={`mt-2 text-xs ${buyResult.recommended ? 'text-emerald-200' : 'text-rose-200'}`}>{buyResult.message}</p>}
          </div>

          <ExpandableCard
            title="Categorias"
            lines={topCategories.length ? topCategories.map((item) => `${item.category}: ${money(item.amount)}`) : ['Sem categorias neste mes', 'Registre gastos para visualizar', 'Toque para detalhes']}
            actionLabel="Ver detalhes"
            onClick={() => setActiveDetail('categorias')}
          />

          <ExpandableCard
            title="Metas"
            lines={
              mainGoal
                ? [mainGoal.title, `${money(mainGoal.current_amount)} / ${money(mainGoal.target_amount)}`, `Progresso: ${Math.min(100, (mainGoal.current_amount / Math.max(1, mainGoal.target_amount)) * 100).toFixed(1)}%`]
                : ['Sem meta principal', 'Crie uma meta para acompanhar', 'Toque para configurar']
            }
            actionLabel="Ver metas"
            onClick={() => setActiveDetail('metas')}
          />

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Registro rapido</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <QuickActionButton label="Entrada" onClick={() => setActiveDetail('registro')} />
              <QuickActionButton label="Gasto" onClick={() => setActiveDetail('registro')} />
              <QuickActionButton label="Conta" onClick={() => setActiveDetail('registro')} />
              <QuickActionButton label="Meta" onClick={() => setActiveDetail('metas')} />
            </div>
          </div>

          <SummaryCard
            title="Resumo da Carinne"
            value={carinneSummary.length > 56 ? `${carinneSummary.slice(0, 56)}...` : carinneSummary}
            subtitle="Toque para ver recomendacoes e inteligencia financeira"
            status="atencao"
            actionLabel="Ver resumo"
            onClick={() => setActiveDetail('carinne')}
          />
        </div>

        {feedback && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{feedback}</div>}
      </section>

      <BottomSheet open={Boolean(activeDetail)} title={activeDetail ? detailTitle[activeDetail] : ''} onClose={() => setActiveDetail(null)}>
        {renderDetail()}
      </BottomSheet>
      <DetailModal open={Boolean(activeDetail)} title={activeDetail ? detailTitle[activeDetail] : ''} onClose={() => setActiveDetail(null)}>
        {renderDetail()}
      </DetailModal>
    </DashboardShell>
  )
}
