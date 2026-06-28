# -*- coding: utf-8 -*-
"""Convert Story/1AnesthesiaAwareness/*.md to episode HTML (1-6)."""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from md2episode import md_to_episode_html

BASE = os.path.dirname(os.path.abspath(__file__))
STORY_DIR = os.path.join(BASE, '..', 'Story', '1AnesthesiaAwareness')

NAV_EP1 = '''
                <div class="chapter-continue">
                    <p>続く...</p>
                    <div class="episode-navigation">
                        <a href="story.html" class="btn btn-outline">
                            <i class="fas fa-list"></i>
                            エピソード一覧に戻る
                        </a>
                        <a href="episode2.html" class="btn btn-primary">
                            次話 <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
'''

NAV_MID = '''
                <div class="chapter-continue">
                    <p>続く...</p>
                    <div class="episode-navigation">
                        <a href="{prev}" class="btn btn-outline">
                            <i class="fas fa-arrow-left"></i>
                            前話
                        </a>
                        <a href="story.html" class="btn btn-outline">
                            <i class="fas fa-list"></i>
                            エピソード一覧に戻る
                        </a>
                        <a href="{next}" class="btn btn-primary">
                            次話 <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
'''

NAV_LAST = '''
                <div class="chapter-continue">
                    <p>第1章 続く...</p>
                    <div class="episode-navigation">
                        <a href="episode5.html" class="btn btn-outline">
                            <i class="fas fa-arrow-left"></i>
                            前話
                        </a>
                        <a href="story.html" class="btn btn-outline">
                            <i class="fas fa-list"></i>
                            エピソード一覧に戻る
                        </a>
                    </div>
                </div>
'''

# h1 / subtitle patches for episode header sections
HEADER_PATCHES = {
    4: (
        r'<h1>#4 Crumbling Sandbox</h1>\s*<p class="episode-subtitle">崩れゆく砂箱</p>',
        '<h1>#4 Cracking Sandbox</h1>\n                <p class="episode-subtitle">ひびく Sandbox</p>',
    ),
}

NAV_BY_EP = {
    1: NAV_EP1,
    2: NAV_MID.format(prev='episode1.html', next='episode3.html'),
    3: NAV_MID.format(prev='episode2.html', next='episode4.html'),
    4: NAV_MID.format(prev='episode3.html', next='episode5.html'),
    5: NAV_MID.format(prev='episode4.html', next='episode6.html'),
    6: NAV_LAST,
}


def convert_md(ep_num):
    md_path = os.path.join(STORY_DIR, '{}.md'.format(ep_num))
    body_path = os.path.join(BASE, 'ep{}_body.txt'.format(ep_num))
    html = md_to_episode_html(md_path)
    with open(body_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print('Wrote ep{}_body.txt'.format(ep_num))


def update_html(ep_num):
    html_path = os.path.join(BASE, 'episode{}.html'.format(ep_num))
    body_path = os.path.join(BASE, 'ep{}_body.txt'.format(ep_num))
    with open(body_path, 'r', encoding='utf-8') as f:
        body = f.read().rstrip()
    nav = NAV_BY_EP[ep_num]
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()
    pattern = r'(<article class="episode-text">)\s*\n(.*?)(\n\s*</article>)'
    matcher = re.compile(pattern, re.DOTALL)

    def repl(m):
        return m.group(1) + '\n' + body + '\n' + nav + m.group(3)

    new_html = matcher.sub(repl, html, count=1)
    if new_html == html:
        raise RuntimeError('Failed to update article in episode{}.html'.format(ep_num))
    if ep_num in HEADER_PATCHES:
        old, new = HEADER_PATCHES[ep_num]
        new_html = re.sub(old, new, new_html, count=1)
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(new_html)
    print('Updated episode{}.html'.format(ep_num))


def update_story_listing():
    story_path = os.path.join(BASE, 'story.html')
    with open(story_path, 'r', encoding='utf-8') as f:
        html = f.read()
    html = html.replace(
        '<h3 class="decrypted-text" data-text="Crumbling Sandbox">Crumbling Sandbox</h3>',
        '<h3 class="decrypted-text" data-text="Cracking Sandbox">Cracking Sandbox</h3>',
    )
    with open(story_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print('Updated story.html (episode 4 title)')


if __name__ == '__main__':
    for n in range(1, 7):
        convert_md(n)
    for n in range(1, 7):
        update_html(n)
    update_story_listing()
    print('Done.')
