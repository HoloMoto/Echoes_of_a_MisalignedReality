# -*- coding: utf-8 -*-
"""Inject WebXR assets into all episode HTML pages (idempotent)."""
import glob
import os
import re

BASE = os.path.dirname(os.path.abspath(__file__))


def inject_xr_assets(html):
    if 'styles/webxr-story.css' not in html:
        html = html.replace(
            '<link rel="stylesheet" href="styles/episode.css">',
            '<link rel="stylesheet" href="styles/episode.css">\n'
            '    <link rel="stylesheet" href="styles/webxr-story.css">',
            1,
        )
    if 'scripts/episode-xr-bootstrap.js' not in html:
        html = html.replace(
            '<script src="scripts/main.js"></script>',
            '<script src="scripts/episode-xr-bootstrap.js" defer></script>\n'
            '    <script src="scripts/main.js"></script>',
            1,
        )
    return html


def main():
    paths = sorted(glob.glob(os.path.join(BASE, 'episode*.html')))
    for path in paths:
        with open(path, 'r', encoding='utf-8') as f:
            html = f.read()
        new_html = inject_xr_assets(html)
        if new_html != html:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_html)
            print('Patched', os.path.basename(path))
        else:
            print('Skipped', os.path.basename(path), '(already patched)')


if __name__ == '__main__':
    main()
