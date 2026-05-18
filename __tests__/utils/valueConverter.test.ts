import { convertPriceToTime } from '../../src/utils/valueConverter'
import { SMIC_ANNUAL, WORKING_HOURS_PER_DAY } from '../../src/utils/constants'
import { minuteRate } from '../../src/utils/salaryCalculator'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Price that yields exactly `targetMinutes` of work at given salary */
const priceFor = (targetMinutes: number, annualSalary: number) =>
  minuteRate(annualSalary) * targetMinutes

// ─── Shape & types ────────────────────────────────────────────────────────────

describe('convertPriceToTime — return shape', () => {
  it('returns all required fields', () => {
    const r = convertPriceToTime(6, SMIC_ANNUAL)
    expect(r).toHaveProperty('price')
    expect(r).toHaveProperty('workMinutes')
    expect(r).toHaveProperty('workHours')
    expect(r).toHaveProperty('workDays')
    expect(r).toHaveProperty('label')
    expect(r).toHaveProperty('comparison')
    expect(r).toHaveProperty('emoji')
  })

  it('echoes back the price', () => {
    expect(convertPriceToTime(42, SMIC_ANNUAL).price).toBe(42)
  })

  it('workHours = workMinutes / 60', () => {
    const r = convertPriceToTime(6, SMIC_ANNUAL)
    expect(r.workHours).toBeCloseTo(r.workMinutes / 60)
  })

  it('workDays = workMinutes / (WORKING_HOURS_PER_DAY * 60)', () => {
    const r = convertPriceToTime(6, SMIC_ANNUAL)
    expect(r.workDays).toBeCloseTo(r.workMinutes / (WORKING_HOURS_PER_DAY * 60))
  })
})

// ─── Core calculation ─────────────────────────────────────────────────────────

describe('convertPriceToTime — calculation', () => {
  it('6€ for SMIC requires more minutes than for 50 000€ salary', () => {
    const smic = convertPriceToTime(6, SMIC_ANNUAL)
    const high = convertPriceToTime(6, 50_000)
    expect(smic.workMinutes).toBeGreaterThan(high.workMinutes)
  })

  it('6€ for SMIC ≈ 29.6 min (price / minuteRate)', () => {
    const r = convertPriceToTime(6, SMIC_ANNUAL)
    const expected = 6 / minuteRate(SMIC_ANNUAL)
    expect(r.workMinutes).toBeCloseTo(expected, 1)
  })

  it('6€ for 50 000€/an ≈ 12.6 min', () => {
    const r = convertPriceToTime(6, 50_000)
    const expected = 6 / minuteRate(50_000)
    expect(r.workMinutes).toBeCloseTo(expected, 1)
  })

  it('workMinutes scales linearly with price', () => {
    const r12 = convertPriceToTime(12, SMIC_ANNUAL)
    const r6 = convertPriceToTime(6, SMIC_ANNUAL)
    expect(r12.workMinutes).toBeCloseTo(r6.workMinutes * 2, 1)
  })
})

// ─── Edge cases (no NaN / Infinity) ──────────────────────────────────────────

describe('convertPriceToTime — edge cases', () => {
  it('0,01€ → workMinutes is finite and positive', () => {
    const r = convertPriceToTime(0.01, SMIC_ANNUAL)
    expect(Number.isNaN(r.workMinutes)).toBe(false)
    expect(Number.isFinite(r.workMinutes)).toBe(true)
    expect(r.workMinutes).toBeGreaterThan(0)
  })

  it('10 000 000€ → not NaN, not Infinity', () => {
    const r = convertPriceToTime(10_000_000, SMIC_ANNUAL)
    expect(Number.isNaN(r.workMinutes)).toBe(false)
    expect(Number.isFinite(r.workMinutes)).toBe(true)
    expect(Number.isNaN(r.workDays)).toBe(false)
    expect(Number.isFinite(r.workDays)).toBe(true)
  })

  it('annualSalary = 0 → workMinutes = 0, no crash', () => {
    const r = convertPriceToTime(6, 0)
    expect(Number.isNaN(r.workMinutes)).toBe(false)
    expect(r.workMinutes).toBe(0)
  })

  it('price = Infinity → workMinutes = 0 (isFinite guard)', () => {
    const r = convertPriceToTime(Infinity, SMIC_ANNUAL)
    expect(r.workMinutes).toBe(0)
    expect(Number.isNaN(r.workMinutes)).toBe(false)
  })
})

// ─── Labels ───────────────────────────────────────────────────────────────────

