#!/usr/bin/env python3
"""tools/build-og.py — X / LINE / Facebook に貼られたときのカード画像を作る（提案 5 / Phase 5）

    python3 tools/build-og.py            # 入力が新しいものだけ作り直す
    python3 tools/build-og.py --force    # 全部作り直す
    python3 tools/build-og.py --check    # 作り直しが要るかだけ見る（要るなら exit 2）

入力: assets/images/shirasagi/photos*.json（三十六景 35景 × JA/EN/HK）
      data/recent-photos.json（断章）
出力: assets/og/cards/{id}.jpg（1200×630・JPEG）
      三十六景: shirasagi-13.jpg / shirasagi-13-en.jpg / shirasagi-13-hk.jpg
      断章:     fragment-{slug}.jpg
写真主体のカードなので PNG ではなく JPEG（品質 82）。PNG だと 1 枚 800KB を超え、
リポジトリが 100MB 単位で膨らむため。

見た目: 写真を全面に敷き、下 1/3 に暗いグラデーション。左下に種別（第十三景 / 断章）と題、
右下に「白鷺三十六景 · tojimasaya.com」。写真が主役になるようにしている。

フォントはシステムの Noto Serif CJK JP を使う（リポジトリに同梱しない）。
Ubuntu なら `sudo apt-get install -y fonts-noto-cjk`、Pillow は `pip install pillow`。
生成物は手で編集しない。
"""
import json
import os
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "assets/og/cards"
W, H = 1200, 630
MARGIN = 64

FONT_CANDIDATES = [
    ("/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc", 0),
    ("/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc", 0),
    ("/System/Library/Fonts/ヒラギノ明朝 ProN.ttc", 0),
    ("/usr/share/fonts/truetype/noto/NotoSerifCJK-Bold.ttc", 0),
]

FORCE = "--force" in sys.argv
CHECK_ONLY = "--check" in sys.argv

KANJI = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"]


def kanji_number(n: int) -> str:
    n = int(n)
    tens, ones = divmod(n, 10)
    head = "十" if tens == 1 else (KANJI[tens] + "十" if tens > 1 else "")
    return head + KANJI[ones]


def load_font(size: int) -> ImageFont.FreeTypeFont:
    for path, index in FONT_CANDIDATES:
        if os.path.exists(path):
            return ImageFont.truetype(path, size, index=index)
    raise SystemExit(
        "日本語のフォントが見つかりません。Ubuntu なら `sudo apt-get install -y fonts-noto-cjk` を実行してください。"
    )


def text_width(draw: ImageDraw.ImageDraw, text: str, font) -> int:
    return int(draw.textlength(text, font=font))


