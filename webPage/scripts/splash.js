/**
 * FUI Splash - 4 phase optical boot sequence
 * - Theme-aware Canvas reticle + neural coherence waveform
 * - Auto-skips within same browser session unless replayed manually
 * - Click / tap anywhere or press Esc / Enter / Space to dismiss
 */
(function () {
  'use strict';

  var SESSION_KEY = 'hs-splash-seen';
  var CONFIG = {
    welcomeDuration: 750,
    typewriterDuration: 2800,
    typewriterText:
      'Syncretic Harmonic Interface for Neural Coherence and Reality Observation Terminal',
    acronymDuration: 950
  };

  var splash = document.getElementById('fui-splash');
  if (!splash) return;

  var phases = {
    welcome: document.getElementById('fui-phase-welcome'),
    typewriter: document.getElementById('fui-phase-typewriter'),
    acronym: document.getElementById('fui-phase-acronym'),
    final: document.getElementById('fui-phase-final')
  };

  var typedEl = document.getElementById('fui-typed-text');
  var cursorEl = document.getElementById('fui-cursor');
  var acronymBox = document.getElementById('fui-acronym-box');
  var skipBtn = document.getElementById('fuiSkipBtn');
  var canvas = document.getElementById('fui-splash-canvas');

  var timers = [];
  var rafTypewriter = null;
  var rafCanvas = null;
  var glitchTimer = null;
  var closed = false;

  function addTimer(fn, ms) {
    var id = window.setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  function clearAllTimers() {
    while (timers.length) {
      window.clearTimeout(timers.pop());
    }
    if (rafTypewriter) {
      cancelAnimationFrame(rafTypewriter);
      rafTypewriter = null;
    }
    if (glitchTimer) {
      window.clearTimeout(glitchTimer);
      glitchTimer = null;
    }
  }

  function setActive(phaseEl) {
    Object.keys(phases).forEach(function (key) {
      var el = phases[key];
      if (el) el.classList.toggle('active', el === phaseEl);
    });
  }

  function startSplashCanvas() {
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var reduceMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    var startTime = performance.now();
    function draw(now) {
      if (closed) return;
      if (canvas.width !== Math.floor(window.innerWidth * dpr)) resize();
      var w = window.innerWidth;
      var h = window.innerHeight;
      var cx = w / 2;
      var cy = h / 2;
      var t = (now - startTime) * 0.001;
      var isLight = document.documentElement.getAttribute('data-theme') === 'light';
      var cyan = isLight ? '8, 145, 178' : '103, 232, 249';
      var violet = isLight ? '79, 70, 229' : '165, 180, 252';

      ctx.clearRect(0, 0, w, h);

      var baseR = Math.min(w, h) * 0.28;
      // Outer rotating targeting rings
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.14);
      ctx.strokeStyle = 'rgba(' + cyan + ', 0.16)';
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 14]);
      ctx.beginPath();
      ctx.arc(0, 0, baseR * 1.15, 0, Math.PI * 2);
      ctx.stroke();

      ctx.rotate(-t * 0.28);
      ctx.strokeStyle = 'rgba(' + violet + ', 0.22)';
      ctx.setLineDash([28, 10, 4, 10]);
      ctx.beginPath();
      ctx.arc(0, 0, baseR * 0.92, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Neural coherence wave near bottom third
      var waveY = h * 0.72;
      var waveW = Math.min(w * 0.68, 520);
      var x0 = cx - waveW / 2;
      ctx.beginPath();
      for (var i = 0; i <= 72; i++) {
        var p = i / 72;
        var x = x0 + p * waveW;
        var env = Math.sin(p * Math.PI);
        var amp =
          (Math.sin(p * 18 - t * 4.2) * 8 + Math.cos(p * 7 + t * 2.1) * 5) * env;
        if (i === 0) ctx.moveTo(x, waveY + amp);
        else ctx.lineTo(x, waveY + amp);
      }
      ctx.strokeStyle = 'rgba(' + cyan + ', 0.35)';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      if (!reduceMotion) {
        rafCanvas = requestAnimationFrame(draw);
      }
    }
    rafCanvas = requestAnimationFrame(draw);
  }

  function stopSplashCanvas() {
    if (rafCanvas) {
      cancelAnimationFrame(rafCanvas);
      rafCanvas = null;
    }
  }

  function runTypewriter(durationMs, fullText, done) {
    if (!typedEl || !cursorEl) {
      if (done) done();
      return;
    }
    typedEl.textContent = '';
    cursorEl.classList.remove('hidden');
    var start = performance.now();
    var len = fullText.length;

    function tick(now) {
      if (closed) return;
      var elapsed = now - start;
      var progress = Math.min(elapsed / durationMs, 1);
      var index = Math.floor(progress * len);
      typedEl.textContent = fullText.slice(0, index);
      if (progress >= 1) {
        cursorEl.classList.add('hidden');
        if (done) done();
        return;
      }
      rafTypewriter = requestAnimationFrame(tick);
    }
    rafTypewriter = requestAnimationFrame(tick);
  }

  function triggerGlitch() {
    if (closed || !splash || splash.classList.contains('hide')) return;
    var turb = document.getElementById('fui-glitch-turb');
    if (turb) turb.setAttribute('seed', String(Math.floor(Math.random() * 100)));
    splash.classList.add('fui-glitch');
    addTimer(function () {
      splash.classList.remove('fui-glitch');
    }, 160);
  }

  function scheduleNextGlitch() {
    if (closed) return;
    var delay = 1700 + Math.random() * 2600;
    glitchTimer = window.setTimeout(function () {
      triggerGlitch();
      scheduleNextGlitch();
    }, delay);
  }

  function runSequence() {
    closed = false;
    splash.classList.remove('hide');
    splash.setAttribute('aria-hidden', 'false');
    if (acronymBox) acronymBox.classList.remove('fade-done');
    if (typedEl) typedEl.textContent = '';

    setActive(phases.welcome);
    startSplashCanvas();
    scheduleNextGlitch();

    addTimer(function () {
      if (closed) return;
      setActive(phases.typewriter);
      runTypewriter(CONFIG.typewriterDuration, CONFIG.typewriterText, function () {
        if (closed) return;
        setActive(phases.acronym);
        if (acronymBox) acronymBox.classList.add('fade-done');

        addTimer(function () {
          if (closed) return;
          setActive(phases.final);
        }, CONFIG.acronymDuration);
      });
    }, CONFIG.welcomeDuration);
  }

  function closeSplash(e) {
    if (closed) return;
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    closed = true;
    clearAllTimers();
    stopSplashCanvas();
    splash.classList.remove('fui-glitch');
    splash.classList.add('hide');
    splash.setAttribute('aria-hidden', 'true');
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch (err) {
      /* ignore */
    }
  }

  splash.setAttribute('role', 'dialog');
  splash.setAttribute('aria-label', '起動シーケンス（クリックまたはEscでスキップ）');

  splash.addEventListener('click', function (e) {
    closeSplash(e);
  });

  if (skipBtn) {
    skipBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      closeSplash(e);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (closed) return;
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      closeSplash(e);
    }
  });

  window.hsReplaySplash = function () {
    clearAllTimers();
    stopSplashCanvas();
    runSequence();
  };

  var alreadySeen = false;
  try {
    alreadySeen = sessionStorage.getItem(SESSION_KEY) === '1';
  } catch (e) {
    alreadySeen = false;
  }

  var forceReplay = /[?&]replay=1\b/.test(window.location.search || '');
  var reduceMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if ((alreadySeen || reduceMotion) && !forceReplay) {
    closed = true;
    splash.classList.add('hide');
    splash.setAttribute('aria-hidden', 'true');
  } else {
    runSequence();
  }
})();
