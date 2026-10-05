// FFPOS Service Worker — cache-first, offline-ready
// ------------------------------------------------------------
// پکا اصول: CACHE_VERSION = 'ffpos-' + وہی ورژن جو index.html میں APP_VERSION ہے
// ورژن = FF + تاریخ + مہینہ + دن کے دو حروف + سیریل (001، 002، 003 …)
// مثال: FF610TU001 → اگلی فائل FF610TU002 — 7 اکتوبر کو FF710WE…
// ہر نئی فائل پر یہ لائن ضرور بدلیں، تاکہ پرانا کیشے خود صاف ہو اور یوزر کو نیا ورژن ملے۔
// ------------------------------------------------------------
const CACHE_VERSION = 'ffpos-FF610TU001';
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
