/**
 * Story Archive Progress Tracker & Card Visual Motifs
 */
(function () {
  'use strict';

  var READ_KEY = 'hs-read-episodes';
  var LAST_KEY = 'hs-last-read';

  var MOTIFS = {
    'episode1.html': '<circle cx="28" cy="28" r="20" stroke="currentColor" stroke-width="1.2" stroke-dasharray="4 3"/><line x1="28" y1="4" x2="28" y2="52" stroke="currentColor" stroke-width="1"/><line x1="4" y1="28" x2="52" y2="28" stroke="currentColor" stroke-width="1"/><circle cx="28" cy="28" r="4" fill="currentColor"/>',
    'episode2.html': '<rect x="10" y="8" width="36" height="42" stroke="currentColor" stroke-width="1.2"/><rect x="16" y="18" width="24" height="5" fill="currentColor"/><rect x="16" y="28" width="18" height="5" fill="currentColor" opacity="0.65"/><line x1="16" y1="39" x2="36" y2="39" stroke="currentColor" stroke-width="1.2"/>',
    'episode3.html': '<polygon points="28,6 48,18 48,40 28,52 8,40 8,18" stroke="currentColor" stroke-width="1.2"/><line x1="16" y1="14" x2="38" y2="44" stroke="currentColor" stroke-width="1.2" stroke-dasharray="3 3"/>',
    'episode4.html': '<rect x="8" y="8" width="40" height="40" stroke="currentColor" stroke-width="1.2"/><path d="M12 44 L24 28 L31 33 L44 12" stroke="currentColor" stroke-width="1.5" fill="none"/>',
    'episode5.html': '<path d="M6 40 Q22 14 48 20" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="14" cy="40" r="7" stroke="currentColor" stroke-width="1.3"/><circle cx="42" cy="40" r="7" stroke="currentColor" stroke-width="1.3"/>',
    'episode6.html': '<polygon points="28,8 50,36 36,36 28,48 20,36 6,36" stroke="currentColor" stroke-width="1.3" fill="none"/><line x1="28" y1="8" x2="28" y2="48" stroke="currentColor" stroke-width="1"/>',
    'episode7.html': '<rect x="10" y="10" width="36" height="36" stroke="currentColor" stroke-width="1.2"/><rect x="18" y="18" width="20" height="20" stroke="currentColor" stroke-width="1.4"/><path d="M4 28 H16 M40 28 H52" stroke="currentColor" stroke-width="1"/>',
    'part2_episode1.html': '<path d="M8 16 H48 M8 28 H48 M8 40 H48" stroke="currentColor" stroke-width="1.2"/><circle cx="20" cy="16" r="3" fill="currentColor"/><circle cx="36" cy="28" r="3" fill="currentColor"/><circle cx="24" cy="40" r="3" fill="currentColor"/>',
    'part2_episode2.html': '<circle cx="28" cy="28" r="18" stroke="currentColor" stroke-width="1.3" stroke-dasharray="6 4"/><path d="M18 36 L38 16 L41 19 L21 39 Z" stroke="currentColor" stroke-width="1.2" fill="none"/>'
  };

  function getReadMap() {
    try {
      return JSON.parse(localStorage.getItem(READ_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function getLastRead() {
    try {
      return JSON.parse(localStorage.getItem(LAST_KEY) || 'null');
    } catch (e) {
      return null;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var readMap = getReadMap();
    var lastRead = getLastRead();

    var p1Count = 0;
    for (var i = 1; i <= 7; i++) {
      if (readMap['episode' + i + '.html']) p1Count++;
    }
    var p2Count = 0;
    for (var j = 1; j <= 2; j++) {
      if (readMap['part2_episode' + j + '.html']) p2Count++;
    }

    // Decorate cards with motifs & read badges
    document.querySelectorAll('.episode-card').forEach(function (card) {
      var link = card.querySelector('a.btn-primary[href]');
      if (!link) return;
      var href = link.getAttribute('href');

      if (MOTIFS[href] && !card.querySelector('.episode-card-motif')) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'episode-card-motif');
        svg.setAttribute('viewBox', '0 0 56 56');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('aria-hidden', 'true');
        svg.innerHTML = MOTIFS[href];
        card.appendChild(svg);
      }

      if (readMap[href]) {
        card.classList.add('is-read');
        var meta = card.querySelector('.episode-meta');
        if (meta && !meta.querySelector('.episode-read-badge')) {
          var badge = document.createElement('span');
          badge.className = 'episode-read-badge';
          badge.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> SYNCED';
          meta.appendChild(badge);
        }
      }
    });

    // Insert Reading Sync Banner inside #part1 container
    var part1Container = document.querySelector('#part1 .container');
    var part1Grid = document.querySelector('#part1 .episodes-grid');
    if (part1Container && part1Grid && !document.querySelector('.story-progress-banner')) {
      var resumeUrl = (lastRead && lastRead.url) ? lastRead.url : 'episode1.html';
      var resumeTitle = (lastRead && lastRead.title) ? lastRead.title : '#1 Contact から読み始める';
      var resumeCta = lastRead ? '続きから読む' : '第1話を読む';

      var banner = document.createElement('div');
      banner.className = 'story-progress-banner';
      banner.innerHTML =
        '<div>' +
          '<div class="story-progress-kicker">READING SYNC // LOCAL ARCHIVE</div>' +
          '<div class="story-progress-title">' + resumeTitle + '</div>' +
          '<div class="story-progress-bars">' +
            '<span>PART 1: ' + p1Count + '/7' +
              '<span class="story-mini-bar"><span style="width:' + Math.round((p1Count / 7) * 100) + '%"></span></span>' +
            '</span>' +
            '<span>PART 2: ' + p2Count + '/2' +
              '<span class="story-mini-bar"><span style="width:' + Math.round((p2Count / 2) * 100) + '%"></span></span>' +
            '</span>' +
          '</div>' +
        '</div>' +
        '<a href="' + resumeUrl + '" class="btn btn-primary">' +
          '<i class="fas fa-book-open"></i> ' + resumeCta +
        '</a>';

      part1Container.insertBefore(banner, part1Grid);
    }
  });
})();
