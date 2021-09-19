if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("service-worker.js")
            .then(reg => {
                console.log("Ready...");
            });
    });
    navigator.serviceWorker.ready.then(function (registration) {
        return registration.sync.register('send_delayed')
    }).then(function () {
        console.log('sync ready...')
    }).catch(function () {
        console.log('sync registration failed')
    });
}