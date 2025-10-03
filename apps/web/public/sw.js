// Minimal service worker for Vite PWA registration placeholder
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Clients claim to control all pages immediately
  event.waitUntil(self.clients.claim())
})