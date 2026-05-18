import { WORKING_HOURS_PER_YEAR, WORKING_HOURS_PER_DAY } from './constants'

const WORK_START_HOUR = 8
const WORK_END_HOUR = WORK_START_HOUR + WORKING_HOURS_PER_DAY // 16

export function hourlyRate(annualSalary: number): number {
  return annualSalary / WORKING_HOURS_PER_YEAR
}

export function minuteRate(annualSalary: number): number {
  return annualSalary / (WORKING_HOURS_PER_YEAR * 60)
}

export function secondRate(annualSalary: number): number {
  return annualSalary / (WORKING_HOURS_PER_YEAR * 3_600)
}

export function todayEarnings(annualSalary: number, now: Date = new Date()): number {
  const totalSeconds = now.getHours() * 3_600 + now.getMinutes() * 60 + now.getSeconds()
  const workStartSeconds = WORK_START_HOUR * 3_600
  const workEndSeconds = WORK_END_HOUR * 3_600

  const elapsedWorkSeconds = Math.min(
    Math.max(totalSeconds - workStartSeconds, 0),
    workEndSeconds - workStartSeconds
  )

  return secondRate(annualSalary) * elapsedWorkSeconds
}

export function momentEarnings(annualSalary: number, durationMinutes: number): number {
  return minuteRate(annualSalary) * Math.max(0, durationMinutes)
}
