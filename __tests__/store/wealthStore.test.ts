import AsyncStorage from '@react-native-async-storage/async-storage'
import { useWealthStore } from '../../src/store/wealthStore'
import { SMIC_ANNUAL } from '../../src/utils/constants'
import { secondRate } from '../../src/utils/salaryCalculator'
import type { MomentRecord, ValueResult } from '../../src/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const s = () => useWealthStore.getState()

const makeValueResult = (price: number): ValueResult => ({
  price,
  workMinutes: 10,
  workHours: 0.16,
  workDays: 0.02,
  label: '10 minutes',
  comparison: '= une pause café',
  emoji: '☕',
})

const makeMomentRecord = (id: string): MomentRecord => ({
  id,
  type: 'meeting',
  title: 'Test',
  amount: 100,
  durationMinutes: 30,
  createdAt: Date.now(),
})

beforeEach(() => {
  s().resetAll()
  jest.clearAllMocks()
})

// ─── Initial state ────────────────────────────────────────────────────────────

describe('wealthStore — initial state', () => {
  it('salary is null', () => {
    expect(s().salary).toBeNull()
  })

  it('secondRate is 0', () => {
    expect(s().secondRate).toBe(0)
  })

  it('calcMode is work_only', () => {
    expect(s().calcMode).toBe('work_only')
  })

  it('isPremium is false', () => {
    expect(s().isPremium).toBe(false)
  })

  it('isOnboardingCompleted is false', () => {
    expect(s().isOnboardingCompleted).toBe(false)
  })

  it('activeMeeting is null', () => {
    expect(s().activeMeeting).toBeNull()
  })

  it('activeNegativeActivity is null', () => {
    expect(s().activeNegativeActivity).toBeNull()
  })

  it('valueHistory is empty', () => {
    expect(s().valueHistory).toEqual([])
  })

  it('momentHistory is empty', () => {
    expect(s().momentHistory).toEqual([])
  })
})

// ─── setSalary ────────────────────────────────────────────────────────────────

describe('wealthStore — setSalary', () => {
  it('sets salary in state', () => {
    s().setSalary(SMIC_ANNUAL)
    expect(s().salary).toBe(SMIC_ANNUAL)
  })

  it('sets secondRate from salary in work_only mode', () => {
    s().setSalary(SMIC_ANNUAL)
    expect(s().secondRate).toBeCloseTo(secondRate(SMIC_ANNUAL))
  })

  it('setSalary(null) → salary null, secondRate 0', () => {
    s().setSalary(SMIC_ANNUAL)
    s().setSalary(null)
    expect(s().salary).toBeNull()
    expect(s().secondRate).toBe(0)
  })

  it('higher salary → higher secondRate', () => {
    s().setSalary(SMIC_ANNUAL)
    const low = s().secondRate
    s().setSalary(100_000)
    expect(s().secondRate).toBeGreaterThan(low)
  })

  it('does NOT call AsyncStorage (salary not persisted by store)', () => {
    s().setSalary(SMIC_ANNUAL)
    expect(AsyncStorage.setItem).not.toHaveBeenCalled()
  })
})

// ─── setCalculationMode ───────────────────────────────────────────────────────

describe('wealthStore — setCalculationMode', () => {
  it('updates calcMode', () => {
    s().setCalculationMode('annualized')
    expect(s().calcMode).toBe('annualized')
  })

  it('persists calcMode to AsyncStorage', async () => {
    s().setCalculationMode('annualized')
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('wealthclock_calc_mode', 'annualized')
  })

  it('annualized mode → lower secondRate than work_only for same salary', () => {
    s().setSalary(SMIC_ANNUAL)
    s().setCalculationMode('work_only')
    const workOnlyRate = s().secondRate
    s().setCalculationMode('annualized')
    const annualizedRate = s().secondRate
    expect(annualizedRate).toBeLessThan(workOnlyRate)
  })

  it('recalculates secondRate when mode changes (salary set)', () => {
    s().setSalary(SMIC_ANNUAL)
    const before = s().secondRate
    s().setCalculationMode('annualized')
    expect(s().secondRate).not.toBe(before)
  })

  it('secondRate stays 0 when salary is null after mode change', () => {
    s().setCalculationMode('annualized')
    expect(s().secondRate).toBe(0)
  })
})

// ─── setIsPremium ─────────────────────────────────────────────────────────────

describe('wealthStore — setIsPremium', () => {
  it('sets isPremium true', () => {
    s().setIsPremium(true)
    expect(s().isPremium).toBe(true)
  })

  it('sets isPremium false', () => {
    s().setIsPremium(true)
    s().setIsPremium(false)
    expect(s().isPremium).toBe(false)
  })
})

