import { renderHook, act } from '@testing-library/react-native'
import { AppState, type AppStateStatus } from 'react-native'
import { useNegativeCounter, type NegativeConfig } from '../../src/hooks/useNegativeCounter'
import { minuteRate, secondRate } from '../../src/utils/salaryCalculator'
import { COUNTER_INTERVAL_MS } from '../../src/utils/constants'

// ─── Mock AppState ─────────────────────────────────────────────────────────────

let appStateListener: ((state: AppStateStatus) => void) | null = null

jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => {
  appStateListener = handler as (state: AppStateStatus) => void
  return { remove: jest.fn() }
})

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const SALARY = 36_000
const START_TIME = 1_000_000

function makeLiveConfig(overrides: Partial<NegativeConfig> = {}): NegativeConfig {
  return { activityType: 'tiktok_scroll', annualSalary: SALARY, startedAt: START_TIME, ...overrides }
}

function makeSimulatedConfig(
  durationMinutes = 45,
  overrides: Partial<NegativeConfig> = {}
): NegativeConfig {
  return {
    activityType: 'netflix_episode',
    annualSalary: SALARY,
    startedAt: START_TIME,
    durationMinutes,
    ...overrides,
  }
}

// ─── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(START_TIME)
  appStateListener = null
  jest.clearAllMocks()
})

afterEach(() => {
  jest.useRealTimers()
})

// ─── Return shape ──────────────────────────────────────────────────────────────

describe('useNegativeCounter — return shape', () => {
  it('returns all expected properties', () => {
    const { result } = renderHook(() => useNegativeCounter(null))
    expect(result.current).toHaveProperty('lossRef')
    expect(result.current).toHaveProperty('elapsedSecondsRef')
    expect(result.current).toHaveProperty('currentLoss')
    expect(result.current).toHaveProperty('elapsedSeconds')
    expect(result.current).toHaveProperty('isRunning')
    expect(result.current).toHaveProperty('stop')
  })

  it('lossRef and elapsedSecondsRef are mutable ref objects', () => {
    const { result } = renderHook(() => useNegativeCounter(null))
    expect(typeof result.current.lossRef).toBe('object')
    expect('current' in result.current.lossRef).toBe(true)
    expect(typeof result.current.elapsedSecondsRef).toBe('object')
    expect('current' in result.current.elapsedSecondsRef).toBe(true)
  })

  it('stop is a function', () => {
    const { result } = renderHook(() => useNegativeCounter(null))
    expect(typeof result.current.stop).toBe('function')
  })
})

// ─── No config ─────────────────────────────────────────────────────────────────

describe('useNegativeCounter — no config', () => {
  it('lossRef.current is 0', () => {
    const { result } = renderHook(() => useNegativeCounter(null))
    expect(result.current.lossRef.current).toBe(0)
  })

  it('currentLoss is 0', () => {
    const { result } = renderHook(() => useNegativeCounter(null))
    expect(result.current.currentLoss).toBe(0)
  })

  it('elapsedSecondsRef.current is 0', () => {
    const { result } = renderHook(() => useNegativeCounter(null))
    expect(result.current.elapsedSecondsRef.current).toBe(0)
  })

  it('elapsedSeconds is 0', () => {
    const { result } = renderHook(() => useNegativeCounter(null))
    expect(result.current.elapsedSeconds).toBe(0)
  })

  it('isRunning is false', () => {
    const { result } = renderHook(() => useNegativeCounter(null))
    expect(result.current.isRunning).toBe(false)
  })

  it('no interval runs with null config', () => {
    const { result } = renderHook(() => useNegativeCounter(null))
    act(() => { jest.advanceTimersByTime(COUNTER_INTERVAL_MS * 5) })
    expect(result.current.lossRef.current).toBe(0)
  })
})

// ─── Simulated mode ────────────────────────────────────────────────────────────

describe('useNegativeCounter — simulated mode', () => {
  it('isRunning is false in simulated mode', () => {
    const { result } = renderHook(() => useNegativeCounter(makeSimulatedConfig()))
    expect(result.current.isRunning).toBe(false)
  })

  it('lossRef.current equals minuteRate × durationMinutes immediately', () => {
    const DURATION = 45
    const { result } = renderHook(() => useNegativeCounter(makeSimulatedConfig(DURATION)))
    const expected = minuteRate(SALARY) * DURATION
    expect(result.current.lossRef.current).toBeCloseTo(expected, 6)
  })

  it('elapsedSecondsRef.current equals durationMinutes × 60', () => {
    const DURATION = 45
    const { result } = renderHook(() => useNegativeCounter(makeSimulatedConfig(DURATION)))
    expect(result.current.elapsedSecondsRef.current).toBe(DURATION * 60)
  })

  it('currentLoss equals minuteRate × durationMinutes immediately', () => {
    const DURATION = 45
    const { result } = renderHook(() => useNegativeCounter(makeSimulatedConfig(DURATION)))
    const expected = minuteRate(SALARY) * DURATION
    expect(result.current.currentLoss).toBeCloseTo(expected, 6)
  })

  it('elapsedSeconds equals durationMinutes × 60', () => {
    const DURATION = 45
    const { result } = renderHook(() => useNegativeCounter(makeSimulatedConfig(DURATION)))
    expect(result.current.elapsedSeconds).toBe(DURATION * 60)
  })

  it('no interval runs in simulated mode — lossRef stays fixed', () => {
    const DURATION = 45
    const { result } = renderHook(() => useNegativeCounter(makeSimulatedConfig(DURATION)))
    const initialLoss = result.current.lossRef.current
    act(() => { jest.advanceTimersByTime(COUNTER_INTERVAL_MS * 5) })
    expect(result.current.lossRef.current).toBe(initialLoss)
  })
})

