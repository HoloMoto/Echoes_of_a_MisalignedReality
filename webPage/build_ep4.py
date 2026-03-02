# -*- coding: utf-8 -*-
import os
base = os.path.dirname(os.path.abspath(__file__))
head = '''<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>第四話 - 春風シンクレティック</title>
    <link rel="stylesheet" href="styles/main.css">
    <link rel="stylesheet" href="styles/episode.css">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <header class="header">
        <nav class="navbar">
            <div class="nav-container">
                <div class="nav-logo">
                    <a href="index.html">
                        <span class="logo-text">春風シンクレティック</span>
                        <span class="logo-subtitle">HARUKAZE SYNCRETECH</span>
                    </a>
                </div>
                <ul class="nav-menu">
                    <li class="nav-item"><a href="index.html" class="nav-link">ホーム</a></li>
                    <li class="nav-item"><a href="story.html" class="nav-link">ストーリー</a></li>
                    <li class="nav-item"><a href="characters.html" class="nav-link">キャラクター</a></li>
                    <li class="nav-item"><a href="world.html" class="nav-link">世界観</a></li>
                </ul>
                <div class="hamburger"><span class="bar"></span><span class="bar"></span><span class="bar"></span></div>
            </div>
        </nav>
    </header>
    <section class="episode-header">
        <div class="container">
            <div class="episode-title">
                <div class="episode-breadcrumb">
                    <a href="story.html">ストーリー</a>
                    <i class="fas fa-chevron-right"></i>
                    <span>第四話</span>
                </div>
                <h1>#4 Crumbling Sandbox</h1>
                <p class="episode-subtitle">崩れゆく砂箱</p>
            </div>
        </div>
    </section>
    <section class="episode-content">
        <div class="container">
            <article class="episode-text">
'''
foot = '''
            </article>
        </div>
    </section>
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>春風シンクレティック</h3>
                    <p>2073年、高度AIが支配する世界で、一人の少女が運命と向き合う物語</p>
                </div>
                <div class="footer-section">
                    <h4>サイトマップ</h4>
                    <ul>
                        <li><a href="index.html">ホーム</a></li>
                        <li><a href="story.html">ストーリー</a></li>
                        <li><a href="characters.html">キャラクター</a></li>
                        <li><a href="world.html">世界観</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>お問い合わせ</h4>
                    <p>公式サイトに関するお問い合わせはこちらまで</p>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2025 春風シンクレティック. All rights reserved.</p>
            </div>
        </div>
    </footer>
    <script src="scripts/main.js"></script>
</body>
</html>
'''
with open(os.path.join(base, 'ep4_body.txt'), 'r', encoding='utf-8') as f:
    body = f.read()
with open(os.path.join(base, 'episode4.html'), 'w', encoding='utf-8') as f:
    f.write(head + body + foot)
print('episode4.html written.')