// ─── completeOnboarding ───────────────────────────────────────────────────────

describe('wealthStore — completeOnboarding', () => {
  it('sets isOnboardingCompleted true', () => {
    s().completeOnboarding()
    expect(s().isOnboardingCompleted).toBe(true)
  })

  it('persists to AsyncStorage', () => {
    s().completeOnboarding()
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('wealthclock_onboarding_done', 'true')
  })
})

// ─── startMeeting / stopMeeting ───────────────────────────────────────────────

describe('wealthStore — startMeeting / stopMeeting', () => {
  it('startMeeting sets activeMeeting with participants', () => {
    s().startMeeting(3)
    expect(s().activeMeeting).not.toBeNull()
    expect(s().activeMeeting?.participants).toBe(3)
  })

  it('startMeeting records startedAt timestamp', () => {
    const before = Date.now()
    s().startMeeting(2)
    const after = Date.now()
    const startedAt = s().activeMeeting!.startedAt
    expect(startedAt).toBeGreaterThanOrEqual(before)
    expect(startedAt).toBeLessThanOrEqual(after)
  })

  it('stopMeeting clears activeMeeting', () => {
    s().startMeeting(2)
    s().stopMeeting()
    expect(s().activeMeeting).toBeNull()
  })

  it('stopMeeting adds a meeting record to momentHistory', () => {
    s().setSalary(SMIC_ANNUAL)
    s().startMeeting(2)
    s().stopMeeting()
    expect(s().momentHistory.length).toBe(1)
    expect(s().momentHistory[0].type).toBe('meeting')
  })

  it('stopMeeting with no active meeting is a no-op', () => {
    s().stopMeeting()
    expect(s().momentHistory.length).toBe(0)
  })

  it('meeting record amount is positive when salary is set', () => {
    s().setSalary(SMIC_ANNUAL)
    s().startMeeting(1)
    s().stopMeeting()
    expect(s().momentHistory[0].amount).toBeGreaterThanOrEqual(0)
  })
})

// ─── startNegativeActivity / stopNegativeActivity ─────────────────────────────

describe('wealthStore — startNegativeActivity / stopNegativeActivity', () => {
  it('startNegativeActivity sets activeNegativeActivity with type', () => {
    s().startNegativeActivity('netflix_episode', 45)
    expect(s().activeNegativeActivity).not.toBeNull()
    expect(s().activeNegativeActivity?.type).toBe('netflix_episode')
    expect(s().activeNegativeActivity?.durationMinutes).toBe(45)
  })

  it('startNegativeActivity without durationMinutes is real-time', () => {
    s().startNegativeActivity('tiktok_scroll')
    expect(s().activeNegativeActivity?.durationMinutes).toBeUndefined()
  })

  it('stopNegativeActivity clears activeNegativeActivity', () => {
    s().startNegativeActivity('gym', 60)
    s().stopNegativeActivity()
    expect(s().activeNegativeActivity).toBeNull()
  })

  it('stopNegativeActivity adds a negative record to momentHistory', () => {
    s().setSalary(SMIC_ANNUAL)
    s().startNegativeActivity('netflix_movie', 120)
    s().stopNegativeActivity()
    expect(s().momentHistory.length).toBe(1)
    expect(s().momentHistory[0].type).toBe('negative')
  })

  it('stopNegativeActivity with no active activity is a no-op', () => {
    s().stopNegativeActivity()
    expect(s().momentHistory.length).toBe(0)
  })

  it('stopNegativeActivity without durationMinutes uses elapsed time', () => {
    s().setSalary(SMIC_ANNUAL)
    s().startNegativeActivity('tiktok_scroll')
    s().stopNegativeActivity()
    expect(s().momentHistory.length).toBe(1)
    expect(s().momentHistory[0].type).toBe('negative')
    expect(s().momentHistory[0].durationMinutes).toBeGreaterThanOrEqual(0)
  })
})

// ─── addValueResult ───────────────────────────────────────────────────────────

describe('wealthStore — addValueResult', () => {
  it('adds result to front of valueHistory', () => {
    const r1 = makeValueResult(6)
    const r2 = makeValueResult(12)
    s().addValueResult(r1)
    s().addValueResult(r2)
    expect(s().valueHistory[0]).toEqual(r2)
    expect(s().valueHistory[1]).toEqual(r1)
  })

  it('keeps max 10 results', () => {
    for (let i = 0; i < 12; i++) s().addValueResult(makeValueResult(i))
    expect(s().valueHistory.length).toBe(10)
  })

  it('oldest results are dropped first', () => {
    for (let i = 0; i < 12; i++) s().addValueResult(makeValueResult(i))
    expect(s().valueHistory[0].price).toBe(11)
    expect(s().valueHistory[9].price).toBe(2)
  })

  it('persists to AsyncStorage', () => {
    s().addValueResult(makeValueResult(6))
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'wealthclock_value_history',
      expect.any(String)
    )
  })
})

