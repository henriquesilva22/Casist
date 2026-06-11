import { BASE_URL, authHeaders } from './api'

export interface WalletBill {
  id: number
  title: string
  amount: number
  due_date: string
  category: string
  paid: boolean
}

export interface WalletGoal {
  id: number
  title: string
  target_amount: number
  current_amount: number
  monthly_contribution: number
  eta_months?: number | null
  is_active: boolean
}

export interface WalletDashboard {
  summary: {
    current_balance: number
    next_payment_date?: string | null
    next_payment_amount?: number | null
    pending_bills_count: number
    pending_bills_total: number
    real_available: number
    monthly_saving_current: number
    monthly_saving_target: number
    month_end_forecast: number
  }
  today: {
    spent_today: number
    recommended_limit_today: number
    difference: number
    biggest_expense_today: number
    biggest_expense_category?: string | null
    categories_today: Record<string, number>
  }
  yesterday: {
    spent_today: number
    spent_yesterday: number
    difference_vs_yesterday: number
    comparison_text: string
  }
  upcoming_bills: WalletBill[]
  category_breakdown: Array<{ category: string; amount: number; percentage: number }>
  goals: WalletGoal[]
  weekly_summary: {
    entries: number
    exits: number
    savings: number
    biggest_expense: number
    dominant_category?: string | null
    carinne_summary: string
  }
  insights: Array<{ text: string }>
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: authHeaders(options.headers || {}),
  })
  if (!response.ok) throw new Error(await response.text())
  return response.status === 204 ? (null as T) : ((await response.json()) as T)
}

export const walletApi = {
  dashboard: () => request<WalletDashboard>('/api/v1/wallet/dashboard'),
  quickIncome: (amount: number, description?: string, category = 'entrada') =>
    request('/api/v1/wallet/quick-income', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, description, category }),
    }),
  quickExpense: (amount: number, description?: string, category = 'outros') =>
    request('/api/v1/wallet/quick-expense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, description, category }),
    }),
  createBill: (title: string, amount: number, due_date: string, category = 'conta') =>
    request<WalletBill>('/api/v1/wallet/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, amount, due_date, category }),
    }),
  payBill: (billId: number) =>
    request(`/api/v1/wallet/bills/${billId}/pay`, {
      method: 'POST',
    }),
  createGoal: (title: string, target_amount: number, current_amount = 0, monthly_contribution = 0) =>
    request<WalletGoal>('/api/v1/wallet/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, target_amount, current_amount, monthly_contribution }),
    }),
  updateGoal: (goalId: number, payload: Partial<Pick<WalletGoal, 'current_amount' | 'monthly_contribution' | 'is_active'>>) =>
    request<WalletGoal>(`/api/v1/wallet/goals/${goalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  updateMonthlyTarget: (monthly_saving_target: number) =>
    request('/api/v1/wallet/monthly-target', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthly_saving_target }),
    }),
  canBuy: (product: string, amount: number) =>
    request<{ recommended: boolean; message: string; impact_saving_delta: number; projected_end_month_balance: number }>('/api/v1/wallet/can-buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product, amount }),
    }),
  runIntent: (command: string) =>
    request<{ intent: string; message: string; recommended?: boolean; impact_saving_delta?: number; projected_end_month_balance?: number }>('/api/v1/wallet/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    }),
}
