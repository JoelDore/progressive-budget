const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.webmanifest',
    '/assets/styles.css',
    '/assets/app.js',
    '/assets/indexedDB.js',
    '/assets/images/icons/icon-192x192.png',
    '/assets/images/icons/icon-512x512.png',
    'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js@2.8.0'
];

const STATIC_CACHE = 'static-cache-v1';
const DATA_CACHE = "data-cache-v1";

self.addEventListener('install', (event) => {
    // pre cache transaction data
    event.waitUntil(
        caches
            .open(DATA_CACHE)
            .then((cache) => cache.add("/api/transaction"))
    );

    // pre cache static assets
    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then((cache) => cache.addAll(FILES_TO_CACHE))
    );
    // activate service worker once installed
    self.skipWaiting()
});

self.addEventListener('activate', (event) => {
    const currentCaches = [DATA_CACHE, STATIC_CACHE];

    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (!currentCaches.includes(key)) {
                        console.log("Removing old cache data", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

self.addEventListener('fetch', (event) => {

    if (event.request.url.includes("/api/transaction")) {
        event.respondWith(
            caches
                .open(DATA_CACHE)
                .then(cache => {
                    return fetch(event.request)
                        .then(response => {
                            // If the response was good, clone it and store it in the cache.
                            if (response.status === 200) {
                                cache.put(event.request.url, response.clone());
                            }
                            return response;
                        })
                        .catch(err => {
                            // Network request failed, try to get it from the cache.
                            return cache.match(event.request);
                        });
                })
                .catch(err => console.log(err))
        );
        return
    }

    // if the request is not for the API, serve static assets using "offline-first" approach.
    event.respondWith(
        caches
            .open(STATIC_CACHE)
            .then(cache => {
                return cache.match(event.request)
                    .then((response) => {
                        return response || fetch(event.request);
                    })
            })
    );
});