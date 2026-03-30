const CACHE_NAME = 'tedesco-facile-v24';

// Listen for skip waiting message from the app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Install: cache fresh assets, bypassing browser HTTP cache
self.addEventListener('install', (event) => {
    const urlsToCache = [
        './',
        './index.html',
        './manifest.json',
        './css/style.css',
        './css/components.css',
        './css/exercises.css',
        './css/flashcards.css',
        './js/app.js',
        './js/store.js',
        './js/router.js',
        './js/renderer.js',
        './js/audio.js',
        './js/auth.js',
        './js/sync.js',
        './js/friends.js',
        './js/firebase-config.js',
        './data/course-structure.json'
    ];
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return Promise.all(
                    urlsToCache.map(url =>
                        fetch(url, { cache: 'no-store' })
                            .then(resp => cache.put(url, resp))
                            .catch(() => {})
                    )
                );
            })
    );
});

// Activate: delete old caches, claim clients, and notify them to reload
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
            .then(() => self.clients.matchAll())
            .then(clients => {
                clients.forEach(client => client.postMessage({ type: 'SW_ACTIVATED' }));
            })
    );
});

// Fetch: network-first for everything (cache as offline fallback)
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        fetch(event.request, { cache: 'no-store' })
            .then(response => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
