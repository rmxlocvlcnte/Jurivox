'use client'

import { useActionState } from 'react'
import { criarEscritorio } from '@/lib/actions/onboarding'
import { Scale, AlertCircle, Loader2 } from 'lucide-react'

const initialState = { erro: null }

export default function OnboardingPage() {
  const [state, formAction, isPending] = useActionState(criarEscritorio, initialState)

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-12" style={{ background: '#f8fafc' }}>
      <div className="w-full max-w-lg">

        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div
              className="p-3 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.35)',
              }}
            >
              <Scale className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Bem-vindo ao Jurivox!</h1>
          <p className="text-slate-500 mt-2 text-sm">
            Vamos configurar seu escritório. Isso leva menos de 1 minuto.
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: '#fff',
            boxShadow: '0 4px 40px rgba(0,0,0,0.08)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
          }}
        >
          <form action={formAction} className="p-6 space-y-5">

            {/* Mensagem de erro */}
            {state?.erro && (
              <div
                className="flex items-start gap-3 p-4 rounded-xl text-sm"
                style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{state.erro}</span>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Sobre você
              </p>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Seu nome completo <span className="text-red-500">*</span>
              </label>
              <input
                name="nome_usuario"
                type="text"
                required
                disabled={isPending}
                placeholder="Dr. João da Silva"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-all disabled:opacity-60"
                style={{ border: '1.5px solid #e2e8f0', background: '#f8fafc' }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#f59e0b'
                  e.target.style.background = '#fff'
                  e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0'
                  e.target.style.background = '#f8fafc'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Sobre o escritório
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Nome do escritório <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="nome"
                    type="text"
                    required
                    disabled={isPending}
                    placeholder="Silva & Associados Advocacia"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-all disabled:opacity-60"
                    style={{ border: '1.5px solid #e2e8f0', background: '#f8fafc' }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#f59e0b'
                      e.target.style.background = '#fff'
                      e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0'
                      e.target.style.background = '#f8fafc'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      CNPJ (opcional)
                    </label>
                    <input
                      name="cnpj"
                      type="text"
                      disabled={isPending}
                      placeholder="00.000.000/0001-00"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-all disabled:opacity-60"
                      style={{ border: '1.5px solid #e2e8f0', background: '#f8fafc' }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#f59e0b'
                        e.target.style.background = '#fff'
                        e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e2e8f0'
                        e.target.style.background = '#f8fafc'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Telefone (opcional)
                    </label>
                    <input
                      name="telefone"
                      type="tel"
                      disabled={isPending}
                      placeholder="(11) 99999-0000"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-all disabled:opacity-60"
                      style={{ border: '1.5px solid #e2e8f0', background: '#f8fafc' }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#f59e0b'
                        e.target.style.background = '#fff'
                        e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e2e8f0'
                        e.target.style.background = '#f8fafc'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    E-mail do escritório (opcional)
                  </label>
                  <input
                    name="email"
                    type="email"
                    disabled={isPending}
                    placeholder="contato@escritorio.adv.br"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-all disabled:opacity-60"
                    style={{ border: '1.5px solid #e2e8f0', background: '#f8fafc' }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#f59e0b'
                      e.target.style.background = '#fff'
                      e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0'
                      e.target.style.background = '#f8fafc'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#1e293b',
                boxShadow: isPending ? 'none' : '0 4px 15px rgba(245, 158, 11, 0.35)',
              }}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando seu escritório...
                </>
              ) : (
                'Criar meu escritório e entrar →'
              )}
            </button>

            <p className="text-xs text-center text-slate-400">
              Você poderá editar essas informações depois nas configurações.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
