// ─── Result monad ────────────────────────────────────────────────────────────

export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E }

// ─── Salary & calculation ─────────────────────────────────────────────────────

export type CalcMode = 'work_only' | 'annualized'

export interface SalaryProfile {
  id: string
  name: string
  emoji: string
  annualSalary: number
  category: 'reference' | 'celebrity' | 'profession' | 'ceo'
  source: string
}

// ─── Value converter ──────────────────────────────────────────────────────────

export interface ValueResult {
  price: number
  workMinutes: number
  workHours: number
  workDays: number
  label: string
  comparison: string
}

// ─── History records ──────────────────────────────────────────────────────────

export interface MomentRecord {
  id: string
  type: 'meeting' | 'value' | 'negative' | 'compare'
  title: string
  amount: number
  durationMinutes?: number
  createdAt: number
}

// ─── Store ────────────────────────────────────────────────────────────────────

export interface WealthState {
  secondRate: number
  calcMode: CalcMode
  isPremium: boolean
  valueHistory: ValueResult[]
  momentHistory: MomentRecord[]
}

// ─── AsyncStorage keys ────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  ONBOARDING_DONE: 'wealthclock_onboarding_done',
  CALC_MODE: 'wealthclock_calc_mode',
  VALUE_HISTORY: 'wealthclock_value_history',
  MOMENT_HISTORY: 'wealthclock_moment_history',
} as const

// ─── Share modes ──────────────────────────────────────────────────────────────

export type ShareMode = 'counter' | 'value' | 'meeting' | 'negative' | 'compare'
