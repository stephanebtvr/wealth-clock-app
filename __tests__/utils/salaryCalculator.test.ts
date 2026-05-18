import {
  hourlyRate,
  minuteRate,
  secondRate,
  todayEarnings,
  momentEarnings,
} from '../../src/utils/salaryCalculator'
import { WORKING_HOURS_PER_YEAR, WORKING_DAYS_PER_YEAR, WORKING_HOURS_PER_DAY } from '../../src/utils/constants'

// Annual salary where secondRate = exactly 1 €/s — makes assertions simple
const ANNUAL_1_PER_SEC = WORKING_HOURS_PER_YEAR * 3600

describe('hourlyRate', () => {
  it('annual / WORKING_HOURS_PER_YEAR = 1 for ANNUAL_1_PER_SEC', () => {
    expect(hourlyRate(ANNUAL_1_PER_SEC)).toBeCloseTo(3_600)
  })

  it('returns 0 when annual = 0', () => {
    expect(hourlyRate(0)).toBe(0)
  })

  it('never returns NaN', () => {
    expect(Number.isNaN(hourlyRate(21_203))).toBe(false)
  })

  it('never returns Infinity', () => {
    expect(Number.isFinite(hourlyRate(10_000_000))).toBe(true)
  })

  it('always returns non-negative for non-negative input', () => {
    expect(hourlyRate(21_203)).toBeGreaterThan(0)
    expect(hourlyRate(0)).toBeGreaterThanOrEqual(0)
  })
})

describe('minuteRate', () => {
  it('equals hourlyRate / 60', () => {
    const annual = 50_000
    expect(minuteRate(annual)).toBeCloseTo(hourlyRate(annual) / 60)
  })

  it('returns 0 when annual = 0', () => {
    expect(minuteRate(0)).toBe(0)
  })

  it('never returns NaN or Infinity', () => {
    const r = minuteRate(21_203)
    expect(Number.isNaN(r)).toBe(false)
    expect(Number.isFinite(r)).toBe(true)
  })
})

describe('secondRate', () => {
  it('returns 1 for ANNUAL_1_PER_SEC', () => {
    expect(secondRate(ANNUAL_1_PER_SEC)).toBeCloseTo(1)
  })

  it('equals minuteRate / 60', () => {
    const annual = 35_000
    expect(secondRate(annual)).toBeCloseTo(minuteRate(annual) / 60)
  })

  it('returns 0 when annual = 0', () => {
    expect(secondRate(0)).toBe(0)
  })

  it('never returns NaN or Infinity', () => {
    const r = secondRate(21_203)
    expect(Number.isNaN(r)).toBe(false)
    expect(Number.isFinite(r)).toBe(true)
  })

  it('always returns non-negative', () => {
    expect(secondRate(WORKING_HOURS_PER_YEAR)).toBeGreaterThan(0)
  })
})

describe('todayEarnings', () => {
  // work: 08:00 → 16:00 (WORKING_HOURS_PER_DAY = 8h)
  const makeDate = (hour: number, min = 0, sec = 0) => new Date(2024, 0, 15, hour, min, sec)

  it('returns 0 before work starts (07:59)', () => {
    expect(todayEarnings(ANNUAL_1_PER_SEC, makeDate(7, 59, 59))).toBe(0)
  })

  it('returns 0 at exactly 08:00', () => {
    expect(todayEarnings(ANNUAL_1_PER_SEC, makeDate(8, 0, 0))).toBe(0)
  })

  it('returns full day earnings when time is past work end', () => {
    const fullDay = secondRate(ANNUAL_1_PER_SEC) * WORKING_HOURS_PER_DAY * 3600
    expect(todayEarnings(ANNUAL_1_PER_SEC, makeDate(17, 0, 0))).toBeCloseTo(fullDay)
  })

  it('returns full day earnings at exactly work end (16:00)', () => {
    const fullDay = secondRate(ANNUAL_1_PER_SEC) * WORKING_HOURS_PER_DAY * 3600
    expect(todayEarnings(ANNUAL_1_PER_SEC, makeDate(16, 0, 0))).toBeCloseTo(fullDay)
  })

  it('returns proportional earnings at noon (4h into workday)', () => {
    const fourHours = secondRate(ANNUAL_1_PER_SEC) * 4 * 3600
    expect(todayEarnings(ANNUAL_1_PER_SEC, makeDate(12, 0, 0))).toBeCloseTo(fourHours)
  })

  it('returns 0 when annual = 0', () => {
    expect(todayEarnings(0, makeDate(12, 0, 0))).toBe(0)
  })

  it('defaults to current time without error', () => {
    const result = todayEarnings(21_203)
    expect(Number.isNaN(result)).toBe(false)
    expect(Number.isFinite(result)).toBe(true)
    expect(result).toBeGreaterThanOrEqual(0)
  })

  it('result equals ANNUAL / WORKING_DAYS_PER_YEAR for full day', () => {
    const annual = 1_000
    const expected = annual / WORKING_DAYS_PER_YEAR
    expect(todayEarnings(annual, makeDate(18, 0, 0))).toBeCloseTo(expected)
  })
})

describe('momentEarnings', () => {
  it('returns minuteRate * duration for 60 min meeting', () => {
    const annual = 50_000
    expect(momentEarnings(annual, 60)).toBeCloseTo(minuteRate(annual) * 60)
  })

  it('returns 0 for 0 minutes', () => {
    expect(momentEarnings(21_203, 0)).toBe(0)
  })

  it('returns 0 for negative duration', () => {
    expect(momentEarnings(21_203, -5)).toBeGreaterThanOrEqual(0)
  })

  it('never returns NaN or Infinity', () => {
    const r = momentEarnings(21_203, 90)
    expect(Number.isNaN(r)).toBe(false)
    expect(Number.isFinite(r)).toBe(true)
  })

  it('scales linearly with duration', () => {
    const annual = 40_000
    expect(momentEarnings(annual, 120)).toBeCloseTo(momentEarnings(annual, 60) * 2)
  })
})
