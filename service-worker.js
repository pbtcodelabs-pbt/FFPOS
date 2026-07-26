// ============================================================
// Fast Food POS — Service Worker
// آف لائن اور آن لائن دونوں حالتوں میں ایپ چلانے کے لیے۔
// ہر نئی ڈیلیوری پر CACHE_VERSION بڑھایا جائے گا (خودکار، بغیر پوچھے)۔
// ============================================================
const CACHE_VERSION = 'ffpos-cache-v2';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install — app shell کو کیش کریں
self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache){
      return cache.addAll(APP_SHELL);
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

// Activate — پرانے کیش ورژن صاف کریں
self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_VERSION; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

// Fetch — کیش-فرسٹ حکمت عملی؛ نہ ملے تو نیٹ ورک، ناکامی پر index.html واپس دیں
// (تاکہ آف لائن ہونے پر بھی ایپ کھلتی رہے)
self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function(cached){
      if(cached) return cached;

      return fetch(event.request).then(function(response){
        // کامیاب same-origin جوابات کو مستقبل کے لیے کیش کر لیں
        if(response && response.status === 200 && event.request.url.startsWith(self.location.origin)){
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(function(cache){ cache.put(event.request, clone); });
        }
        return response;
      }).catch(function(){
        if(event.request.mode === 'navigate'){
          return caches.match('./index.html');
        }
      });
    })
  );
});
