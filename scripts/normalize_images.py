#!/usr/bin/env python3
from __future__ import annotations
"""
Normalize image backgrounds to pure white.

Uses a flood fill from the four corners to identify background pixels (those
connected to the edges and within `tolerance` of white), then sets them to
pure white (#ffffff). Interior details — shadows, light washes, brush strokes
— are preserved because they are not reachable from the corners without
crossing illustration linework.

Usage:
  .venv/bin/python scripts/normalize_images.py                    # all images
  .venv/bin/python scripts/normalize_images.py -c fruits          # one category
  .venv/bin/python scripts/normalize_images.py -w apple watermelon
  .venv/bin/python scripts/normalize_images.py --tolerance 40     # looser threshold
  .venv/bin/python scripts/normalize_images.py --dry-run          # preview, no writes

Requires: Pillow, numpy  (both in requirements.txt)
"""

import argparse
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT   = Path(__file__).parent.parent
IMAGES = ROOT / 'images'

WHITE = np.array([255, 255, 255], dtype=np.float32)


def flood_fill_background(arr: np.ndarray, tolerance: float) -> np.ndarray:
    """Return boolean mask of background pixels reachable from any corner."""
    h, w = arr.shape[:2]
    dist = np.sqrt(np.sum((arr.astype(np.float32) - WHITE) ** 2, axis=2))

    bg = np.zeros((h, w), dtype=bool)
    queue: deque = deque()

    for r, c in ((0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)):
        if dist[r, c] <= tolerance and not bg[r, c]:
            bg[r, c] = True
            queue.append((r, c))

    while queue:
        r, c = queue.popleft()
        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < h and 0 <= nc < w and not bg[nr, nc] and dist[nr, nc] <= tolerance:
                bg[nr, nc] = True
                queue.append((nr, nc))

    return bg


def normalize(path: Path, tolerance: float, dry_run: bool) -> tuple[int, int]:
    """
    Normalize one image. Returns (pixels_changed, total_bg_pixels).
    Saves in-place unless dry_run is True.
    """
    img = Image.open(path).convert('RGB')
    arr = np.array(img)

    bg = flood_fill_background(arr, tolerance)
    total_bg = int(bg.sum())

    non_white_bg = bg & np.any(arr != 255, axis=2)
    changed = int(non_white_bg.sum())

    if changed > 0 and not dry_run:
        arr[bg] = 255
        Image.fromarray(arr).save(path)

    return changed, total_bg


def collect_paths(category: str | None, words: list[str] | None) -> list[Path]:
    paths = []
    for p in sorted(IMAGES.rglob('*.png')):
        if category and p.parent.name != category:
            continue
        if words and p.stem not in [w.lower().replace(' ', '_') for w in words]:
            continue
        paths.append(p)
    return paths


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('-c', '--category', help='Only process images in this category folder')
    parser.add_argument('-w', '--word', nargs='+', help='Only process these words (matches filename stem)')
    parser.add_argument('-t', '--tolerance', type=float, default=30,
                        help='Max distance from white to treat as background (default: 30)')
    parser.add_argument('--dry-run', action='store_true', help='Report changes without writing files')
    args = parser.parse_args()

    paths = collect_paths(args.category, args.word)
    if not paths:
        print('No images found matching the given filters.', file=sys.stderr)
        sys.exit(1)

    total_changed = 0
    total_skipped = 0
    total_failed  = 0

    for path in paths:
        rel = path.relative_to(ROOT)
        try:
            changed, bg_pixels = normalize(path, args.tolerance, args.dry_run)
            if changed:
                tag = '(dry run) ' if args.dry_run else ''
                print(f'  {tag}fixed  {rel}  — {changed:,} px normalised')
                total_changed += 1
            else:
                total_skipped += 1
        except Exception as e:
            print(f'  ERROR  {rel}  — {e}', file=sys.stderr)
            total_failed += 1

    action = 'Would fix' if args.dry_run else 'Fixed'
    print(f'\n{action}: {total_changed}  Already clean: {total_skipped}  Failed: {total_failed}')


if __name__ == '__main__':
    main()
