/**
 * FUI Splash - 4 phase sequence, tap to close
 * 英字用フォントは CSS の .fui-phase で GAU Root を適用
 */
(function () {
  'use strict';

  var CONFIG = {
    welcomeDuration: 1000,
    typewriterDuration: 5000,
    typewriterText: 'Syncretic Harmonic Interface for Neural Coherence and Reality Observation Terminal',
    acronymDuration: 1000
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

  function setActive(phaseEl) {
    Object.keys(phases).forEach(function (key) {
      var el = phases[key];
      if (el) el.classList.toggle('active', el === phaseEl);
    });
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
      var elapsed = now - start;
      var progress = Math.min(elapsed / durationMs, 1);
      var index = Math.floor(progress * len);
      typedEl.textContent = fullText.slice(0, index);
      if (progress >= 1) {
        cursorEl.classList.add('hidden');
        if (done) done();
        return;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function runSequence() {
    setActive(phases.welcome);

    setTimeout(function () {
      setActive(phases.typewriter);
      runTypewriter(CONFIG.typewriterDuration, CONFIG.typewriterText, function () {
        setActive(phases.acronym);
        if (acronymBox) acronymBox.classList.add('fade-done');

        setTimeout(function () {
          setActive(phases.final);
        }, CONFIG.acronymDuration);
      });
    }, CONFIG.welcomeDuration);
  }

  function closeSplash(e) {
    if (e) {
      e.preventDefault();
      if (e.type === 'touchend') e.preventDefault();
    }
    splash.classList.add('hide');
  }

  splash.setAttribute('role', 'button');
  splash.setAttribute('aria-label', 'スプラッシュを閉じる');

  splash.addEventListener('click', function (e) {
    if (e.target === splash || e.target.closest('.fui-center')) closeSplash(e);
  });

  splash.addEventListener('touchend', function (e) {
    if (e.target === splash || e.target.closest('.fui-center')) {
      e.preventDefault();
      closeSplash(e);
    }
  }, { passive: false });

  runSequence();
})();
