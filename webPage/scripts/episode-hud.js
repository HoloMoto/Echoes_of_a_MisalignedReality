/**
 * Episode Third-Eye Reading HUD
 * - Font size, line-height, Focus Mode, 《》 Optical Token Toggle
 * - Local scroll bookmark & read-completion sync
 */
(function () {
  'use strict';

  var PREF_KEY = 'hs-reader-prefs';
  var READ_KEY = 'hs-read-episodes';
  var LAST_KEY = 'hs-last-read';
  var POS_KEY = 'hs-scroll-pos';

  function currentFile() {
    var path = window.location.pathname || window.location.href || '';
    var m = path.match(/([^\/\\?#]+\.html)(?:$|[?#])/i);
    return m ? m[1] : 'episode1.html';
  }

  function loadPrefs() {
    try {
      return Object.assign(
        { size: 'md', lead: 'tight', focus: false, optics: true },
        JSON.parse(localStorage.getItem(PREF_KEY) || '{}')
      );
    } catch (e) {
      return { size: 'md', lead: 'tight', focus: false, optics: true };
    }
  }

  function savePrefs(prefs) {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    } catch (e) { /* ignore */ }
  }

  function decorateOpticalTokens(article) {
    var nodes = [];
    var walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = walker.nextNode())) {
      var parent = n.parentElement;
      if (!parent || parent.closest('.chapter-continue') || parent.closest('.chapter-break')) continue;
      if (n.nodeValue && n.nodeValue.indexOf('《') !== -1) nodes.push(n);
    }

    nodes.forEach(function (tn) {
      var parts = tn.nodeValue.split(/(《[^》]+》)/g);
      if (parts.length <= 1) return;
      var frag = document.createDocumentFragment();
      parts.forEach(function (part) {
        if (!part) return;
        if (part.indexOf('《') === 0 && part.lastIndexOf('》') === part.length - 1) {
          var span = document.createElement('span');
          span.className = 'ep-optical-token';
          span.textContent = part;
          frag.appendChild(span);
        } else {
          frag.appendChild(document.createTextNode(part));
        }
      });
      tn.parentNode.replaceChild(frag, tn);
    });
  }

  function markAsRead(file, title) {
    try {
      var map = JSON.parse(localStorage.getItem(READ_KEY) || '{}');
      map[file] = true;
      localStorage.setItem(READ_KEY, JSON.stringify(map));
      localStorage.setItem(LAST_KEY, JSON.stringify({ url: file, title: title }));
    } catch (e) { /* ignore */ }
  }

  function saveLastVisited(file, title) {
    try {
      localStorage.setItem(LAST_KEY, JSON.stringify({ url: file, title: title }));
    } catch (e) { /* ignore */ }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var article = document.querySelector('article.episode-text');
    if (!article) return;

    var file = currentFile();
    var h1 = document.querySelector('.episode-title h1');
    var epTitle = h1 ? h1.textContent.trim() : document.title;
    saveLastVisited(file, epTitle);

    decorateOpticalTokens(article);

    var prefs = loadPrefs();
    var sizes = ['sm', 'md', 'lg'];

    function applyPrefs() {
      sizes.forEach(function (s) { article.classList.remove('ep-size-' + s); });
      article.classList.add('ep-size-' + prefs.size);
      article.classList.remove('ep-lead-tight', 'ep-lead-wide');
      article.classList.add('ep-lead-' + prefs.lead);
      document.body.classList.toggle('ep-focus-mode', Boolean(prefs.focus));
      document.documentElement.classList.toggle('ep-optics-off', !prefs.optics);
    }
    applyPrefs();

    // Create floating reading HUD bar
    var bar = document.createElement('div');
    bar.className = 'episode-hud-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', '読書HUDコントロール');
    bar.innerHTML =
      '<span class="ep-hud-pct" id="epHudPct">0%</span>' +
      '<button type="button" class="ep-hud-btn" id="epSizeBtn" title="文字サイズ切替">文字 A±</button>' +
      '<button type="button" class="ep-hud-btn" id="epLeadBtn" title="行間切替">行間</button>' +
      '<button type="button" class="ep-hud-btn" id="epOpticsBtn" title="《》光学装飾の切替">《》装飾</button>' +
      '<button type="button" class="ep-hud-btn" id="epFocusBtn" title="集中読書モード">集中</button>';
    document.body.appendChild(bar);

    var pctEl = bar.querySelector('#epHudPct');
    var sizeBtn = bar.querySelector('#epSizeBtn');
    var leadBtn = bar.querySelector('#epLeadBtn');
    var opticsBtn = bar.querySelector('#epOpticsBtn');
    var focusBtn = bar.querySelector('#epFocusBtn');

    function syncBtnStates() {
      leadBtn.classList.toggle('is-active', prefs.lead === 'wide');
      opticsBtn.classList.toggle('is-active', Boolean(prefs.optics));
      focusBtn.classList.toggle('is-active', Boolean(prefs.focus));
    }
    syncBtnStates();

    sizeBtn.addEventListener('click', function () {
      var idx = (sizes.indexOf(prefs.size) + 1) % sizes.length;
      prefs.size = sizes[idx];
      applyPrefs();
      savePrefs(prefs);
    });

    leadBtn.addEventListener('click', function () {
      prefs.lead = prefs.lead === 'tight' ? 'wide' : 'tight';
      applyPrefs();
      syncBtnStates();
      savePrefs(prefs);
    });

    opticsBtn.addEventListener('click', function () {
      prefs.optics = !prefs.optics;
      applyPrefs();
      syncBtnStates();
      savePrefs(prefs);
    });

    focusBtn.addEventListener('click', function () {
      prefs.focus = !prefs.focus;
      applyPrefs();
      syncBtnStates();
      savePrefs(prefs);
    });

    // Bookmark restore prompt if previously scrolled between 12% and 92%
    try {
      var posMap = JSON.parse(localStorage.getItem(POS_KEY) || '{}');
      var savedPct = posMap[file];
      if (savedPct && savedPct >= 12 && savedPct <= 92) {
        var toast = document.createElement('div');
        toast.className = 'ep-resume-toast';
        toast.innerHTML =
          '<span>前回の読了位置（約 ' + Math.round(savedPct) + '%）があります</span>' +
          '<button type="button">そこへ移動</button>';
        toast.querySelector('button').addEventListener('click', function () {
          var docH = document.documentElement.scrollHeight - window.innerHeight;
          window.scrollTo({ top: Math.round((savedPct / 100) * docH), behavior: 'smooth' });
          toast.remove();
        });
        article.insertBefore(toast, article.firstChild);
      }
    } catch (e) { /* ignore */ }

    // Track scroll percentage + mark read near bottom
    var marked = false;
    var saveTick = null;

    function onScroll() {
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docH > 0 ? Math.min(100, Math.max(0, (window.scrollY / docH) * 100)) : 100;
      pctEl.textContent = Math.round(pct) + '%';

      if (pct >= 88 && !marked) {
        marked = true;
        markAsRead(file, epTitle);
      }

      clearTimeout(saveTick);
      saveTick = setTimeout(function () {
        try {
          var posMap = JSON.parse(localStorage.getItem(POS_KEY) || '{}');
          posMap[file] = Math.round(pct);
          localStorage.setItem(POS_KEY, JSON.stringify(posMap));
        } catch (e) { /* ignore */ }
      }, 300);
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  });
})();
