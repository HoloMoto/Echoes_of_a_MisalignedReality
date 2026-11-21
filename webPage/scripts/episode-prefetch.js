/**
 * Episode prefetch / cache — while reading N, warm-load N+1 (and its images).
 * Strictly honors published boundaries: Part 1 (#1..#7) and Part 2 (#2-1..#2-2).
 */
(function () {
  'use strict';

  var CACHE_NAME = 'hs-episode-cache-v4';
  var MAX_PART1 = 7;
  var MAX_PART2 = 2;
  var SW_URL = 'sw.js';

  function detectEpisode() {
    var path = window.location.pathname || window.location.href || '';
    var p2 = path.match(/(?:^|\/)part2_episode(\d+)\.html(?:$|[?#])/i);
    if (p2) {
      return { part: 2, num: parseInt(p2[1], 10) };
    }
    var p1 = path.match(/(?:^|\/)episode(\d+)\.html(?:$|[?#])/i);
    if (p1) {
      return { part: 1, num: parseInt(p1[1], 10) };
    }
    return null;
  }

  function toAbsolute(url) {
    try {
      return new URL(url, window.location.href).href;
    } catch (e) {
      return url;
    }
  }

  function nextEpisodeInfo(ep) {
    if (!ep) return null;
    if (ep.part === 1) {
      if (ep.num >= MAX_PART1) return null;
      var n1 = ep.num + 1;
      return {
        url: toAbsolute('episode' + n1 + '.html'),
        label: '第' + n1 + '話'
      };
    }
    if (ep.part === 2) {
      if (ep.num >= MAX_PART2) return null;
      var n2 = ep.num + 1;
      return {
        url: toAbsolute('part2_episode' + n2 + '.html'),
        label: '第2部 第' + n2 + '話'
      };
    }
    return null;
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return Promise.resolve(null);
    if (
      window.location.protocol !== 'https:' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      return Promise.resolve(null);
    }
    return navigator.serviceWorker
      .register(SW_URL, { scope: './' })
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

  function setHintLoading(hint, label) {
    if (!hint) return;
    hint.className = 'episode-prefetch-hint is-visible';
    hint.innerHTML =
      '<span class="spin" aria-hidden="true"></span><span>' + label + 'を先読み中…</span>';
  }

  function setHintReady(hint, label) {
    if (!hint) return;
    hint.className = 'episode-prefetch-hint is-visible is-ready';
    hint.innerHTML =
      '<i class="fas fa-check" aria-hidden="true"></i><span>' + label + 'の表示準備完了</span>';
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
      /* ignore quota / opaque failures */
    }
  }

  function collectAssetUrls(htmlText) {
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
    [
      'styles/main.css',
      'styles/theme.css',
      'styles/syncretic-hud.css',
      'styles/episode.css',
      'styles/episode-hud.css',
      'styles/webxr-story.css',
      'scripts/syncretic-fx.js',
      'scripts/episode-hud.js',
      'scripts/main.js'
    ].forEach(function (p) {
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

  async function prefetch(next) {
    var hint = ensureHint(next.url);

    if (!('caches' in window)) {
      setHintUnsupported(hint);
    }

    setHintLoading(hint, next.label);

    if (!document.querySelector('link[data-episode-prefetch="' + next.url + '"]')) {
      var link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'document';
      link.href = next.url;
      link.setAttribute('data-episode-prefetch', next.url);
      document.head.appendChild(link);
    }

    try {
      if ('caches' in window) {
        var cache = await caches.open(CACHE_NAME);
        var cached = await cache.match(next.url, { ignoreSearch: true });
        if (cached) {
          var cachedText = await cached.clone().text();
          await warmAssets(collectAssetUrls(cachedText));
          setHintReady(hint, next.label);
          fetch(next.url, { credentials: 'same-origin', cache: 'no-cache' })
            .then(function (res) {
              if (res && res.ok) return putInCache(next.url, res);
            })
            .catch(function () {});
          return;
        }
      }

      var res = await fetch(next.url, { credentials: 'same-origin', cache: 'no-cache' });
      if (!res.ok) throw new Error('prefetch status ' + res.status);
      var text = await res.clone().text();
      await putInCache(next.url, res);
      await warmAssets(collectAssetUrls(text));
      setHintReady(hint, next.label);
    } catch (err) {
      console.warn('Episode prefetch failed:', err);
      setHintFailed(hint);
    }
  }

  function init() {
    var ep = detectEpisode();
    var next = nextEpisodeInfo(ep);
    if (!next) return;

    var run = function () {
      registerServiceWorker().finally(function () {
        prefetch(next);
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
