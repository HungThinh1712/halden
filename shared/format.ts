export const FREE_SHIPPING_AT = 25000
export const SHIPPING_CENTS = 1800

export function shippingFor(subtotalCents: number) {
  if (subtotalCents <= 0 || subtotalCents >= FREE_SHIPPING_AT) return 0
  return SHIPPING_CENTS
}

export function money(cents: number) {
  const hasFraction = cents % 100 !== 0
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).format(cents / 100)
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

export function orderNumber(id: string) {
  return `HD-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function messageOf(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'object' && error && 'message' in error) {
    const message = (error as { message: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return 'Something went wrong. Please try again.'
}

export function dollarsToCents(value: string) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return Math.round(parsed * 100)
}

export function centsToInput(cents: number | null) {
  if (cents === null) return ''
  return (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)
}