def wrap(draw, text: str, font, max_width: int, max_lines: int) -> list[str]:
    """日本語は 1 文字ずつ、空白のある言語は単語ごとに折り返す。溢れたら … で止める。"""
    text = " ".join(str(text or "").split())
    if not text:
        return []
    use_words = " " in text and text.count(" ") >= max(1, len(text) // 12)
    units = text.split(" ") if use_words else list(text)
    joiner = " " if use_words else ""
    lines, current = [], ""
    for unit in units:
        candidate = (current + joiner + unit).strip() if current else unit
        if text_width(draw, candidate, font) <= max_width or not current:
            current = candidate
            continue
        lines.append(current)
        current = unit
        if len(lines) == max_lines:
            break
    if current and len(lines) < max_lines:
        lines.append(current)
    if len(lines) == max_lines:
        rest_index = sum(len(l) + (1 if use_words else 0) for l in lines)
        if rest_index < len(text):
            last = lines[-1]
            while last and text_width(draw, last + "…", font) > max_width:
                last = last[:-1]
            lines[-1] = last + "…"
    return lines


def cover(image: Image.Image, width: int, height: int) -> Image.Image:
    src_ratio = image.width / image.height
    dst_ratio = width / height
    if src_ratio > dst_ratio:
        new_h = height
        new_w = int(round(height * src_ratio))
    else:
        new_w = width
        new_h = int(round(width / src_ratio))
    resized = image.resize((new_w, new_h), Image.LANCZOS)
    left = (new_w - width) // 2
    top = int((new_h - height) * 0.42)  # 少し上寄りに切る（空より被写体を残す）
    return resized.crop((left, top, left + width, top + height))


def gradient_overlay() -> Image.Image:
    overlay = Image.new("L", (1, H), 0)
    for y in range(H):
        t = y / (H - 1)
        if t < 0.34:
            value = int(22 * (t / 0.34))          # 上はごく薄く
        else:
            u = (t - 0.34) / 0.66
            value = int(22 + (243 - 22) * (u ** 1.45))
        overlay.putpixel((0, y), value)
    return overlay.resize((W, H))


def draw_card(photo_path: Path, eyebrow: str, title: str, footer: str, out_path: Path) -> None:
    with Image.open(photo_path) as src:
        photo = cover(src.convert("RGB"), W, H)

    shade = Image.new("RGB", (W, H), (12, 12, 14))
    card = Image.composite(shade, photo, gradient_overlay())
    draw = ImageDraw.Draw(card)

    f_eyebrow = load_font(28)
    f_title = load_font(54)
    f_footer = load_font(24)

    max_text_width = W - MARGIN * 2
    lines = wrap(draw, title, f_title, max_text_width, 2)

    footer_h = 30
    line_h = 74
    block_h = 44 + line_h * len(lines)
    baseline = H - MARGIN - footer_h - block_h

    x = MARGIN
    y = baseline
    draw.text((x, y), eyebrow, font=f_eyebrow, fill=(255, 255, 255, 235))
    y += 46
    for line in lines:
        draw.text((x, y), line, font=f_title, fill=(255, 255, 255))
        y += line_h

    fw = text_width(draw, footer, f_footer)
    draw.text((W - MARGIN - fw, H - MARGIN - footer_h), footer, font=f_footer, fill=(236, 236, 236))

    # 左下の細い罫（サイトの雰囲気に合わせた小さな印）
    draw.rectangle([MARGIN, baseline - 20, MARGIN + 48, baseline - 17], fill=(222, 176, 112))

    out_path.parent.mkdir(parents=True, exist_ok=True)
    card.save(out_path, "JPEG", quality=82, optimize=True, progressive=True, subsampling=2)


def newer(sources: list[Path], target: Path) -> bool:
    if FORCE or not target.exists():
        return True
    t = target.stat().st_mtime
    return any(s.exists() and s.stat().st_mtime > t for s in sources)


def main() -> None:
    script = Path(__file__)
    jobs = []

    # 三十六景
    ja = json.loads((ROOT / "assets/images/shirasagi/photos.json").read_text("utf-8"))
    langs = {
        "": (ja, "白鷺三十六景 · tojimasaya.com"),
        "-en": (json.loads((ROOT / "assets/images/shirasagi/photos-en.json").read_text("utf-8")), "36 Views of the White Heron · tojimasaya.com"),
        "-hk": (json.loads((ROOT / "assets/images/shirasagi/photos-hk.json").read_text("utf-8")), "白鷺三十六景 · tojimasaya.com"),
    }
    for key in sorted(ja.keys(), key=lambda k: int(k)):
        n = int(key)
        nn = f"{n:02d}"
        photo = ROOT / f"assets/images/shirasagi/webp/full/{nn}.webp"
        if not photo.exists():
            photo = ROOT / f"assets/images/shirasagi/{nn}.jpg"
        for suffix, (data, footer) in langs.items():
            item = data.get(key) or ja[key]
            title = item.get("title") or ja[key].get("title") or ""
            eyebrow = f"第{kanji_number(n)}景" if suffix != "-en" else f"View No. {n}"
            jobs.append({
                "photo": photo,
                "eyebrow": eyebrow,
                "title": title,
                "footer": footer,
                "out": OUT_DIR / f"shirasagi-{nn}{suffix}.jpg",
                "sources": [photo, ROOT / "assets/images/shirasagi/photos.json", script],
            })

    # 断章
    fragments = json.loads((ROOT / "data/recent-photos.json").read_text("utf-8"))
    for item in fragments:
        slug = item.get("slug")
        if not slug or not item.get("image"):
            continue
        photo = ROOT / (item.get("imageWebp") or item["image"])
        if not photo.exists():
            photo = ROOT / item["image"]
        date = item.get("date") or ""
        jobs.append({
            "photo": photo,
            "eyebrow": f"断章　{date}" if date else "断章",
            "title": item.get("title") or "",
            "footer": "tojimasaya.com",
            "out": OUT_DIR / f"fragment-{slug}.jpg",
            "sources": [photo, ROOT / "data/recent-photos.json", script],
        })

    todo = [j for j in jobs if newer(j["sources"], j["out"])]
    if not CHECK_ONLY:
        for job in todo:
            draw_card(job["photo"], job["eyebrow"], job["title"], job["footer"], job["out"])

    total_bytes = sum(p.stat().st_size for p in OUT_DIR.glob("*.jpg")) if OUT_DIR.exists() else 0
    print(f"{'[check] ' if CHECK_ONLY else ''}OG カード: 全 {len(jobs)} 枚")
    print(f"{'作り直しが要るもの' if CHECK_ONLY else '作り直したもの'}: {len(todo)}")
    for job in todo[:12]:
        print("  - " + str(job["out"].relative_to(ROOT)))
    if len(todo) > 12:
        print(f"  … ほか {len(todo) - 12} 枚")
    print(f"assets/og/cards の合計: {total_bytes / 1024 / 1024:.1f} MB")
    if CHECK_ONLY and todo:
        sys.exit(2)


if __name__ == "__main__":
    main()
