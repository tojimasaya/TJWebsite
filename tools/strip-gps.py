#!/usr/bin/env python3
"""公開画像から位置情報(GPS)を取り除く。

方針（2026-09-04 に全画像を一括処理して確立）:
  assets/images/photo-notes/ … EXIF(APP1)を丸ごと削除。
                               日々の断章はスナップなのでカメラ情報を残す意味が薄い。
  それ以外                   … GPS IFD(0x8825)だけを削除し、
                               カメラ/レンズ/絞り/撮影日時は作品情報として温存する。

いずれも JPEG のマーカー構造だけを書き換える。圧縮データ(DCT)には一切触れないので
再エンコードによる劣化は起きず、ICC プロファイル(APP2)もそのまま残る。
安全のため、書き戻す前に必ず画素の MD5 が一致することを検証している。

WebP / PNG は劣化なしにメタデータだけ落とす手段がないため、検出したら報告のみ行う
（ワークフローの cwebp は既定でメタデータを写さないので、通常ここには来ない）。

使い方:
  python3 tools/strip-gps.py             # assets/images 以下をすべて処理
  python3 tools/strip-gps.py --check     # 変更せず、GPS付きがあれば終了コード 1
  python3 tools/strip-gps.py path ...    # 対象を明示（ディレクトリ/ファイル）
"""

import hashlib
import io
import os
import sys

from PIL import Image

GPS_IFD = 0x8825
JPEG_EXT = (".jpg", ".jpeg")
OTHER_EXT = (".webp", ".png")


def rewrite_app1(data, drop_all_exif, new_exif=None):
    """Exif と XMP の APP1 セグメントだけ差し替える。他のマーカーはバイト列のまま通す。"""
    if data[:2] != b"\xff\xd8":
        raise ValueError("not a JPEG")
    out = bytearray(data[:2])
    i = 2
    while i < len(data) - 1:
        if data[i] != 0xFF:
            out += data[i:]
            break
        marker = data[i + 1]
        if marker in (0xD8, 0x01) or 0xD0 <= marker <= 0xD7:
            out += data[i : i + 2]
            i += 2
            continue
        if marker == 0xDA:  # SOS 以降は圧縮データなのでそのまま
            out += data[i:]
            break
        seglen = int.from_bytes(data[i + 2 : i + 4], "big")
        seg = data[i + 4 : i + 2 + seglen]
        is_exif = marker == 0xE1 and seg[:6] == b"Exif\x00\x00"
        is_xmp = marker == 0xE1 and seg[:29] == b"http://ns.adobe.com/xap/1.0/\x00"
        if is_exif:
            if not drop_all_exif and new_exif:
                payload = b"Exif\x00\x00" + new_exif
                out += b"\xff\xe1" + (len(payload) + 2).to_bytes(2, "big") + payload
            # drop_all_exif のときはセグメントごと捨てる
        elif is_xmp:
            pass  # XMP にも位置が入りうるので常に削除
        else:
            out += data[i : i + 2 + seglen]
        i += 2 + seglen
    return bytes(out)


def pixels_md5(blob):
    im = Image.open(io.BytesIO(blob))
    im.load()
    return hashlib.md5(im.tobytes()).hexdigest()


def collect(paths):
    files = []
    for p in paths:
        if os.path.isfile(p):
            files.append(p)
            continue
        for dirpath, _, names in os.walk(p):
            for n in sorted(names):
                files.append(os.path.join(dirpath, n))
    return files


def has_gps(path):
    try:
        return bool(Image.open(path).getexif().get(GPS_IFD))
    except Exception:
        return False


def main(argv):
    check_only = "--check" in argv
    targets = [a for a in argv if not a.startswith("-")] or ["assets/images"]

    jpegs, others, fixed, skipped, saved = [], [], [], [], 0
    for f in collect(targets):
        low = f.lower()
        if low.endswith(JPEG_EXT):
            jpegs.append(f)
        elif low.endswith(OTHER_EXT) and has_gps(f):
            others.append(f)

    for path in jpegs:
        try:
            exif = Image.open(path).getexif()
        except Exception:
            continue
        in_notes = os.path.basename(os.path.dirname(path)) == "photo-notes"
        drop_all = in_notes and len(exif) > 0
        if not drop_all and not exif.get(GPS_IFD):
            continue  # 何もすることがない

        if check_only:
            fixed.append((path, "EXIF全削除" if drop_all else "GPS削除"))
            continue

        original = open(path, "rb").read()
        new_exif = None
        if not drop_all:
            del exif[GPS_IFD]
            new_exif = exif.tobytes()
        try:
            rewritten = rewrite_app1(original, drop_all, new_exif)
        except Exception as e:
            skipped.append((path, str(e)))
            continue

        before, after = Image.open(io.BytesIO(original)), Image.open(io.BytesIO(rewritten))
        same_pixels = pixels_md5(original) == pixels_md5(rewritten)
        gps_gone = not after.getexif().get(GPS_IFD)
        icc_kept = bool(before.info.get("icc_profile")) == bool(after.info.get("icc_profile"))
        if same_pixels and gps_gone and icc_kept:
            with open(path, "wb") as fh:
                fh.write(rewritten)
            fixed.append((path, "EXIF全削除" if drop_all else "GPS削除"))
            saved += len(original) - len(rewritten)
        else:
            skipped.append(
                (path, f"画素一致={same_pixels} GPS除去={gps_gone} ICC保持={icc_kept}")
            )

    verb = "検出" if check_only else "処理"
    for path, how in fixed:
        print(f"  {verb}: {path}  ({how})")
    for path, why in skipped:
        print(f"  ✗ 見送り: {path}  {why}")
    for path in others:
        print(f"  ⚠ 手当て必要: {path}  WebP/PNG は劣化なしに落とせないため元画像から作り直すこと")

    print(f"JPEG {len(jpegs)} 枚を確認 → {verb} {len(fixed)} 枚 / 見送り {len(skipped)} 枚", end="")
    print(f" / 削減 {saved / 1024:.0f} KB" if saved else "")

    if check_only and (fixed or others):
        return 1
    return 1 if (skipped or others) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
