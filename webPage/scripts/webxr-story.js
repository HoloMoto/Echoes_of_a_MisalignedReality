import * as THREE from 'three';

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

async function detectXrMode() {
    if (!navigator.xr) return null;
    try {
        if (await navigator.xr.isSessionSupported('immersive-vr')) {
            return 'immersive-vr';
        }
    } catch (e) { /* ignore */ }
    try {
        if (await navigator.xr.isSessionSupported('immersive-ar')) {
            return 'immersive-ar';
        }
    } catch (e) { /* ignore */ }
    return null;
}

export function createXrStoryReader() {
    var state = {
        data: null,
        index: 0,
        shell: null,
        renderer: null,
        scene: null,
        camera: null,
        clock: new THREE.Clock(),
        world: null,
        grid: null,
        particles: null,
        holoPanel: null,
        skySphere: null,
        navPrev: null,
        navNext: null,
        overlaySprites: [],
        resizeHandler: null,
        keyHandler: null,
        pointerHandler: null,
        sessionStartHandler: null,
        sessionEndHandler: null,
        selectHandler: null,
        yaw: 0,
        pitch: 0,
        dragging: false,
        lastX: 0,
        lastY: 0,
        xrMode: null,
        isPresenting: false
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
                        '<button type="button" class="xr-story-shell__btn xr-story-shell__btn--primary" id="xrStoryEnterBtn">ENTER XR</button>' +
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
        }, 2600);
    }

    function currentSegment() {
        if (!state.data || !state.data.segments.length) return null;
        if (state.index < 0) state.index = 0;
        if (state.index >= state.data.segments.length) state.index = state.data.segments.length - 1;
        return state.data.segments[state.index];
    }

    function renderSegment() {
        if (!state.data || !state.shell) return;
        var segment = currentSegment();
        if (!segment) return;

        var panel = state.shell.querySelector('#xrStoryPanel');
        panel.innerHTML = formatSegmentHtml(segment);

        var progress = state.shell.querySelector('#xrStoryProgress');
        var num = String(state.index + 1).padStart(2, '0');
        var total = String(state.data.segments.length).padStart(2, '0');
        progress.textContent = num + ' / ' + total;

        updateThreeScene(segment);
        showStatus(segment.type === 'chapter' ? 'CHAPTER SYNC' : 'SEGMENT LOADED');
    }

    function buildHoloTexture(segment, forXr) {
        var canvas = document.createElement('canvas');
        canvas.width = forXr ? 2048 : 1024;
        canvas.height = forXr ? 1024 : 512;
        var ctx = canvas.getContext('2d');

        ctx.fillStyle = '#07131f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
        ctx.lineWidth = forXr ? 6 : 3;
        ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);

        ctx.fillStyle = '#e8fbff';
        ctx.font = 'bold ' + (forXr ? 52 : 28) + 'px "Share Tech Mono", monospace';
        ctx.fillText(state.data.title || 'EPISODE', 56, forXr ? 96 : 70);

        ctx.fillStyle = '#b8ecff';
        ctx.font = (forXr ? 40 : 22) + 'px "Noto Sans JP", sans-serif';
        var text = (segment.text || state.data.title || '').replace(OVERLAY_PATTERN, '').replace(/\s+/g, ' ').trim();
        var y = forXr ? 150 : 120;
        var maxWidth = canvas.width - 112;
        var lineHeight = forXr ? 54 : 34;
        wrapText(ctx, text, 56, y, maxWidth, lineHeight);

        if (segment.overlays && segment.overlays.length) {
            ctx.fillStyle = '#6dffe8';
            ctx.font = 'bold ' + (forXr ? 34 : 20) + 'px "Share Tech Mono", monospace';
            y = canvas.height - 64 - segment.overlays.length * (forXr ? 42 : 28);
            segment.overlays.forEach(function (line, i) {
                ctx.fillText('《' + line + '》', 56, y + i * (forXr ? 42 : 28));
            });
        }

        var texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
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
                if (y > ctx.canvas.height - 80) break;
            } else {
                line = test;
            }
        }
        if (line && y <= ctx.canvas.height - 80) ctx.fillText(line, x, y);
    }

    function updateThreeScene(segment) {
        if (!state.holoPanel) return;
        var oldMap = state.holoPanel.material.map;
        var texture = buildHoloTexture(segment, state.isPresenting);
        state.holoPanel.material.map = texture;
        state.holoPanel.material.needsUpdate = true;
        if (oldMap) oldMap.dispose();

        clearOverlaySprites();
        if (segment.overlays && segment.overlays.length) {
            segment.overlays.forEach(function (line, i) {
                var sprite = createOverlaySprite('《' + line + '》', i);
                state.overlaySprites.push(sprite);
                state.world.add(sprite);
            });
        }
    }

    function createOverlaySprite(text, index) {
        var canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 128;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#7dffe8';
        ctx.font = 'bold 42px "Share Tech Mono", monospace';
        ctx.fillText(text, 24, 78);

        var texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        var material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.95,
            depthTest: false,
            depthWrite: false
        });
        var sprite = new THREE.Sprite(material);
        sprite.scale.set(0.9, 0.11, 1);
        sprite.position.set(0.45, 0.42 - index * 0.14, -0.95);
        sprite.renderOrder = 999;
        return sprite;
    }

    function clearOverlaySprites() {
        state.overlaySprites.forEach(function (sprite) {
            state.world.remove(sprite);
            if (sprite.material.map) sprite.material.map.dispose();
            sprite.material.dispose();
        });
        state.overlaySprites = [];
    }

    function createNavButton(label, x) {
        var canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 160;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0, 40, 60, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'rgba(0, 220, 255, 0.8)';
        ctx.lineWidth = 4;
        ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
        ctx.fillStyle = '#d8fbff';
        ctx.font = 'bold 48px "Share Tech Mono", monospace';
        ctx.fillText(label, 56, 98);

        var texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        var mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(0.42, 0.13),
            new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide })
        );
        mesh.position.set(x, -0.62, -1.05);
        mesh.userData.action = label === 'PREV' ? 'prev' : 'next';
        return mesh;
    }

    function createSkySphere() {
        var canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        var ctx = canvas.getContext('2d');
        var gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#02060c');
        gradient.addColorStop(0.5, '#061525');
        gradient.addColorStop(1, '#0a2038');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        var texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        var sphere = new THREE.Mesh(
            new THREE.SphereGeometry(30, 32, 16),
            new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, depthWrite: false })
        );
        return sphere;
    }

    function setPreviewLayout() {
        state.world.position.set(0, 1.55, 0);
        state.world.scale.set(1, 1, 1);
        state.holoPanel.scale.set(1, 1, 1);
        state.holoPanel.position.set(0, 0, -2.2);
        if (state.ring) state.ring.position.set(0, 0, -2.18);
        if (state.navPrev) state.navPrev.visible = false;
        if (state.navNext) state.navNext.visible = false;
        if (state.skySphere) state.skySphere.visible = true;
        if (state.scene) state.scene.fog = new THREE.FogExp2(0x02060c, 0.045);
        if (state.renderer) {
            state.renderer.setClearColor(0x02060c, 1);
        }
    }

    function setXrLayout() {
        // Vision Pro uses local-space; place content in front of the head.
        state.world.position.set(0, 0, 0);
        state.world.scale.set(1, 1, 1);
        state.holoPanel.scale.set(1.35, 1.35, 1.35);
        state.holoPanel.position.set(0, 0.05, -1.35);
        if (state.ring) {
            state.ring.position.set(0, 0.05, -1.33);
            state.ring.scale.set(0.75, 0.75, 0.75);
        }
        if (state.navPrev) state.navPrev.visible = true;
        if (state.navNext) state.navNext.visible = true;
        if (state.skySphere) state.skySphere.visible = true;
        if (state.scene) state.scene.fog = null;
        if (state.renderer) {
            state.renderer.setClearColor(0x02060c, 1);
        }
        if (state.grid) state.grid.visible = true;
        if (state.particles) state.particles.visible = true;
    }

    function initThree() {
        var canvas = state.shell.querySelector('#xrStoryCanvas');
        // Vision Pro: antialias off avoids known black-screen issues on some WebGL stacks.
        var renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: false,
            alpha: false,
            powerPreference: 'high-performance'
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x02060c, 1);
        renderer.xr.enabled = true;
        state.renderer = renderer;

        var scene = new THREE.Scene();
        scene.background = new THREE.Color(0x02060c);
        scene.fog = new THREE.FogExp2(0x02060c, 0.045);
        state.scene = scene;

        var camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100);
        camera.position.set(0, 1.55, 0.2);
        state.camera = camera;

        state.world = new THREE.Group();
        scene.add(state.world);

        scene.add(new THREE.AmbientLight(0xffffff, 0.65));
        var key = new THREE.DirectionalLight(0xb8f4ff, 1.1);
        key.position.set(2, 4, 3);
        scene.add(key);

        state.skySphere = createSkySphere();
        scene.add(state.skySphere);

        var grid = new THREE.GridHelper(20, 40, 0x1ecfff, 0x0a3048);
        grid.position.y = -1.6;
        state.grid = grid;
        state.world.add(grid);

        var starGeo = new THREE.BufferGeometry();
        var starCount = 700;
        var positions = new Float32Array(starCount * 3);
        for (var i = 0; i < starCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 24;
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        var stars = new THREE.Points(
            starGeo,
            new THREE.PointsMaterial({ color: 0x7adfff, size: 0.04, transparent: true, opacity: 0.85 })
        );
        stars.position.y = 1.2;
        state.particles = stars;
        state.world.add(stars);

        var segment = currentSegment() || { text: state.data.title, overlays: [] };
        var panelGeo = new THREE.PlaneGeometry(2.8, 1.5);
        var panelMat = new THREE.MeshBasicMaterial({
            map: buildHoloTexture(segment, false),
            transparent: false,
            side: THREE.DoubleSide
        });
        var holoPanel = new THREE.Mesh(panelGeo, panelMat);
        holoPanel.position.set(0, 0, -2.2);
        state.holoPanel = holoPanel;
        state.world.add(holoPanel);

        var ring = new THREE.Mesh(
            new THREE.RingGeometry(1.2, 1.25, 64),
            new THREE.MeshBasicMaterial({
                color: 0x2adfff,
                transparent: true,
                opacity: 0.45,
                side: THREE.DoubleSide
            })
        );
        ring.position.set(0, 0, -2.18);
        state.world.add(ring);
        state.ring = ring;

        state.navPrev = createNavButton('PREV', -0.55);
        state.navNext = createNavButton('NEXT', 0.55);
        state.navPrev.visible = false;
        state.navNext.visible = false;
        state.world.add(state.navPrev);
        state.world.add(state.navNext);

        setPreviewLayout();

        state.resizeHandler = function () {
            var w = window.innerWidth;
            var h = window.innerHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', state.resizeHandler);

        var domCanvas = renderer.domElement;
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
        domCanvas.addEventListener('pointerdown', state.pointerHandler.down);
        window.addEventListener('pointermove', state.pointerHandler.move);
        window.addEventListener('pointerup', state.pointerHandler.up);

        state.sessionStartHandler = function () {
            state.isPresenting = true;
            setXrLayout();
            var seg = currentSegment();
            if (seg) updateThreeScene(seg);
            state.shell.classList.add('is-xr-presenting');
            showStatus('XR SESSION ACTIVE');
        };

        state.sessionEndHandler = function () {
            state.isPresenting = false;
            setPreviewLayout();
            state.shell.classList.remove('is-xr-presenting');
            showStatus('PREVIEW MODE');
        };

        renderer.xr.addEventListener('sessionstart', state.sessionStartHandler);
        renderer.xr.addEventListener('sessionend', state.sessionEndHandler);

        // WebXR requires setAnimationLoop — requestAnimationFrame alone renders black on Vision Pro.
        renderer.setAnimationLoop(function () {
            var t = state.clock.getElapsedTime();

            if (state.grid) state.grid.position.z = (t * 0.12) % 1;
            if (state.particles) state.particles.rotation.y = t * 0.03;
            if (state.holoPanel && !state.isPresenting) {
                state.holoPanel.position.y = Math.sin(t * 1.2) * 0.03;
            }
            if (state.ring) {
                state.ring.rotation.z = t * 0.4;
                state.ring.material.opacity = 0.28 + Math.sin(t * 2) * 0.12;
            }
            state.overlaySprites.forEach(function (sprite, i) {
                sprite.position.x = (state.isPresenting ? 0.45 : 1.2) + Math.sin(t * 2 + i) * 0.04;
                sprite.material.opacity = 0.75 + Math.sin(t * 3 + i) * 0.2;
            });

            if (!renderer.xr.isPresenting) {
                var radius = 0.2;
                camera.position.x = Math.sin(state.yaw) * radius;
                camera.position.z = Math.cos(state.yaw) * radius;
                camera.position.y = 1.55 + state.pitch;
                camera.lookAt(0, 1.55, -2.0);
            }

            renderer.render(scene, camera);
        });
    }

    async function startXrSession() {
        if (!state.renderer || !state.xrMode) return;
        if (state.renderer.xr.isPresenting) return;

        var sessionInit = {
            optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'layers']
        };

        try {
            var session = await navigator.xr.requestSession(state.xrMode, sessionInit);
            await state.renderer.xr.setSession(session);
            bindXrInput(session);
            showStatus('ENTERED ' + state.xrMode.toUpperCase());
        } catch (err) {
            console.error('XR session failed:', err);
            showStatus('XR SESSION FAILED');
            var unsupported = state.shell.querySelector('#xrStoryUnsupported');
            unsupported.textContent =
                'XRセッションを開始できませんでした。Safari の WebXR Device API が有効か、HTTPS / localhost かを確認してください。';
            unsupported.classList.add('is-visible');
        }
    }

    function bindXrInput(session) {
        if (state.selectHandler) {
            session.removeEventListener('select', state.selectHandler);
        }

        var raycaster = new THREE.Raycaster();
        state.selectHandler = function (event) {
            if (!state.isPresenting || !state.camera) return;
            var frame = event.frame;
            if (!frame) return;
            var refSpace = state.renderer.xr.getReferenceSpace();
            var pose = frame.getPose(event.inputSource.targetRaySpace, refSpace);
            if (!pose) return;

            var origin = new THREE.Vector3(
                pose.transform.position.x,
                pose.transform.position.y,
                pose.transform.position.z
            );
            var direction = new THREE.Vector3(0, 0, -1).applyQuaternion(
                new THREE.Quaternion(
                    pose.transform.orientation.x,
                    pose.transform.orientation.y,
                    pose.transform.orientation.z,
                    pose.transform.orientation.w
                )
            );

            raycaster.set(origin, direction);
            var hits = raycaster.intersectObjects([state.navPrev, state.navNext, state.holoPanel], false);
            if (!hits.length) {
                state.index = Math.min(state.index + 1, state.data.segments.length - 1);
                renderSegment();
                return;
            }
            var action = hits[0].object.userData.action;
            if (action === 'prev' && state.index > 0) state.index -= 1;
            if (action === 'next' && state.index < state.data.segments.length - 1) state.index += 1;
            renderSegment();
        };
        session.addEventListener('select', state.selectHandler);
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
            if (state.renderer && state.renderer.xr.isPresenting) {
                state.renderer.xr.getSession().end();
            }
            setPreviewLayout();
            showStatus('DRAG TO LOOK AROUND');
        });
        shell.querySelector('#xrStoryEnterBtn').addEventListener('click', function () {
            startXrSession();
        });

        var unsupported = state.shell.querySelector('#xrStoryUnsupported');
        detectXrMode().then(function (mode) {
            state.xrMode = mode;
            var enterBtn = shell.querySelector('#xrStoryEnterBtn');
            if (!mode) {
                enterBtn.disabled = true;
                unsupported.textContent =
                    'この端末では WebXR セッションに未対応です。Vision Pro では Safari > 設定 > 詳細 > 機能フラグで WebXR Device API を有効にしてください。';
                unsupported.classList.add('is-visible');
            } else {
                enterBtn.textContent = mode === 'immersive-ar' ? 'ENTER AR' : 'ENTER XR';
                unsupported.textContent =
                    'Vision Pro: ピンチで NEXT / PREV ボタン、またはテキストパネルをタップして次へ進めます。';
                unsupported.classList.add('is-visible');
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
        if (!state.renderer) initThree();
        renderSegment();
        showStatus('XR STORY MODE');
    }

    function close() {
        if (!state.shell) return;
        if (state.renderer && state.renderer.xr.isPresenting) {
            state.renderer.xr.getSession().end();
        }
        state.shell.classList.remove('is-open');
        state.shell.classList.remove('is-xr-presenting');
        document.body.classList.remove('xr-story-active');
    }

    return {
        createShell: createShell,
        bindShell: bindShell,
        open: open,
        close: close
    };
}
