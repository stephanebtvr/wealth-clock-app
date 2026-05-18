import type { ValueResult } from '../types'
import { WORKING_HOURS_PER_DAY } from './constants'
import { minuteRate } from './salaryCalculator'

const WORK_MINUTES_PER_DAY = WORKING_HOURS_PER_DAY * 60 // 480

function computeLabel(workMinutes: number): string {
  if (workMinutes < 1) return "moins d'une minute"
  if (workMinutes < 60) return `${Math.round(workMinutes)} minutes`
  if (workMinutes < WORK_MINUTES_PER_DAY) {
    const hours = Math.floor(workMinutes / 60)
    const mins = Math.round(workMinutes % 60)
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }
  const days = workMinutes / WORK_MINUTES_PER_DAY
  return `${days.toFixed(1).replace('.', ',')} jours`
}

function computeComparison(workMinutes: number): string {
  if (workMinutes < 30) return '= une pause café'
  if (workMinutes < 60) return '= une pause déjeuner'
  if (workMinutes < 4 * 60) {
    const pct = Math.round((workMinutes / WORK_MINUTES_PER_DAY) * 100)
    return `= ${pct}% de ta journée`
  }
  if (workMinutes < WORK_MINUTES_PER_DAY) return '= une demi-journée'
  const days = workMinutes / WORK_MINUTES_PER_DAY
  return `= ${days.toFixed(1).replace('.', ',')} journées`
}

function computeEmoji(workMinutes: number): string {
  if (workMinutes < 1) return '⚡'
  if (workMinutes < 30) return '☕'
  if (workMinutes < 60) return '🥗'
  if (workMinutes < 4 * 60) return '⏰'
  if (workMinutes < WORK_MINUTES_PER_DAY) return '📅'
  return '🗓️'
}

export function convertPriceToTime(price: number, annualSalary: number): ValueResult {
  const rate = minuteRate(annualSalary)
  const raw = rate > 0 ? price / rate : 0
  const workMinutes = !isFinite(raw) || isNaN(raw) ? 0 : Math.max(0, raw)
  const workHours = workMinutes / 60
  const workDays = workMinutes / WORK_MINUTES_PER_DAY

  return {
    price,
    workMinutes,
    workHours,
    workDays,
    label: computeLabel(workMinutes),
    comparison: computeComparison(workMinutes),
    emoji: computeEmoji(workMinutes),
  }
}
