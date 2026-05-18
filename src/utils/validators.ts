import type { Result } from '../types'

function parseInput(input: string | number): number {
  if (typeof input === 'number') return input
  const cleaned = input.trim().replace(/\s/g, '').replace(',', '.')
  return parseFloat(cleaned)
}

export function validateSalary(input: string | number): Result<number, string> {
  const n = parseInput(input)
  if (isNaN(n) || n < 1_000 || n > 10_000_000) {
    return { ok: false, error: 'Le salaire doit être compris entre 1 000 € et 10 000 000 €' }
  }
  return { ok: true, value: n }
}

export function validatePrice(input: string | number): Result<number, string> {
  const n = parseInput(input)
  if (isNaN(n) || n < 0.01 || n > 10_000_000) {
    return { ok: false, error: 'Le prix doit être compris entre 0,01 € et 10 000 000 €' }
  }
  return { ok: true, value: n }
}

export function validateParticipants(input: string | number): Result<number, string> {
  const n = parseInput(input)
  if (isNaN(n) || !Number.isInteger(n) || n < 1 || n > 1_000) {
    return { ok: false, error: 'Le nombre de participants doit être un entier entre 1 et 1 000' }
  }
  return { ok: true, value: n }
}

export function validateDuration(input: string | number): Result<number, string> {
  const n = parseInput(input)
  if (isNaN(n) || !Number.isInteger(n) || n < 1 || n > 1_440) {
    return { ok: false, error: 'La durée doit être un entier entre 1 et 1 440 minutes' }
  }
  return { ok: true, value: n }
}
