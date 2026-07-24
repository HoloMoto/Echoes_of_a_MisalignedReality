/**
 * Episode prefetch / cache — while reading N, warm-load N+1.
 */
(function () {
  'use strict';

  var CACHE_NAME = 'hs-episode-cache-v1';
  var MAX_EPISODE = 20;

  function currentEpisodeNumber() {
    var match = (window.location.pathname || '').match(/episode(\d+)\.html/i);
    if (match) return parseInt(match[1], 10);
    match = (window.location.href || '').match(/episode(\d+)\.html/i);
    if (match) return parseInt(match[1], 10);
    return null;
  }

  function nextEpisodeUrl(num) {
    if (!num || num >= MAX_EPISODE) return null;
    return 'episode' + (num + 1) + '.html';
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
      nextLink.addEventListener('click', function (e) {
        // Let browser navigate; cache is already warm.
        // If Cache API has a copy, still normal navigation is fine.
      });
    }
    return hint;
  }

  function setHintLoading(hint, nextNum) {
    if (!hint) return;
    hint.className = 'episode-prefetch-hint is-visible';
    hint.innerHTML = '<span class="spin" aria-hidden="true"></span><span>第' + nextNum + '話を先読み中…</span>';
  }

  function setHintReady(hint, nextNum) {
    if (!hint) return;
    hint.className = 'episode-prefetch-hint is-visible is-ready';
    hint.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i><span>第' + nextNum + '話の表示準備完了</span>';
  }

  function setHintFailed(hint) {
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

  async function prefetch(url, nextNum) {
    var hint = ensureHint(url);
    setHintLoading(hint, nextNum);

    // Browser-level prefetch
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
        var cached = await cache.match(url);
        if (cached) {
          setHintReady(hint, nextNum);
          return;
        }
      }

      var res = await fetch(url, { credentials: 'same-origin', cache: 'force-cache' });
      if (!res.ok) throw new Error('prefetch status ' + res.status);
      await putInCache(url, res);
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

    // Defer until idle so current episode paint isn't blocked
    var run = function () { prefetch(nextUrl, num + 1); };
    if ('requestIdleCallback' in window) {
      requestIdleCallback(run, { timeout: 2500 });
    } else {
      setTimeout(run, 800);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
