import { renderHook, act } from '@testing-library/react-native'
import { AppState, type AppStateStatus } from 'react-native'
import { useMeetingCounter, type MeetingConfig } from '../../src/hooks/useMeetingCounter'
import { minuteRate } from '../../src/utils/salaryCalculator'
import { COUNTER_INTERVAL_MS } from '../../src/utils/constants'

// ─── Mock AppState ────────────────────────────────────────────────────────────

let appStateListener: ((state: AppStateStatus) => void) | null = null

jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => {
  appStateListener = handler as (state: AppStateStatus) => void
  return { remove: jest.fn() }
})

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SALARY = 36_000
const PARTICIPANTS = 2
const START_TIME = 1_000_000

function makeConfig(overrides: Partial<MeetingConfig> = {}): MeetingConfig {
  return { participants: PARTICIPANTS, averageSalary: SALARY, startedAt: START_TIME, ...overrides }
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(START_TIME)
  appStateListener = null
  jest.clearAllMocks()
})

afterEach(() => {
  jest.useRealTimers()
})

// ─── Return shape ─────────────────────────────────────────────────────────────

describe('useMeetingCounter — return shape', () => {
  it('returns all expected properties', () => {
    const { result } = renderHook(() => useMeetingCounter(null))
    expect(result.current).toHaveProperty('costRef')
    expect(result.current).toHaveProperty('elapsedSecondsRef')
    expect(result.current).toHaveProperty('currentCost')
    expect(result.current).toHaveProperty('elapsedSeconds')
    expect(result.current).toHaveProperty('isRunning')
    expect(result.current).toHaveProperty('pause')
    expect(result.current).toHaveProperty('resume')
    expect(result.current).toHaveProperty('stop')
  })

  it('costRef and elapsedSecondsRef are mutable ref objects', () => {
    const { result } = renderHook(() => useMeetingCounter(null))
    expect(typeof result.current.costRef).toBe('object')
    expect('current' in result.current.costRef).toBe(true)
    expect(typeof result.current.elapsedSecondsRef).toBe('object')
    expect('current' in result.current.elapsedSecondsRef).toBe(true)
  })

  it('pause, resume and stop are functions', () => {
    const { result } = renderHook(() => useMeetingCounter(null))
    expect(typeof result.current.pause).toBe('function')
    expect(typeof result.current.resume).toBe('function')
    expect(typeof result.current.stop).toBe('function')
  })
})

// ─── No config ────────────────────────────────────────────────────────────────

describe('useMeetingCounter — no config', () => {
  it('costRef.current starts at 0', () => {
    const { result } = renderHook(() => useMeetingCounter(null))
    expect(result.current.costRef.current).toBe(0)
  })

  it('elapsedSecondsRef.current starts at 0', () => {
    const { result } = renderHook(() => useMeetingCounter(null))
    expect(result.current.elapsedSecondsRef.current).toBe(0)
  })

  it('currentCost is 0', () => {
    const { result } = renderHook(() => useMeetingCounter(null))
    expect(result.current.currentCost).toBe(0)
  })

  it('elapsedSeconds is 0', () => {
    const { result } = renderHook(() => useMeetingCounter(null))
    expect(result.current.elapsedSeconds).toBe(0)
  })

  it('isRunning is false', () => {
    const { result } = renderHook(() => useMeetingCounter(null))
    expect(result.current.isRunning).toBe(false)
  })

  it('interval does not run when config is null', () => {
    const { result } = renderHook(() => useMeetingCounter(null))
    act(() => { jest.advanceTimersByTime(COUNTER_INTERVAL_MS * 5) })
    expect(result.current.costRef.current).toBe(0)
    expect(result.current.elapsedSecondsRef.current).toBe(0)
  })
})

// ─── With config ──────────────────────────────────────────────────────────────

