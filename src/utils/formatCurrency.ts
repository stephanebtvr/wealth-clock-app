const FR_CURRENCY_BASE = { style: 'currency' as const, currency: 'EUR' }

export function formatCurrency(amount: number, decimals = 2): string {
  return new Intl.NumberFormat('fr-FR', {
    ...FR_CURRENCY_BASE,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

export function formatCurrencyCompact(amount: number): string {
  const abs = Math.abs(amount)
  if (abs >= 1_000_000) {
    const v = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(amount / 1_000_000)
    return `${v} M€`
  }
  if (abs >= 1_000) {
    const v = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(amount / 1_000)
    return `${v} k€`
  }
  return formatCurrency(amount)
}
