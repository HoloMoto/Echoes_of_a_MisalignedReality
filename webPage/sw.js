/**
 * Episode cache SW — serve prefetched episode HTML (and warm assets) on navigation.
 * Scope: same directory as this file (webPage/).
 */
const CACHE_NAME = 'hs-episode-cache-v2';

self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (k) {
            return k.indexOf('hs-episode-cache-') === 0 && k !== CACHE_NAME;
          })
          .map(function (k) {
            return caches.delete(k);
          })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

function isEpisodeHtml(url) {
  return /\/episode\d+\.html$/i.test(url.pathname);
}

function shouldHandle(request) {
  if (request.method !== 'GET') return false;
  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (isEpisodeHtml(url)) return true;
  if (/\/images\//i.test(url.pathname)) return true;
  if (/\/styles\//i.test(url.pathname)) return true;
  return false;
}

async function fromNetwork(request) {
  var res = await fetch(request);
  var path = new URL(request.url).pathname;
  if (
    res &&
    res.ok &&
    (isEpisodeHtml(new URL(request.url)) ||
      /\/images\//i.test(path) ||
      /\/styles\//i.test(path))
  ) {
    var cache = await caches.open(CACHE_NAME);
    try {
      await cache.put(request, res.clone());
    } catch (e) {
      /* ignore */
    }
  }
  return res;
}

self.addEventListener('fetch', function (event) {
  if (!shouldHandle(event.request)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.match(event.request, { ignoreSearch: true }).then(function (cached) {
        if (cached) {
          // Stale-while-revalidate: show cached episode immediately, refresh in background
          event.waitUntil(
            fetch(event.request)
              .then(function (res) {
                if (res && res.ok) return cache.put(event.request, res.clone());
              })
              .catch(function () {})
          );
          return cached;
        }
        return fromNetwork(event.request);
      });
    })
  );
});
