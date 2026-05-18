import {
  WORKING_DAYS_PER_YEAR,
  WORKING_HOURS_PER_DAY,
  WORKING_HOURS_PER_YEAR,
  COUNTER_INTERVAL_MS,
  SMIC_ANNUAL,
  MEDIAN_SALARY_FRANCE,
} from '../../src/utils/constants'

describe('constants', () => {
  it('WORKING_DAYS_PER_YEAR = 218', () => {
    expect(WORKING_DAYS_PER_YEAR).toBe(218)
  })

  it('WORKING_HOURS_PER_DAY = 8', () => {
    expect(WORKING_HOURS_PER_DAY).toBe(8)
  })

  it('WORKING_HOURS_PER_YEAR = WORKING_DAYS_PER_YEAR * WORKING_HOURS_PER_DAY', () => {
    expect(WORKING_HOURS_PER_YEAR).toBe(WORKING_DAYS_PER_YEAR * WORKING_HOURS_PER_DAY)
  })

  it('WORKING_HOURS_PER_YEAR = 1744', () => {
    expect(WORKING_HOURS_PER_YEAR).toBe(1744)
  })

  it('COUNTER_INTERVAL_MS = 100', () => {
    expect(COUNTER_INTERVAL_MS).toBe(100)
  })

  it('SMIC_ANNUAL = 21 203', () => {
    expect(SMIC_ANNUAL).toBe(21_203)
  })

  it('MEDIAN_SALARY_FRANCE = 26 500', () => {
    expect(MEDIAN_SALARY_FRANCE).toBe(26_500)
  })
})
