const storeName = 'post_requests';
const databaseName = 'budget_app';
import ex from './index';
console.log(ex);


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
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(evt.request).then(response => {
                    if (response.status === 200) {
                        cache.put(evt.request.url, response.clone());
                    }

                    return response;
                })
                    .catch(err => {
                        console.log('catch_area')
                        return cache.match(evt.request);
                    });
            })
        );
        return;
    }

    evt.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(evt.request).then(response => {
                return response || fetch(evt.request);
            });
        })
    );
});

self.addEventListener('message', function (entry) {
    console.log('entry data', entry.data)

    if (entry.data.hasOwnProperty('entry')) {
        let entry_data = entry.data.entry;

        saveDelayedPosts(entry_data);
    }
})

self.addEventListener('sync', function (event) {
    console.log('now online')
    if (event.tag === 'send_delayed') {
        console.log('send_delayed eh')
        event.waitUntil(
            sendDelayedPosts()
        )
    }
})

function saveDelayedPosts(data) {
    var req = indexedDB.open(databaseName,
        1)
    req.onerror = function (error) {
        console.error('IndexedDB error: ', error)
    }
    req.onupgradeneeded = function () {
        this.result.createObjectStore(storeName, {
            autoIncrement: true, keyPath: 'id'
        })
    }
    req.onsuccess = function () {
        let tx = this.result.transaction(storeName, 'readwrite').objectStore(storeName).add({
            time: Date.now(),
            data: data
        });
        tx.oncomplete = function (succ) {
            console.log('tx-complete')
        }
        tx.onerror = function (err) {
            console.error(err);
        }
    }
}

function sendDelayedPosts() {
    console.log('Sending delayed posts')

    var req = indexedDB.open(databaseName,
        1)
    req.onerror = function (error) {
        console.error('IndexedDB error: ', error)
    }
    req.onupgradeneeded = function () {
        this.result.createObjectStore(storeName, {
            autoIncrement: true, keyPath: 'id'
        })
    }
    req.onsuccess = async function () {
        let delayed_posts = [];
        console.log('sending db opened...')
        let tx = this.result.transaction(storeName, 'readwrite').objectStore(storeName).openCursor().onsuccess = function (succ) {
            let index = succ.target.result;
            if (index) {
                delayed_posts.push(index.value)
                index.continue();
            } else {
                console.log('syncing data')
                for (let post of delayed_posts) {
                    console.log('post');
                    console.log(post.data);
                    fetch("/api/transaction", {
                        method: "POST",
                        body: JSON.stringify(post.data),
                        headers: {
                            "Accept": "application/json, text/plain, */*",
                            "Content-Type": "application/json"
                        }
                    })
                        .then(res => {
                            if (res.status == 200) {
                                console.log('post sent!');
                                console.log(post.data);
                                delete_delayed(post.id)
                            }
                        })
                        .catch(err => {
                            console.error(err);
                        });
                }
            }
        }
    }
}

function delete_delayed(id) {
    console.log('deleteStarted')
    var req = indexedDB.open(databaseName,
        1)
    req.onerror = function (error) {
        console.error('IndexedDB error: ', error)
    }
    req.onupgradeneeded = function () {
        this.result.createObjectStore(storeName, {
            autoIncrement: true, keyPath: 'id'
        })
    }
    req.onsuccess = async function () {
        console.log('delete');
        console.log(id)
        this.result.transaction(storeName, "readwrite")
            .objectStore(storeName)
            .delete(id)
    }
}