// ─── Live mode ─────────────────────────────────────────────────────────────────

describe('useNegativeCounter — live mode', () => {
  it('isRunning is true in live mode', () => {
    const { result } = renderHook(() => useNegativeCounter(makeLiveConfig()))
    expect(result.current.isRunning).toBe(true)
  })

  it('lossRef.current increases after one tick', () => {
    const { result } = renderHook(() => useNegativeCounter(makeLiveConfig()))
    act(() => { jest.advanceTimersByTime(COUNTER_INTERVAL_MS) })
    expect(result.current.lossRef.current).toBeGreaterThan(0)
  })

  it('elapsedSecondsRef.current increases after one tick', () => {
    const { result } = renderHook(() => useNegativeCounter(makeLiveConfig()))
    act(() => { jest.advanceTimersByTime(COUNTER_INTERVAL_MS) })
    expect(result.current.elapsedSecondsRef.current).toBeGreaterThan(0)
  })

  it('lossRef.current = secondRate × elapsed after 60s', () => {
    const { result } = renderHook(() => useNegativeCounter(makeLiveConfig()))
    act(() => { jest.advanceTimersByTime(60_000) })
    const expected = secondRate(SALARY) * 60
    expect(result.current.lossRef.current).toBeCloseTo(expected, 4)
  })

  it('elapsedSecondsRef.current matches wall clock after 60s', () => {
    const { result } = renderHook(() => useNegativeCounter(makeLiveConfig()))
    act(() => { jest.advanceTimersByTime(60_000) })
    expect(result.current.elapsedSecondsRef.current).toBeCloseTo(60, 0)
  })
})

// ─── Stop ──────────────────────────────────────────────────────────────────────

describe('useNegativeCounter — stop', () => {
  it('stop() sets isRunning to false', () => {
    const { result } = renderHook(() => useNegativeCounter(makeLiveConfig()))
    act(() => { result.current.stop() })
    expect(result.current.isRunning).toBe(false)
  })

  it('stop() halts the interval — lossRef frozen after stop', () => {
    const { result } = renderHook(() => useNegativeCounter(makeLiveConfig()))
    act(() => { jest.advanceTimersByTime(1_000) })
    act(() => { result.current.stop() })
    const loss = result.current.lossRef.current
    act(() => { jest.advanceTimersByTime(COUNTER_INTERVAL_MS * 5) })
    expect(result.current.lossRef.current).toBe(loss)
  })

  it('stop() flushes currentLoss state', () => {
    const { result } = renderHook(() => useNegativeCounter(makeLiveConfig()))
    act(() => { jest.advanceTimersByTime(60_000) })
    act(() => { result.current.stop() })
    expect(result.current.currentLoss).toBeGreaterThan(0)
  })

  it('stop() flushes elapsedSeconds state', () => {
    const { result } = renderHook(() => useNegativeCounter(makeLiveConfig()))
    act(() => { jest.advanceTimersByTime(60_000) })
    act(() => { result.current.stop() })
    expect(result.current.elapsedSeconds).toBeCloseTo(60, 0)
  })
})

// ─── AppState ──────────────────────────────────────────────────────────────────

describe('useNegativeCounter — AppState', () => {
  it('registers an AppState listener on mount', () => {
    renderHook(() => useNegativeCounter(makeLiveConfig()))
    expect(AppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('removes AppState listener on unmount', () => {
    const removeSpy = jest.fn()
    ;(AppState.addEventListener as jest.Mock).mockReturnValueOnce({ remove: removeSpy })
    const { unmount } = renderHook(() => useNegativeCounter(makeLiveConfig()))
    unmount()
    expect(removeSpy).toHaveBeenCalled()
  })

  it('recalculates lossRef from wall clock on foreground in live mode', () => {
    const { result } = renderHook(() => useNegativeCounter(makeLiveConfig()))
    act(() => { jest.advanceTimersByTime(10_000) })
    result.current.lossRef.current = 9_999
    act(() => { appStateListener?.('active' as AppStateStatus) })
    expect(result.current.lossRef.current).not.toBe(9_999)
    expect(result.current.lossRef.current).toBeCloseTo(secondRate(SALARY) * 10, 4)
  })

  it('updates currentLoss state on foreground in live mode', () => {
    const { result } = renderHook(() => useNegativeCounter(makeLiveConfig()))
    act(() => { jest.advanceTimersByTime(60_000) })
    act(() => { appStateListener?.('active' as AppStateStatus) })
    expect(result.current.currentLoss).toBeGreaterThan(0)
  })

  it('does not recalculate on background state', () => {
    const { result } = renderHook(() => useNegativeCounter(makeLiveConfig()))
    result.current.lossRef.current = 9_999
    act(() => { appStateListener?.('background' as AppStateStatus) })
    expect(result.current.lossRef.current).toBe(9_999)
  })

  it('does not recalculate when config is null', () => {
    const { result } = renderHook(() => useNegativeCounter(null))
    result.current.lossRef.current = 9_999
    act(() => { appStateListener?.('active' as AppStateStatus) })
    expect(result.current.lossRef.current).toBe(9_999)
  })
})

// ─── Cleanup ───────────────────────────────────────────────────────────────────

describe('useNegativeCounter — cleanup', () => {
  it('clears interval on unmount in live mode', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
    const { unmount } = renderHook(() => useNegativeCounter(makeLiveConfig()))
    unmount()
    expect(clearIntervalSpy).toHaveBeenCalled()
  })
})
