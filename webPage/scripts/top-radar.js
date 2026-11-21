/**
 * Top Radar Interactive Signal Explorer, Inline Novel Reader & Rurimi Hologram Canvas
 * - Lets readers explore Episodes (#1..#7, #2-1..#2-2) and Keywords right inside the Top Radar
 * - Reads actual novel text live from episode*.html / part2_episode*.html
 * - Includes Rurimi Server 3D Wireframe Dam-Lake Canvas visualizer
 */
(function () {
  'use strict';

  var RADAR_NODES = [
    // Inner orbit: Published Episodes (Part 1 #1-#7, Part 2 #2-1..#2-2)
    {
      id: 'ep1',
      kind: 'episode',
      ring: 0.42,
      angle: -Math.PI * 0.45,
      code: '#1',
      label: 'Contact',
      sub: '第1部 第1話 / デジャブ',
      url: 'episode1.html',
      desc: '退屈な日常の中、千花はスマートアイなしで町の内側に触れ、神田響と出会う。'
    },
    {
      id: 'ep2',
      kind: 'episode',
      ring: 0.42,
      angle: -Math.PI * 0.22,
      code: '#2',
      label: 'Log',
      sub: '第1部 第2話 / ログ',
      url: 'episode2.html',
      desc: 'カイと綾との記憶、旧校舎のメモリー、そして黒塗りの報告書が千花の日常を揺らす。'
    },
    {
      id: 'ep3',
      kind: 'episode',
      ring: 0.42,
      angle: 0.02,
      code: '#3',
      label: 'Boundary',
      sub: '第1部 第3話 / メモリーのあと',
      url: 'episode3.html',
      desc: '報告書の余韻。旧体育館の不在。職員室で、倒れたことが別の言葉に変わる。'
    },
    {
      id: 'ep4',
      kind: 'episode',
      ring: 0.42,
      angle: Math.PI * 0.25,
      code: '#4',
      label: 'Cracking Sandbox',
      sub: '第1部 第4話 / ひびく Sandbox',
      url: 'episode4.html',
      desc: '日常の箱庭にひびが入る。家で、千花の世界が音を立てて崩れ落ちる。'
    },
    {
      id: 'ep5',
      kind: 'episode',
      ring: 0.42,
      angle: Math.PI * 0.48,
      code: '#5',
      label: 'Aporia',
      sub: '第1部 第5話 / 行き詰まり',
      url: 'episode5.html',
      desc: '止まらない町。神田の救出。木村と赤いバイクの脱出。千花は家へ戻れなくなる。'
    },
    {
      id: 'ep6',
      kind: 'episode',
      ring: 0.42,
      angle: Math.PI * 0.72,
      code: '#6',
      label: 'Existential Exodus',
      sub: '第1部 第6話 / 実存のエクソダス',
      url: 'episode6.html',
      desc: '雷鳥に収容された千花は、未確定の接続核と瑠璃見を離れる痛みを抱えて夜空へ向かう。'
    },
    {
      id: 'ep7',
      kind: 'episode',
      ring: 0.42,
      angle: Math.PI * 0.96,
      code: '#7',
      label: 'Boundary Noise',
      sub: '第1部 第7話 / 境界のノイズ',
      url: 'episode7.html',
      desc: '瑠璃見サーバー施設からの接続ノイズに引き戻される千花は、御厨玲奈の助言で「窓」を作る術を知る。'
    },
    {
      id: 'p2ep1',
      kind: 'episode',
      ring: 0.58,
      angle: -Math.PI * 0.78,
      code: '#2-1',
      label: 'Old Electric Street',
      sub: '第2部 第1話 / 旧電気街',
      url: 'part2_episode1.html',
      desc: '2076年、吉祥寺・旧電気街。機械が嘘に負ける夜、千花だけが拾える一本がある。'
    },
    {
      id: 'p2ep2',
      kind: 'episode',
      ring: 0.58,
      angle: -Math.PI * 0.61,
      code: '#2-2',
      label: 'Analog Hack',
      sub: '第2部 第2話 / 追認されるクオリア',
      url: 'part2_episode2.html',
      desc: '立山美弓の依頼で秋葉原へ向かう千花と佳織。身体感覚とクオリアが交差する休日任務。'
    },

    // Outer orbit: Discoverable Keywords (Hidden from page body, explorable via Radar!)
    {
      id: 'kw-rurimi',
      kind: 'keyword',
      ring: 0.8,
      angle: -Math.PI * 0.35,
      code: 'FACILITY',
      label: '瑠璃見サーバー施設',
      sub: 'KEYWORD // RURIMI_DAM_01',
      desc: '瑠璃見のダム湖周辺に存在する巨大サーバー施設。ネオユビキタスネットワークの基盤であり、町の歪みの象徴。',
      spoiler: 'ダム湖を水冷に利用する国家規模のデータセンター。地下領域や町中のIoTデバイス、千花の接続と重なり、現実と記憶の境界を揺らす中枢となっている。'
    },
    {
      id: 'kw-thirdeye',
      kind: 'keyword',
      ring: 0.8,
      angle: -Math.PI * 0.08,
      code: 'TECH',
      label: 'サードアイ / スマートアイ',
      sub: 'KEYWORD // 5TH-GEN XR',
      desc: '日常生活に浸透した眼鏡型空間コンピュータ。世代ごとに形状や入力方法が進化してきた。',
      spoiler: '初期のスタンドアロン型から、脳波補助入力や第6世代バイザー型（VA64）へと発展。千花が高校で携帯しているのは第5世代モデルにあたる。'
    },
    {
      id: 'kw-neo',
      kind: 'keyword',
      ring: 0.8,
      angle: Math.PI * 0.2,
      code: 'NETWORK',
      label: 'ネオユビキタスネットワーク',
      sub: 'KEYWORD // INFRASTRUCTURE',
      desc: '2073年〜2076年の社会を支える情報基盤。人と街と家具の無線給電・無線演算を常時接続する。',
      spoiler: '視界、行動、行政サービス、椅子や机からの非接触給電を横断的につなぐ仕組み。便利さの裏で個人の認知と境界も接続され続ける。'
    },
    {
      id: 'kw-core',
      kind: 'keyword',
      ring: 0.8,
      angle: Math.PI * 0.48,
      code: 'CORE',
      label: 'ユビキタスコア / リンカー',
      sub: 'KEYWORD // QUANTUM-BMI',
      desc: '量子演算と人間の脳波を接続する極めて特殊なブレインマシンインターフェースと中核モジュール。',
      spoiler: '個体認証や増幅を担うブラックボックス。端末なしの接続をもたらし、千花をめぐる公安13課とスサノオ隊の攻防の中心となる。'
    },
    {
      id: 'kw-susanoo',
      kind: 'keyword',
      ring: 0.8,
      angle: Math.PI * 0.78,
      code: 'UNIT',
      label: 'スサノオ隊 / 高度AI《神楽》',
      sub: 'KEYWORD // DEFENSE UNIT',
      desc: '防衛省の特務電子戦部隊と、隊員を支援する日本有数の超高度AI（レッドボックス）。',
      spoiler: '輸送機C-2改「雷鳥」や電磁気銃MD59、強化スーツ等を運用。非公開任務で千花の保護と監視を担い、13課の暗躍と対峙している。'
    },
    {
      id: 'kw-analog',
      kind: 'keyword',
      ring: 0.8,
      angle: -Math.PI * 0.88,
      code: 'CONCEPT',
      label: 'アナログハッチ / 窓',
      sub: 'KEYWORD // MANUAL & WINDOW',
      desc: 'デジタル制御の網から身を守るための、物理的あるいは認知的な「外側の支点」。',
      spoiler: '紙の文字、インクのメモ、消しゴムの欠片、そして「扉を無理に塞がず小さな窓にして一つだけ掴む」技術——情報を遮断せず己を保つ鍵。'
    },

    // Easter Egg Hidden Nodes (visible when RAW VISION is active!)
    {
      id: 'sec-beacon',
      kind: 'secret',
      ring: 0.68,
      angle: Math.PI * 0.36,
      code: 'ANOMALY',
      label: 'BEACON AFX-012-VFZ23',
      sub: 'RAW INTERCEPT // 第4話観測痕',
      desc: '通常のクラウド同期に偽装された微弱ビーコン。永洞綾の端末を経由し、校内の技術準備室へ向けて三段リレーされていた走査痕。',
      spoiler: 'スサノオの清水暁美が偽装コンテナ内のモニタで捕捉した痕跡。日常のすぐ足元に13課の視線が入り込んでいた証拠。'
    },
    {
      id: 'sec-kai',
      kind: 'secret',
      ring: 0.68,
      angle: -Math.PI * 0.48,
      code: 'GHOST',
      label: 'ARCHIVE // 12号機',
      sub: 'RAW MEMORY // FILE CORRUPTED',
      desc: '旧体育館の記録から消えた「ネオ・スターフライヤー12号機」と少年のログ。出席名簿には存在しないが、床下の傷だけは現実に残っている。',
      spoiler: '「雲に隠れて、それがわからないから探しに行くんだよ」——千花が現実へ目覚めたあとも胸の奥で鳴り続ける残響。'
    }
  ];

  var SIZE_CLASSES = ['size-sm', 'size-md', 'size-lg'];
  var CURRENT_FONT_IDX = 1;

  function isRawActive() {
    return document.documentElement.classList.contains('raw-vision');
  }

  function isAnalogActive() {
    return document.documentElement.classList.contains('analog-hatch');
  }

  function isLightTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light';
  }

  /* ========================================================================
     1. TOP RADAR CONTROLLER
     ======================================================================== */
  function initTopRadar() {
    var canvas = document.getElementById('topRadarCanvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var chipsBox = document.getElementById('radarSignalChips');
    var modeBtns = document.querySelectorAll('.radar-mode-btn');
    var metaEl = document.getElementById('radarInspectorMeta');
    var titleEl = document.getElementById('radarInspectorTitle');
    var descEl = document.getElementById('radarInspectorDesc');
    var openReaderBtn = document.getElementById('radarOpenReaderBtn');
    var openPageLink = document.getElementById('radarOpenPageLink');

    var filterMode = 'all'; // 'all' | 'episode' | 'keyword'
    var selectedNode = RADAR_NODES[0];
    var hoveredNode = null;
    var pointer = { x: -1, y: -1 };
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = 320;
    var height = 310;
    var reduceMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function visibleNodes() {
      var raw = isRawActive();
      return RADAR_NODES.filter(function (n) {
        if (n.kind === 'secret' && !raw) return false;
        if (filterMode === 'all') return true;
        if (n.kind === 'secret') return true;
        return n.kind === filterMode;
      });
    }

    function nodePosition(node, t) {
      var cx = width / 2;
      var cy = height / 2;
      var maxR = Math.min(width, height) * 0.44;
      var drift = reduceMotion ? 0 : t * (node.kind === 'episode' ? 0.08 : -0.05);
      var a = node.angle + drift;
      var r = node.ring * maxR;
      return {
        x: cx + Math.cos(a) * r,
        y: cy + Math.sin(a) * r
      };
    }

    function syncInspector(node) {
      if (!node) return;
      selectedNode = node;
      if (metaEl) metaEl.textContent = node.sub;
      if (titleEl) titleEl.textContent = node.code + ' — ' + node.label;
      if (descEl) descEl.textContent = node.desc;

      if (openReaderBtn) {
        openReaderBtn.textContent =
          node.kind === 'episode' ? 'レーダー内で読む' : 'レーダー解析を開く';
      }
      if (openPageLink) {
        if (node.kind === 'episode' && node.url) {
          openPageLink.href = node.url;
          openPageLink.style.display = 'inline-flex';
        } else {
          openPageLink.style.display = 'none';
        }
      }

      if (chipsBox) {
        chipsBox.querySelectorAll('.radar-signal-chip').forEach(function (c) {
          c.classList.toggle('is-selected', c.getAttribute('data-id') === node.id);
        });
      }
    }

    function renderChips() {
      if (!chipsBox) return;
      chipsBox.innerHTML = '';
      visibleNodes().forEach(function (n) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'radar-signal-chip' + (selectedNode && selectedNode.id === n.id ? ' is-selected' : '');
        btn.setAttribute('data-id', n.id);
        btn.setAttribute('data-kind', n.kind);
        btn.textContent = n.code + ' ' + n.label;
        btn.addEventListener('mouseenter', function () {
          hoveredNode = n;
          syncInspector(n);
        });
        btn.addEventListener('click', function () {
          syncInspector(n);
          openRadarReader(n.id);
        });
        chipsBox.appendChild(btn);
      });
    }

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(240, rect.width);
      height = Math.max(220, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    var startTime = performance.now();
    function draw(now) {
      var t = (now - startTime) * 0.001;
      var cx = width / 2;
      var cy = height / 2;
      var maxR = Math.min(width, height) * 0.44;

      var light = isLightTheme();
      var analog = isAnalogActive();
      var cyan = analog ? '139, 58, 43' : light ? '8, 145, 178' : '103, 232, 249';
      var violet = analog ? '45, 76, 99' : light ? '79, 70, 229' : '165, 180, 252';
      var rose = '253, 164, 175';

      ctx.clearRect(0, 0, width, height);

      // Crosshairs
      ctx.strokeStyle = 'rgba(' + cyan + ', 0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - maxR * 1.15, cy);
      ctx.lineTo(cx + maxR * 1.15, cy);
      ctx.moveTo(cx, cy - maxR * 1.15);
      ctx.lineTo(cx, cy + maxR * 1.15);
      ctx.stroke();

      // Concentric radar rings
      [0.42, 0.58, 0.8, 1.0].forEach(function (ratio, idx) {
        ctx.strokeStyle =
          idx === 2 ? 'rgba(' + violet + ', 0.26)' : 'rgba(' + cyan + ', 0.2)';
        ctx.setLineDash(idx === 1 ? [4, 6] : []);
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * ratio, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Rotating radar sweep beam
      if (!reduceMotion) {
        var sweepAngle = t * 0.72;
        var grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, maxR);
        grad.addColorStop(0, 'rgba(' + cyan + ', 0.22)');
        grad.addColorStop(1, 'rgba(' + cyan + ', 0.0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, maxR, sweepAngle - 0.42, sweepAngle);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(' + cyan + ', 0.55)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(sweepAngle) * maxR, cy + Math.sin(sweepAngle) * maxR);
        ctx.stroke();
      }

      // Draw signal nodes + connection lines to CHIKA core
      var list = visibleNodes();
      var closest = null;
      var closestDist = 18;

      list.forEach(function (node) {
        var pos = nodePosition(node, t);
        var isSel = selectedNode && selectedNode.id === node.id;

        if (pointer.x >= 0) {
          var pd = Math.hypot(pos.x - pointer.x, pos.y - pointer.y);
          if (pd < closestDist) {
            closestDist = pd;
            closest = node;
          }
        }

        var col =
          node.kind === 'keyword' ? violet : node.kind === 'secret' ? rose : cyan;

        ctx.strokeStyle = 'rgba(' + col + ', ' + (isSel ? 0.55 : 0.14) + ')';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        var r = isSel ? 5.5 : 3.6;
        ctx.fillStyle = 'rgba(' + col + ', 0.95)';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.fill();

        if (isSel) {
          ctx.strokeStyle = 'rgba(' + col + ', 0.85)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 11 + Math.sin(t * 5) * 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.lineWidth = 1;

          // Target label next to selected node
          ctx.font = '11px "Share Tech Mono", monospace';
          ctx.fillStyle = 'rgba(' + col + ', 0.95)';
          var tx = pos.x > cx ? pos.x + 12 : pos.x - 12;
          ctx.textAlign = pos.x > cx ? 'left' : 'right';
          ctx.fillText(node.code, tx, pos.y + 4);
        }
      });

      hoveredNode = closest;

      // Center CHIKA core
      ctx.fillStyle = analog ? '#f4efe4' : light ? '#ffffff' : '#050d1d';
      ctx.strokeStyle = 'rgba(' + cyan + ', 0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(' + cyan + ', 0.98)';
      ctx.font = 'bold 11px "GAU Root", "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CHIKA', cx, cy + 4);

      if (!reduceMotion) {
        requestAnimationFrame(draw);
      }
    }

    canvas.addEventListener('pointermove', function (e) {
      var rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      if (hoveredNode) {
        syncInspector(hoveredNode);
      }
    });

    canvas.addEventListener('pointerleave', function () {
      pointer.x = -1;
      pointer.y = -1;
    });

    canvas.addEventListener('click', function (e) {
      var rect = canvas.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var cx = width / 2;
      var cy = height / 2;

      // Click center CHIKA core to cycle filter
      if (Math.hypot(x - cx, y - cy) <= 25) {
        var order = ['all', 'episode', 'keyword'];
        var nextIdx = (order.indexOf(filterMode) + 1) % order.length;
        filterMode = order[nextIdx];
        modeBtns.forEach(function (b) {
          b.classList.toggle('is-active', b.getAttribute('data-radar-mode') === filterMode);
        });
        renderChips();
        return;
      }

      var t = (performance.now() - startTime) * 0.001;
      var hit = null;
      var best = 22;
      visibleNodes().forEach(function (node) {
        var pos = nodePosition(node, t);
        var d = Math.hypot(pos.x - x, pos.y - y);
        if (d < best) {
          best = d;
          hit = node;
        }
      });

      if (hit) {
        syncInspector(hit);
        openRadarReader(hit.id);
      }
    });

    modeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterMode = btn.getAttribute('data-radar-mode') || 'all';
        modeBtns.forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        renderChips();
      });
    });

    if (openReaderBtn) {
      openReaderBtn.addEventListener('click', function () {
        if (selectedNode) openRadarReader(selectedNode.id);
      });
    }

    // Re-sync chips if RAW VISION toggles
    var mo = new MutationObserver(function () {
      renderChips();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    renderChips();
    syncInspector(selectedNode);
    requestAnimationFrame(draw);
  }

  /* ========================================================================
     2. INLINE RADAR NOVEL & KEYWORD READER MODAL
     ======================================================================== */
  var readerModal = null;
  var readerListEl = null;
  var readerBodyEl = null;
  var readerSubEl = null;
  var readerHeadingEl = null;
  var readerFullLinkEl = null;
  var readerProgressFill = null;
  var readerPrevBtn = null;
  var readerNextBtn = null;
  var activeReaderId = 'ep1';
  var episodeCache = {};

  function buildRadarReaderModal() {
    if (readerModal) return;
    readerModal = document.createElement('div');
    readerModal.className = 'radar-reader-modal';
    readerModal.id = 'radarReaderModal';
    readerModal.setAttribute('role', 'dialog');
    readerModal.setAttribute('aria-modal', 'true');
    readerModal.setAttribute('aria-label', 'Ubiquitous Trace Radar Reader');
    readerModal.innerHTML =
      '<div class="radar-reader-shell">' +
        '<aside class="radar-reader-sidebar">' +
          '<div class="radar-reader-sidehead">' +
            '<div class="kicker">UBIQUITOUS TRACE</div>' +
            '<h3>RADAR ARCHIVE</h3>' +
          '</div>' +
          '<div class="radar-reader-list" id="radarReaderList"></div>' +
        '</aside>' +
        '<div class="radar-reader-main">' +
          '<div class="radar-reader-toolbar">' +
            '<div class="radar-reader-titlebox">' +
              '<div class="radar-reader-sub" id="radarReaderSub">EPISODE</div>' +
              '<div class="radar-reader-heading" id="radarReaderHeading">Loading...</div>' +
            '</div>' +
            '<div class="radar-reader-tools">' +
              '<button type="button" class="radar-tool-btn" id="radarFontBtn" title="文字サイズ切替">A±</button>' +
              '<a href="episode1.html" class="radar-tool-btn" id="radarFullLink">単体ページへ</a>' +
              '<button type="button" class="radar-tool-btn radar-tool-btn--close" id="radarReaderCloseBtn">CLOSE [ESC]</button>' +
            '</div>' +
          '</div>' +
          '<div class="radar-reader-progress"><div class="radar-reader-progress-fill" id="radarReaderProgress"></div></div>' +
          '<div class="radar-reader-body size-md" id="radarReaderBody"></div>' +
          '<div class="radar-reader-footer">' +
            '<button type="button" class="radar-tool-btn" id="radarPrevBtn">&lt; PREV</button>' +
            '<span class="radar-reader-sub" id="radarFooterStatus">SYNC READY</span>' +
            '<button type="button" class="radar-tool-btn" id="radarNextBtn">NEXT &gt;</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(readerModal);
    readerListEl = readerModal.querySelector('#radarReaderList');
    readerBodyEl = readerModal.querySelector('#radarReaderBody');
    readerSubEl = readerModal.querySelector('#radarReaderSub');
    readerHeadingEl = readerModal.querySelector('#radarReaderHeading');
    readerFullLinkEl = readerModal.querySelector('#radarFullLink');
    readerProgressFill = readerModal.querySelector('#radarReaderProgress');
    readerPrevBtn = readerModal.querySelector('#radarPrevBtn');
    readerNextBtn = readerModal.querySelector('#radarNextBtn');

    readerModal.querySelector('#radarReaderCloseBtn').addEventListener('click', closeRadarReader);
    readerModal.addEventListener('click', function (e) {
      if (e.target === readerModal) closeRadarReader();
    });

    readerModal.querySelector('#radarFontBtn').addEventListener('click', function () {
      readerBodyEl.classList.remove(SIZE_CLASSES[CURRENT_FONT_IDX]);
      CURRENT_FONT_IDX = (CURRENT_FONT_IDX + 1) % SIZE_CLASSES.length;
      readerBodyEl.classList.add(SIZE_CLASSES[CURRENT_FONT_IDX]);
    });

    readerBodyEl.addEventListener('scroll', function () {
      var maxScroll = readerBodyEl.scrollHeight - readerBodyEl.clientHeight;
      var pct = maxScroll > 0 ? Math.min(100, (readerBodyEl.scrollTop / maxScroll) * 100) : 100;
      readerProgressFill.style.width = pct.toFixed(1) + '%';
    });

    readerPrevBtn.addEventListener('click', function () {
      stepReaderNode(-1);
    });
    readerNextBtn.addEventListener('click', function () {
      stepReaderNode(1);
    });

    document.addEventListener('keydown', function (e) {
      if (!readerModal || !readerModal.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeRadarReader();
    });
  }

  function stepReaderNode(delta) {
    var list = RADAR_NODES.filter(function (n) {
      return n.kind !== 'secret' || isRawActive();
    });
    var idx = list.findIndex(function (n) {
      return n.id === activeReaderId;
    });
    if (idx === -1) return;
    var next = list[idx + delta];
    if (next) loadNodeIntoReader(next.id);
  }

  function renderSidebarList() {
    if (!readerListEl) return;
    readerListEl.innerHTML = '';

    var groups = [
      { title: 'STORY // EPISODES', items: RADAR_NODES.filter(function (n) { return n.kind === 'episode'; }) },
      { title: 'ARCHIVE // KEYWORDS', items: RADAR_NODES.filter(function (n) { return n.kind === 'keyword'; }) }
    ];
    if (isRawActive()) {
      groups.push({
        title: 'RAW // INTERCEPTED',
        items: RADAR_NODES.filter(function (n) { return n.kind === 'secret'; })
      });
    }

    groups.forEach(function (g) {
      var gl = document.createElement('div');
      gl.className = 'radar-reader-group-label';
      gl.textContent = g.title;
      readerListEl.appendChild(gl);

      g.items.forEach(function (item) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'radar-nav-item' + (item.id === activeReaderId ? ' is-active' : '');
        btn.innerHTML = '<span class="code">' + item.code + '</span><span>' + item.label + '</span>';
        btn.addEventListener('click', function () {
          loadNodeIntoReader(item.id);
        });
        readerListEl.appendChild(btn);
      });
    });
  }

  function highlightOverlayTokens(container) {
    var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    var textNodes = [];
    var n;
    while ((n = walker.nextNode())) {
      if (n.nodeValue && n.nodeValue.indexOf('《') !== -1) textNodes.push(n);
    }
    textNodes.forEach(function (tn) {
      var parts = tn.nodeValue.split(/(《[^》]+》)/g);
      if (parts.length <= 1) return;
      var frag = document.createDocumentFragment();
      parts.forEach(function (p) {
        if (!p) return;
        if (p.indexOf('《') === 0 && p.lastIndexOf('》') === p.length - 1) {
          var span = document.createElement('span');
          span.className = 'radar-overlay-token';
          span.textContent = p;
          frag.appendChild(span);
        } else {
          frag.appendChild(document.createTextNode(p));
        }
      });
      tn.parentNode.replaceChild(frag, tn);
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function loadNodeIntoReader(nodeId) {
    var node = RADAR_NODES.find(function (n) { return n.id === nodeId; }) || RADAR_NODES[0];
    activeReaderId = node.id;
    renderSidebarList();

    readerSubEl.textContent = node.sub;
    readerHeadingEl.textContent = node.code + ' — ' + node.label;
    readerProgressFill.style.width = '0%';
    readerBodyEl.scrollTop = 0;

    if (node.kind !== 'episode') {
      readerFullLinkEl.style.display = 'none';
      readerBodyEl.innerHTML =
        '<div class="radar-keyword-dossier">' +
          '<div class="radar-reader-sub">' + escapeHtml(node.sub) + '</div>' +
          '<h2>' + escapeHtml(node.label) + '</h2>' +
          '<p>' + escapeHtml(node.desc) + '</p>' +
          (node.spoiler
            ? '<div class="spoiler-box"><details><summary>核心に触れる可能性があります（クリックして開示）</summary><p>' +
              escapeHtml(node.spoiler) +
              '</p></details></div>'
            : '') +
        '</div>';
      readerProgressFill.style.width = '100%';
      return;
    }

    readerFullLinkEl.style.display = 'inline-block';
    readerFullLinkEl.href = node.url;

    if (episodeCache[node.url]) {
      renderEpisodeFragment(episodeCache[node.url]);
      return;
    }

    readerBodyEl.innerHTML =
      '<div class="radar-keyword-dossier"><p>SYNCING EPISODE DATA: ' + escapeHtml(node.url) + ' ...</p></div>';

    fetch(node.url, { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var article = doc.querySelector('article.episode-text');
        if (!article) throw new Error('Article not found');
        var clone = article.cloneNode(true);
        var cont = clone.querySelector('.chapter-continue');
        if (cont) cont.remove();
        episodeCache[node.url] = clone.innerHTML;
        if (activeReaderId === node.id) {
          renderEpisodeFragment(episodeCache[node.url]);
        }
      })
      .catch(function () {
        if (activeReaderId !== node.id) return;
        readerBodyEl.innerHTML =
          '<div class="radar-keyword-dossier">' +
            '<h2>' + escapeHtml(node.label) + '</h2>' +
            '<p>' + escapeHtml(node.desc) + '</p>' +
            '<p style="margin-top:1rem;">ローカル環境（file://）ではブラウザのセキュリティ制限により直接読込ができない場合があります。下のボタンから本文ページへ移動できます。</p>' +
            '<p style="margin-top:1rem;"><a class="radar-action-btn" href="' + escapeHtml(node.url) + '">第' + escapeHtml(node.code) + ' 本文ページを開く</a></p>' +
          '</div>';
      });
  }

  function renderEpisodeFragment(innerHtml) {
    var wrap = document.createElement('article');
    wrap.className = 'radar-reader-article';
    wrap.innerHTML = innerHtml;
    highlightOverlayTokens(wrap);
    readerBodyEl.innerHTML = '';
    readerBodyEl.appendChild(wrap);
  }

  function openRadarReader(nodeId) {
    buildRadarReaderModal();
    readerModal.classList.add('is-open');
    loadNodeIntoReader(nodeId || 'ep1');
  }

  function closeRadarReader() {
    if (readerModal) readerModal.classList.remove('is-open');
  }

  /* ========================================================================
     3. WORLD PREVIEW: RURIMI DAM-LAKE SERVER 3D WIREFRAME HOLOGRAM CANVAS
     ======================================================================== */
  function initRurimiServerCanvas() {
    var canvas = document.getElementById('rurimiServerCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 420;
    var h = 420;
    var reduceMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(260, rect.width);
      h = 420;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    var start = performance.now();
    function tick(now) {
      var t = (now - start) * 0.001;
      var light = isLightTheme();
      var analog = isAnalogActive();
      var cyan = analog ? '139, 58, 43' : light ? '8, 145, 178' : '103, 232, 249';
      var violet = analog ? '45, 76, 99' : light ? '79, 70, 229' : '165, 180, 252';
      var cx = w / 2;
      var waterY = h * 0.44;

      ctx.clearRect(0, 0, w, h);

      // Perspective dam lake water grid
      ctx.strokeStyle = 'rgba(' + cyan + ', 0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var i = -5; i <= 5; i++) {
        ctx.moveTo(cx + i * 24, waterY);
        ctx.lineTo(cx + i * 74, h - 24);
      }
      for (var row = 0; row < 6; row++) {
        var py = waterY + Math.pow(row / 5, 1.45) * (h - waterY - 26);
        ctx.moveTo(20, py);
        ctx.lineTo(w - 20, py);
      }
      ctx.stroke();

      // Concentric water ripples at base of tower
      for (var r = 0; r < 3; r++) {
        var phase = ((t * 0.35 + r * 0.33) % 1);
        var rx = 45 + phase * 125;
        var ry = rx * 0.28;
        ctx.strokeStyle = 'rgba(' + cyan + ', ' + ((1 - phase) * 0.48) + ')';
        ctx.beginPath();
        ctx.ellipse(cx, waterY, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Rotating 3D wireframe monolith server tower (above & submerged reflection)
      var rot = reduceMotion ? 0.3 : t * 0.45;
      var tw = 44;
      var topY = waterY - 128;
      var botY = waterY + 110;
      var corners = [-1, 1];
      var ptsTop = [];
      var ptsWater = [];
      var ptsBot = [];

      for (var k = 0; k < 4; k++) {
        var ang = rot + (k * Math.PI) / 2 + Math.PI / 4;
        var x = cx + Math.cos(ang) * tw;
        var yOff = Math.sin(ang) * 14;
        ptsTop.push({ x: x, y: topY + yOff });
        ptsWater.push({ x: x, y: waterY + yOff });
        ptsBot.push({ x: x, y: botY + yOff * 0.8 });
      }

      // Upper physical structure
      ctx.strokeStyle = 'rgba(' + cyan + ', 0.85)';
      ctx.fillStyle = 'rgba(' + cyan + ', 0.08)';
      ctx.beginPath();
      ptsTop.forEach(function (p, idx) {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      for (var e = 0; e < 4; e++) {
        ctx.beginPath();
        ctx.moveTo(ptsTop[e].x, ptsTop[e].y);
        ctx.lineTo(ptsWater[e].x, ptsWater[e].y);
        ctx.stroke();
      }

      // Submerged Quantum / IKAROS Core Layer
      ctx.strokeStyle = 'rgba(' + violet + ', 0.65)';
      ctx.setLineDash([4, 4]);
      for (var s = 0; s < 4; s++) {
        ctx.beginPath();
        ctx.moveTo(ptsWater[s].x, ptsWater[s].y);
        ctx.lineTo(ptsBot[s].x, ptsBot[s].y);
        ctx.stroke();
      }
      ctx.beginPath();
      ptsBot.forEach(function (p, idx) {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);

      // Core data pulse ascending
      var pulseY = botY - ((t * 58) % (botY - topY));
      ctx.fillStyle = 'rgba(' + cyan + ', 0.9)';
      ctx.beginPath();
      ctx.arc(cx, pulseY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      if (!reduceMotion) {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  }

  window.hsOpenRadarReader = openRadarReader;

  document.addEventListener('DOMContentLoaded', function () {
    initTopRadar();
    initRurimiServerCanvas();
  });
})();
