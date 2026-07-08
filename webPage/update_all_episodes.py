# -*- coding: utf-8 -*-
"""Convert Story/1AnesthesiaAwareness/*.md to episode HTML pages."""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from md2episode import md_to_episode_html

BASE = os.path.dirname(os.path.abspath(__file__))
STORY_DIR = os.path.join(BASE, '..', 'Story', '1AnesthesiaAwareness')

EPISODES = {
    1: {
        'en': 'Contact',
        'ja': '2072年のデジャブ',
        'desc': '退屈な日常の中、千花はスマートアイなしで町のユビキタスネットワークに触れ、神田響と出会う。',
    },
    2: {
        'en': 'Log',
        'ja': 'ログ',
        'desc': 'カイと綾との記憶、旧校舎のメモリー、そして黒塗りの報告書が千花の日常を揺らす。',
    },
    3: {
        'en': 'Boundary',
        'ja': 'メモリーのあと',
        'desc': '報告書の余韻と端末なし接続の残響が、千花と綾の日常へ静かに侵食していく。',
    },
    4: {
        'en': 'Cracking Sandbox',
        'ja': 'ひびく Sandbox',
        'desc': '過去の温かな箱庭と現在の監視線が重なり、坂下の交差点で日常が崩れ始める。',
    },
    5: {
        'en': 'Awakening',
        'ja': '覚悟',
        'desc': '十三課の襲撃、綾への危機、スサノオ隊の救出。千花は守られるだけでは済まない現実を知る。',
    },
    6: {
        'en': 'Departure',
        'ja': '旅立ち',
        'desc': '雷鳥に収容された千花は、体内にある未確定の接続核と瑠璃見を離れる痛みを抱えて夜空へ向かう。',
    },
    7: {
        'en': 'Boundary Noise',
        'ja': '境界のノイズ',
        'desc': 'クロノス・タワーの呼び声に引き戻される千花は、御厨玲奈の助言で「窓」を作る術を知る。',
    },
    8: {
        'en': 'Red Wing',
        'ja': '赤い翼のペンダント',
        'desc': '保護された綾は、翼のペンダントと荒木紘一の記憶を通じて、自分が千花の支えである意味を選ぶ。',
    },
    9: {
        'en': 'Black File',
        'ja': '黒いファイル',
        'desc': '旧郷土資料館で黒塗りの紙記録を発見し、千花はカイの声とクロノスを結ぶ線に触れる。',
    },
    10: {
        'en': 'Phase Two',
        'ja': 'フェーズ2',
        'desc': '霧崎譲が現れ、千花の社会復帰そのものが観察実験だったと告げる。町全体が試験場へ変わる。',
    },
    11: {
        'en': 'Araki Record',
        'ja': '荒木紘一の記録',
        'desc': '荒木の告発記録は、事故、救命、実験、そしてクロノスを止めるアナログハッチの存在を示す。',
    },
    12: {
        'en': 'Experiment Footage',
        'ja': '実験映像',
        'desc': '綾のペンダントに隠された映像から、千花は麻酔覚醒の恐怖と黒く伏せられた対話補助の存在を目撃する。',
    },
    13: {
        'en': 'Under the Gymnasium',
        'ja': '旧体育館の底',
        'desc': '旧体育館の床下に隠された同期観測線が、箱庭の記憶とクロノス・タワーを物理的につなげていた。',
    },
    14: {
        'en': 'Kai Lawrence',
        'ja': 'カイ・ローレンス',
        'desc': 'クロノスの縁で千花はカイと再会し、彼が作られた存在でありながら自ら空を望んだことを知る。',
    },
    15: {
        'en': 'The Whole Incident',
        'ja': '事件の全貌',
        'desc': '紺虹峠の事故と隠蔽の真相が明かされ、千花はカイを鎖にしないためクロノスを閉じる決断へ進む。',
    },
    16: {
        'en': 'Rurimi Uprising',
        'ja': '瑠璃見動乱',
        'desc': 'クロノス停止後も町の暴走は止まらず、千花は力を兵器ではなく避難誘導の道標として使い始める。',
    },
    17: {
        'en': 'Analog Hatch',
        'ja': 'アナログハッチの守人',
        'desc': '元ダム保守員・真壁宗一の紙地図と手動工具が、デジタルが嘘を吐く夜に住民の道を守る。',
    },
    18: {
        'en': 'Chronos Tower',
        'ja': 'クロノス・タワー',
        'desc': '湖底施設へ入った千花たちは美綴琴音と対峙し、町を救うため一時的な協力を選ぶ。',
    },
    19: {
        'en': 'White Sky',
        'ja': '白い空',
        'desc': '白いノイズの中で千花はカイと最後の選択を交わし、町を救うためIKAROS領域を切断する。',
    },
    20: {
        'en': 'Anesthesia Awareness',
        'ja': 'Anesthesia Awareness',
        'desc': '瑠璃見動乱の夜明け。政府の隠蔽と残された犠牲の中で、千花は自分の痛みで現実を歩き始める。',
    },
}

JAPANESE_ORDINAL = {
    1: '第一話',
    2: '第二話',
    3: '第三話',
    4: '第四話',
    5: '第五話',
    6: '第六話',
    7: '第七話',
    8: '第八話',
    9: '第九話',
    10: '第十話',
    11: '第十一話',
    12: '第十二話',
    13: '第十三話',
    14: '第十四話',
    15: '第十五話',
    16: '第十六話',
    17: '第十七話',
    18: '第十八話',
    19: '第十九話',
    20: '第二十話',
}

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
                    <p>第1章 完結</p>
                    <div class="episode-navigation">
                        <a href="{prev}" class="btn btn-outline">
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

