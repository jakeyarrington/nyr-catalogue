self.addEventListener('fetch', function(event) {
  var ext = event.request.url.slice((Math.max(0, event.request.url.lastIndexOf(".")) || Infinity) + 1);
  event.respondWith(
      caches.match(event.request).then(function(response) {
          console.log(ext);
          if(ext == 'json') {
            return fetch(event.request);
          }
          return response || fetch(event.request);
      })
  );
});