describe('convertPriceToTime — label', () => {
  it('< 1 min → "moins d\'une minute"', () => {
    // 0.01€ at SMIC ≈ 0.049 min
    const r = convertPriceToTime(0.01, SMIC_ANNUAL)
    expect(r.label).toBe("moins d'une minute")
  })

  it('1–59 min → "X minutes"', () => {
    // price for ~25 min
    const price = priceFor(25, SMIC_ANNUAL)
    const r = convertPriceToTime(price, SMIC_ANNUAL)
    expect(r.label).toBe('25 minutes')
  })

  it('1 min exactly → "1 minutes"', () => {
    const price = priceFor(1, SMIC_ANNUAL)
    const r = convertPriceToTime(price, SMIC_ANNUAL)
    expect(r.label).toBe('1 minutes')
  })

  it('59 min exactly → "59 minutes"', () => {
    const price = priceFor(59, SMIC_ANNUAL)
    const r = convertPriceToTime(price, SMIC_ANNUAL)
    expect(r.label).toBe('59 minutes')
  })

  it('1h–7h59 with minutes → "Xh Ymin"', () => {
    // price for 90 min = 1h30
    const price = priceFor(90, SMIC_ANNUAL)
    const r = convertPriceToTime(price, SMIC_ANNUAL)
    expect(r.label).toBe('1h 30min')
  })

  it('exactly Xh (no minutes) → "Xh" without minutes part', () => {
    // price for exactly 120 min = 2h
    const price = priceFor(120, SMIC_ANNUAL)
    const r = convertPriceToTime(price, SMIC_ANNUAL)
    expect(r.label).toBe('2h')
  })

  it('7h59 (479 min) → "Xh Ymin" (still in hours range)', () => {
    const price = priceFor(479, SMIC_ANNUAL)
    const r = convertPriceToTime(price, SMIC_ANNUAL)
    expect(r.label).toMatch(/^\d+h \d+min$/)
  })

  it('≥ 8h (480 min) → "X,X jours"', () => {
    const price = priceFor(480, SMIC_ANNUAL)
    const r = convertPriceToTime(price, SMIC_ANNUAL)
    expect(r.label).toMatch(/jours$/)
    expect(r.label).toContain(',')
  })

  it('large amount → "X,X jours" with comma decimal', () => {
    const price = priceFor(960, SMIC_ANNUAL) // 2 full work days
    const r = convertPriceToTime(price, SMIC_ANNUAL)
    expect(r.label).toBe('2,0 jours')
  })
})

// ─── Comparisons ─────────────────────────────────────────────────────────────

describe('convertPriceToTime — comparison', () => {
  it('< 30 min → "= une pause café"', () => {
    const price = priceFor(15, SMIC_ANNUAL)
    expect(convertPriceToTime(price, SMIC_ANNUAL).comparison).toBe('= une pause café')
  })

  it('30–60 min → "= une pause déjeuner"', () => {
    const price = priceFor(45, SMIC_ANNUAL)
    expect(convertPriceToTime(price, SMIC_ANNUAL).comparison).toBe('= une pause déjeuner')
  })

  it('exactly 30 min → "= une pause déjeuner"', () => {
    const price = priceFor(30, SMIC_ANNUAL)
    expect(convertPriceToTime(price, SMIC_ANNUAL).comparison).toBe('= une pause déjeuner')
  })

  it('1h–4h → "= X% de ta journée"', () => {
    // 2h = 120 min / (8*60) = 25%
    const price = priceFor(120, SMIC_ANNUAL)
    expect(convertPriceToTime(price, SMIC_ANNUAL).comparison).toBe('= 25% de ta journée')
  })

  it('4h–8h → "= une demi-journée"', () => {
    const price = priceFor(300, SMIC_ANNUAL) // 5h
    expect(convertPriceToTime(price, SMIC_ANNUAL).comparison).toBe('= une demi-journée')
  })

  it('exactly 4h (240 min) boundary → "= une demi-journée"', () => {
    const price = priceFor(240, SMIC_ANNUAL)
    expect(convertPriceToTime(price, SMIC_ANNUAL).comparison).toBe('= une demi-journée')
  })

  it('≥ 8h → "= X,X journées"', () => {
    const price = priceFor(480, SMIC_ANNUAL) // exactly 1 full day
    expect(convertPriceToTime(price, SMIC_ANNUAL).comparison).toBe('= 1,0 journées')
  })

  it('multi-day → "= X,X journées"', () => {
    const price = priceFor(960, SMIC_ANNUAL) // 2 full days
    expect(convertPriceToTime(price, SMIC_ANNUAL).comparison).toBe('= 2,0 journées')
  })
})

// ─── Emoji ────────────────────────────────────────────────────────────────────

describe('convertPriceToTime — emoji', () => {
  it('returns a non-empty emoji string', () => {
    const r = convertPriceToTime(6, SMIC_ANNUAL)
    expect(typeof r.emoji).toBe('string')
    expect(r.emoji.length).toBeGreaterThan(0)
  })

  it('very quick purchase (< 1 min) has an emoji', () => {
    const r = convertPriceToTime(0.01, SMIC_ANNUAL)
    expect(r.emoji.length).toBeGreaterThan(0)
  })

  it('multi-day purchase has an emoji', () => {
    const r = convertPriceToTime(10_000_000, SMIC_ANNUAL)
    expect(r.emoji.length).toBeGreaterThan(0)
  })
})
