#!/usr/bin/env python3
"""DROMI用シーン背景テンプレート（PNG）を生成する。"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
TEMPLATES = ROOT / "templates"
SHOTS = ROOT / "shots" / "Part1_Trailer_Serious"

# 16:9 — DROMIの「16:9」新規作成に合わせる
W, H = 1920, 1080
DRAW_BOTTOM = 820  # 描画エリア下辺
MARGIN = 48

COLORS = {
    "bg": (22, 22, 26),
    "panel": (30, 30, 36),
    "line": (72, 72, 82),
    "label": (120, 120, 132),
    "text": (210, 210, 218),
    "accent": (140, 90, 90),
}


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/meiryob.ttc" if bold else "C:/Windows/Fonts/meiryo.ttc",
        "C:/Windows/Fonts/YuGothB.ttc" if bold else "C:/Windows/Fonts/YuGothM.ttc",
        "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc",
    ]
    for path in candidates:
        p = Path(path)
        if p.exists():
            try:
                return ImageFont.truetype(str(p), size=size)
            except OSError:
                continue
    return ImageFont.load_default()


def draw_base_frame(draw: ImageDraw.ImageDraw, title: str | None = None) -> None:
    draw.rectangle((0, 0, W, H), fill=COLORS["bg"])
    draw.rectangle(
        (MARGIN, MARGIN, W - MARGIN, DRAW_BOTTOM),
        outline=COLORS["line"],
        width=2,
    )
    draw.line((MARGIN, DRAW_BOTTOM, W - MARGIN, DRAW_BOTTOM), fill=COLORS["line"], width=2)
    draw.rectangle((0, DRAW_BOTTOM, W, H), fill=COLORS["panel"])

    font_label = load_font(22)
    font_hint = load_font(18)
    y = DRAW_BOTTOM + 20
    for label in ("CUT", "TIME", "画面", "台詞 / SE", "演出"):
        draw.text((MARGIN, y), label, fill=COLORS["label"], font=font_label)
        y += 36 if label in ("CUT", "TIME") else 52

    if title:
        draw.text((MARGIN, 12), title, fill=COLORS["accent"], font=load_font(20, bold=True))

    draw.text(
        (MARGIN, DRAW_BOTTOM - 36),
        "← この枠内に絵コンテを描く（DROMIでは上のレイヤーで描画）",
        fill=COLORS["label"],
        font=font_hint,
    )


def wrap_text(text: str, max_chars: int) -> list[str]:
    lines: list[str] = []
    for paragraph in text.replace("\r", "").split("\n"):
        p = paragraph.strip()
        if not p:
            continue
        while len(p) > max_chars:
            lines.append(p[:max_chars])
            p = p[max_chars:]
        lines.append(p)
    return lines or [""]


def draw_shot_card(shot: dict) -> Image.Image:
    img = Image.new("RGB", (W, H), COLORS["bg"])
    draw = ImageDraw.Draw(img)
    draw_base_frame(draw, title=shot.get("project", ""))

    font_b = load_font(26, bold=True)
    font = load_font(22)
    font_s = load_font(20)

    cut = shot["id"]
    time_code = shot["time"]
    duration = shot.get("duration_sec", 3)

    draw.text((MARGIN + 70, DRAW_BOTTOM + 20), cut, fill=COLORS["text"], font=font_b)
    draw.text(
        (MARGIN + 200, DRAW_BOTTOM + 20),
        f"{time_code}  （{duration}秒）",
        fill=COLORS["text"],
        font=font,
    )

    fields = [
        ("画面", shot.get("visual", ""), DRAW_BOTTOM + 92, 38),
        ("台詞", shot.get("dialogue", ""), DRAW_BOTTOM + 200, 34),
        ("演出", shot.get("direction", ""), DRAW_BOTTOM + 300, 34),
    ]
    x_body = MARGIN + 8
    for _, body, y0, max_chars in fields:
        for i, line in enumerate(wrap_text(body, max_chars)):
            draw.text((x_body, y0 + i * 28), line, fill=COLORS["text"], font=font_s)

    return img


def make_blank_template(name: str, subtitle: str) -> None:
    img = Image.new("RGB", (W, H), COLORS["bg"])
    draw = ImageDraw.Draw(img)
    draw_base_frame(draw, title=subtitle)
    TEMPLATES.mkdir(parents=True, exist_ok=True)
    img.save(TEMPLATES / name)


def load_shots() -> list[dict]:
    data_path = ROOT / "part1_trailer_serious_shots.json"
    with data_path.open(encoding="utf-8") as f:
        return json.load(f)["shots"]


def main() -> None:
    make_blank_template("scene_blank_16x9.png", "Echoes — DROMI 空白テンプレート")
    make_blank_template("scene_blank_16x9_no_hint.png", "")

    shots = load_shots()
    SHOTS.mkdir(parents=True, exist_ok=True)
    for shot in shots:
        img = draw_shot_card(shot)
        out = SHOTS / f"{shot['id']}.png"
        img.save(out)
        print(f" wrote {out.relative_to(ROOT)}")

    print(f"\nDone: {len(shots)} shot cards + 2 blank templates")


if __name__ == "__main__":
    main()
