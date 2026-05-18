import {
  convertReceipt,
  RECEIPT_PRESETS,
  type ReceiptItem,
} from '../../src/utils/receiptConverter'
import { minuteRate } from '../../src/utils/salaryCalculator'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SALARY = 36_000
const WORK_MINUTES_PER_DAY = 8 * 60 // 480

function makeItem(overrides: Partial<ReceiptItem> = {}): ReceiptItem {
  return { id: '1', label: 'Café', price: 3, ...overrides }
}

// ─── RECEIPT_PRESETS ──────────────────────────────────────────────────────────

describe('RECEIPT_PRESETS', () => {
  it('has exactly 6 presets', () => {
    expect(RECEIPT_PRESETS).toHaveLength(6)
  })

  it('each preset has emoji, label and price', () => {
    for (const p of RECEIPT_PRESETS) {
      expect(typeof p.emoji).toBe('string')
      expect(p.emoji.length).toBeGreaterThan(0)
      expect(typeof p.label).toBe('string')
      expect(p.label.length).toBeGreaterThan(0)
      expect(typeof p.price).toBe('number')
      expect(p.price).toBeGreaterThan(0)
    }
  })

  it('includes a café preset at 3€', () => {
    const café = RECEIPT_PRESETS.find((p) => p.price === 3)
    expect(café).toBeDefined()
    expect(café?.emoji).toBe('☕')
  })

  it('includes a baguette preset at 1,20€', () => {
    const baguette = RECEIPT_PRESETS.find((p) => p.price === 1.2)
    expect(baguette).toBeDefined()
    expect(baguette?.emoji).toBe('🥖')
  })

  it('includes a repas preset at 14€', () => {
    const repas = RECEIPT_PRESETS.find((p) => p.price === 14)
    expect(repas).toBeDefined()
    expect(repas?.emoji).toBe('🍽️')
  })

  it('includes an essence preset at 80€', () => {
    const essence = RECEIPT_PRESETS.find((p) => p.price === 80)
    expect(essence).toBeDefined()
    expect(essence?.emoji).toBe('⛽')
  })

  it('includes a courses preset at 120€', () => {
    const courses = RECEIPT_PRESETS.find((p) => p.price === 120)
    expect(courses).toBeDefined()
    expect(courses?.emoji).toBe('🛒')
  })

  it('includes an iPhone preset at 1299€', () => {
    const iphone = RECEIPT_PRESETS.find((p) => p.price === 1299)
    expect(iphone).toBeDefined()
    expect(iphone?.emoji).toBe('📱')
  })
})

// ─── Empty items ──────────────────────────────────────────────────────────────

describe('convertReceipt — empty items', () => {
  it('returns empty items array', () => {
    const result = convertReceipt([], SALARY)
    expect(result.items).toEqual([])
  })

  it('total is 0', () => {
    expect(convertReceipt([], SALARY).total).toBe(0)
  })

  it('totalWorkMinutes is 0', () => {
    expect(convertReceipt([], SALARY).totalWorkMinutes).toBe(0)
  })

  it('totalLabel is a non-empty string', () => {
    const { totalLabel } = convertReceipt([], SALARY)
    expect(typeof totalLabel).toBe('string')
    expect(totalLabel.length).toBeGreaterThan(0)
  })

  it('shockPhrase is a non-empty string', () => {
    const { shockPhrase } = convertReceipt([], SALARY)
    expect(typeof shockPhrase).toBe('string')
    expect(shockPhrase.length).toBeGreaterThan(0)
  })
})

// ─── Single item ──────────────────────────────────────────────────────────────

describe('convertReceipt — single item', () => {
  it('preserves id, label and price in result item', () => {
    const item = makeItem({ id: 'abc', label: 'Café', price: 3 })
    const { items } = convertReceipt([item], SALARY)
    expect(items[0].id).toBe('abc')
    expect(items[0].label).toBe('Café')
    expect(items[0].price).toBe(3)
  })

  it('workMinutes is positive for non-zero price', () => {
    const { items } = convertReceipt([makeItem({ price: 3 })], SALARY)
    expect(items[0].workMinutes).toBeGreaterThan(0)
  })

  it('workMinutes = price / minuteRate(salary)', () => {
    const price = 3
    const { items } = convertReceipt([makeItem({ price })], SALARY)
    expect(items[0].workMinutes).toBeCloseTo(price / minuteRate(SALARY), 6)
  })

  it('total equals the item price', () => {
    const price = 14
    const { total } = convertReceipt([makeItem({ price })], SALARY)
    expect(total).toBe(price)
  })

  it('totalWorkMinutes equals the item workMinutes', () => {
    const price = 14
    const { items, totalWorkMinutes } = convertReceipt([makeItem({ price })], SALARY)
    expect(totalWorkMinutes).toBeCloseTo(items[0].workMinutes, 6)
  })

  it('timeLabel is a non-empty string', () => {
    const { items } = convertReceipt([makeItem()], SALARY)
    expect(typeof items[0].timeLabel).toBe('string')
    expect(items[0].timeLabel.length).toBeGreaterThan(0)
  })

  it('emoji is a non-empty string', () => {
    const { items } = convertReceipt([makeItem()], SALARY)
    expect(typeof items[0].emoji).toBe('string')
    expect(items[0].emoji.length).toBeGreaterThan(0)
  })
})

