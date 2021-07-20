self.addEventListener('fetch', function(event) {
  var ext = event.request.url.slice((Math.max(0, event.request.url.lastIndexOf(".")) || Infinity) + 1);
  event.respondWith(
      caches.match(event.request).then(function(response) {
          return response || fetch(event.request);
      })
  );
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          console.log(cacheName);
         // if (CACHE_NAME !== cacheName &&  cacheName.startsWith("gih-cache")) {
          //  return caches.delete(cacheName);
         // }
        })
      );
    })
  );
});