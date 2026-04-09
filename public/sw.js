const CACHE_NAME = 'jurivox-v1'
const STATIC_ASSETS = [
  '/',
  '/dashboard',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Network-first para API, cache-first para assets estáticos
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignora requisições de API e autenticação (sempre busca da rede)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/sign-')) {
    return
  }

  // Para navegação e assets: network-first com fallback para cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => caches.match(request).then((cached) => cached ?? new Response('Offline', { status: 503 })))
  )
})
