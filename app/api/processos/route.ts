// API route para listar processos (usada por Client Components)
import { getAuthContext } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) {
    return NextResponse.json([], { status: 401 })
  }

  const { data } = await supabase
    .from('processos')
    .select('id, numero_cnj, clientes(nome)')
    .eq('escritorio_id', escritorioId)
    .eq('status', 'ativo')
    .order('criado_em', { ascending: false })

  return NextResponse.json(data ?? [])
}
