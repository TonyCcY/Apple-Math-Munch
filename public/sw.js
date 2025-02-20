const CACHE_NAME = 'apple-sum-game-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/game.js',
    '/images/apple.svg',
    '/images/icon-192.png',
    '/images/icon-512.png'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
}); 