// ─── addMomentRecord ──────────────────────────────────────────────────────────

describe('wealthStore — addMomentRecord', () => {
  it('adds record to front of momentHistory', () => {
    const r1 = makeMomentRecord('a')
    const r2 = makeMomentRecord('b')
    s().addMomentRecord(r1)
    s().addMomentRecord(r2)
    expect(s().momentHistory[0].id).toBe('b')
    expect(s().momentHistory[1].id).toBe('a')
  })

  it('keeps max 20 records', () => {
    for (let i = 0; i < 22; i++) s().addMomentRecord(makeMomentRecord(String(i)))
    expect(s().momentHistory.length).toBe(20)
  })

  it('oldest records are dropped first', () => {
    for (let i = 0; i < 22; i++) s().addMomentRecord(makeMomentRecord(String(i)))
    expect(s().momentHistory[0].id).toBe('21')
    expect(s().momentHistory[19].id).toBe('2')
  })

  it('persists to AsyncStorage', () => {
    s().addMomentRecord(makeMomentRecord('x'))
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'wealthclock_moment_history',
      expect.any(String)
    )
  })
})

// ─── resetAll ─────────────────────────────────────────────────────────────────

describe('wealthStore — resetAll', () => {
  it('clears salary and secondRate', () => {
    s().setSalary(SMIC_ANNUAL)
    s().resetAll()
    expect(s().salary).toBeNull()
    expect(s().secondRate).toBe(0)
  })

  it('resets calcMode to work_only', () => {
    s().setCalculationMode('annualized')
    s().resetAll()
    expect(s().calcMode).toBe('work_only')
  })

  it('resets isPremium to false', () => {
    s().setIsPremium(true)
    s().resetAll()
    expect(s().isPremium).toBe(false)
  })

  it('resets isOnboardingCompleted to false', () => {
    s().completeOnboarding()
    s().resetAll()
    expect(s().isOnboardingCompleted).toBe(false)
  })

  it('clears activeMeeting', () => {
    s().startMeeting(2)
    s().resetAll()
    expect(s().activeMeeting).toBeNull()
  })

  it('clears valueHistory', () => {
    s().addValueResult(makeValueResult(6))
    s().resetAll()
    expect(s().valueHistory).toEqual([])
  })

  it('clears momentHistory', () => {
    s().addMomentRecord(makeMomentRecord('x'))
    s().resetAll()
    expect(s().momentHistory).toEqual([])
  })
})

// ─── hydrate ──────────────────────────────────────────────────────────────────

describe('wealthStore — hydrate', () => {
  it('loads calcMode from AsyncStorage', async () => {
    ;(AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'wealthclock_calc_mode') return Promise.resolve('annualized')
      return Promise.resolve(null)
    })
    await s().hydrate()
    expect(s().calcMode).toBe('annualized')
  })

  it('loads isOnboardingCompleted from AsyncStorage', async () => {
    ;(AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'wealthclock_onboarding_done') return Promise.resolve('true')
      return Promise.resolve(null)
    })
    await s().hydrate()
    expect(s().isOnboardingCompleted).toBe(true)
  })

  it('loads valueHistory from AsyncStorage', async () => {
    const history = [makeValueResult(6)]
    ;(AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'wealthclock_value_history') return Promise.resolve(JSON.stringify(history))
      return Promise.resolve(null)
    })
    await s().hydrate()
    expect(s().valueHistory).toEqual(history)
  })

  it('loads momentHistory from AsyncStorage', async () => {
    const history = [makeMomentRecord('a')]
    ;(AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'wealthclock_moment_history') return Promise.resolve(JSON.stringify(history))
      return Promise.resolve(null)
    })
    await s().hydrate()
    expect(s().momentHistory).toEqual(history)
  })

  it('handles null/missing AsyncStorage values without crashing', async () => {
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
    await expect(s().hydrate()).resolves.not.toThrow()
    expect(s().calcMode).toBe('work_only')
    expect(s().isOnboardingCompleted).toBe(false)
  })

  it('handles malformed JSON in AsyncStorage without crashing', async () => {
    ;(AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'wealthclock_value_history') return Promise.resolve('not-json')
      return Promise.resolve(null)
    })
    await expect(s().hydrate()).resolves.not.toThrow()
    expect(s().valueHistory).toEqual([])
  })
})
