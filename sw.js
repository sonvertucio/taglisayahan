
const CACHE = 'taglisayahan-v4-cache';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/pages/leaderboard.html',
  '/pages/families.html',
  '/pages/events.html',
  '/pages/analytics.html',
  '/pages/strategy.html',
  '/pages/bracket.html',
  '/admin/index.html',
  '/led-mode/index.html',
  '/manifest.webmanifest',
  '/assets/icon-192.png',
  '/assets/icon-512.png'
];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).catch(()=>caches.match('/index.html'))));
});
