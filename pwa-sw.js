self.addEventListener('fetch', function(event) {
  console.log(event.request.url.slice((Math.max(0, fname.lastIndexOf(".")) || Infinity) + 1));
  event.respondWith(
      caches.match(event.request).then(function(response) {
          return response || fetch(event.request);
      })
  );
});