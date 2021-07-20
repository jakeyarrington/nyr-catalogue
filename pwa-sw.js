self.addEventListener('fetch', function(event) {
  console.log(event.request);
  event.respondWith(
      caches.match(event.request).then(function(response) {
          return response || fetch(event.request);
      })
  );
});