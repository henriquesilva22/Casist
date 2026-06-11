const CACHE_NAME = 'lifeos-static-v1'

self.addEventListener('install', (event) => { event.waitUntil(caches.open(CACHE_NAME)); self.skipWaiting() })
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()) })
self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return

	if (event.request.url.includes('/api/')) {
		event.respondWith(
			fetch(event.request).catch(async () => {
				const cached = await caches.match(event.request)
				if (cached) return cached
				return new Response(JSON.stringify({ error: 'offline' }), {
					status: 503,
					headers: { 'Content-Type': 'application/json' },
				})
			}),
		)
		return
	}

	event.respondWith(
		caches.match(event.request).then(async (cached) => {
			if (cached) return cached
			try {
				const response = await fetch(event.request)
				return response
			} catch {
				if (event.request.mode === 'navigate') {
					return new Response('<h1>Offline</h1><p>Sem conexao no momento.</p>', {
						status: 503,
						headers: { 'Content-Type': 'text/html; charset=utf-8' },
					})
				}
				return new Response('', { status: 503 })
			}
		}),
	)
})
self.addEventListener('push', (event) => { let payload = { title: 'LifeOS Assistant', body: 'Você tem uma nova notificação.', sound: 'default' }; try { if (event.data) payload = { ...payload, ...event.data.json() } } catch {} event.waitUntil(self.registration.showNotification(payload.title, { body: payload.body, icon: '/manifest.json', data: { sound: payload.sound } })) })
self.addEventListener('notificationclick', (event) => { event.notification.close(); event.waitUntil(self.clients.openWindow('/')) })