def nav_for_episode(ep_num):
    max_ep = max(EPISODES)
    if ep_num == 1:
        return NAV_EP1
    if ep_num == max_ep:
        return NAV_LAST.format(prev='episode{}.html'.format(ep_num - 1))
    return NAV_MID.format(
        prev='episode{}.html'.format(ep_num - 1),
        next='episode{}.html'.format(ep_num + 1),
    )


def html_escape(text):
    return (
        text.replace('&', '&amp;')
        .replace('<', '&lt;')
        .replace('>', '&gt;')
        .replace('"', '&quot;')
    )


def convert_md(ep_num):
    md_path = os.path.join(STORY_DIR, '{}.md'.format(ep_num))
    body_path = os.path.join(BASE, 'ep{}_body.txt'.format(ep_num))
    html = md_to_episode_html(md_path)
    with open(body_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print('Wrote ep{}_body.txt'.format(ep_num))


def ensure_episode_html(ep_num):
    html_path = os.path.join(BASE, 'episode{}.html'.format(ep_num))
    if os.path.exists(html_path):
        return
    template_path = os.path.join(BASE, 'episode6.html')
    with open(template_path, 'r', encoding='utf-8') as f:
        html = f.read()
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print('Created episode{}.html from template'.format(ep_num))


def update_header(html, ep_num):
    meta = EPISODES[ep_num]
    ordinal = JAPANESE_ORDINAL[ep_num]
    html = re.sub(
        r'<title>.*?</title>',
        '<title>{} - 春風シンクレティック</title>'.format(ordinal),
        html,
        count=1,
    )
    html = re.sub(
        r'(<div class="episode-breadcrumb">.*?<i class="fas fa-chevron-right"></i>\s*)<span>.*?</span>',
        r'\1<span>{}</span>'.format(ordinal),
        html,
        count=1,
        flags=re.DOTALL,
    )
    html = re.sub(
        r'<h1>#\d+ .*?</h1>\s*<p class="episode-subtitle">.*?</p>',
        '<h1>#{} {}</h1>\n                <p class="episode-subtitle">{}</p>'.format(
            ep_num, html_escape(meta['en']), html_escape(meta['ja'])
        ),
        html,
        count=1,
        flags=re.DOTALL,
    )
    return html


def update_html(ep_num):
    ensure_episode_html(ep_num)
    html_path = os.path.join(BASE, 'episode{}.html'.format(ep_num))
    body_path = os.path.join(BASE, 'ep{}_body.txt'.format(ep_num))
    with open(body_path, 'r', encoding='utf-8') as f:
        body = f.read().rstrip()
    nav = nav_for_episode(ep_num)
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()
    html = update_header(html, ep_num)
    pattern = r'(<article class="episode-text">)\s*\n(.*?)(\n\s*</article>)'
    matcher = re.compile(pattern, re.DOTALL)

    def repl(m):
        return m.group(1) + '\n' + body + '\n' + nav + m.group(3)

    new_html = matcher.sub(repl, html, count=1)
    if new_html == html:
        raise RuntimeError('Failed to update article in episode{}.html'.format(ep_num))
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(new_html)
    print('Updated episode{}.html'.format(ep_num))


def render_episode_card(ep_num):
    meta = EPISODES[ep_num]
    en = html_escape(meta['en'])
    desc = html_escape(meta['desc'])
    return '''                <div class="episode-card">
                    <div class="episode-header">
                        <div class="episode-number">#{num}</div>
                        <h3 class="decrypted-text" data-text="{en}">{en}</h3>
                    </div>
                    <div class="episode-content">
                        <p class="episode-description decrypted-text" data-text="{desc}">{desc}</p>
                        <div class="episode-meta">
                            <span class="episode-status available decrypted-text" data-text="公開中">公開中</span>
                            <span class="episode-date decrypted-text" data-text="2026.06.28">2026.06.28</span>
                        </div>
                        <a href="episode{num}.html" class="btn btn-primary">
                            <span class="decrypted-text" data-text="読む">読む</span> <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>'''.format(num=ep_num, en=en, desc=desc)


def update_story_listing():
    story_path = os.path.join(BASE, 'story.html')
    with open(story_path, 'r', encoding='utf-8') as f:
        html = f.read()
    cards = '\n\n'.join(render_episode_card(n) for n in sorted(EPISODES))
    start_marker = '            <div class="episodes-grid">'
    end_marker = '    <!-- Access Denied Overlay -->'
    start = html.find(start_marker)
    end = html.find(end_marker)
    if start == -1 or end == -1 or end <= start:
        raise RuntimeError('Failed to locate story.html episode grid')
    prefix = html[:start]
    suffix = html[end:]
    grid = (
        start_marker
        + '\n'
        + cards
        + '\n'
        + '            </div>\n'
        + '        </div>\n'
        + '    </section>\n\n'
    )
    new_html = prefix + grid + suffix
    with open(story_path, 'w', encoding='utf-8') as f:
        f.write(new_html)
    print('Updated story.html episode listing')


if __name__ == '__main__':
    for n in sorted(EPISODES):
        convert_md(n)
    for n in sorted(EPISODES):
        update_html(n)
    update_story_listing()
    print('Done.')
