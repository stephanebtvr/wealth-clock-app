import { formatCurrency, formatCurrencyCompact } from '../../src/utils/formatCurrency'

describe('formatCurrency', () => {
  it('includes EUR symbol', () => {
    expect(formatCurrency(100)).toContain('€')
  })

  it('formats 1234.56 in fr-FR style', () => {
    const expected = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(1234.56)
    expect(formatCurrency(1234.56)).toBe(expected)
  })

  it('uses 2 decimal places by default', () => {
    const result = formatCurrency(1)
    // fr-FR: "1,00 €"
    expect(result).toContain(',00')
  })

  it('respects custom decimals (6)', () => {
    const expected = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 6,
      maximumFractionDigits: 6,
    }).format(0.001234)
    expect(formatCurrency(0.001234, 6)).toBe(expected)
  })

  it('handles zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('€')
    expect(result).toContain('0')
  })

  it('returns string type', () => {
    expect(typeof formatCurrency(42)).toBe('string')
  })
})

describe('formatCurrencyCompact', () => {
  it('abbreviates millions', () => {
    const result = formatCurrencyCompact(1_234_567)
    expect(result).toContain('€')
    // Must be shorter than the full format
    expect(result.length).toBeLessThan(formatCurrency(1_234_567).length)
  })

  it('abbreviates thousands', () => {
    const result = formatCurrencyCompact(12_345)
    expect(result).toContain('€')
    expect(result.length).toBeLessThan(formatCurrency(12_345).length)
  })

  it('returns full format for small amounts (< 1 000)', () => {
    expect(formatCurrencyCompact(42)).toBe(formatCurrency(42))
  })

  it('returns string type', () => {
    expect(typeof formatCurrencyCompact(1_000_000)).toBe('string')
  })
})
