"""tools/blur-faces.py — 人の顔をぼかして、公開用の JPEG / WebP を書き出す。

  python3 tools/blur-faces.py <入力> <出力.jpg> [幅]

検出は macOS の Vision（追加のモデル不要・Mac でのみ動く）。EXIF は渡さないので
GPS も一緒に落ちる。仕上がりは必ず目で確かめること — 横顔や後ろ姿に紛れた顔は
取りこぼすことがある。

人混みの写真は顔が画面に対して小さく、全体を一度に渡すと Vision がほとんど拾わない
（4096px の一枚で 1〜4 箇所しか返ってこなかった）。そこで重なりを持たせた升目に切って
一枚ずつ調べる。さらに顔検出だけだと横顔・うつむきを落とすので、体の姿勢推定から
頭の位置も取って併せて潰す。向こうを向いている人まで潰れるが、それは構わない。
"""
import io
import sys
from pathlib import Path

import Quartz
import Vision
from Foundation import NSURL
from PIL import Image, ImageFilter, ImageOps

FACE_REVISIONS = (1, 2, 3)
TILE = 800          # 升目の一辺（元画像の画素）
STEP = 500          # 送り幅。TILE より小さくして重ねる
ZOOM = 2            # 検出前に升目を何倍に引き伸ばすか
HEAD_JOINTS = ("nose", "left_eye", "right_eye", "left_ear", "right_ear")


def _cg_from_pil(im):
    buf = io.BytesIO()
    im.save(buf, "PNG")
    data = Quartz.CFDataCreate(None, buf.getvalue(), len(buf.getvalue()))
    src = Quartz.CGImageSourceCreateWithData(data, None)
    return Quartz.CGImageSourceCreateImageAtIndex(src, 0, None)


def _run(cg, req):
    handler = Vision.VNImageRequestHandler.alloc().initWithCGImage_options_(cg, None)
    ok, _ = handler.performRequests_error_([req], None)
    return (req.results() or []) if ok else []


def _faces(cg, w, h):
    out = []
    for rev in FACE_REVISIONS:
        req = Vision.VNDetectFaceRectanglesRequest.alloc().init()
        req.setRevision_(rev)
        for obs in _run(cg, req):
            bb = obs.boundingBox()
            out.append((
                bb.origin.x * w,
                (1.0 - (bb.origin.y + bb.size.height)) * h,
                (bb.origin.x + bb.size.width) * w,
                (1.0 - bb.origin.y) * h,
            ))
    return out


def _heads(cg, w, h):
    """体の姿勢から頭の位置を取る。顔検出が落とす横顔・うつむきを拾うため。"""
    out = []
    req = Vision.VNDetectHumanBodyPoseRequest.alloc().init()
    for obs in _run(cg, req):
        pts, _ = obs.recognizedPointsForJointsGroupName_error_(
            Vision.VNHumanBodyPoseObservationJointsGroupNameFace, None)
        if not pts:
            continue
        xs, ys = [], []
        for key, p in pts.items():
            if p.confidence() < 0.25:
                continue
            loc = p.location()
            xs.append(loc.x * w)
            ys.append((1.0 - loc.y) * h)
        if not xs:
            continue
        cx, cy = sum(xs) / len(xs), sum(ys) / len(ys)
        spread = max(max(xs) - min(xs), max(ys) - min(ys))
        # 目と耳しか取れないと枠が小さくなりすぎるので、升目に対する下限を置く
        side = max(spread * 2.4, h * 0.05, 18)
        out.append((cx - side / 2, cy - side * 0.6, cx + side / 2, cy + side * 0.5))
    return out


def detect(path):
    im = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    W, H = im.size
    boxes = []
    for top in range(0, max(1, H - TILE + STEP), STEP):
        for left in range(0, max(1, W - TILE + STEP), STEP):
            r = (left, top, min(left + TILE, W), min(top + TILE, H))
            tile = im.crop(r)
            # Vision には検出できる顔の下限があるので、升目を引き伸ばしてから渡す
            up = tile.resize((tile.width * ZOOM, tile.height * ZOOM), Image.LANCZOS)
            cg = _cg_from_pil(up)
            for (x0, y0, x1, y1) in _faces(cg, up.width, up.height) + _heads(cg, up.width, up.height):
                boxes.append((x0 / ZOOM + r[0], y0 / ZOOM + r[1], x1 / ZOOM + r[0], y1 / ZOOM + r[1]))
    return merge(boxes), im


def merge(boxes, overlap_min=0.25):
    """重なった枠を一つにまとめる（升目が重なるぶん同じ頭が何度も出る）。"""
    out = []
    for b in sorted(boxes, key=lambda b: -((b[2] - b[0]) * (b[3] - b[1]))):
        hit = False
        for i, o in enumerate(out):
            ix = max(0, min(b[2], o[2]) - max(b[0], o[0]))
            iy = max(0, min(b[3], o[3]) - max(b[1], o[1]))
            inter = ix * iy
            if inter <= 0:
                continue
            small = min((b[2] - b[0]) * (b[3] - b[1]), (o[2] - o[0]) * (o[3] - o[1]))
            if inter / small > overlap_min:
                out[i] = (min(b[0], o[0]), min(b[1], o[1]), max(b[2], o[2]), max(b[3], o[3]))
                hit = True
                break
        if not hit:
            out.append(b)
    return out


def mosaic(im, box, pad=0.35, cell=12):
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    x0 = max(0, int(x0 - w * pad))
    y0 = max(0, int(y0 - h * pad * 1.2))   # 髪の生え際まで
    x1 = min(im.width, int(x1 + w * pad))
    y1 = min(im.height, int(y1 + h * pad * 0.8))
    if x1 - x0 < 4 or y1 - y0 < 4:
        return
    region = im.crop((x0, y0, x1, y1))
    small = region.resize((max(2, region.width // cell), max(2, region.height // cell)), Image.BILINEAR)
    region = small.resize(region.size, Image.NEAREST).filter(ImageFilter.GaussianBlur(2.0))
    im.paste(region, (x0, y0))


def main():
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    box_w = int(sys.argv[3]) if len(sys.argv) > 3 else 1600

    boxes, im = detect(src)
    scale = box_w / max(im.size)
    im.thumbnail((box_w, box_w), Image.LANCZOS)
    for b in boxes:
        mosaic(im, tuple(v * scale for v in b))

    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst, "JPEG", quality=86, optimize=True, progressive=True)  # exif は渡さない＝GPSも消える
    im.save(dst.with_suffix(".webp"), "WEBP", quality=82, method=6)
    print(f"{dst.name}: {im.width}x{im.height}  ぼかし {len(boxes)} 箇所")


if __name__ == "__main__":
    main()
