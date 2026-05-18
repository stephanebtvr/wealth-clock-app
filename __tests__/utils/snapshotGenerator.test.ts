import { generateSnapshotData, type SnapshotData } from '../../src/utils/snapshotGenerator'
import {
  secondRate as calcSecondRate,
  minuteRate as calcMinuteRate,
  hourlyRate as calcHourlyRate,
  todayEarnings as calcTodayEarnings,
} from '../../src/utils/salaryCalculator'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const SALARY = 36_000
// Tuesday 19 May 2026, 14:00 — working hours (08:00–16:00)
const TEST_DATE = new Date('2026-05-19T14:00:00')
// Sunday 17 May 2026, 06:00 — before work hours, end of week
const SUNDAY_EARLY = new Date('2026-05-17T06:00:00')
// Monday 19 Jan 2026, 08:00 — first working day of the week, start of work
const MONDAY_START = new Date('2026-01-19T08:00:00')
// Jan 1 at 06:00 — first day of year, before work hours
const JAN_FIRST = new Date('2026-01-01T06:00:00')

// ─── Return shape ──────────────────────────────────────────────────────────────

describe('generateSnapshotData — return shape', () => {
  it('returns an object with all expected keys', () => {
    const data = generateSnapshotData(SALARY, TEST_DATE)
    const keys: (keyof SnapshotData)[] = [
      'todayEarnings',
      'weekEarnings',
      'monthEarnings',
      'yearEarnings',
      'secondRate',
      'minuteRate',
      'hourlyRate',
      'generatedAt',
    ]
    keys.forEach((key) => expect(data).toHaveProperty(key))
  })

  it('generatedAt equals now.getTime()', () => {
    const data = generateSnapshotData(SALARY, TEST_DATE)
    expect(data.generatedAt).toBe(TEST_DATE.getTime())
  })
})

// ─── Rates ─────────────────────────────────────────────────────────────────────

describe('generateSnapshotData — rates', () => {
  it('secondRate matches salaryCalculator.secondRate', () => {
    const data = generateSnapshotData(SALARY, TEST_DATE)
    expect(data.secondRate).toBeCloseTo(calcSecondRate(SALARY), 10)
  })

  it('minuteRate matches salaryCalculator.minuteRate', () => {
    const data = generateSnapshotData(SALARY, TEST_DATE)
    expect(data.minuteRate).toBeCloseTo(calcMinuteRate(SALARY), 10)
  })

  it('hourlyRate matches salaryCalculator.hourlyRate', () => {
    const data = generateSnapshotData(SALARY, TEST_DATE)
    expect(data.hourlyRate).toBeCloseTo(calcHourlyRate(SALARY), 10)
  })
})

// ─── Earnings consistency ──────────────────────────────────────────────────────

describe('generateSnapshotData — earnings consistency', () => {
  it('todayEarnings matches salaryCalculator.todayEarnings', () => {
    const data = generateSnapshotData(SALARY, TEST_DATE)
    expect(data.todayEarnings).toBeCloseTo(calcTodayEarnings(SALARY, TEST_DATE), 8)
  })

  it('weekEarnings >= todayEarnings', () => {
    const data = generateSnapshotData(SALARY, TEST_DATE)
    expect(data.weekEarnings).toBeGreaterThanOrEqual(data.todayEarnings)
  })

  it('monthEarnings >= weekEarnings', () => {
    const data = generateSnapshotData(SALARY, TEST_DATE)
    expect(data.monthEarnings).toBeGreaterThanOrEqual(data.weekEarnings)
  })

  it('yearEarnings >= monthEarnings', () => {
    const data = generateSnapshotData(SALARY, TEST_DATE)
    expect(data.yearEarnings).toBeGreaterThanOrEqual(data.monthEarnings)
  })

  it('yearEarnings is strictly less than the raw annual salary', () => {
    const data = generateSnapshotData(SALARY, TEST_DATE)
    expect(data.yearEarnings).toBeLessThan(SALARY)
  })

  it('weekEarnings > todayEarnings on a Tuesday at 14h (Monday completed)', () => {
    const data = generateSnapshotData(SALARY, TEST_DATE)
    expect(data.weekEarnings).toBeGreaterThan(data.todayEarnings)
  })
})

// ─── Edge cases: no work hours ─────────────────────────────────────────────────

describe('generateSnapshotData — before work hours', () => {
  it('todayEarnings is 0 before work starts (Sunday 6h)', () => {
    const data = generateSnapshotData(SALARY, SUNDAY_EARLY)
    expect(data.todayEarnings).toBe(0)
  })

  it('weekEarnings on Sunday equals full 5-day week earnings', () => {
    const data = generateSnapshotData(SALARY, SUNDAY_EARLY)
    const fullDay = 8 * calcHourlyRate(SALARY) // WORKING_HOURS_PER_DAY = 8
    expect(data.weekEarnings).toBeCloseTo(5 * fullDay, 6)
  })

  it('yearEarnings on Jan 1 at 6h equals 0 (nothing earned yet)', () => {
    const data = generateSnapshotData(SALARY, JAN_FIRST)
    expect(data.yearEarnings).toBe(0)
  })

  it('monthEarnings on the 1st at 6h equals 0 (no completed days)', () => {
    const data = generateSnapshotData(SALARY, JAN_FIRST)
    expect(data.monthEarnings).toBe(0)
  })

  it('weekEarnings on Monday at work-start equals todayEarnings (no prior days)', () => {
    const data = generateSnapshotData(SALARY, MONDAY_START)
    expect(data.weekEarnings).toBe(data.todayEarnings)
  })
})

// ─── Safety: zero / negative / invalid salary ──────────────────────────────────

describe('generateSnapshotData — safety', () => {
  it('returns all-zero earnings for salary = 0', () => {
    const data = generateSnapshotData(0, TEST_DATE)
    expect(data.todayEarnings).toBe(0)
    expect(data.weekEarnings).toBe(0)
    expect(data.monthEarnings).toBe(0)
    expect(data.yearEarnings).toBe(0)
  })

  it('returns zero rates for salary = 0', () => {
    const data = generateSnapshotData(0, TEST_DATE)
    expect(data.secondRate).toBe(0)
    expect(data.minuteRate).toBe(0)
    expect(data.hourlyRate).toBe(0)
  })

  it('returns all-zero earnings for negative salary', () => {
    const data = generateSnapshotData(-10_000, TEST_DATE)
    expect(data.todayEarnings).toBe(0)
    expect(data.yearEarnings).toBe(0)
  })

  it('no NaN in any field for a standard salary', () => {
    const data = generateSnapshotData(SALARY, TEST_DATE)
    Object.values(data).forEach((v) => expect(isNaN(v as number)).toBe(false))
  })

  it('no NaN in any field for salary = 0', () => {
    const data = generateSnapshotData(0, TEST_DATE)
    Object.values(data).forEach((v) => expect(isNaN(v as number)).toBe(false))
  })

  it('no Infinity in any field for a standard salary', () => {
    const data = generateSnapshotData(SALARY, TEST_DATE)
    Object.values(data).forEach((v) => expect(isFinite(v as number)).toBe(true))
  })
})
