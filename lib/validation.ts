export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function normalizeOtpCode(value: string, length = 6) {
  return value.replace(/[^0-9]/g, '').slice(0, length)
}

export function isValidOtpCode(value: string, length = 6) {
  return value.length === length && /^[0-9]+$/.test(value)
}