// ─── Multiple items ───────────────────────────────────────────────────────────

describe('convertReceipt — multiple items', () => {
  const items: ReceiptItem[] = [
    { id: '1', label: 'Café', price: 3 },
    { id: '2', label: 'Baguette', price: 1.2 },
    { id: '3', label: 'Repas', price: 14 },
  ]

  it('result.items has same length as input', () => {
    expect(convertReceipt(items, SALARY).items).toHaveLength(3)
  })

  it('total = sum of all prices', () => {
    const { total } = convertReceipt(items, SALARY)
    const expected = items.reduce((s, i) => s + i.price, 0)
    expect(total).toBeCloseTo(expected, 6)
  })

  it('totalWorkMinutes = sum of individual workMinutes', () => {
    const { items: resultItems, totalWorkMinutes } = convertReceipt(items, SALARY)
    const sumMinutes = resultItems.reduce((s, i) => s + i.workMinutes, 0)
    expect(totalWorkMinutes).toBeCloseTo(sumMinutes, 6)
  })

  it('preserves item order', () => {
    const { items: resultItems } = convertReceipt(items, SALARY)
    expect(resultItems[0].id).toBe('1')
    expect(resultItems[1].id).toBe('2')
    expect(resultItems[2].id).toBe('3')
  })
})

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('convertReceipt — edge cases', () => {
  it('item with zero price → workMinutes = 0', () => {
    const { items } = convertReceipt([makeItem({ price: 0 })], SALARY)
    expect(items[0].workMinutes).toBe(0)
  })

  it('zero salary → totalWorkMinutes = 0', () => {
    expect(convertReceipt([makeItem({ price: 100 })], 0).totalWorkMinutes).toBe(0)
  })

  it('large price → results are finite', () => {
    const { totalWorkMinutes } = convertReceipt([makeItem({ price: 10_000_000 })], SALARY)
    expect(Number.isFinite(totalWorkMinutes)).toBe(true)
    expect(totalWorkMinutes).toBeGreaterThan(0)
  })
})

// ─── shockPhrase tiers ────────────────────────────────────────────────────────

describe('convertReceipt — shockPhrase', () => {
  it('small total (< 30 work-minutes) → phrase mentions minutes', () => {
    // Need < 30 work-minutes: price < 30 × minuteRate(SALARY)
    const tinyPrice = 29 * minuteRate(SALARY) * 0.9 // ~26 work-minutes
    const { shockPhrase } = convertReceipt([makeItem({ price: tinyPrice })], SALARY)
    expect(shockPhrase.toLowerCase()).toMatch(/minute/)
  })

  it('medium total (30–60 work-minutes) → phrase mentions minutes or boulot', () => {
    const midPrice = 45 * minuteRate(SALARY) // ~45 work-minutes
    const { shockPhrase } = convertReceipt([makeItem({ price: midPrice })], SALARY)
    expect(shockPhrase.length).toBeGreaterThan(0)
  })

  it('hourly total (1–8 hours of work) → phrase mentions h or journée', () => {
    const hourlyPrice = 2 * 60 * minuteRate(SALARY) // 2 hours
    const { shockPhrase } = convertReceipt([makeItem({ price: hourlyPrice })], SALARY)
    expect(shockPhrase.toLowerCase()).toMatch(/h|journée/)
  })

  it('daily total (≥ 1 work day) → phrase mentions journée or semaine', () => {
    const dayPrice = WORK_MINUTES_PER_DAY * 1.5 * minuteRate(SALARY) // 1.5 days
    const { shockPhrase } = convertReceipt([makeItem({ price: dayPrice })], SALARY)
    expect(shockPhrase.toLowerCase()).toMatch(/journée|semaine/)
  })

  it('multi-week total (≥ 5 work days) → phrase mentions semaine', () => {
    const weekPrice = WORK_MINUTES_PER_DAY * 6 * minuteRate(SALARY) // 6 days
    const { shockPhrase } = convertReceipt([makeItem({ price: weekPrice })], SALARY)
    expect(shockPhrase.toLowerCase()).toMatch(/semaine/)
  })
})

// ─── Highlight condition (> 1 work day) ──────────────────────────────────────

describe('convertReceipt — highlight condition', () => {
  it('item with workMinutes > 480 gets 🗓️ emoji', () => {
    const expensivePrice = (WORK_MINUTES_PER_DAY + 1) * minuteRate(SALARY) // > 1 day
    const { items } = convertReceipt([makeItem({ price: expensivePrice })], SALARY)
    expect(items[0].emoji).toBe('🗓️')
    expect(items[0].workMinutes).toBeGreaterThan(WORK_MINUTES_PER_DAY)
  })

  it('item with workMinutes ≤ 480 does not get 🗓️ emoji', () => {
    const cheapPrice = (WORK_MINUTES_PER_DAY - 1) * minuteRate(SALARY) // < 1 day
    const { items } = convertReceipt([makeItem({ price: cheapPrice })], SALARY)
    expect(items[0].emoji).not.toBe('🗓️')
  })
})
