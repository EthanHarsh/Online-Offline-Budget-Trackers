if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("service-worker.js")
            .then(reg => {
                console.log("Ready...");
            });
        navigator.serviceWorker.ready.then(function (swRegistration) {
            return swRegistration.sync.register('myFirstSync');
        });
    });
}