# -*- coding: utf-8 -*-
"""Update episode1/2/3 HTML with body content from ep1/2/3_body.txt"""
import os
import re

base = os.path.dirname(os.path.abspath(__file__))

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

NAV_WITH_PREV = '''
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

def update_episode(ep_num, nav_html):
    html_path = os.path.join(base, 'episode{}.html'.format(ep_num))
    body_path = os.path.join(base, 'ep{}_body.txt'.format(ep_num))
    with open(body_path, 'r', encoding='utf-8') as f:
        body = f.read().rstrip()
    nav = nav_html
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()
    # Replace content between <article class="episode-text"> and </article>
    # Keep the nav at the end for ep1, ep2. For ep3 we add nav.
    pattern = r'(<article class="episode-text">)\s*\n(.*?)\n(\s*</article>)'
    matcher = re.compile(pattern, re.DOTALL)
    def repl(m):
        return m.group(1) + '\n' + body + '\n' + nav + '\n' + m.group(3)
    new_html = matcher.sub(repl, html)
    if new_html == html:
        # Maybe no nav in article (ep3) - try without requiring nav inside
        pattern2 = r'(<article class="episode-text">)\s*\n(.*?)(\n\s*</article>)'
        matcher2 = re.compile(pattern2, re.DOTALL)
        def repl2(m):
            return m.group(1) + '\n' + body + '\n' + nav + m.group(3)
        new_html = matcher2.sub(repl2, html)
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(new_html)
    print('Updated episode{}.html'.format(ep_num))

if __name__ == '__main__':
    update_episode(1, NAV_EP1)
    update_episode(2, NAV_WITH_PREV.format(prev='episode1.html', next='episode3.html'))
    update_episode(3, NAV_WITH_PREV.format(prev='episode2.html', next='episode4.html'))
