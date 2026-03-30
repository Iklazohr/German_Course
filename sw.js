const CACHE_NAME = 'tedesco-facile-v4';
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
    './data/course-structure.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(SHELL_ASSETS))
            .then(() => self.skipWaiting())
    );
});

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

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // For JSON data files, use network-first strategy
    if (url.pathname.includes('/data/') && url.pathname.endsWith('.json')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // For app shell, use cache-first strategy
    event.respondWith(
        caches.match(event.request)
            .then(cached => cached || fetch(event.request))
    );
});
