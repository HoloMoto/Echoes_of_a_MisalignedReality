/**
 * Episode cache SW — serve prefetched episode HTML and shared assets.
 * Scope: webPage/
 */
const CACHE_NAME = 'hs-episode-cache-v4';

self.addEventListener('install', function () {
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

function isPublishedEpisodeHtml(url) {
  var p1 = url.pathname.match(/\/episode(\d+)\.html$/i);
  if (p1) return parseInt(p1[1], 10) >= 1 && parseInt(p1[1], 10) <= 7;
  var p2 = url.pathname.match(/\/part2_episode(\d+)\.html$/i);
  if (p2) return parseInt(p2[1], 10) >= 1 && parseInt(p2[1], 10) <= 2;
  return false;
}

function isStaticAsset(pathname) {
  return /\/(images|styles|scripts|font)\//i.test(pathname);
}

function shouldHandle(request) {
  if (request.method !== 'GET') return false;
  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  return isPublishedEpisodeHtml(url) || isStaticAsset(url.pathname);
}

async function fromNetwork(request) {
  var res = await fetch(request);
  var url = new URL(request.url);
  if (res && res.ok && (isPublishedEpisodeHtml(url) || isStaticAsset(url.pathname))) {
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
