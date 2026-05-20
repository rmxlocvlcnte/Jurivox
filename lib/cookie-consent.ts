export type CookieConsentCategory = 'essenciais' | 'analytics'

export type CookieConsent = {
  essenciais: true
  analytics: boolean
  atualizadoEm: string
}

export const COOKIE_CONSENT_KEY = 'jurivox-cookie-consent'
export const COOKIE_CONSENT_VERSION = '1'

export function parseCookieConsent(raw: string | null): CookieConsent | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as CookieConsent
    if (parsed.essenciais !== true || typeof parsed.analytics !== 'boolean') return null
    return parsed
  } catch {
    return null
  }
}

export function hasAnalyticsConsent(consent: CookieConsent | null): boolean {
  return consent?.analytics === true
}
