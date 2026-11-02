# -*- coding: utf-8 -*-
import os
import re

BASE = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(BASE, "episode20.html"), encoding="utf-8") as f:
    tpl = f.read()
with open(os.path.join(BASE, "ep_p2_1_body.txt"), encoding="utf-8") as f:
    body = f.read()

tpl = re.sub(
    r"<title>.*?</title>",
    "<title>第2部 第一話 - 春風シンクレティック</title>",
    tpl,
    count=1,
)
tpl = re.sub(
    r'(<div class="episode-breadcrumb">.*?<i class="fas fa-chevron-right"></i>\s*)<span>.*?</span>',
    r"\1<span>第2部 第一話</span>",
    tpl,
    count=1,
    flags=re.DOTALL,
)
tpl = re.sub(
    r'<h1>#\d+ .*?</h1>\s*<p class="episode-subtitle">.*?</p>',
    '<h1>#2-1 Old Electric Street</h1>\n                <p class="episode-subtitle">旧電気街</p>',
    tpl,
    count=1,
    flags=re.DOTALL,
)

nav = """
                <div class="chapter-continue">
                    <p>続く...</p>
                    <div class="episode-navigation">
                        <a href="episode20.html" class="btn btn-outline">
                            <i class="fas fa-arrow-left"></i>
                            第1部 最終話
                        </a>
                        <a href="story.html" class="btn btn-outline">
                            <i class="fas fa-list"></i>
                            エピソード一覧に戻る
                        </a>
                    </div>
                </div>
"""

new_article = '<article class="episode-text">\n' + body + nav + "\n            </article>"
tpl = re.sub(
    r'<article class="episode-text">.*?</article>',
    new_article,
    tpl,
    count=1,
    flags=re.DOTALL,
)

out = os.path.join(BASE, "part2_episode1.html")
with open(out, "w", encoding="utf-8") as f:
    f.write(tpl)
print("Wrote", out)