describe('useMeetingCounter — with config', () => {
  it('isRunning is true when config is provided', () => {
    const { result } = renderHook(() => useMeetingCounter(makeConfig()))
    expect(result.current.isRunning).toBe(true)
  })

  it('elapsedSecondsRef.current increases after one tick', () => {
    const { result } = renderHook(() => useMeetingCounter(makeConfig()))
    act(() => { jest.advanceTimersByTime(COUNTER_INTERVAL_MS) })
    expect(result.current.elapsedSecondsRef.current).toBeGreaterThan(0)
  })

  it('elapsedSecondsRef.current matches elapsed wall time', () => {
    const { result } = renderHook(() => useMeetingCounter(makeConfig()))
    act(() => { jest.advanceTimersByTime(5_000) })
    expect(result.current.elapsedSecondsRef.current).toBeCloseTo(5, 0)
  })

  it('costRef.current is positive after one tick', () => {
    const { result } = renderHook(() => useMeetingCounter(makeConfig()))
    act(() => { jest.advanceTimersByTime(COUNTER_INTERVAL_MS) })
    expect(result.current.costRef.current).toBeGreaterThan(0)
  })

  it('costRef.current = participants × minuteRate(salary) × elapsedMin after 60s', () => {
    const { result } = renderHook(() => useMeetingCounter(makeConfig()))
    act(() => { jest.advanceTimersByTime(60_000) })
    const expected = PARTICIPANTS * minuteRate(SALARY) * 1
    expect(result.current.costRef.current).toBeCloseTo(expected, 4)
  })

  it('costRef.current scales linearly with participant count', () => {
    const { result: r1 } = renderHook(() => useMeetingCounter(makeConfig({ participants: 1 })))
    const { result: r4 } = renderHook(() => useMeetingCounter(makeConfig({ participants: 4 })))
    act(() => { jest.advanceTimersByTime(60_000) })
    expect(r4.current.costRef.current).toBeCloseTo(r1.current.costRef.current * 4, 4)
  })
})

// ─── Pause / Resume ───────────────────────────────────────────────────────────

describe('useMeetingCounter — pause / resume', () => {
  it('pause() sets isRunning to false', () => {
    const { result } = renderHook(() => useMeetingCounter(makeConfig()))
    act(() => { result.current.pause() })
    expect(result.current.isRunning).toBe(false)
  })

  it('pause() stops the interval — refs do not change after pause', () => {
    const { result } = renderHook(() => useMeetingCounter(makeConfig()))
    act(() => { jest.advanceTimersByTime(1_000) })
    act(() => { result.current.pause() })
    const cost = result.current.costRef.current
    const elapsed = result.current.elapsedSecondsRef.current
    act(() => { jest.advanceTimersByTime(COUNTER_INTERVAL_MS * 5) })
    expect(result.current.costRef.current).toBe(cost)
    expect(result.current.elapsedSecondsRef.current).toBe(elapsed)
  })

  it('resume() sets isRunning to true', () => {
    const { result } = renderHook(() => useMeetingCounter(makeConfig()))
    act(() => { result.current.pause() })
    act(() => { result.current.resume() })
    expect(result.current.isRunning).toBe(true)
  })

  it('resume() restarts the interval', () => {
    const { result } = renderHook(() => useMeetingCounter(makeConfig()))
    act(() => { result.current.pause() })
    const costAfterPause = result.current.costRef.current
    act(() => { result.current.resume() })
    act(() => { jest.advanceTimersByTime(COUNTER_INTERVAL_MS) })
    expect(result.current.costRef.current).toBeGreaterThan(costAfterPause)
  })

  it('elapsed time preserves prior seconds after pause + resume', () => {
    const { result } = renderHook(() => useMeetingCounter(makeConfig()))
    act(() => { jest.advanceTimersByTime(30_000) }) // 30s elapsed
    act(() => { result.current.pause() })
    act(() => { jest.advanceTimersByTime(10_000) }) // 10s wall-clock pause
    act(() => { result.current.resume() })
    act(() => { jest.advanceTimersByTime(30_000) }) // 30s more
    // Expect total active elapsed ≈ 60s (30 before + 30 after, wall = 70s)
    expect(result.current.elapsedSecondsRef.current).toBeCloseTo(60, 0)
  })
})

// ─── Stop ─────────────────────────────────────────────────────────────────────

