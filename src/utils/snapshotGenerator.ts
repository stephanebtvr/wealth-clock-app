import {
  hourlyRate as calcHourlyRate,
  minuteRate as calcMinuteRate,
  secondRate as calcSecondRate,
  todayEarnings as calcTodayEarnings,
} from './salaryCalculator'
import { WORKING_DAYS_PER_YEAR, WORKING_HOURS_PER_DAY } from './constants'

export interface SnapshotData {
  todayEarnings: number
  weekEarnings: number
  monthEarnings: number
  yearEarnings: number
  secondRate: number
  minuteRate: number
  hourlyRate: number
  generatedAt: number
}

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1)
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000) + 1
}

// Completed full working days before today in the current ISO week (Mon–Fri)
function completedWorkdaysThisWeek(date: Date): number {
  const day = date.getDay() // 0=Sun, 1=Mon, …, 6=Sat
  if (day === 0 || day === 6) return 5 // weekend — full Mon–Fri done
  return day - 1                        // Mon=0, Tue=1, …, Fri=4
}

export function generateSnapshotData(salary: number, now: Date = new Date()): SnapshotData {
  const safeSalary = Math.max(0, salary || 0)

  const sr = calcSecondRate(safeSalary)
  const mr = calcMinuteRate(safeSalary)
  const hr = calcHourlyRate(safeSalary)
  const fullDay = WORKING_HOURS_PER_DAY * hr
  const today = calcTodayEarnings(safeSalary, now)

  // Week: completed Mon–(yesterday) full days + today's partial
  const weekCompleted = completedWorkdaysThisWeek(now)
  const weekEarnings = weekCompleted * fullDay + today

  // Month: working days elapsed before today this month (approx)
  const dailyWorkdays = WORKING_DAYS_PER_YEAR / 365
  const completedMonthDays = Math.max(0, Math.floor((now.getDate() - 1) * dailyWorkdays))
  const monthEarnings = completedMonthDays * fullDay + today

  // Year: working days elapsed before today this year (approx)
  const completedYearDays = Math.max(0, Math.floor((dayOfYear(now) - 1) * dailyWorkdays))
  const yearEarnings = completedYearDays * fullDay + today

  return {
    todayEarnings: today,
    weekEarnings,
    monthEarnings,
    yearEarnings,
    secondRate: sr,
    minuteRate: mr,
    hourlyRate: hr,
    generatedAt: now.getTime(),
  }
}
