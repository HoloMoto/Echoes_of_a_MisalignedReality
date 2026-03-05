# -*- coding: utf-8 -*-
import re
import sys

def md_to_episode_html(path):
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    out = []
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.rstrip()
        # Skip episode title line and pure separators
        if stripped == '' or stripped == '---' or stripped.startswith('ーーー') or (stripped.startswith('Episode ') and ':' in stripped):
            i += 1
            continue
        if stripped.startswith('## '):
            title = stripped[3:].strip()
            out.append('<div class="chapter-break">\n<h2>{}</h2>\n</div>\n\n'.format(title))
            i += 1
            continue
        # Single # chapter title (e.g. "# 3章　メモリーのあと")
        if stripped.startswith('# ') and not stripped.startswith('## '):
            title = stripped[2:].strip()
            out.append('<div class="chapter-break">\n<h2>{}</h2>\n</div>\n\n'.format(title))
            i += 1
            continue
        # Date-only line like "2072年5月　ゴールデンウィーク" as small header or paragraph
        if re.match(r'^\d{4}年', stripped) and ' ' in stripped:
            out.append('<p class="chapter-date">{}</p>\n\n'.format(stripped))
            i += 1
            continue
        # Collect paragraph lines
        para_lines = []
        while i < len(lines):
            l = lines[i]
            s = l.rstrip()
            if s == '' or s == '---' or s.startswith('ーーー'):
                break
            if s.startswith('## ') or (s.startswith('# ') and not s.startswith('## ')):
                break
            if re.match(r'^\d{4}年', s) and ' ' in s and not para_lines:
                break
            para_lines.append(s)
            i += 1
        if para_lines:
            html_para = ('<br>\n                '.join(para_lines))
            out.append('                <p>{}</p>\n\n'.format(html_para))
        if i < len(lines) and (lines[i].strip() == '' or lines[i].strip().startswith('ー')):
            i += 1
    return ''.join(out)

if __name__ == '__main__':
    path = sys.argv[1] if len(sys.argv) > 1 else 'Story/1AnesthesiaAwareness/4.md'
    out_path = sys.argv[2] if len(sys.argv) > 2 else 'webPage/ep4_body.txt'
    html = md_to_episode_html(path)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(html)
