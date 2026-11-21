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
    return null;
}

function createXrGlContext(canvas) {
    var attrs = {
        antialias: true,
        alpha: false,
        depth: true,
        stencil: false,
        xrCompatible: true
    };
    var gl = canvas.getContext('webgl2', attrs);
    if (!gl) gl = canvas.getContext('webgl', attrs);
    return gl;
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
        contentRig: null,
        holoPanel: null,
        holoFrame: null,
        navPrev: null,
        navNext: null,
        backdrop: null,
        envGroup: null,
        particles: null,
        orbitRingA: null,
        orbitRingB: null,
        overlaySprites: [],
        resizeHandler: null,
        keyHandler: null,
        pointerHandler: null,
        sessionStartHandler: null,
        sessionEndHandler: null,
        selectHandler: null,
        activeSession: null,
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
            '</div>' +
            '<div class="xr-story-shell__xr-exit" id="xrStoryXrExit">' +
                '<button type="button" class="xr-story-shell__btn xr-story-shell__btn--danger" id="xrStoryXrExitBtn">XR を終了</button>' +
            '</div>';
        return shell;
    }

    function showStatus(message, persist) {
        if (!state.shell) return;
        var el = state.shell.querySelector('#xrStoryStatus');
        el.textContent = message;
        el.classList.add('is-visible');
        clearTimeout(showStatus._timer);
        if (!persist) {
            showStatus._timer = setTimeout(function () {
                el.classList.remove('is-visible');
            }, 3200);
        }
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

        state.shell.querySelector('#xrStoryPanel').innerHTML = formatSegmentHtml(segment);

        var progress = state.shell.querySelector('#xrStoryProgress');
        progress.textContent =
            String(state.index + 1).padStart(2, '0') + ' / ' +
            String(state.data.segments.length).padStart(2, '0');

        updatePanelTexture(segment);
        showStatus(state.isPresenting ? 'PINCH: NEXT / PREV' : 'SEGMENT SYNCED');
    }

    function buildHoloTexture(segment, forXr) {
        var canvas = document.createElement('canvas');
        canvas.width = forXr ? 2048 : 1280;
        canvas.height = forXr ? 1024 : 640;
        var ctx = canvas.getContext('2d');
        var w = canvas.width;
        var h = canvas.height;

        // Deep space gradient glass panel
        var bg = ctx.createLinearGradient(0, 0, w, h);
        bg.addColorStop(0, '#040c18');
        bg.addColorStop(0.5, '#07182c');
        bg.addColorStop(1, '#050b18');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Subtle optical scanlines
        ctx.fillStyle = 'rgba(103, 232, 249, 0.035)';
        for (var sy = 0; sy < h; sy += 6) {
            ctx.fillRect(0, sy, w, 1);
        }

        // Outer neon border + corner brackets
        ctx.strokeStyle = 'rgba(103, 232, 249, 0.45)';
        ctx.lineWidth = forXr ? 5 : 3;
        ctx.strokeRect(24, 24, w - 48, h - 48);

        var bLen = forXr ? 48 : 30;
        ctx.strokeStyle = '#67e8f9';
        ctx.lineWidth = forXr ? 9 : 5;
        [[24, 24, 1, 1], [w - 24, 24, -1, 1], [24, h - 24, 1, -1], [w - 24, h - 24, -1, -1]].forEach(function (c) {
            ctx.beginPath();
            ctx.moveTo(c[0] + c[2] * bLen, c[1]);
            ctx.lineTo(c[0], c[1]);
            ctx.lineTo(c[0], c[1] + c[3] * bLen);
            ctx.stroke();
        });

        // Header divider & telemetry
        ctx.fillStyle = 'rgba(34, 211, 238, 0.08)';
        ctx.fillRect(26, 26, w - 52, forXr ? 100 : 66);

        ctx.fillStyle = '#67e8f9';
        ctx.font = 'bold ' + (forXr ? 46 : 28) + 'px "Share Tech Mono", monospace';
        ctx.fillText(state.data.title || 'EPISODE', 56, forXr ? 90 : 68);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#a5b4fc';
        ctx.font = (forXr ? 32 : 20) + 'px "Share Tech Mono", monospace';
        ctx.fillText(
            'SEG ' + String(state.index + 1).padStart(2, '0') + '/' + String(state.data.segments.length).padStart(2, '0'),
            w - 56,
            forXr ? 88 : 66
        );
        ctx.textAlign = 'left';

        // Story body text
        ctx.fillStyle = segment.type === 'dialogue' ? '#fff4df' : '#e6f4ff';
        ctx.font = (forXr ? 44 : 26) + 'px "Noto Sans JP", sans-serif';
        var text = (segment.text || '').replace(OVERLAY_PATTERN, '').replace(/\s+/g, ' ').trim();
        wrapText(ctx, text, 58, forXr ? 185 : 138, w - 116, forXr ? 62 : 40);

        if (segment.overlays && segment.overlays.length) {
            ctx.fillStyle = '#67e8f9';
            ctx.font = 'bold ' + (forXr ? 36 : 22) + 'px "Share Tech Mono", "Noto Sans JP", monospace';
            var y = h - 68 - segment.overlays.length * (forXr ? 48 : 30);
            segment.overlays.forEach(function (line, i) {
                ctx.fillText('《' + line + '》', 58, y + i * (forXr ? 48 : 30));
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
                if (y > ctx.canvas.height - 84) break;
            } else {
                line = test;
            }
        }
        if (line && y <= ctx.canvas.height - 84) ctx.fillText(line, x, y);
    }

    function updatePanelTexture(segment) {
        if (!state.holoPanel) return;
        var oldMap = state.holoPanel.material.map;
        state.holoPanel.material.map = buildHoloTexture(segment, state.isPresenting);
        state.holoPanel.material.needsUpdate = true;
        if (oldMap) oldMap.dispose();

        clearOverlaySprites();
        if (segment.overlays && segment.overlays.length) {
            segment.overlays.forEach(function (line, i) {
                var sprite = createOverlaySprite('《' + line + '》', i);
                state.overlaySprites.push(sprite);
                state.contentRig.add(sprite);
            });
        }
    }

    function createOverlaySprite(text, index) {
        var canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 128;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(4, 18, 34, 0.88)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'rgba(103, 232, 249, 0.75)';
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
        ctx.fillStyle = '#67e8f9';
        ctx.font = 'bold 42px "Share Tech Mono", "Noto Sans JP", monospace';
        ctx.fillText(text, 28, 80);

        var texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false,
            depthWrite: false
        }));
        sprite.scale.set(1.0, 0.125, 1);
        sprite.position.set(0, 0.56 - index * 0.145, 0.04);
        sprite.renderOrder = 999;
        return sprite;
    }

    function clearOverlaySprites() {
        state.overlaySprites.forEach(function (sprite) {
            state.contentRig.remove(sprite);
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
        ctx.fillStyle = '#071a2d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#67e8f9';
        ctx.lineWidth = 5;
        ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
        ctx.fillStyle = '#e6f4ff';
        ctx.font = 'bold 50px "Share Tech Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, canvas.width / 2, 98);

        var texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        var mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(0.5, 0.15),
            new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, side: THREE.DoubleSide })
        );
        mesh.position.set(x, -0.82, 0.03);
        mesh.userData.action = label === 'PREV' ? 'prev' : 'next';
        return mesh;
    }

    function createSkyDome() {
        var canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        var ctx = canvas.getContext('2d');
        var grad = ctx.createLinearGradient(0, 0, 0, 512);
        grad.addColorStop(0, '#02060f');
        grad.addColorStop(0.45, '#071b33');
        grad.addColorStop(0.7, '#061528');
        grad.addColorStop(1, '#02050c');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);

        // Distant horizon glow band
        var band = ctx.createLinearGradient(0, 220, 0, 310);
        band.addColorStop(0, 'rgba(34,211,238,0)');
        band.addColorStop(0.5, 'rgba(34,211,238,0.16)');
        band.addColorStop(1, 'rgba(34,211,238,0)');
        ctx.fillStyle = band;
        ctx.fillRect(0, 220, 512, 90);

        var tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        return new THREE.Mesh(
            new THREE.SphereGeometry(28, 32, 24),
            new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, toneMapped: false })
        );
    }

    function createCyberEnvironment(scene) {
        var group = new THREE.Group();

        // Dual Cyber Grid Floors
        var mainGrid = new THREE.GridHelper(36, 48, 0x22d3ee, 0x102b46);
        mainGrid.position.y = 0;
        group.add(mainGrid);

        var upperGrid = new THREE.GridHelper(36, 24, 0xa5b4fc, 0x0c1b36);
        upperGrid.position.y = 5.4;
        group.add(upperGrid);

        // Floating Quantum Data Particles
        var count = 520;
        var positions = new Float32Array(count * 3);
        var colors = new Float32Array(count * 3);
        var cyan = new THREE.Color(0x67e8f9);
        var violet = new THREE.Color(0xa5b4fc);

        for (var i = 0; i < count; i++) {
            var angle = Math.random() * Math.PI * 2;
            var dist = 2.4 + Math.random() * 14;
            positions[i * 3] = Math.cos(angle) * dist;
            positions[i * 3 + 1] = 0.3 + Math.random() * 4.8;
            positions[i * 3 + 2] = Math.sin(angle) * dist;

            var c = i % 3 === 0 ? violet : cyan;
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }

        var pGeo = new THREE.BufferGeometry();
        pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        var pMat = new THREE.PointsMaterial({
            size: 0.055,
            vertexColors: true,
            transparent: true,
            opacity: 0.78
        });
        state.particles = new THREE.Points(pGeo, pMat);
        group.add(state.particles);

        // Rotating Spatial Orbital Rings
        state.orbitRingA = new THREE.Mesh(
            new THREE.RingGeometry(3.8, 3.83, 96),
            new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide, transparent: true, opacity: 0.32 })
        );
        state.orbitRingA.rotation.x = Math.PI / 2;
        state.orbitRingA.position.y = 1.55;
        group.add(state.orbitRingA);

        state.orbitRingB = new THREE.Mesh(
            new THREE.RingGeometry(4.6, 4.62, 96),
            new THREE.MeshBasicMaterial({ color: 0xa5b4fc, side: THREE.DoubleSide, transparent: true, opacity: 0.25 })
        );
        state.orbitRingB.rotation.x = Math.PI / 2.25;
        state.orbitRingB.rotation.y = 0.25;
        state.orbitRingB.position.y = 1.65;
        group.add(state.orbitRingB);

        state.envGroup = group;
        scene.add(group);
    }

    function mountRigForPreview() {
        if (!state.contentRig || !state.scene) return;
        state.camera.remove(state.contentRig);
        state.scene.add(state.contentRig);
        state.contentRig.position.set(0, 1.62, 0);
        state.contentRig.rotation.set(0, 0, 0);
        state.holoPanel.position.set(0, 0, -2.05);
        state.holoPanel.scale.set(1, 1, 1);
        if (state.navPrev) state.navPrev.visible = false;
        if (state.navNext) state.navNext.visible = false;
        if (state.backdrop) state.backdrop.visible = true;
        if (state.envGroup) state.envGroup.visible = true;
    }

    function mountRigForXr() {
        if (!state.contentRig || !state.scene) return;
        state.camera.remove(state.contentRig);
        if (!state.contentRig.parent) state.scene.add(state.contentRig);
        state.holoPanel.position.set(0, 0, 0);
        state.holoPanel.scale.set(1.15, 1.15, 1.15);
        if (state.navPrev) state.navPrev.visible = true;
        if (state.navNext) state.navNext.visible = true;
        if (state.backdrop) state.backdrop.visible = false;
        if (state.envGroup) state.envGroup.visible = true;
    }

    function updateXrRigPose(frame) {
        if (!state.isPresenting || !state.contentRig || !state.renderer) return;
        var refSpace = state.renderer.xr.getReferenceSpace();
        if (!frame || !refSpace) return;
        var pose = frame.getViewerPose(refSpace);
        if (!pose) return;

        var t = pose.transform;
        state.contentRig.position.set(t.position.x, t.position.y, t.position.z);
        state.contentRig.quaternion.set(
            t.orientation.x,
            t.orientation.y,
            t.orientation.z,
            t.orientation.w
        );
        var offset = new THREE.Vector3(0, 0, -1.08);
        offset.applyQuaternion(state.contentRig.quaternion);
        state.contentRig.position.add(offset);
    }

    function initThree() {
        var canvas = state.shell.querySelector('#xrStoryCanvas');
        var gl = createXrGlContext(canvas);
        if (!gl) {
            showStatus('WEBGL NOT AVAILABLE', true);
            return;
        }

        var renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            context: gl,
            antialias: true,
            alpha: false
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x030812, 1);
        renderer.xr.enabled = true;
        renderer.xr.setReferenceSpaceType('local');
        state.renderer = renderer;

        var scene = new THREE.Scene();
        scene.background = new THREE.Color(0x030812);
        scene.fog = new THREE.FogExp2(0x030812, 0.042);
        state.scene = scene;

        var camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.01, 60);
        camera.position.set(0, 1.62, 0.25);
        state.camera = camera;

        state.backdrop = createSkyDome();
        scene.add(state.backdrop);
        createCyberEnvironment(scene);

        state.contentRig = new THREE.Group();
        var segment = currentSegment() || { text: state.data.title, overlays: [] };
        state.holoPanel = new THREE.Mesh(
            new THREE.PlaneGeometry(2.75, 1.48),
            new THREE.MeshBasicMaterial({
                map: buildHoloTexture(segment, false),
                toneMapped: false,
                side: THREE.DoubleSide
            })
        );
        state.contentRig.add(state.holoPanel);

        // Glowing wireframe halo behind holographic panel
        var halo = new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.84, 1.56)),
            new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.45 })
        );
        halo.position.z = -0.02;
        state.holoPanel.add(halo);

        state.navPrev = createNavButton('PREV', -0.64);
        state.navNext = createNavButton('NEXT', 0.64);
        state.navPrev.visible = false;
        state.navNext.visible = false;
        state.contentRig.add(state.navPrev);
        state.contentRig.add(state.navNext);

        scene.add(state.contentRig);
        mountRigForPreview();

        state.resizeHandler = function () {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', state.resizeHandler);

        state.pointerHandler = {
            down: function (e) {
                if (renderer.xr.isPresenting) return;
                state.dragging = true;
                state.lastX = e.clientX;
                state.lastY = e.clientY;
            },
            move: function (e) {
                if (!state.dragging || renderer.xr.isPresenting) return;
                state.yaw -= (e.clientX - state.lastX) * 0.004;
                state.pitch -= (e.clientY - state.lastY) * 0.003;
                state.lastX = e.clientX;
                state.lastY = e.clientY;
                state.pitch = Math.max(-0.45, Math.min(0.45, state.pitch));
            },
            up: function () { state.dragging = false; }
        };
        canvas.addEventListener('pointerdown', state.pointerHandler.down);
        window.addEventListener('pointermove', state.pointerHandler.move);
        window.addEventListener('pointerup', state.pointerHandler.up);

        state.sessionStartHandler = function () {
            state.isPresenting = true;
            mountRigForXr();
            state.contentRig.position.set(0, 0, -1.2);
            state.contentRig.quaternion.set(0, 0, 0, 1);
            var seg = currentSegment();
            if (seg) updatePanelTexture(seg);
            state.shell.classList.add('is-xr-presenting');
            showStatus('XR ACTIVE — テキストは目の前に固定', true);
        };

        state.sessionEndHandler = function () {
            state.isPresenting = false;
            mountRigForPreview();
            state.shell.classList.remove('is-xr-presenting');
            state.activeSession = null;
            showStatus('PREVIEW MODE');
        };

        renderer.xr.addEventListener('sessionstart', state.sessionStartHandler);
        renderer.xr.addEventListener('sessionend', state.sessionEndHandler);

        renderer.setAnimationLoop(function () {
            var dt = state.clock.getDelta();
            if (state.particles) {
                state.particles.rotation.y += dt * 0.035;
            }
            if (state.orbitRingA) state.orbitRingA.rotation.z += dt * 0.12;
            if (state.orbitRingB) state.orbitRingB.rotation.z -= dt * 0.08;

            if (!renderer.xr.isPresenting) {
                var radius = 0.22;
                camera.position.x = Math.sin(state.yaw) * radius;
                camera.position.z = Math.cos(state.yaw) * radius;
                camera.position.y = 1.62 + state.pitch;
                camera.lookAt(0, 1.62, -1.85);
            } else {
                var frame = renderer.xr.getFrame ? renderer.xr.getFrame() : null;
                if (frame) updateXrRigPose(frame);
            }
            renderer.render(scene, camera);
        });
    }

    async function startXrSession() {
        if (!state.renderer || !state.xrMode) return;
        if (state.renderer.xr.isPresenting) return;

        try {
            var gl = state.renderer.getContext();
            if (gl && gl.makeXRCompatible) {
                await gl.makeXRCompatible();
            }

            var session = await navigator.xr.requestSession(state.xrMode, {
                optionalFeatures: ['hand-tracking']
            });
            state.activeSession = session;
            state.renderer.xr.setReferenceSpaceType('local');
            await state.renderer.xr.setSession(session);
            bindXrInput(session);
        } catch (err) {
            console.error('XR session failed:', err);
            showStatus('XR FAILED: ' + (err.message || err), true);
            var unsupported = state.shell.querySelector('#xrStoryUnsupported');
            unsupported.textContent = 'XR開始に失敗: ' + (err.message || String(err));
            unsupported.classList.add('is-visible');
        }
    }

    function bindXrInput(session) {
        if (state.selectHandler) {
            session.removeEventListener('select', state.selectHandler);
        }

        var raycaster = new THREE.Raycaster();
        state.selectHandler = function (event) {
            if (!state.isPresenting) return;
            var frame = event.frame;
            var refSpace = state.renderer.xr.getReferenceSpace();
            if (!frame || !refSpace) {
                if (state.index < state.data.segments.length - 1) {
                    state.index += 1;
                    renderSegment();
                }
                return;
            }

            var pose = frame.getPose(event.inputSource.targetRaySpace, refSpace);
            if (!pose) {
                state.index = Math.min(state.index + 1, state.data.segments.length - 1);
                renderSegment();
                return;
            }

            var origin = new THREE.Vector3(
                pose.transform.position.x,
                pose.transform.position.y,
                pose.transform.position.z
            );
            var quat = new THREE.Quaternion(
                pose.transform.orientation.x,
                pose.transform.orientation.y,
                pose.transform.orientation.z,
                pose.transform.orientation.w
            );
            var direction = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
            raycaster.set(origin, direction);

            var targets = [state.navPrev, state.navNext, state.holoPanel].filter(Boolean);
            var hits = raycaster.intersectObjects(targets, false);
            if (!hits.length) {
                state.index = Math.min(state.index + 1, state.data.segments.length - 1);
            } else if (hits[0].object.userData.action === 'prev' && state.index > 0) {
                state.index -= 1;
            } else if (hits[0].object.userData.action === 'next') {
                state.index = Math.min(state.index + 1, state.data.segments.length - 1);
            } else {
                state.index = Math.min(state.index + 1, state.data.segments.length - 1);
            }
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
            if (state.index > 0) { state.index -= 1; renderSegment(); }
        });
        shell.querySelector('#xrStoryNextBtn').addEventListener('click', function () {
            if (state.index < state.data.segments.length - 1) { state.index += 1; renderSegment(); }
        });
        shell.querySelector('#xrStoryExitBtn').addEventListener('click', close);
        shell.querySelector('#xrStoryXrExitBtn').addEventListener('click', function () {
            if (state.renderer && state.renderer.xr.isPresenting) {
                state.renderer.xr.getSession().end();
            }
        });
        shell.querySelector('#xrStoryPreviewBtn').addEventListener('click', function () {
            if (state.renderer && state.renderer.xr.isPresenting) {
                state.renderer.xr.getSession().end();
            }
            showStatus('DRAG TO LOOK AROUND');
        });
        shell.querySelector('#xrStoryEnterBtn').addEventListener('click', startXrSession);

        detectXrMode().then(function (mode) {
            state.xrMode = mode;
            var enterBtn = shell.querySelector('#xrStoryEnterBtn');
            var unsupported = shell.querySelector('#xrStoryUnsupported');
            if (!mode) {
                enterBtn.disabled = true;
                unsupported.textContent =
                    'WebXR 未対応。3D PREVIEW（ドラッグ視点操作）でお楽しみください。Vision Pro では Safari > 詳細 > 機能フラグ > WebXR Device API を ON。';
            } else {
                unsupported.textContent =
                    'Vision Pro: ENTER XR で没入。ピンチで次へ / PREV・NEXT ボタンで送り。';
            }
            unsupported.classList.add('is-visible');
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
