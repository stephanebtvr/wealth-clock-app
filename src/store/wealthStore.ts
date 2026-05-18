import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { STORAGE_KEYS } from '../types'
import { WORKING_HOURS_PER_YEAR } from '../utils/constants'
import type {
  CalcMode,
  ValueResult,
  MomentRecord,
  ActiveMeeting,
  ActiveNegativeActivity,
  NegativeActivityType,
  WealthState,
} from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_VALUE_HISTORY = 10
const MAX_MOMENT_HISTORY = 20
const HOURS_PER_YEAR_ANNUALIZED = 8_760

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeSecondRate(salary: number | null, calcMode: CalcMode): number {
  if (!salary) return 0
  const divisor =
    calcMode === 'annualized'
      ? HOURS_PER_YEAR_ANNUALIZED * 3_600
      : WORKING_HOURS_PER_YEAR * 3_600
  return salary / divisor
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface WealthStore extends WealthState {
  setSalary: (salary: number | null) => void
  setCalculationMode: (mode: CalcMode) => void
  setIsPremium: (isPremium: boolean) => void
  completeOnboarding: () => void
  startMeeting: (participants: number) => void
  stopMeeting: () => void
  startNegativeActivity: (type: NegativeActivityType, durationMinutes?: number) => void
  stopNegativeActivity: () => void
  addValueResult: (result: ValueResult) => void
  addMomentRecord: (record: MomentRecord) => void
  removeValueResult: (price: number) => void
  removeMomentRecord: (id: string) => void
  clearHistory: () => void
  resetAll: () => void
  hydrate: () => Promise<void>
}

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_STATE: WealthState = {
  salary: null,
  secondRate: 0,
  calcMode: 'work_only',
  isPremium: false,
  isOnboardingCompleted: false,
  activeMeeting: null,
  activeNegativeActivity: null,
  valueHistory: [],
  momentHistory: [],
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useWealthStore = create<WealthStore>((set, get) => ({
  ...INITIAL_STATE,

  setSalary: (salary) => {
    set({ salary, secondRate: computeSecondRate(salary, get().calcMode) })
  },

  setCalculationMode: (calcMode) => {
    const secondRate = computeSecondRate(get().salary, calcMode)
    set({ calcMode, secondRate })
    AsyncStorage.setItem(STORAGE_KEYS.CALC_MODE, calcMode)
  },

  setIsPremium: (isPremium) => {
    set({ isPremium })
  },

  completeOnboarding: () => {
    set({ isOnboardingCompleted: true })
    AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_DONE, 'true')
  },

  startMeeting: (participants) => {
    const meeting: ActiveMeeting = { startedAt: Date.now(), participants }
    set({ activeMeeting: meeting })
  },

  stopMeeting: () => {
    const { activeMeeting, secondRate: rate } = get()
    if (!activeMeeting) return
    const durationMs = Date.now() - activeMeeting.startedAt
    const durationMinutes = Math.max(0, Math.round(durationMs / 1000 / 60))
    const record: MomentRecord = {
      id: Date.now().toString(),
      type: 'meeting',
      title: `Réunion — ${activeMeeting.participants} participant${activeMeeting.participants > 1 ? 's' : ''}`,
      amount: Math.max(0, (durationMs / 1000) * rate * activeMeeting.participants),
      durationMinutes,
      createdAt: Date.now(),
    }
    set({ activeMeeting: null })
    get().addMomentRecord(record)
  },

  startNegativeActivity: (type, durationMinutes?) => {
    const activity: ActiveNegativeActivity = { type, startedAt: Date.now(), durationMinutes }
    set({ activeNegativeActivity: activity })
  },

  stopNegativeActivity: () => {
    const { activeNegativeActivity, secondRate: rate } = get()
    if (!activeNegativeActivity) return
    const durationMs = Date.now() - activeNegativeActivity.startedAt
    const durationMinutes = Math.max(
      0,
      activeNegativeActivity.durationMinutes ?? Math.round(durationMs / 1000 / 60)
    )
    const record: MomentRecord = {
      id: Date.now().toString(),
      type: 'negative',
      title: activeNegativeActivity.type,
      amount: Math.max(0, (durationMs / 1000) * rate),
      durationMinutes,
      createdAt: Date.now(),
    }
    set({ activeNegativeActivity: null })
    get().addMomentRecord(record)
  },

  addValueResult: (result) => {
    const valueHistory = [result, ...get().valueHistory].slice(0, MAX_VALUE_HISTORY)
    set({ valueHistory })
    AsyncStorage.setItem(STORAGE_KEYS.VALUE_HISTORY, JSON.stringify(valueHistory))
  },

  addMomentRecord: (record) => {
    const momentHistory = [record, ...get().momentHistory].slice(0, MAX_MOMENT_HISTORY)
    set({ momentHistory })
    AsyncStorage.setItem(STORAGE_KEYS.MOMENT_HISTORY, JSON.stringify(momentHistory))
  },

  removeValueResult: (price) => {
    const valueHistory = get().valueHistory.filter((r) => r.price !== price)
    set({ valueHistory })
    AsyncStorage.setItem(STORAGE_KEYS.VALUE_HISTORY, JSON.stringify(valueHistory))
  },

  removeMomentRecord: (id) => {
    const momentHistory = get().momentHistory.filter((r) => r.id !== id)
    set({ momentHistory })
    AsyncStorage.setItem(STORAGE_KEYS.MOMENT_HISTORY, JSON.stringify(momentHistory))
  },

  clearHistory: () => {
    set({ valueHistory: [], momentHistory: [] })
    AsyncStorage.setItem(STORAGE_KEYS.VALUE_HISTORY, JSON.stringify([]))
    AsyncStorage.setItem(STORAGE_KEYS.MOMENT_HISTORY, JSON.stringify([]))
  },

  resetAll: () => {
    set({ ...INITIAL_STATE })
  },

  hydrate: async () => {
    try {
      const [calcModeRaw, onboardingRaw, valueRaw, momentRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CALC_MODE),
        AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_DONE),
        AsyncStorage.getItem(STORAGE_KEYS.VALUE_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.MOMENT_HISTORY),
      ])

      const calcMode = (calcModeRaw as CalcMode | null) ?? 'work_only'
      const isOnboardingCompleted = onboardingRaw === 'true'

      let valueHistory: ValueResult[] = []
      let momentHistory: MomentRecord[] = []

      try {
        if (valueRaw) valueHistory = JSON.parse(valueRaw) as ValueResult[]
      } catch {}
      try {
        if (momentRaw) momentHistory = JSON.parse(momentRaw) as MomentRecord[]
      } catch {}

      const secondRate = computeSecondRate(get().salary, calcMode)
      set({ calcMode, isOnboardingCompleted, valueHistory, momentHistory, secondRate })
    } catch {}
  },
}))
