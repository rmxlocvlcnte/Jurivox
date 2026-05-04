// Rate limiter em memória (funciona por instância do servidor)
// Para produção multi-instância, substituir por Redis/Upstash

const MAX_STORE_SIZE = 10_000  // evita crescimento ilimitado em caso de abuso

const store = new Map<string, { count: number; resetAt: number }>()

interface RateLimitOptions {
  windowMs: number    // janela de tempo em ms
  maxRequests: number // máximo de requests na janela
}

export function rateLimit(
  key: string,
  options: RateLimitOptions,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    // Evicta a entrada mais antiga se o store está cheio
    if (!entry && store.size >= MAX_STORE_SIZE) {
      const primeiraChave = store.keys().next().value
      if (primeiraChave) store.delete(primeiraChave)
    }
    const resetAt = now + options.windowMs
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: options.maxRequests - 1, resetAt }
  }

  if (entry.count >= options.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: options.maxRequests - entry.count, resetAt: entry.resetAt }
}

// Limpa entradas expiradas a cada 5 minutos para liberar memória
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) store.delete(key)
    }
  }, 5 * 60 * 1000)
}
