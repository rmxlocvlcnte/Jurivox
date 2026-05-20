'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  COOKIE_CONSENT_KEY,
  type CookieConsent,
} from '@/lib/cookie-consent'

function salvarConsentimento(analytics: boolean) {
  const consent: CookieConsent = {
    essenciais: true,
    analytics,
    atualizadoEm: new Date().toISOString(),
  }
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent))
  window.dispatchEvent(new CustomEvent('jurivox-cookie-consent', { detail: consent }))
}

export function CookieConsentBanner() {
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const salvo = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!salvo) setVisivel(true)
  }, [])

  if (!visivel) return null

  return (
    <div
      role="dialog"
      aria-label="Preferências de cookies"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-slate-200 bg-white p-4 shadow-lg sm:p-5"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-700">
          <p className="font-medium text-slate-900">Cookies e privacidade</p>
          <p className="mt-1 leading-relaxed">
            Usamos cookies essenciais para autenticação e funcionamento da plataforma.
            Com seu consentimento, também utilizamos cookies para diagnóstico de erros.
            Saiba mais na{' '}
            <Link href="/privacidade#cookies" className="text-blue-600 hover:underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              salvarConsentimento(false)
              setVisivel(false)
            }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Apenas essenciais
          </button>
          <button
            type="button"
            onClick={() => {
              salvarConsentimento(true)
              setVisivel(false)
            }}
            className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-600"
          >
            Aceitar todos
          </button>
        </div>
      </div>
    </div>
  )
}
