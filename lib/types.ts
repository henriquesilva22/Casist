export interface UserState { name: string; dailyProgress: number; battery: number; freeMinutes: number }
export interface MMRState { value: number; rank: string; consistency: number }
export interface MotorState { suggestion: string; reason?: string }
export interface StudiesState { current: { subject: string; nextAction?: string }; history: Array<{ subject: string; when: string }>; statsTable: { headers: string[]; rows: Array<Array<string | number>> }; flashcardsPending: string[] }
export interface WalletState { saldoTotal: number; saldoLivre: number; limiteDiario: number; investimentos: Array<{ name: string; type: string; target: number }>; metaLancamento: { title: string; progress: number } }
export interface AcademiaState { today: { muscles: string[]; effort: number; previous?: string[] } }
export interface Postit { id: string; title: string; priority: number; color: string; completed?: boolean }
export interface LifeEvent { id: string; title: string; eventDate: string; category: string; notificationSound: string; reminderDays: number }
export interface EspelhoData { studied: string | null; trained: string[]; spent: number; hasData: boolean }
export interface FlashcardsState { total: number; active: number; accuracyPercent: number }
export interface LifeState { user: UserState; mmr: MMRState; motor: MotorState; estudos: StudiesState; carteira: WalletState; academia: AcademiaState; postits: Postit[]; events: LifeEvent[]; espelho: EspelhoData; flashcards: FlashcardsState }
