import { convertPriceToTime } from './valueConverter'

export interface ReceiptItem {
  id: string
  label: string
  price: number
}

export interface ReceiptResultItem {
  id: string
  label: string
  price: number
  workMinutes: number
  timeLabel: string
  emoji: string
}

export interface ReceiptResult {
  items: ReceiptResultItem[]
  total: number
  totalWorkMinutes: number
  totalLabel: string
  shockPhrase: string
}

export const RECEIPT_PRESETS: { emoji: string; label: string; price: number }[] = [
  { emoji: '☕', label: 'Café', price: 3 },
  { emoji: '🥖', label: 'Baguette', price: 1.2 },
  { emoji: '🍽️', label: 'Repas', price: 14 },
  { emoji: '⛽', label: 'Plein d\'essence', price: 80 },
  { emoji: '🛒', label: 'Courses', price: 120 },
  { emoji: '📱', label: 'iPhone', price: 1299 },
]

const WORK_MINUTES_PER_DAY = 8 * 60

function computeShockPhrase(totalWorkMinutes: number, itemCount: number): string {
  if (totalWorkMinutes < 30) {
    return `${Math.round(totalWorkMinutes)} minutes de ta vie envolées`
  }
  if (totalWorkMinutes < 60) {
    return `${Math.round(totalWorkMinutes)} minutes de boulot pour ${itemCount} article${itemCount > 1 ? 's' : ''}`
  }
  const hours = totalWorkMinutes / 60
  if (hours < 8) {
    return `${hours.toFixed(1).replace('.', ',')}h de ta journée de travail`
  }
  const days = totalWorkMinutes / WORK_MINUTES_PER_DAY
  if (days < 5) {
    return `${days.toFixed(1).replace('.', ',')} journées de travail`
  }
  const weeks = Math.round(days / 5)
  return `${weeks} semaine${weeks > 1 ? 's' : ''} de travail`
}

export function convertReceipt(items: ReceiptItem[], annualSalary: number): ReceiptResult {
  const resultItems: ReceiptResultItem[] = items.map((item) => {
    const valueResult = convertPriceToTime(item.price, annualSalary)
    return {
      id: item.id,
      label: item.label,
      price: item.price,
      workMinutes: valueResult.workMinutes,
      timeLabel: valueResult.label,
      emoji: valueResult.emoji,
    }
  })

  const total = items.reduce((sum, item) => sum + item.price, 0)
  const totalResult = convertPriceToTime(total, annualSalary)

  return {
    items: resultItems,
    total,
    totalWorkMinutes: totalResult.workMinutes,
    totalLabel: totalResult.label,
    shockPhrase: computeShockPhrase(totalResult.workMinutes, items.length),
  }
}
