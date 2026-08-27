/**
 * Episode prefetch / cache — while reading N, warm-load N+1 (and its images).
 * Requires https or localhost for Cache API + Service Worker.
 */
(function () {
  'use strict';

  var CACHE_NAME = 'hs-episode-cache-v2';
  var MAX_EPISODE = 20;
  var SW_URL = 'sw.js';

  function currentEpisodeNumber() {
    var match = (window.location.pathname || '').match(/episode(\d+)\.html/i);
    if (match) return parseInt(match[1], 10);
    match = (window.location.href || '').match(/episode(\d+)\.html/i);
    if (match) return parseInt(match[1], 10);
    return null;
  }

  function toAbsolute(url) {
    try {
      return new URL(url, window.location.href).href;
    } catch (e) {
      return url;
    }
  }

  function nextEpisodeUrl(num) {
    if (!num || num >= MAX_EPISODE) return null;
    return toAbsolute('episode' + (num + 1) + '.html');
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return Promise.resolve(null);
    // file:// and insecure LAN origins cannot register
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return Promise.resolve(null);
    }
    return navigator.serviceWorker
      .register(SW_URL, { scope: './' })
      .then(function (reg) {
        return reg;
      })
      .catch(function (err) {
        console.warn('Episode SW register failed:', err);
        return null;
      });
  }

  function ensureHint(nextUrl) {
    var continueBox = document.querySelector('.chapter-continue');
    if (!continueBox) return null;

    var hint = continueBox.querySelector('.episode-prefetch-hint');
    if (!hint) {
      hint = document.createElement('div');
      hint.className = 'episode-prefetch-hint';
      hint.setAttribute('aria-live', 'polite');
      continueBox.appendChild(hint);
    }

    var nextLink = continueBox.querySelector('a.btn-primary[href*="episode"]');
    if (nextLink && nextUrl && !nextLink.getAttribute('data-prefetch-bound')) {
      nextLink.setAttribute('data-prefetch-bound', '1');
    }
    return hint;
  }

  function setHintLoading(hint, nextNum) {
    if (!hint) return;
    hint.className = 'episode-prefetch-hint is-visible';
    hint.innerHTML =
      '<span class="spin" aria-hidden="true"></span><span>第' + nextNum + '話を先読み中…</span>';
  }

  function setHintReady(hint, nextNum) {
    if (!hint) return;
    hint.className = 'episode-prefetch-hint is-visible is-ready';
    hint.innerHTML =
      '<i class="fas fa-check" aria-hidden="true"></i><span>第' + nextNum + '話の表示準備完了</span>';
  }

  function setHintFailed(hint, message) {
    if (!hint) return;
    hint.className = 'episode-prefetch-hint is-visible';
    hint.innerHTML = '<span>' + (message || '先読みに失敗（通常表示で続行）') + '</span>';
  }

  function setHintUnsupported(hint) {
    if (!hint) return;
    hint.className = 'episode-prefetch-hint';
    hint.innerHTML = '';
  }

  async function putInCache(url, response) {
    if (!('caches' in window)) return;
    try {
      var cache = await caches.open(CACHE_NAME);
      await cache.put(url, response.clone());
    } catch (e) {
      // ignore quota / opaque failures
    }
  }

  function collectAssetUrls(htmlText, pageUrl) {
    var urls = [];
    try {
      var doc = new DOMParser().parseFromString(htmlText, 'text/html');
      doc.querySelectorAll('img[src]').forEach(function (img) {
        var src = img.getAttribute('src');
        if (src && src.indexOf('data:') !== 0) urls.push(toAbsolute(src));
      });
    } catch (e) {
      /* ignore parse errors */
    }
    // shared styles used by episode pages
    ['styles/main.css', 'styles/theme.css', 'styles/episode.css'].forEach(function (p) {
      urls.push(toAbsolute(p));
    });
    return urls.filter(function (u, i, arr) {
      return arr.indexOf(u) === i;
    });
  }

  async function warmAssets(urls) {
    if (!('caches' in window) || !urls.length) return;
    var cache = await caches.open(CACHE_NAME);
    await Promise.all(
      urls.map(function (url) {
        return cache.match(url).then(function (hit) {
          if (hit) return;
          return fetch(url, { credentials: 'same-origin', cache: 'default' })
            .then(function (res) {
              if (res && res.ok) return cache.put(url, res.clone());
            })
            .catch(function () {});
        });
      })
    );
  }

  async function prefetch(url, nextNum) {
    var hint = ensureHint(url);

    if (!('caches' in window)) {
      setHintUnsupported(hint);
      // still add <link rel=prefetch> as best-effort
    }

    setHintLoading(hint, nextNum);

    if (!document.querySelector('link[data-episode-prefetch="' + url + '"]')) {
      var link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'document';
      link.href = url;
      link.setAttribute('data-episode-prefetch', url);
      document.head.appendChild(link);
    }

    try {
      if ('caches' in window) {
        var cache = await caches.open(CACHE_NAME);
        var cached = await cache.match(url, { ignoreSearch: true });
        if (cached) {
          var cachedText = await cached.clone().text();
          await warmAssets(collectAssetUrls(cachedText, url));
          setHintReady(hint, nextNum);
          // still revalidate in background
          fetch(url, { credentials: 'same-origin', cache: 'no-cache' })
            .then(function (res) {
              if (res && res.ok) return putInCache(url, res);
            })
            .catch(function () {});
          return;
        }
      }

      var res = await fetch(url, { credentials: 'same-origin', cache: 'no-cache' });
      if (!res.ok) throw new Error('prefetch status ' + res.status);
      var text = await res.clone().text();
      await putInCache(url, res);
      await warmAssets(collectAssetUrls(text, url));
      setHintReady(hint, nextNum);
    } catch (err) {
      console.warn('Episode prefetch failed:', err);
      setHintFailed(hint);
    }
  }

  function init() {
    var num = currentEpisodeNumber();
    if (!num) return;
    var nextUrl = nextEpisodeUrl(num);
    if (!nextUrl) return;

    var run = function () {
      registerServiceWorker().finally(function () {
        prefetch(nextUrl, num + 1);
      });
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(run, { timeout: 1800 });
    } else {
      setTimeout(run, 400);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
