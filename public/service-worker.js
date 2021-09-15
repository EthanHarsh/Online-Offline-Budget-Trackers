const FILES_TO_CACHE = [
    '/index.html',
    '/index.js',
    '/styles.css'
];

const CACHE_NAME = 'static-cache-v2';
const DATA_CACHE_NAME = 'data-cache-v1';

// install
self.addEventListener("install", function (evt) {
    // pre cache image data
    evt.waitUntil(
        caches.open(DATA_CACHE_NAME).then((cache) => cache.add("/api/transaction"))
    );

    // pre cache all static assets
    evt.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
    );

    // tell the browser to activate this service worker immediately once it
    // has finished installing
    self.skipWaiting();
});


self.addEventListener("activate", function (evt) {
    evt.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log("Removing old cache data", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

self.addEventListener('fetch', function (evt) {
    if (evt.request.url.includes('/api/')) {
        console.log('[Service Worker] Fetch (data)', evt.request.url);

        evt.respondWith(
            caches.match(evt.request)
                .then(function (response) {
                    if (response) {
                        return response;
                    }

                    return fetch(evt.request).then(
                        function (response) {
                            if (!response || response.status !== 200 || response.type !== 'basic') {
                                return response;
                            }
                            var responseToCache = response.clone();

                            caches.open(CACHE_NAME)
                                .then(function (cache) {
                                    cache.put(evt.request, responseToCache)
                                });
                            return response;
                        })
                })
        )
    }
});

self.addEventListener('sync', function (event) {
    if (event.tag == 'myFirstSync') {
        event.waitUntil(() => {
            fetch
        });
    }
});