import {
  SALARY_PROFILES,
  getProfileById,
  getProfilesByCategory,
  calculateProfileSecondRate,
} from '../../src/utils/salaryProfiles'
import { SMIC_ANNUAL } from '../../src/utils/constants'
import { secondRate } from '../../src/utils/salaryCalculator'
import type { SalaryProfile } from '../../src/types'

const VALID_CATEGORIES: SalaryProfile['category'][] = [
  'reference',
  'celebrity',
  'profession',
  'ceo',
]

// ─── Data integrity ───────────────────────────────────────────────────────────

describe('SALARY_PROFILES — data integrity', () => {
  it('has at least 12 profiles', () => {
    expect(SALARY_PROFILES.length).toBeGreaterThanOrEqual(12)
  })

  it('all ids are unique', () => {
    const ids = SALARY_PROFILES.map((p) => p.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('all ids are non-empty strings', () => {
    SALARY_PROFILES.forEach((p) => {
      expect(typeof p.id).toBe('string')
      expect(p.id.length).toBeGreaterThan(0)
    })
  })

  it('all names are non-empty strings', () => {
    SALARY_PROFILES.forEach((p) => {
      expect(typeof p.name).toBe('string')
      expect(p.name.length).toBeGreaterThan(0)
    })
  })

  it('all emoji are non-empty strings', () => {
    SALARY_PROFILES.forEach((p) => {
      expect(typeof p.emoji).toBe('string')
      expect(p.emoji.length).toBeGreaterThan(0)
    })
  })

  it('all annualSalary are strictly positive', () => {
    SALARY_PROFILES.forEach((p) => {
      expect(p.annualSalary).toBeGreaterThan(0)
      expect(Number.isFinite(p.annualSalary)).toBe(true)
      expect(Number.isNaN(p.annualSalary)).toBe(false)
    })
  })

  it('all categories are valid', () => {
    SALARY_PROFILES.forEach((p) => {
      expect(VALID_CATEGORIES).toContain(p.category)
    })
  })

  it('all sources are non-empty strings', () => {
    SALARY_PROFILES.forEach((p) => {
      expect(typeof p.source).toBe('string')
      expect(p.source.length).toBeGreaterThan(0)
    })
  })

  it('all 4 categories are represented', () => {
    const presentCategories = new Set(SALARY_PROFILES.map((p) => p.category))
    VALID_CATEGORIES.forEach((cat) => {
      expect(presentCategories.has(cat)).toBe(true)
    })
  })
})

// ─── Required profiles ────────────────────────────────────────────────────────

describe('SALARY_PROFILES — required profiles', () => {
  it('includes a profile with annualSalary === SMIC_ANNUAL (21 203)', () => {
    const smic = SALARY_PROFILES.find((p) => p.annualSalary === SMIC_ANNUAL)
    expect(smic).toBeDefined()
    expect(smic?.category).toBe('reference')
  })

  it('includes Mbappé with annualSalary > 10 000 000', () => {
    const mbappe = SALARY_PROFILES.find(
      (p) => p.id === 'mbappe' || p.name.toLowerCase().includes('mbapp')
    )
    expect(mbappe).toBeDefined()
    expect(mbappe!.annualSalary).toBeGreaterThan(10_000_000)
  })

  it('includes at least 2 reference profiles', () => {
    expect(getProfilesByCategory('reference').length).toBeGreaterThanOrEqual(2)
  })

  it('includes at least 2 celebrity profiles', () => {
    expect(getProfilesByCategory('celebrity').length).toBeGreaterThanOrEqual(2)
  })

  it('includes at least 3 profession profiles', () => {
    expect(getProfilesByCategory('profession').length).toBeGreaterThanOrEqual(3)
  })

  it('includes at least 2 ceo profiles', () => {
    expect(getProfilesByCategory('ceo').length).toBeGreaterThanOrEqual(2)
  })
})

// ─── getProfileById ───────────────────────────────────────────────────────────

describe('getProfileById', () => {
  it('returns the profile for a known id', () => {
    const first = SALARY_PROFILES[0]
    const result = getProfileById(first.id)
    expect(result).toEqual(first)
  })

  it('returns undefined for an unknown id', () => {
    expect(getProfileById('__nonexistent__')).toBeUndefined()
  })

  it('returns the correct profile by id for every profile', () => {
    SALARY_PROFILES.forEach((p) => {
      const found = getProfileById(p.id)
      expect(found).toBeDefined()
      expect(found?.id).toBe(p.id)
    })
  })
})

// ─── getProfilesByCategory ────────────────────────────────────────────────────

describe('getProfilesByCategory', () => {
  it('returns only profiles of the requested category', () => {
    VALID_CATEGORIES.forEach((cat) => {
      const result = getProfilesByCategory(cat)
      result.forEach((p) => expect(p.category).toBe(cat))
    })
  })

  it('returns a non-empty array for each valid category', () => {
    VALID_CATEGORIES.forEach((cat) => {
      expect(getProfilesByCategory(cat).length).toBeGreaterThan(0)
    })
  })

  it('all results together equal the full array length', () => {
    const total = VALID_CATEGORIES.reduce(
      (sum, cat) => sum + getProfilesByCategory(cat).length,
      0
    )
    expect(total).toBe(SALARY_PROFILES.length)
  })
})

// ─── calculateProfileSecondRate ───────────────────────────────────────────────

describe('calculateProfileSecondRate', () => {
  it('never returns NaN for any profile', () => {
    SALARY_PROFILES.forEach((p) => {
      expect(Number.isNaN(calculateProfileSecondRate(p))).toBe(false)
    })
  })

  it('never returns Infinity for any profile', () => {
    SALARY_PROFILES.forEach((p) => {
      expect(Number.isFinite(calculateProfileSecondRate(p))).toBe(true)
    })
  })

  it('always returns a positive value for any profile', () => {
    SALARY_PROFILES.forEach((p) => {
      expect(calculateProfileSecondRate(p)).toBeGreaterThan(0)
    })
  })

  it('equals secondRate(profile.annualSalary)', () => {
    SALARY_PROFILES.forEach((p) => {
      expect(calculateProfileSecondRate(p)).toBeCloseTo(secondRate(p.annualSalary))
    })
  })

  it('higher salary → higher secondRate', () => {
    const smic = SALARY_PROFILES.find((p) => p.annualSalary === SMIC_ANNUAL)!
    const mbappe = SALARY_PROFILES.find((p) => p.annualSalary > 10_000_000)!
    expect(calculateProfileSecondRate(mbappe)).toBeGreaterThan(calculateProfileSecondRate(smic))
  })
})
