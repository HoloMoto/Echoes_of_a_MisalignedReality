// メインJavaScriptファイル

const THEME_STORAGE_KEY = 'hs-theme';

function getCurrentTheme() {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'dark' || attr === 'light') return attr;
    try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) { /* ignore */ }
    return 'dark';
}

function applyTheme(theme, persist) {
    const next = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    if (persist) {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch (e) { /* ignore */ }
    }
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        toggle.setAttribute('aria-label', next === 'dark' ? 'ライトモードに切替' : 'ダークモードに切替');
        toggle.setAttribute('title', next === 'dark' ? 'ライトモード' : 'ダークモード');
    }
}

function initNavControls() {
    applyTheme(getCurrentTheme(), false);

    const navContainer = document.querySelector('.nav-container');
    if (!navContainer) return;

    let actions = navContainer.querySelector('.nav-actions');
    if (!actions) {
        actions = document.createElement('div');
        actions.className = 'nav-actions';

        const traceBtn = document.createElement('button');
        traceBtn.type = 'button';
        traceBtn.id = 'hudTraceNavBtn';
        traceBtn.className = 'hud-trace-btn';
        traceBtn.title = '観測コンソールを開く (Ctrl+Shift+U)';
        traceBtn.setAttribute('aria-label', '観測コンソールを開く');
        traceBtn.innerHTML = '<i class="fas fa-terminal" aria-hidden="true"></i><span>TRACE</span>';
        traceBtn.addEventListener('click', function () {
            if (typeof window.hsOpenTraceTerminal === 'function') {
                window.hsOpenTraceTerminal();
            }
        });

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.id = 'themeToggle';
        toggleBtn.className = 'theme-toggle';
        toggleBtn.innerHTML =
            '<i class="fas fa-moon icon-moon" aria-hidden="true"></i>' +
            '<i class="fas fa-sun icon-sun" aria-hidden="true"></i>';
        toggleBtn.addEventListener('click', function () {
            const current = getCurrentTheme();
            applyTheme(current === 'dark' ? 'light' : 'dark', true);
        });

        actions.appendChild(traceBtn);
        actions.appendChild(toggleBtn);

        const hamburger = navContainer.querySelector('.hamburger');
        if (hamburger) {
            navContainer.insertBefore(actions, hamburger);
        } else {
            navContainer.appendChild(actions);
        }
    }

    applyTheme(getCurrentTheme(), false);
}

document.addEventListener('DOMContentLoaded', function () {
    initNavControls();

    // ハンバーガーメニューの制御
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function () {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        document.querySelectorAll('.nav-link').forEach(function (link) {
            link.addEventListener('click', function () {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // スムーススクロール（存在するアンカーのみ）
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const header = document.querySelector('.header');
                const headerHeight = header ? header.offsetHeight : 0;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
                window.scrollTo({
                    top: Math.max(0, targetPosition),
                    behavior: 'smooth'
                });
            }
        });
    });

    // ヘッダーのスクロール状態
    function syncHeaderScroll() {
        const header = document.querySelector('.header');
        if (!header) return;
        header.classList.toggle('is-scrolled', window.scrollY > 40);
    }
    syncHeaderScroll();
    window.addEventListener('scroll', syncHeaderScroll, { passive: true });

    // スクロール登場アニメーション（CSSクラス制御なので :hover と競合しない）
    const revealEls = document.querySelectorAll(
        '.story-card, .character-card-home, .episode-card, .keyword-card, .world-keyword-card, .tech-card, .org-card, .location-card, .character-card-detailed'
    );
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-revealed');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.06, rootMargin: '0px 0px -24px 0px' });

        revealEls.forEach(function (el) {
            el.classList.add('reveal-target');
            observer.observe(el);
        });
    }

    // スクロール進捗テレメトリバー（全ページ共通）
    let progressBar = document.querySelector('.scroll-progress');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        progressBar.setAttribute('aria-hidden', 'true');
        document.body.appendChild(progressBar);
    }

    function updateScrollProgress() {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100)) : 0;
        progressBar.style.width = pct.toFixed(2) + '%';
    }
    updateScrollProgress();
    window.addEventListener('scroll', updateScrollProgress, { passive: true });

    // Escキーでモバイルメニューを閉じる
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && hamburger && navMenu) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });

    window.addEventListener('load', function () {
        document.body.classList.add('loaded');
    });
});

// Register episode cache SW early (https / localhost only)
(function registerEpisodeCacheSW() {
    if (!('serviceWorker' in navigator)) return;
    var host = window.location.hostname;
    if (window.location.protocol !== 'https:' && host !== 'localhost' && host !== '127.0.0.1') return;
    navigator.serviceWorker.register('sw.js', { scope: './' }).catch(function (err) {
        console.warn('Episode SW register failed:', err);
    });
})();
