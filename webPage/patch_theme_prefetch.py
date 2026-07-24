# -*- coding: utf-8 -*-
"""Inject theme + episode-prefetch assets into all site HTML pages (idempotent)."""
import glob
import os

BASE = os.path.dirname(os.path.abspath(__file__))

THEME_CSS = 'styles/theme.css'
THEME_INIT = 'scripts/theme-init.js'
PREFETCH_JS = 'scripts/episode-prefetch.js'


def inject_assets(html, path):
    # Theme CSS after main.css when present, else before </head>
    if THEME_CSS not in html:
        if 'styles/main.css' in html:
            html = html.replace(
                '<link rel="stylesheet" href="styles/main.css">',
                '<link rel="stylesheet" href="styles/main.css">\n'
                '    <link rel="stylesheet" href="styles/theme.css">',
                1,
            )
        else:
            html = html.replace(
                '</head>',
                '    <link rel="stylesheet" href="styles/theme.css">\n</head>',
                1,
            )

    # Early theme init in <head>
    if THEME_INIT not in html:
        html = html.replace(
            '</head>',
            '    <script src="scripts/theme-init.js"></script>\n</head>',
            1,
        )

    basename = os.path.basename(path)
    is_episode = basename.startswith('episode') and basename.endswith('.html')

    # Prefetch only on episode pages
    if is_episode and PREFETCH_JS not in html:
        if 'scripts/main.js' in html:
            html = html.replace(
                '<script src="scripts/main.js"></script>',
                '<script src="scripts/episode-prefetch.js" defer></script>\n'
                '    <script src="scripts/main.js"></script>',
                1,
            )
        else:
            html = html.replace(
                '</body>',
                '    <script src="scripts/episode-prefetch.js" defer></script>\n</body>',
                1,
            )

    return html


def main():
    paths = sorted(glob.glob(os.path.join(BASE, '*.html')))
    for path in paths:
        with open(path, 'r', encoding='utf-8') as f:
            html = f.read()
        new_html = inject_assets(html, path)
        if new_html != html:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_html)
            print('Patched', os.path.basename(path))
        else:
            print('Skipped', os.path.basename(path))


if __name__ == '__main__':
    main()
