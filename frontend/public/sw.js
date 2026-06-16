// Service Worker for Smart RT web push notifications

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload = { judul: 'Smart RT', isi: 'Ada notifikasi baru.', url: '/' }
  try {
    payload = { ...payload, ...event.data.json() }
  } catch {
    payload.isi = event.data.text()
  }

  event.waitUntil(
    self.registration.showNotification(payload.judul, {
      body: payload.isi,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: { url: payload.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
