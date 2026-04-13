import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Gera uma nova chave de API com formato: jvx_live_<64 hex chars>
 * Retorna a chave bruta (exibida UMA VEZ para o usuário), o hash SHA-256
 * para armazenar no banco, e um preview para mostrar na listagem.
 */
export function gerarApiKey(): { chave: string; hash: string; preview: string } {
  const raw = 'jvx_live_' + crypto.randomBytes(32).toString('hex')
  const hash = crypto.createHash('sha256').update(raw).digest('hex')
  const preview = raw.slice(0, 22) + '...'
  return { chave: raw, hash, preview }
}

/**
 * Verifica uma chave de API a partir do cabeçalho Authorization.
 * Espera: "Authorization: Bearer jvx_live_..."
 * Retorna { escritorioId, escopos } se válida, ou null se inválida/revogada.
 */
export async function verificarApiKey(
  authHeader: string | null | undefined,
): Promise<{ escritorioId: string; escopos: string[] } | null> {
  if (!authHeader?.startsWith('Bearer ')) return null

  const chave = authHeader.slice(7).trim()
  if (!chave.startsWith('jvx_live_')) return null

  const hash = crypto.createHash('sha256').update(chave).digest('hex')

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('api_keys')
    .select('id, escritorio_id, escopos, ativo')
    .eq('key_hash', hash)
    .maybeSingle()

  if (!data || !data.ativo) return null

  // Atualiza último uso de forma não bloqueante
  supabase
    .from('api_keys')
    .update({ ultimo_uso_em: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => {})

  return {
    escritorioId: data.escritorio_id,
    escopos: (data.escopos as string[]) ?? [],
  }
}
