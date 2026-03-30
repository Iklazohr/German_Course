const CACHE_NAME = 'tedesco-facile-v7';
const SHELL_ASSETS = [
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
    './js/components/dashboard.js',
    './js/components/levels-view.js',
    './js/components/lesson-view.js',
    './js/components/exercise-view.js',
    './js/components/progress-view.js',
    './js/components/settings-view.js',
    './js/exercises/multiple-choice.js',
    './js/exercises/fill-blanks.js',
    './js/exercises/matching.js',
    './js/exercises/translation.js',
    './js/exercises/reorder.js',
    './js/exercises/select-article.js',
    './js/audio.js',
    './js/auth.js',
    './js/sync.js',
    './js/firebase-config.js',
    './js/components/auth-view.js',
    './js/components/flashcards-view.js',
    './js/components/theory-view.js',
    './js/friends.js',
    './data/course-structure.json'
];

// Install: cache assets, then activate immediately
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(SHELL_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate: delete old caches, claim clients immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

// Fetch: network-first for everything (with cache fallback for offline)
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip external requests (Firebase, CDN, etc.)
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Cache the fresh response
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            })
            .catch(() => {
                // Offline: serve from cache
                return caches.match(event.request);
            })
    );
});
