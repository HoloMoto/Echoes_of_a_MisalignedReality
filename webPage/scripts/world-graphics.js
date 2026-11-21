/**
 * World Page Interactive Topology Controller
 */
(function () {
  'use strict';

  var NODES = {
    redbox: {
      tag: 'SINGULARITY // RED BOX',
      title: '超高度AI（レッドボックス）',
      body: '高度AI群から生まれた人類未到達の技術水準のAI。軍事分野にのみ運用され、核兵器同様の国家抑止力として管理される。日本国内では《神楽》や《IKAROS》の名が確認されている。',
      links: 'LINKED: ネオユビキタス基盤 / スサノオ隊（神楽運用） / ユビキタスリンカー研究'
    },
    neoubi: {
      tag: 'INFRASTRUCTURE // 2073-2076',
      title: 'ネオユビキタスネットワーク',
      body: '地下の大規模データサーバーと量子型演算コンピュータ、町中に展開された高密度無線回線、椅子や机などの日常家具による無線給電システムで構成される社会インフラ。',
      links: 'LINKED: サードアイ / 瑠璃見サーバー施設 / 無線給電インフラ'
    },
    thirdeye: {
      tag: 'XR RETINA // GEN 5 - GEN 6',
      title: 'サードアイ / スマートアイ',
      body: '従来の眼鏡と同等の外観を持つ空間コンピュータ。第5世代は簡易脳波補助入力に対応し、第6世代（VA64等）はうなじ部の補助装置で高度な戦術連動を行う。',
      links: 'LINKED: ネオユビキタスネットワーク / 一般市民・学生 / スサノオ隊'
    },
    linker: {
      tag: 'QUANTUM BMI // CORE',
      title: 'ユビキタスリンカー & コア',
      body: '量子コンピュータ級の演算領域と人間の脳波を接続する秘匿技術。春風千花は端末を介さず町の情報網を視認してしまう異常接続を観測され、物語が動き出す。',
      links: 'LINKED: 春風千花 / 荒木紘一の研究 / スサノオ保護対象 / 13課回収目標'
    },
    susanoo: {
      tag: 'DEFENSE // SPECIAL EW UNIT',
      title: '自衛隊電子戦部隊 スサノオ隊',
      body: '総隊長・近藤達也のもと68名で構成される非公開の特務電子戦部隊。超高度AI《神楽》、MD59、強化スーツf62、輸送機C-2改「雷鳥」を運用し、13課と対峙する。',
      links: 'LINKED: 超高度AI《神楽》 / 千花の保護・外部協力 / 公安情報局 第13課（対立）'
    },
    div13: {
      tag: 'INTELLIGENCE // 13TH DIVISION',
      title: '公安情報局 第13課',
      body: '国内機密と「都合の悪い事象」を扱う情報機関。ユビキタスリンカー関連の証拠と千花の身柄を強硬に追っており、第1部序盤から瑠璃見に潜入している。',
      links: 'LINKED: 美綴琴音との接点？ / 瑠璃見潜入監視 / スサノオ隊（対立）'
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    var svgNodes = document.querySelectorAll('.topo-node');
    var edges = document.querySelectorAll('.topo-edge');
    var tagEl = document.getElementById('topoDetailTag');
    var titleEl = document.getElementById('topoDetailTitle');
    var bodyEl = document.getElementById('topoDetailBody');
    var linksEl = document.getElementById('topoDetailLinks');

    if (!svgNodes.length || !tagEl) return;

    function selectNode(id) {
      var data = NODES[id];
      if (!data) return;

      svgNodes.forEach(function (n) {
        n.classList.toggle('is-selected', n.getAttribute('data-node') === id);
      });
      edges.forEach(function (e) {
        var from = e.getAttribute('data-from');
        var to = e.getAttribute('data-to');
        e.classList.toggle('is-highlighted', from === id || to === id);
      });

      tagEl.textContent = data.tag;
      titleEl.textContent = data.title;
      bodyEl.textContent = data.body;
      linksEl.textContent = data.links;
    }

    svgNodes.forEach(function (node) {
      var id = node.getAttribute('data-node');
      node.addEventListener('click', function () { selectNode(id); });
      node.addEventListener('mouseenter', function () { selectNode(id); });
      node.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectNode(id);
        }
      });
    });

    selectNode('linker');
  });
})();
