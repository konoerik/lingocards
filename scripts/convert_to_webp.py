#!/usr/bin/env python3
"""Convert PNG card images to WebP at 512px / quality 85, then delete originals."""

import argparse
import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow not found — run: .venv/bin/python3 -m pip install Pillow")

TARGET_SIZE = 512
QUALITY = 85
IMAGES_DIR = Path(__file__).parent.parent / "images"


def convert(dry_run: bool) -> None:
    pngs = sorted(IMAGES_DIR.rglob("*.png"))
    if not pngs:
        print("No PNG files found.")
        return

    ok = skipped = 0
    for src in pngs:
        dst = src.with_suffix(".webp")
        if dst.exists() and not dry_run:
            print(f"  skip (webp exists): {src.relative_to(IMAGES_DIR)}")
            skipped += 1
            continue

        if dry_run:
            print(f"  would convert: {src.relative_to(IMAGES_DIR)}")
            ok += 1
            continue

        with Image.open(src) as img:
            img = img.convert("RGBA")
            img = img.resize((TARGET_SIZE, TARGET_SIZE), Image.LANCZOS)
            img.save(dst, "WEBP", quality=QUALITY, method=6)

        src_kb = src.stat().st_size / 1024
        dst_kb = dst.stat().st_size / 1024
        print(f"  {src.relative_to(IMAGES_DIR)}  {src_kb:.0f}KB → {dst_kb:.0f}KB")
        src.unlink()
        ok += 1

    label = "would convert" if dry_run else "converted"
    print(f"\n{label}: {ok}  skipped: {skipped}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="List files without converting")
    args = parser.parse_args()
    convert(dry_run=args.dry_run)


if __name__ == "__main__":
    main()
