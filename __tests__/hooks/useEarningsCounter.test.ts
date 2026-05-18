import { renderHook, act } from '@testing-library/react-native'
import { AppState, type AppStateStatus } from 'react-native'
import { useEarningsCounter } from '../../src/hooks/useEarningsCounter'
import { SMIC_ANNUAL, COUNTER_INTERVAL_MS } from '../../src/utils/constants'
import { secondRate as calcSecondRate } from '../../src/utils/salaryCalculator'

// ─── Mock store ───────────────────────────────────────────────────────────────

jest.mock('../../src/store/wealthStore')
import { useWealthStore } from '../../src/store/wealthStore'
const mockUseWealthStore = useWealthStore as jest.MockedFunction<typeof useWealthStore>

// ─── Mock AppState ────────────────────────────────────────────────────────────

let appStateListener: ((state: AppStateStatus) => void) | null = null

jest.spyOn(AppState, 'addEventListener').mockImplementation(
  (_event, handler) => {
    appStateListener = handler as (state: AppStateStatus) => void
    return { remove: jest.fn() }
  }
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockStore(salary: number | null) {
  const rate = salary ? calcSecondRate(salary) : 0
  mockUseWealthStore.mockReturnValue({
    salary,
    secondRate: rate,
  } as ReturnType<typeof useWealthStore>)
}

beforeEach(() => {
  jest.useFakeTimers()
  appStateListener = null
  jest.clearAllMocks()
  mockStore(null)
})

afterEach(() => {
  jest.useRealTimers()
})

// ─── Return shape ─────────────────────────────────────────────────────────────

describe('useEarningsCounter — return shape', () => {
  it('returns accumulatedRef, accumulatedToday, secondRate, minuteRate, hourlyRate', () => {
    const { result } = renderHook(() => useEarningsCounter())
    expect(result.current).toHaveProperty('accumulatedRef')
    expect(result.current).toHaveProperty('accumulatedToday')
    expect(result.current).toHaveProperty('secondRate')
    expect(result.current).toHaveProperty('minuteRate')
    expect(result.current).toHaveProperty('hourlyRate')
  })

  it('accumulatedRef is a mutable ref object', () => {
    const { result } = renderHook(() => useEarningsCounter())
    expect(typeof result.current.accumulatedRef).toBe('object')
    expect('current' in result.current.accumulatedRef).toBe(true)
  })
})

// ─── Rates — no salary ────────────────────────────────────────────────────────

describe('useEarningsCounter — no salary', () => {
  it('secondRate is 0 when no salary', () => {
    mockStore(null)
    const { result } = renderHook(() => useEarningsCounter())
    expect(result.current.secondRate).toBe(0)
  })

  it('minuteRate is 0 when no salary', () => {
    mockStore(null)
    const { result } = renderHook(() => useEarningsCounter())
    expect(result.current.minuteRate).toBe(0)
  })

  it('hourlyRate is 0 when no salary', () => {
    mockStore(null)
    const { result } = renderHook(() => useEarningsCounter())
    expect(result.current.hourlyRate).toBe(0)
  })

  it('accumulatedToday is 0 when no salary', () => {
    mockStore(null)
    const { result } = renderHook(() => useEarningsCounter())
    expect(result.current.accumulatedToday).toBe(0)
  })
})

// ─── Rates — with salary ──────────────────────────────────────────────────────

describe('useEarningsCounter — with salary', () => {
  it('secondRate matches store secondRate', () => {
    mockStore(SMIC_ANNUAL)
    const { result } = renderHook(() => useEarningsCounter())
    expect(result.current.secondRate).toBeCloseTo(calcSecondRate(SMIC_ANNUAL))
  })

  it('minuteRate = secondRate × 60', () => {
    mockStore(SMIC_ANNUAL)
    const { result } = renderHook(() => useEarningsCounter())
    expect(result.current.minuteRate).toBeCloseTo(result.current.secondRate * 60)
  })

  it('hourlyRate = secondRate × 3600', () => {
    mockStore(SMIC_ANNUAL)
    const { result } = renderHook(() => useEarningsCounter())
    expect(result.current.hourlyRate).toBeCloseTo(result.current.secondRate * 3_600)
  })

  it('accumulatedToday is finite and non-negative', () => {
    mockStore(SMIC_ANNUAL)
    const { result } = renderHook(() => useEarningsCounter())
    expect(Number.isFinite(result.current.accumulatedToday)).toBe(true)
    expect(result.current.accumulatedToday).toBeGreaterThanOrEqual(0)
  })

  it('accumulatedRef.current matches accumulatedToday on init', () => {
    mockStore(SMIC_ANNUAL)
    const { result } = renderHook(() => useEarningsCounter())
    expect(result.current.accumulatedRef.current).toBeCloseTo(result.current.accumulatedToday, 2)
  })
})

// ─── Interval accumulation ────────────────────────────────────────────────────

describe('useEarningsCounter — interval', () => {
  it('accumulatedRef.current increases after one tick', () => {
    mockStore(SMIC_ANNUAL)
    const { result } = renderHook(() => useEarningsCounter())
    const before = result.current.accumulatedRef.current
    act(() => { jest.advanceTimersByTime(COUNTER_INTERVAL_MS) })
    expect(result.current.accumulatedRef.current).toBeGreaterThan(before)
  })

  it('each tick adds secondRate / 10', () => {
    mockStore(SMIC_ANNUAL)
    const { result } = renderHook(() => useEarningsCounter())
    const before = result.current.accumulatedRef.current
    act(() => { jest.advanceTimersByTime(COUNTER_INTERVAL_MS) })
    const delta = result.current.accumulatedRef.current - before
    expect(delta).toBeCloseTo(result.current.secondRate / 10, 10)
  })

  it('interval does not fire when secondRate is 0', () => {
    mockStore(null)
    const { result } = renderHook(() => useEarningsCounter())
    const before = result.current.accumulatedRef.current
    act(() => { jest.advanceTimersByTime(COUNTER_INTERVAL_MS * 5) })
    expect(result.current.accumulatedRef.current).toBe(before)
  })

  it('clears interval on unmount', () => {
    mockStore(SMIC_ANNUAL)
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
    const { unmount } = renderHook(() => useEarningsCounter())
    unmount()
    expect(clearIntervalSpy).toHaveBeenCalled()
  })
})

// ─── AppState handling ────────────────────────────────────────────────────────

describe('useEarningsCounter — AppState', () => {
  it('registers AppState listener on mount', () => {
    mockStore(SMIC_ANNUAL)
    renderHook(() => useEarningsCounter())
    expect(AppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('removes AppState listener on unmount', () => {
    mockStore(SMIC_ANNUAL)
    const removeSpy = jest.fn()
    ;(AppState.addEventListener as jest.Mock).mockReturnValueOnce({ remove: removeSpy })
    const { unmount } = renderHook(() => useEarningsCounter())
    unmount()
    expect(removeSpy).toHaveBeenCalled()
  })

  it('recalculates accumulatedRef on foreground', () => {
    mockStore(SMIC_ANNUAL)
    const { result } = renderHook(() => useEarningsCounter())

    // Manually corrupt the accumulated value
    result.current.accumulatedRef.current = 9999

    act(() => {
      appStateListener?.('active' as AppStateStatus)
    })

    // Should be recalculated (not 9999)
    expect(result.current.accumulatedRef.current).not.toBe(9999)
    expect(result.current.accumulatedRef.current).toBeGreaterThanOrEqual(0)
  })

  it('updates accumulatedToday state on foreground', () => {
    mockStore(SMIC_ANNUAL)
    const { result } = renderHook(() => useEarningsCounter())

    act(() => {
      appStateListener?.('active' as AppStateStatus)
    })

    expect(result.current.accumulatedToday).toBeGreaterThanOrEqual(0)
    expect(Number.isFinite(result.current.accumulatedToday)).toBe(true)
  })

  it('does NOT recalculate on background state', () => {
    mockStore(SMIC_ANNUAL)
    const { result } = renderHook(() => useEarningsCounter())
    const before = result.current.accumulatedRef.current

    act(() => {
      appStateListener?.('background' as AppStateStatus)
    })

    // accumulatedRef should not be reset (only 'active' triggers recalc)
    expect(result.current.accumulatedRef.current).toBeCloseTo(before, 10)
  })

  it('does NOT recalculate on foreground when salary is null', () => {
    mockStore(null)
    const { result } = renderHook(() => useEarningsCounter())
    const before = result.current.accumulatedRef.current

    act(() => {
      appStateListener?.('active' as AppStateStatus)
    })

    expect(result.current.accumulatedRef.current).toBe(before)
  })
})
