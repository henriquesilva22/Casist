import { LifeState } from './types'

export const initialMockState: LifeState = {
  user: { name: '', dailyProgress: 0, battery: 0, freeMinutes: 0 },
  mmr: { value: 0, rank: '', consistency: 0 },
  motor: { suggestion: 'Adicione seu primeiro objetivo para eu te orientar.', reason: 'Sem dados iniciais' },
  estudos: { current: { subject: '' }, history: [], statsTable: { headers: ['Valor (x)', 'fi', 'fi%'], rows: [] }, flashcardsPending: [] },
  carteira: { saldoTotal: 0, saldoLivre: 0, limiteDiario: 0, investimentos: [], metaLancamento: { title: '', progress: 0 } },
  academia: { today: { muscles: [], effort: 0, previous: [] } },
  postits: [],
  events: [],
  espelho: { studied: null, trained: [], spent: 0, hasData: false },
  flashcards: { total: 0, active: 0, accuracyPercent: 0 },
}
