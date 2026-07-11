import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

const OVERLAY_PATTERN = /《([^》]+)》/g;

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatSegmentHtml(segment) {
    if (segment.type === 'chapter') {
        return '<div class="xr-story-shell__chapter">' + escapeHtml(segment.text) + '</div>';
    }

    var plain = segment.text.replace(OVERLAY_PATTERN, '').replace(/\s+/g, ' ').trim();
    var body = escapeHtml(plain);
    if (segment.overlays && segment.overlays.length) {
        segment.overlays.forEach(function (line) {
            body += '<span class="xr-story-shell__overlay-line">《' + escapeHtml(line) + '》</span>';
        });
    }

    var className = segment.type === 'dialogue'
        ? 'xr-story-shell__text xr-story-shell__text--dialogue'
        : 'xr-story-shell__text';
    return '<div class="' + className + '">' + body + '</div>';
}

export function createXrStoryReader() {
    var state = {
        data: null,
        index: 0,
        shell: null,
        renderer: null,
        scene: null,
        camera: null,
        animationId: 0,
        clock: new THREE.Clock(),
        grid: null,
        particles: null,
        holoPanel: null,
        overlaySprites: [],
        resizeHandler: null,
        keyHandler: null,
        pointerHandler: null,
        yaw: 0,
        pitch: 0,
        dragging: false,
        lastX: 0,
        lastY: 0,
        vrSupported: false,
        mode: 'preview'
    };

    function createShell() {
        var shell = document.createElement('div');
        shell.className = 'xr-story-shell';
        shell.id = 'xrStoryShell';
        shell.innerHTML =
            '<canvas class="xr-story-shell__canvas" id="xrStoryCanvas"></canvas>' +
            '<div class="xr-story-shell__hud">' +
                '<div class="xr-story-shell__topbar">' +
                    '<div class="xr-story-shell__meta">' +
                        '<div class="xr-story-shell__episode" id="xrStoryEpisode">EPISODE</div>' +
                        '<div class="xr-story-shell__title" id="xrStoryTitle"></div>' +
                    '</div>' +
                    '<div class="xr-story-shell__controls">' +
                        '<button type="button" class="xr-story-shell__btn" id="xrStoryPreviewBtn">3D PREVIEW</button>' +
                        '<button type="button" class="xr-story-shell__btn xr-story-shell__btn--danger" id="xrStoryExitBtn">EXIT</button>' +
                    '</div>' +
                '</div>' +
                '<div class="xr-story-shell__status" id="xrStoryStatus"></div>' +
                '<div class="xr-story-shell__unsupported" id="xrStoryUnsupported"></div>' +
                '<div class="xr-story-shell__panel" id="xrStoryPanel" role="region" aria-live="polite"></div>' +
                '<div class="xr-story-shell__footer">' +
                    '<div class="xr-story-shell__progress" id="xrStoryProgress">01 / 01</div>' +
                    '<div class="xr-story-shell__nav">' +
                        '<button type="button" class="xr-story-shell__btn" id="xrStoryPrevBtn">PREV</button>' +
                        '<button type="button" class="xr-story-shell__btn xr-story-shell__btn--primary" id="xrStoryNextBtn">NEXT</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        return shell;
    }

    function showStatus(message) {
        if (!state.shell) return;
        var el = state.shell.querySelector('#xrStoryStatus');
        el.textContent = message;
        el.classList.add('is-visible');
        clearTimeout(showStatus._timer);
        showStatus._timer = setTimeout(function () {
            el.classList.remove('is-visible');
        }, 2200);
    }

    function renderSegment() {
        if (!state.data || !state.shell) return;
        var segments = state.data.segments;
        if (!segments.length) return;

        if (state.index < 0) state.index = 0;
        if (state.index >= segments.length) state.index = segments.length - 1;

        var segment = segments[state.index];
        var panel = state.shell.querySelector('#xrStoryPanel');
        panel.innerHTML = formatSegmentHtml(segment);

        var progress = state.shell.querySelector('#xrStoryProgress');
        var num = String(state.index + 1).padStart(2, '0');
        var total = String(segments.length).padStart(2, '0');
        progress.textContent = num + ' / ' + total;

        updateThreeScene(segment);
        showStatus(segment.type === 'chapter' ? 'CHAPTER SYNC' : 'SEGMENT LOADED');
    }

    function buildHoloTexture(segment) {
        var canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        var ctx = canvas.getContext('2d');

        var gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(8, 20, 34, 0.95)');
        gradient.addColorStop(1, 'rgba(4, 10, 18, 0.98)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(0, 220, 255, 0.45)';
        ctx.lineWidth = 3;
        ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

        ctx.fillStyle = '#dff9ff';
        ctx.font = 'bold 28px "Share Tech Mono", monospace';
        ctx.fillText(state.data.title || 'EPISODE', 48, 70);

        ctx.fillStyle = '#9fdfff';
        ctx.font = '22px "Noto Sans JP", sans-serif';
        var text = segment.text.replace(OVERLAY_PATTERN, '').replace(/\s+/g, ' ').trim();
        var y = 120;
        var maxWidth = canvas.width - 96;
        wrapText(ctx, text, 48, y, maxWidth, 34);

        if (segment.overlays && segment.overlays.length) {
            ctx.fillStyle = '#6dffe8';
            ctx.font = '20px "Share Tech Mono", monospace';
            y = canvas.height - 48 - segment.overlays.length * 28;
            segment.overlays.forEach(function (line, i) {
                ctx.fillText('《' + line + '》', 48, y + i * 28);
            });
        }

        var texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        var chars = Array.from(text);
        var line = '';
        for (var i = 0; i < chars.length; i++) {
            var test = line + chars[i];
            if (ctx.measureText(test).width > maxWidth && line) {
                ctx.fillText(line, x, y);
                line = chars[i];
                y += lineHeight;
            } else {
                line = test;
            }
        }
        if (line) ctx.fillText(line, x, y);
    }

    function updateThreeScene(segment) {
        if (!state.holoPanel) return;
        var texture = buildHoloTexture(segment);
        state.holoPanel.material.map = texture;
        state.holoPanel.material.needsUpdate = true;

        clearOverlaySprites();
        if (segment.overlays && segment.overlays.length) {
            segment.overlays.forEach(function (line, i) {
                var sprite = createOverlaySprite('《' + line + '》', i);
                state.overlaySprites.push(sprite);
                state.scene.add(sprite);
            });
        }
    }

    function createOverlaySprite(text, index) {
        var canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 128;
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#7dffe8';
        ctx.font = 'bold 42px "Share Tech Mono", monospace';
        ctx.fillText(text, 24, 78);

        var texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        var material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.92,
            depthWrite: false
        });
        var sprite = new THREE.Sprite(material);
        sprite.scale.set(2.4, 0.3, 1);
        sprite.position.set(1.2, 1.8 - index * 0.28, -1.4);
        return sprite;
    }

    function clearOverlaySprites() {
        state.overlaySprites.forEach(function (sprite) {
            state.scene.remove(sprite);
            if (sprite.material.map) sprite.material.map.dispose();
            sprite.material.dispose();
        });
        state.overlaySprites = [];
    }

    function initThree() {
        var canvas = state.shell.querySelector('#xrStoryCanvas');
        var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;
        state.renderer = renderer;

        var scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x02060c, 0.045);
        state.scene = scene;

        var camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 80);
        camera.position.set(0, 1.55, 0.2);
        state.camera = camera;

        scene.add(new THREE.AmbientLight(0x8adfff, 0.45));
        var key = new THREE.DirectionalLight(0xb8f4ff, 0.9);
        key.position.set(2, 4, 3);
        scene.add(key);

        var grid = new THREE.GridHelper(24, 48, 0x1ecfff, 0x0a3048);
        grid.position.y = 0;
        state.grid = grid;
        scene.add(grid);

        var starGeo = new THREE.BufferGeometry();
        var starCount = 900;
        var positions = new Float32Array(starCount * 3);
        for (var i = 0; i < starCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 40;
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        var stars = new THREE.Points(
            starGeo,
            new THREE.PointsMaterial({ color: 0x7adfff, size: 0.03, transparent: true, opacity: 0.75 })
        );
        stars.position.y = 4;
        state.particles = stars;
        scene.add(stars);

        var panelGeo = new THREE.PlaneGeometry(2.8, 1.5);
        var panelMat = new THREE.MeshBasicMaterial({
            map: buildHoloTexture({ text: state.data.title, overlays: [] }),
            transparent: true,
            opacity: 0.94,
            side: THREE.DoubleSide
        });
        var holoPanel = new THREE.Mesh(panelGeo, panelMat);
        holoPanel.position.set(0, 1.55, -2.2);
        state.holoPanel = holoPanel;
        scene.add(holoPanel);

        var ringGeo = new THREE.RingGeometry(1.2, 1.25, 64);
        var ringMat = new THREE.MeshBasicMaterial({
            color: 0x2adfff,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide
        });
        var ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(0, 1.55, -2.18);
        scene.add(ring);
        state.ring = ring;

        state.resizeHandler = function () {
            var w = window.innerWidth;
            var h = window.innerHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', state.resizeHandler);

        var canvas = renderer.domElement;
        state.pointerHandler = {
            down: function (e) {
                if (renderer.xr.isPresenting) return;
                state.dragging = true;
                state.lastX = e.clientX;
                state.lastY = e.clientY;
            },
            move: function (e) {
                if (!state.dragging || renderer.xr.isPresenting) return;
                var dx = e.clientX - state.lastX;
                var dy = e.clientY - state.lastY;
                state.lastX = e.clientX;
                state.lastY = e.clientY;
                state.yaw -= dx * 0.004;
                state.pitch -= dy * 0.003;
                state.pitch = Math.max(-0.45, Math.min(0.45, state.pitch));
            },
            up: function () {
                state.dragging = false;
            }
        };
        canvas.addEventListener('pointerdown', state.pointerHandler.down);
        window.addEventListener('pointermove', state.pointerHandler.move);
        window.addEventListener('pointerup', state.pointerHandler.up);

        animate();
    }

    function animate() {
        state.animationId = requestAnimationFrame(animate);
        var t = state.clock.getElapsedTime();

        if (state.grid) {
            state.grid.position.z = (t * 0.12) % 1;
        }
        if (state.particles) {
            state.particles.rotation.y = t * 0.03;
        }
        if (state.holoPanel) {
            state.holoPanel.position.y = 1.55 + Math.sin(t * 1.2) * 0.03;
        }
        if (state.ring) {
            state.ring.rotation.z = t * 0.4;
            state.ring.material.opacity = 0.22 + Math.sin(t * 2) * 0.12;
        }
        state.overlaySprites.forEach(function (sprite, i) {
            sprite.position.x = 1.2 + Math.sin(t * 2 + i) * 0.05;
            sprite.material.opacity = 0.65 + Math.sin(t * 3 + i) * 0.25;
        });

        if (state.renderer && state.scene && state.camera) {
            if (!state.renderer.xr.isPresenting) {
                var radius = 0.2;
                state.camera.position.x = Math.sin(state.yaw) * radius;
                state.camera.position.z = Math.cos(state.yaw) * radius;
                state.camera.position.y = 1.55 + state.pitch;
                state.camera.lookAt(0, 1.55, -2.2);
            }
            state.renderer.render(state.scene, state.camera);
        }
    }

    function destroyThree() {
        cancelAnimationFrame(state.animationId);
        if (state.resizeHandler) {
            window.removeEventListener('resize', state.resizeHandler);
            state.resizeHandler = null;
        }
        if (state.pointerHandler && state.renderer) {
            var canvas = state.renderer.domElement;
            canvas.removeEventListener('pointerdown', state.pointerHandler.down);
            window.removeEventListener('pointermove', state.pointerHandler.move);
            window.removeEventListener('pointerup', state.pointerHandler.up);
            state.pointerHandler = null;
        }
        clearOverlaySprites();
        if (state.renderer) {
            state.renderer.dispose();
            state.renderer = null;
        }
        state.scene = null;
        state.camera = null;
        state.holoPanel = null;
        state.grid = null;
        state.particles = null;
    }

    async function checkVrSupport() {
        if (!navigator.xr) return false;
        try {
            return await navigator.xr.isSessionSupported('immersive-vr');
        } catch (e) {
            return false;
        }
    }

    function setupVrButton() {
        var controls = state.shell.querySelector('.xr-story-shell__controls');
        var existing = controls.querySelector('.xr-vr-button');
        if (existing) existing.remove();

        if (!state.vrSupported || !state.renderer) return;

        var vrBtn = VRButton.createButton(state.renderer);
        vrBtn.classList.add('xr-story-shell__btn', 'xr-vr-button');
        vrBtn.textContent = 'ENTER VR';
        controls.insertBefore(vrBtn, controls.firstChild);
    }

    function bindShell(shell, data) {
        state.shell = shell;
        state.data = data;
        state.index = 0;

        shell.querySelector('#xrStoryTitle').textContent = data.title;
        shell.querySelector('#xrStoryEpisode').textContent = data.subtitle || 'HARUKAZE SYNCRETECH';

        shell.querySelector('#xrStoryPrevBtn').addEventListener('click', function () {
            if (state.index > 0) {
                state.index -= 1;
                renderSegment();
            }
        });
        shell.querySelector('#xrStoryNextBtn').addEventListener('click', function () {
            if (state.data && state.index < state.data.segments.length - 1) {
                state.index += 1;
                renderSegment();
            }
        });
        shell.querySelector('#xrStoryExitBtn').addEventListener('click', close);
        shell.querySelector('#xrStoryPreviewBtn').addEventListener('click', function () {
            state.mode = 'preview';
            showStatus('DRAG TO LOOK AROUND');
        });

        var unsupported = shell.querySelector('#xrStoryUnsupported');
        checkVrSupport().then(function (supported) {
            state.vrSupported = supported;
            if (!supported) {
                unsupported.textContent =
                    'この端末では VR セッションに未対応です。3D PREVIEW（ドラッグで視点移動）でストーリーをお楽しみください。';
                unsupported.classList.add('is-visible');
            } else {
                unsupported.classList.remove('is-visible');
            }
        });

        state.keyHandler = function (e) {
            if (!shell.classList.contains('is-open')) return;
            if (e.key === 'ArrowRight' || e.key === 'PageDown') {
                e.preventDefault();
                shell.querySelector('#xrStoryNextBtn').click();
            } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                e.preventDefault();
                shell.querySelector('#xrStoryPrevBtn').click();
            } else if (e.key === 'Escape') {
                close();
            }
        };
        document.addEventListener('keydown', state.keyHandler);

        renderSegment();
    }

    function open() {
        if (!state.shell) return;
        state.shell.classList.add('is-open');
        document.body.classList.add('xr-story-active');
        if (!state.renderer) {
            initThree();
            checkVrSupport().then(function () {
                setupVrButton();
            });
        }
        renderSegment();
        showStatus('XR STORY MODE');
    }

    function close() {
        if (!state.shell) return;
        state.shell.classList.remove('is-open');
        document.body.classList.remove('xr-story-active');
        if (state.renderer && state.renderer.xr.isPresenting) {
            state.renderer.xr.getSession().end();
        }
    }

    return {
        createShell: createShell,
        bindShell: bindShell,
        open: open,
        close: close
    };
}
