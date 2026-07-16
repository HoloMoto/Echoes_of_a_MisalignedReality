/**
 * Episode pages only: injects XR launch UI without modifying article HTML.
 */
(function () {
    'use strict';

    var article = document.querySelector('article.episode-text');
    if (!article) return;

    var shell = null;
    var reader = null;
    var assetsReady = false;

    function createLaunchButton() {
        var wrap = document.createElement('div');
        wrap.className = 'xr-story-launch';
        wrap.innerHTML =
            '<span class="xr-story-launch__hint">Ubiquitous Vision</span>' +
            '<button type="button" class="xr-story-launch__btn" id="xrStoryLaunchBtn" aria-label="XR Story Mode を開く">' +
            '<i class="fas fa-vr-cardboard" aria-hidden="true"></i>' +
            '<span>XR STORY</span>' +
            '</button>';
        document.body.appendChild(wrap);
        return wrap.querySelector('#xrStoryLaunchBtn');
    }

    function ensureImportMap() {
        if (document.querySelector('script[data-xr-importmap]')) return;
        var script = document.createElement('script');
        script.type = 'importmap';
        script.setAttribute('data-xr-importmap', 'true');
        script.textContent = JSON.stringify({
            imports: {
                three: 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',
                'three/addons/': 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/'
            }
        });
        document.head.appendChild(script);
    }

    function loadReaderModule() {
        ensureImportMap();
        return import('./webxr-story.js?v=6');
    }

    function parseEpisodeData() {
        var titleEl = document.querySelector('.episode-title h1');
        var subtitleEl = document.querySelector('.episode-subtitle');
        var segments = [];
        var nodes = article.querySelectorAll('p, .chapter-break h2');

        nodes.forEach(function (node) {
            if (node.closest('.chapter-continue')) return;
            var text = (node.textContent || '').replace(/\s+/g, ' ').trim();
            if (!text) return;

            if (node.matches('.chapter-break h2')) {
                segments.push({ type: 'chapter', text: text, overlays: [] });
                return;
            }

            var overlays = [];
            var overlayPattern = /《([^》]+)》/g;
            var match;
            while ((match = overlayPattern.exec(text)) !== null) {
                overlays.push(match[1]);
            }

            segments.push({
                type: text.indexOf('「') === 0 ? 'dialogue' : 'paragraph',
                text: text,
                overlays: overlays
            });
        });

        return {
            title: titleEl ? titleEl.textContent.trim() : document.title,
            subtitle: subtitleEl ? subtitleEl.textContent.trim() : '',
            segments: segments
        };
    }

    async function openReader() {
        if (!assetsReady) {
            launchBtn.disabled = true;
            launchBtn.textContent = 'LOADING...';
            try {
                var mod = await loadReaderModule();
                reader = mod.createXrStoryReader();
                assetsReady = true;
            } catch (err) {
                console.error('XR module load failed:', err);
                launchBtn.disabled = false;
                launchBtn.innerHTML =
                    '<i class="fas fa-vr-cardboard" aria-hidden="true"></i><span>XR STORY</span>';
                alert('XRモジュールの読み込みに失敗しました。ネットワーク接続を確認してください。');
                return;
            }
            launchBtn.disabled = false;
            launchBtn.innerHTML =
                '<i class="fas fa-vr-cardboard" aria-hidden="true"></i><span>XR STORY</span>';
        }

        if (!shell) {
            shell = reader.createShell();
            document.body.appendChild(shell);
            reader.bindShell(shell, parseEpisodeData());
        }

        reader.open();
    }

    var launchBtn = createLaunchButton();
    launchBtn.addEventListener('click', function () {
        openReader().catch(function (err) {
            console.error(err);
        });
    });
})();