describe('useMeetingCounter — stop', () => {
  it('stop() sets isRunning to false', () => {
    const { result } = renderHook(() => useMeetingCounter(makeConfig()))
    act(() => { result.current.stop() })
    expect(result.current.isRunning).toBe(false)
  })

  it('stop() halts the interval — refs frozen after stop', () => {
    const { result } = renderHook(() => useMeetingCounter(makeConfig()))
    act(() => { jest.advanceTimersByTime(1_000) })
    act(() => { result.current.stop() })
    const cost = result.current.costRef.current
    act(() => { jest.advanceTimersByTime(COUNTER_INTERVAL_MS * 5) })
    expect(result.current.costRef.current).toBe(cost)
  })

  it('stop() flushes currentCost state', () => {
    const { result } = renderHook(() => useMeetingCounter(makeConfig()))
    act(() => { jest.advanceTimersByTime(60_000) })
    act(() => { result.current.stop() })
    expect(result.current.currentCost).toBeGreaterThan(0)
  })

  it('stop() flushes elapsedSeconds state', () => {
    const { result } = renderHook(() => useMeetingCounter(makeConfig()))
    act(() => { jest.advanceTimersByTime(60_000) })
    act(() => { result.current.stop() })
    expect(result.current.elapsedSeconds).toBeCloseTo(60, 0)
  })
})

// ─── AppState ─────────────────────────────────────────────────────────────────

describe('useMeetingCounter — AppState', () => {
  it('registers an AppState listener on mount', () => {
    renderHook(() => useMeetingCounter(makeConfig()))
    expect(AppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('removes AppState listener on unmount', () => {
    const removeSpy = jest.fn()
    ;(AppState.addEventListener as jest.Mock).mockReturnValueOnce({ remove: removeSpy })
    const { unmount } = renderHook(() => useMeetingCounter(makeConfig()))
    unmount()
    expect(removeSpy).toHaveBeenCalled()
  })

  it('recalculates elapsedSecondsRef from wall clock on foreground', () => {
    const { result } = renderHook(() => useMeetingCounter(makeConfig()))
    act(() => { jest.advanceTimersByTime(10_000) })
    result.current.elapsedSecondsRef.current = 9999
    act(() => { appStateListener?.('active' as AppStateStatus) })
    expect(result.current.elapsedSecondsRef.current).not.toBe(9999)
    expect(result.current.elapsedSecondsRef.current).toBeCloseTo(10, 0)
  })

  it('recalculates costRef on foreground', () => {
    const { result } = renderHook(() => useMeetingCounter(makeConfig()))
    act(() => { jest.advanceTimersByTime(60_000) })
    result.current.costRef.current = 0
    act(() => { appStateListener?.('active' as AppStateStatus) })
    expect(result.current.costRef.current).toBeGreaterThan(0)
  })

  it('updates currentCost state on foreground', () => {
    const { result } = renderHook(() => useMeetingCounter(makeConfig()))
    act(() => { jest.advanceTimersByTime(60_000) })
    act(() => { appStateListener?.('active' as AppStateStatus) })
    expect(result.current.currentCost).toBeGreaterThan(0)
  })

  it('updates elapsedSeconds state on foreground', () => {
    const { result } = renderHook(() => useMeetingCounter(makeConfig()))
    act(() => { jest.advanceTimersByTime(60_000) })
    act(() => { appStateListener?.('active' as AppStateStatus) })
    expect(result.current.elapsedSeconds).toBeGreaterThan(0)
  })

  it('does not recalculate on background state', () => {
    const { result } = renderHook(() => useMeetingCounter(makeConfig()))
    act(() => { jest.advanceTimersByTime(1_000) })
    result.current.costRef.current = 9999
    act(() => { appStateListener?.('background' as AppStateStatus) })
    expect(result.current.costRef.current).toBe(9999)
  })

  it('does not recalculate when config is null', () => {
    const { result } = renderHook(() => useMeetingCounter(null))
    result.current.costRef.current = 9999
    act(() => { appStateListener?.('active' as AppStateStatus) })
    expect(result.current.costRef.current).toBe(9999)
  })
})

// ─── Cleanup ──────────────────────────────────────────────────────────────────

describe('useMeetingCounter — cleanup', () => {
  it('clears interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
    const { unmount } = renderHook(() => useMeetingCounter(makeConfig()))
    unmount()
    expect(clearIntervalSpy).toHaveBeenCalled()
  })
})
