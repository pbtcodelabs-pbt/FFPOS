// FFPOS Service Worker — cache-first, offline-ready
// ہر نئی ریلیز پر CACHE_VERSION بڑھائیں تاکہ پرانا کیشے خودکار صاف ہو جائے
// اور یوزر کو اگلی بار کھولنے پر نیا ورژن ملے۔
const CACHE_VERSION = 'ffpos-FF003';
const CACHE_NAME = CACHE_VERSION;

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);

      // کیشے موجود ہو تو فوری دکھائیں (offline-first)، ساتھ ہی بیک گراؤنڈ میں نیا ورژن لے آئیں
      return cached || networkFetch;
    })
  );
});
