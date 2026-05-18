import {
  validateSalary,
  validatePrice,
  validateParticipants,
  validateDuration,
} from '../../src/utils/validators'

describe('validateSalary', () => {
  it('accepts minimum boundary (1 000)', () => {
    const r = validateSalary(1_000)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe(1_000)
  })

  it('accepts maximum boundary (10 000 000)', () => {
    const r = validateSalary(10_000_000)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe(10_000_000)
  })

  it('accepts typical salary (SMIC ~21 203)', () => {
    const r = validateSalary(21_203)
    expect(r.ok).toBe(true)
  })

  it('rejects below minimum (999)', () => {
    const r = validateSalary(999)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBeTruthy()
  })

  it('rejects above maximum (10 000 001)', () => {
    const r = validateSalary(10_000_001)
    expect(r.ok).toBe(false)
  })

  it('rejects zero', () => {
    expect(validateSalary(0).ok).toBe(false)
  })

  it('rejects negative', () => {
    expect(validateSalary(-1).ok).toBe(false)
  })

  it('rejects NaN', () => {
    expect(validateSalary(NaN).ok).toBe(false)
  })

  it('parses valid string input ("35000")', () => {
    const r = validateSalary('35000')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe(35_000)
  })

  it('parses string with spaces ("35 000")', () => {
    const r = validateSalary('35 000')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe(35_000)
  })

  it('rejects non-numeric string', () => {
    expect(validateSalary('abc').ok).toBe(false)
  })
})

describe('validatePrice', () => {
  it('accepts minimum boundary (0,01)', () => {
    const r = validatePrice(0.01)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe(0.01)
  })

  it('accepts maximum boundary (10 000 000)', () => {
    expect(validatePrice(10_000_000).ok).toBe(true)
  })

  it('accepts typical price (6€)', () => {
    expect(validatePrice(6).ok).toBe(true)
  })

  it('rejects below minimum (0.009)', () => {
    expect(validatePrice(0.009).ok).toBe(false)
  })

  it('rejects zero', () => {
    expect(validatePrice(0).ok).toBe(false)
  })

  it('rejects negative', () => {
    expect(validatePrice(-1).ok).toBe(false)
  })

  it('rejects above maximum (10 000 001)', () => {
    expect(validatePrice(10_000_001).ok).toBe(false)
  })

  it('rejects NaN', () => {
    expect(validatePrice(NaN).ok).toBe(false)
  })

  it('parses string with comma ("3,99")', () => {
    const r = validatePrice('3,99')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBeCloseTo(3.99)
  })
})

describe('validateParticipants', () => {
  it('accepts minimum boundary (1)', () => {
    const r = validateParticipants(1)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe(1)
  })

  it('accepts maximum boundary (1 000)', () => {
    expect(validateParticipants(1_000).ok).toBe(true)
  })

  it('accepts typical value (10)', () => {
    expect(validateParticipants(10).ok).toBe(true)
  })

  it('rejects zero', () => {
    expect(validateParticipants(0).ok).toBe(false)
  })

  it('rejects above maximum (1 001)', () => {
    expect(validateParticipants(1_001).ok).toBe(false)
  })

  it('rejects decimal (1.5)', () => {
    expect(validateParticipants(1.5).ok).toBe(false)
  })

  it('rejects negative', () => {
    expect(validateParticipants(-1).ok).toBe(false)
  })

  it('rejects NaN', () => {
    expect(validateParticipants(NaN).ok).toBe(false)
  })
})

describe('validateDuration', () => {
  it('accepts minimum boundary (1 min)', () => {
    const r = validateDuration(1)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe(1)
  })

  it('accepts maximum boundary (1 440 min = 24h)', () => {
    expect(validateDuration(1_440).ok).toBe(true)
  })

  it('accepts typical meeting (60 min)', () => {
    expect(validateDuration(60).ok).toBe(true)
  })

  it('rejects zero', () => {
    expect(validateDuration(0).ok).toBe(false)
  })

  it('rejects above maximum (1 441)', () => {
    expect(validateDuration(1_441).ok).toBe(false)
  })

  it('rejects decimal (1.5)', () => {
    expect(validateDuration(1.5).ok).toBe(false)
  })

  it('rejects negative', () => {
    expect(validateDuration(-1).ok).toBe(false)
  })

  it('rejects NaN', () => {
    expect(validateDuration(NaN).ok).toBe(false)
  })
})
