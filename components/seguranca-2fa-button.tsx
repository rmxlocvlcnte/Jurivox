'use client'

import { useClerk } from '@clerk/nextjs'

export function AbrirPerfil2FAButton({ children }: { children: React.ReactNode }) {
  const { openUserProfile } = useClerk()

  return (
    <button
      type="button"
      onClick={() => openUserProfile()}
      className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg bg-amber-500 text-slate-900 hover:bg-amber-600 transition-colors"
    >
      {children}
    </button>
  )
}
