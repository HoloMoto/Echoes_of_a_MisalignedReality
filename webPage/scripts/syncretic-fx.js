/**
 * Syncretic Optical HUD Engine + Easter Egg System
 * - Real-time Canvas 2D spatial field (adapts to Dark / Light / RAW VISION / ANALOG HATCH)
 * - Safe short-label decode animation (never breaks nested HTML)
 * - Easter Eggs:
 *   1. UBIQUITOUS TRACE TERMINAL (Ctrl+Shift+U, [TRACE] button, or hero terminal click)
 *   2. RAW VISION Layer (command `raw`, Konami code, or triple-click telemetry badge)
 *   3. ANALOG HATCH Bypass (command `analog` or footer [HATCH-00] switch)
 */
(function () {
  'use strict';

  var RAW_KEY = 'hs-raw-vision';
  var ANALOG_KEY = 'hs-analog-hatch';

  function isEpisodePage() {
    return Boolean(document.querySelector('article.episode-text'));
  }

  function ensureGlitchFilter() {
    if (document.getElementById('fui-glitch-filter')) return;
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true">' +
      '<defs>' +
      '<filter id="fui-glitch-filter" x="-20%" y="-20%" width="140%" height="140%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" result="turb" id="fui-glitch-turb"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="turb" scale="24" xChannelSelector="R" yChannelSelector="G" result="displaced"/>' +
      '<feColorMatrix in="displaced" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/>' +
      '<feOffset in="r" dx="-4" dy="0" result="ro"/>' +
      '<feColorMatrix in="displaced" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g"/>' +
      '<feOffset in="g" dx="0" dy="0" result="go"/>' +
      '<feColorMatrix in="displaced" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b"/>' +
      '<feOffset in="b" dx="4" dy="0" result="bo"/>' +
      '<feBlend in="ro" in2="go" mode="screen" result="rg"/>' +
      '<feBlend in="rg" in2="bo" mode="screen" result="final"/>' +
      '</filter></defs></svg>';
    document.body.insertBefore(wrap.firstChild, document.body.firstChild);
  }

  function pulseGlitch() {
    var turb = document.getElementById('fui-glitch-turb');
    if (turb) turb.setAttribute('seed', String(Math.floor(Math.random() * 99)));
    document.documentElement.classList.add('raw-glitch-pulse');
    window.setTimeout(function () {
      document.documentElement.classList.remove('raw-glitch-pulse');
    }, 190);
  }

  function setRawVision(active) {
    pulseGlitch();
    document.documentElement.classList.toggle('raw-vision', active);
    if (active) {
      document.documentElement.classList.remove('analog-hatch');
      try { sessionStorage.removeItem(ANALOG_KEY); } catch (e) {}
    }
    try {
      if (active) sessionStorage.setItem(RAW_KEY, '1');
      else sessionStorage.removeItem(RAW_KEY);
    } catch (e) {}
    updateBadgeText();
  }

  function setAnalogHatch(active) {
    document.documentElement.classList.toggle('analog-hatch', active);
    if (active) {
      document.documentElement.classList.remove('raw-vision');
      try { sessionStorage.removeItem(RAW_KEY); } catch (e) {}
    }
    try {
      if (active) sessionStorage.setItem(ANALOG_KEY, '1');
      else sessionStorage.removeItem(ANALOG_KEY);
    } catch (e) {}
    updateBadgeText();
  }

  /* ---------- Canvas 2D Spatial Field ---------- */
  function initSpatialCanvas() {
    if (document.getElementById('syncretic-canvas')) return;
    var canvas = document.createElement('canvas');
    canvas.id = 'syncretic-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(canvas, document.body.firstChild);

    var frame = document.createElement('div');
    frame.className = 'syncretic-hud-frame';
    frame.setAttribute('aria-hidden', 'true');
    document.body.appendChild(frame);

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var reduceMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var episodeMode = isEpisodePage();
    var nodeCount = episodeMode ? 22 : 44;
    var nodes = [];
    var pointer = { x: -9999, y: -9999 };
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = window.innerWidth;
    var height = window.innerHeight;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    for (var i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: 1.1 + Math.random() * 1.7,
        phase: Math.random() * Math.PI * 2
      });
    }

    if (!episodeMode) {
      window.addEventListener('pointermove', function (e) {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
      });
    }

    var start = performance.now();
    function tick(now) {
      var t = (now - start) * 0.001;
      var scrollY = window.scrollY || 0;
      var isLight = document.documentElement.getAttribute('data-theme') === 'light';
      var isRaw = document.documentElement.classList.contains('raw-vision');
      var isAnalog = document.documentElement.classList.contains('analog-hatch');

      ctx.clearRect(0, 0, width, height);

      var alphaScale = episodeMode ? 0.36 : 1;
      var primaryRgb = isAnalog
        ? '139, 58, 43'
        : isLight
          ? '8, 145, 178'
          : '103, 232, 249';
      var secondaryRgb = isAnalog
        ? '45, 76, 99'
        : isLight
          ? '79, 70, 229'
          : '165, 180, 252';
      var alertRgb = '253, 164, 175';

      // Subtle architectural grid lines with scroll parallax
      var gridSize = isAnalog ? 56 : 72;
      var offsetY = (scrollY * 0.14) % gridSize;
      ctx.strokeStyle = 'rgba(' + primaryRgb + ', ' + (0.04 * alphaScale) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var gx = 0; gx < width; gx += gridSize) {
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
      }
      for (var gy = -offsetY; gy < height; gy += gridSize) {
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
      }
      ctx.stroke();

      // Update & draw neural nodes + connections
      var linkDist = episodeMode ? 105 : 145;
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (!reduceMotion) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < -20) n.x = width + 20;
          if (n.x > width + 20) n.x = -20;
          if (n.y < -20) n.y = height + 20;
          if (n.y > height + 20) n.y = -20;
        }

        var pulse = 0.45 + 0.55 * Math.sin(t * 1.4 + n.phase);
        ctx.fillStyle = 'rgba(' + primaryRgb + ', ' + (0.45 * pulse * alphaScale) + ')';
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();

        for (var j = i + 1; j < nodes.length; j++) {
          var m = nodes[j];
          var dx = n.x - m.x;
          var dy = n.y - m.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < linkDist) {
            var lineAlpha = (1 - d / linkDist) * 0.16 * alphaScale;
            ctx.strokeStyle =
              'rgba(' + (isRaw ? alertRgb : secondaryRgb) + ', ' + lineAlpha + ')';
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
          }
        }

        if (!episodeMode) {
          var pdx = n.x - pointer.x;
          var pdy = n.y - pointer.y;
          var pd = Math.sqrt(pdx * pdx + pdy * pdy);
          if (pd < 170) {
            ctx.strokeStyle = 'rgba(' + primaryRgb + ', ' + ((1 - pd / 170) * 0.34) + ')';
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }
      }

      // RAW VISION Easter Egg: active triangulation radar + AFX-012-VFZ23 pulse
      if (isRaw && !episodeMode) {
        var rx = width * 0.78;
        var ry = height * 0.32;
        var sweep = (t * 0.9) % (Math.PI * 2);
        ctx.save();
        ctx.translate(rx, ry);
        ctx.strokeStyle = 'rgba(253, 164, 175, 0.24)';
        ctx.setLineDash([6, 8]);
        [70, 130, 190].forEach(function (r) {
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();
        });
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(103, 232, 249, 0.48)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(sweep) * 190, Math.sin(sweep) * 190);
        ctx.stroke();
        ctx.restore();
      }

      if (!reduceMotion) {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  }

  /* ---------- Safe Short-Label Decode Effect ---------- */
  function initSafeDecode() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var els = document.querySelectorAll('.hud-decode');
    var glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/:<>';

    els.forEach(function (el) {
      if (el.children.length > 0) return;
      var target = el.getAttribute('data-text') || el.textContent.trim();
      if (!target || target.length > 36) return;

      var frame = 0;
      var totalFrames = 14;
      var timer = window.setInterval(function () {
        frame++;
        var progress = frame / totalFrames;
        var out = '';
        for (var i = 0; i < target.length; i++) {
          if (target[i] === ' ') {
            out += ' ';
          } else if (i / target.length < progress) {
            out += target[i];
          } else {
            out += glyphs[Math.floor(Math.random() * glyphs.length)];
          }
        }
        el.textContent = out;
        if (frame >= totalFrames) {
          window.clearInterval(timer);
          el.textContent = target;
        }
      }, 28);
    });
  }

  /* ---------- HUD Badge & Footer Easter-Egg Triggers ---------- */
  var badgeEl = null;

  function updateBadgeText() {
    if (!badgeEl) return;
    var label = badgeEl.querySelector('.hud-badge-label');
    if (!label) return;
    if (document.documentElement.classList.contains('raw-vision')) {
      label.textContent = 'LAYER: RAW VISION // AFX-012';
    } else if (document.documentElement.classList.contains('analog-hatch')) {
      label.textContent = 'MODE: ANALOG HATCH // MANUAL';
    } else {
      label.textContent = 'THIRD EYE // TRACE [CTRL+SHIFT+U]';
    }
  }

  function createHudChrome() {
    if (!document.querySelector('.hud-telemetry-badge')) {
      badgeEl = document.createElement('button');
      badgeEl.type = 'button';
      badgeEl.className = 'hud-telemetry-badge';
      badgeEl.title = 'クリック: 観測端末を開く / 3回連続クリック: RAW VISION切替';
      badgeEl.innerHTML =
        '<span class="hud-telemetry-dot" aria-hidden="true"></span>' +
        '<span class="hud-badge-label">THIRD EYE // TRACE [CTRL+SHIFT+U]</span>';
      document.body.appendChild(badgeEl);
      updateBadgeText();

      var clickCount = 0;
      var clickTimer = null;
      badgeEl.addEventListener('click', function () {
        clickCount++;
        clearTimeout(clickTimer);
        if (clickCount >= 3) {
          clickCount = 0;
          setRawVision(!document.documentElement.classList.contains('raw-vision'));
          return;
        }
        clickTimer = setTimeout(function () {
          if (clickCount === 1) openTraceTerminal();
          clickCount = 0;
        }, 260);
      });
    }

    // Add subtle Analog Hatch + Replay triggers to footer if not present
    var footerBottom = document.querySelector('.footer-bottom');
    if (footerBottom && !footerBottom.querySelector('.footer-easter-triggers')) {
      var bar = document.createElement('div');
      bar.className = 'footer-easter-triggers';
      bar.style.justifyContent = 'center';

      var traceBtn = document.createElement('button');
      traceBtn.type = 'button';
      traceBtn.className = 'footer-mini-btn';
      traceBtn.textContent = '[TRACE CONSOLE]';
      traceBtn.addEventListener('click', openTraceTerminal);
      bar.appendChild(traceBtn);

      var hatchBtn = document.createElement('button');
      hatchBtn.type = 'button';
      hatchBtn.className = 'footer-mini-btn';
      hatchBtn.title = 'デジタル制御外の物理バイパス切替';
      hatchBtn.textContent = '[HATCH-00]';
      hatchBtn.addEventListener('click', function () {
        setAnalogHatch(!document.documentElement.classList.contains('analog-hatch'));
      });
      bar.appendChild(hatchBtn);

      if (typeof window.hsReplaySplash === 'function') {
        var replayBtn = document.createElement('button');
        replayBtn.type = 'button';
        replayBtn.className = 'footer-mini-btn';
        replayBtn.textContent = '[REPLAY BOOT]';
        replayBtn.addEventListener('click', function () {
          window.hsReplaySplash();
        });
        bar.appendChild(replayBtn);
      }

      footerBottom.appendChild(bar);
    }

    // Hero terminal fragment click shortcut on index.html
    var heroTerminal = document.querySelector('.hero-panel .terminal-fragment');
    if (heroTerminal) {
      heroTerminal.style.cursor = 'pointer';
      heroTerminal.title = 'クリックで観測コンソールを起動';
      heroTerminal.addEventListener('click', openTraceTerminal);
    }
  }

  /* ---------- UBIQUITOUS TRACE TERMINAL (Easter Egg Console) ---------- */
  var modalEl = null;
  var outputEl = null;
  var inputEl = null;

  var LOG_ENTRIES = {
    help: {
      cls: 'trace-line-ok',
      text:
        'AVAILABLE COMMANDS:\n' +
        '  status   - 現在の現実レイヤー・観測座標を確認\n' +
        '  chika    - 対象: 春風千花（非端末接続ログ）\n' +
        '  kanda    - 観測員: 神田響（スサノオ現場記録）\n' +
        '  aya      - 関係者: 永洞綾（赤いスマートアイ）\n' +
        '  shimizu  - 隊員: 清水暁美（ビーコン AFX-012-VFZ23）\n' +
        '  rurimi   - 地点: 瑠璃見ダム湖周辺ネットワーク異常\n' +
        '  kagura   - 超高度AI《神楽》照会\n' +
        '  raw      - [OVERRIDE] サードアイ RAW VISION モード切替\n' +
        '  analog   - [BYPASS] アナログハッチ（物理図面モード）切替\n' +
        '  splash   - 起動シーケンスを再再生（トップページ）\n' +
        '  clear    - ログを消去 / exit - 閉じる'
    },
    chika: {
      cls: 'trace-line-cmd',
      text:
        '[SUBJECT: HARUKAZE CHIKA]\n' +
        '> 2073.04.03 INTERSECTION A-17: スマートアイ未装着のまま広域網を視覚認識。\n' +
        '> 生体認証鍵: UNKNOWN / 2072年4月事故後の記録に半年の空白。'
    },
    kanda: {
      cls: 'trace-line-cmd',
      text:
        '[UNIT: KANDA HIBIKI // SUSANOO]\n' +
        '> 「無理に囲えば折れる。距離と速さは相手に合わせる、それが現場だろ？」\n' +
        '> メモリー受け渡し後、13課の追跡を察知。'
    },
    aya: {
      cls: 'trace-line-cmd',
      text:
        '[CONTACT: EIDO AYA // RURIMI HIGH]\n' +
        '> 赤いバイク・赤いスマートアイ・銀の翼のペンダント。\n' +
        '> 2073.04.04 業務連絡添付ファイルに不審な走査痕（踏み台未遂）。'
    },
    shimizu: {
      cls: 'trace-line-warn',
      text:
        '[OPERATOR: SHIMIZU AKEMI // SUSANOO]\n' +
        '> 偽装コンテナ内3面モニタよりビーコン AFX-012-VFZ23 を捕捉。\n' +
        '> 「乾かす暇も与えてくれない上司がいますので」'
    },
    rurimi: {
      cls: 'trace-line-alert',
      text:
        '[NODE: RURIMI_DAM_01]\n' +
        '> ダム湖水冷サーバー施設周囲に未承認の暗号枝（BRANCH）を検出。\n' +
        '> 境界のノイズ増大中——「扉ではなく、窓を作れ」。'
    },
    kagura: {
      cls: 'trace-line-ok',
      text:
        '《神楽》より応答：\n' +
        '「観測者アクセスを確認。現在の公開レイヤーは第1部 第7話および第2部 第2話まで同期されています。無理な深層開示は認知負荷を招くため制限中です。」'
    },
    kai: {
      cls: 'trace-line-warn',
      text:
        '[MEMORY FRAGMENT // ARCHIVE-01]\n' +
        '「雲に隠れて、それがわからないから探しに行くんだよ」\n' +
        '> 記録上：該当生徒は存在しません（FILE CORRUPTED）。'
    }
  };

  function appendLine(text, cls) {
    if (!outputEl) return;
    var div = document.createElement('div');
    div.className = 'trace-line-entry ' + (cls || '');
    div.textContent = text;
    outputEl.appendChild(div);
    outputEl.scrollTop = outputEl.scrollHeight;
  }

  function runCommand(rawInput) {
    var cmd = (rawInput || '').trim().toLowerCase();
    if (!cmd) return;
    appendLine('> ' + rawInput, 'trace-line-cmd');

    if (cmd === 'clear') {
      outputEl.innerHTML = '';
      return;
    }
    if (cmd === 'exit' || cmd === 'quit') {
      closeTraceTerminal();
      return;
    }
    if (cmd === 'status') {
      var theme = document.documentElement.getAttribute('data-theme') || 'dark';
      var raw = document.documentElement.classList.contains('raw-vision');
      var analog = document.documentElement.classList.contains('analog-hatch');
      appendLine(
        'SYSTEM STATUS:\n' +
          '  THEME: ' + theme.toUpperCase() + '\n' +
          '  RAW VISION: ' + (raw ? 'ACTIVE' : 'STANDBY') + '\n' +
          '  ANALOG HATCH: ' + (analog ? 'BYPASS OPEN' : 'SEALED') + '\n' +
          '  PUBLISHED SYNC: PART1 [#01-#07] / PART2 [#2-1-#2-2]',
        'trace-line-ok'
      );
      return;
    }
    if (cmd === 'raw') {
      var nextRaw = !document.documentElement.classList.contains('raw-vision');
      setRawVision(nextRaw);
      appendLine(
        nextRaw
          ? '>> THIRD EYE RAW VISION OVERRIDE: ENABLED (隠蔽座標レイヤーを表示)'
          : '>> THIRD EYE RAW VISION OVERRIDE: DISABLED',
        nextRaw ? 'trace-line-alert' : 'trace-line-ok'
      );
      return;
    }
    if (cmd === 'analog') {
      var nextAnalog = !document.documentElement.classList.contains('analog-hatch');
      setAnalogHatch(nextAnalog);
      appendLine(
        nextAnalog
          ? '>> ANALOG HATCH OPEN: デジタル制御外・紙媒体モードへ退避しました'
          : '>> ANALOG HATCH SEALED: 光学HUDへ復帰しました',
        'trace-line-warn'
      );
      return;
    }
    if (cmd === 'splash') {
      if (typeof window.hsReplaySplash === 'function') {
        closeTraceTerminal();
        window.hsReplaySplash();
      } else {
        appendLine('起動シーケンスはトップページ（index.html）で再生できます。', 'trace-line-warn');
      }
      return;
    }
    if (LOG_ENTRIES[cmd]) {
      appendLine(LOG_ENTRIES[cmd].text, LOG_ENTRIES[cmd].cls);
      return;
    }
    appendLine(
      'ERROR: unknown command "' + cmd + '". `help` でコマンド一覧を表示します。',
      'trace-line-alert'
    );
  }

  function buildTraceModal() {
    if (modalEl) return;
    modalEl = document.createElement('div');
    modalEl.className = 'trace-modal';
    modalEl.id = 'trace-terminal-modal';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-label', 'Ubiquitous Trace Console');
    modalEl.innerHTML =
      '<div class="trace-window">' +
        '<div class="trace-window-bar">' +
          '<span>UBIQUITOUS TRACE TERMINAL // HARUKAZE SYNCRETECH</span>' +
          '<button type="button" class="trace-close-btn" id="traceCloseBtn">CLOSE [ESC]</button>' +
        '</div>' +
        '<div class="trace-output" id="traceOutput"></div>' +
        '<div class="trace-chips">' +
          ['help', 'status', 'chika', 'shimizu', 'rurimi', 'kagura', 'raw', 'analog']
            .map(function (c) {
              return '<button type="button" class="trace-chip" data-cmd="' + c + '">' + c + '</button>';
            })
            .join('') +
        '</div>' +
        '<form class="trace-input-row" id="traceForm">' +
          '<span class="trace-prompt">&gt;</span>' +
          '<input type="text" class="trace-input" id="traceInput" autocomplete="off" spellcheck="false" placeholder="コマンドを入力（例: help / raw / analog / chika）">' +
        '</form>' +
      '</div>';

    document.body.appendChild(modalEl);
    outputEl = modalEl.querySelector('#traceOutput');
    inputEl = modalEl.querySelector('#traceInput');

    appendLine('SYNCRETIC TRACE CONSOLE INITIALIZED. TYPE `help` TO INSPECT.', 'trace-line-ok');

    modalEl.querySelector('#traceCloseBtn').addEventListener('click', closeTraceTerminal);
    modalEl.addEventListener('click', function (e) {
      if (e.target === modalEl) closeTraceTerminal();
    });

    modalEl.querySelectorAll('.trace-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        runCommand(chip.getAttribute('data-cmd'));
        if (inputEl) inputEl.focus();
      });
    });

    modalEl.querySelector('#traceForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var val = inputEl.value;
      inputEl.value = '';
      runCommand(val);
    });
  }

  function openTraceTerminal() {
    buildTraceModal();
    modalEl.classList.add('is-open');
    if (inputEl) {
      window.setTimeout(function () {
        inputEl.focus();
      }, 30);
    }
  }

  function closeTraceTerminal() {
    if (modalEl) modalEl.classList.remove('is-open');
  }

  /* ---------- Keyboard Shortcuts & Konami Code ---------- */
  function initShortcuts() {
    var konami = [
      'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'
    ];
    var pos = 0;

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modalEl && modalEl.classList.contains('is-open')) {
        closeTraceTerminal();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        if (modalEl && modalEl.classList.contains('is-open')) closeTraceTerminal();
        else openTraceTerminal();
        return;
      }

      // Skip Konami tracking while typing in inputs
      var tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === konami[pos]) {
        pos++;
        if (pos === konami.length) {
          pos = 0;
          setRawVision(true);
          openTraceTerminal();
          appendLine(
            '!! KONAMI OVERRIDE ACCEPTED — THIRD EYE RAW VISION UNLOCKED !!',
            'trace-line-alert'
          );
        }
      } else {
        pos = k === konami[0] ? 1 : 0;
      }
    });
  }

  window.hsOpenTraceTerminal = openTraceTerminal;
  window.hsToggleRawVision = function () {
    setRawVision(!document.documentElement.classList.contains('raw-vision'));
  };
  window.hsToggleAnalogHatch = function () {
    setAnalogHatch(!document.documentElement.classList.contains('analog-hatch'));
  };

  document.addEventListener('DOMContentLoaded', function () {
    ensureGlitchFilter();
    initSpatialCanvas();
    initSafeDecode();
    createHudChrome();
    initShortcuts();
  });
})();
