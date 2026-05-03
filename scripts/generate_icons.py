#!/usr/bin/env python3
"""
Generate PWA icons: icon-192.png and icon-512.png
Navy rounded-square background with a bold white Μ and blue accent dot.

Run from the project root:
  pip install Pillow
  python scripts/generate_icons.py
"""

from PIL import Image, ImageDraw, ImageFont
import os
import sys

NAVY  = (26, 58, 107)
BLUE  = (61, 127, 204)
WHITE = (255, 255, 255)

SIZES = [192, 512]
OUT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def make_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded square background
    radius = size // 5
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=NAVY)

    # Blue accent bar at bottom
    bar_h = size // 10
    draw.rounded_rectangle(
        [size // 8, size - bar_h - size // 10, size * 7 // 8, size - size // 10],
        radius=bar_h // 2,
        fill=BLUE,
    )

    # Letter Μ — try to load a system font, fall back to default
    letter = 'Μ'
    font_size = int(size * 0.55)
    font = None

    font_candidates = [
        '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
        '/System/Library/Fonts/Helvetica.ttc',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    ]

    for path in font_candidates:
        if os.path.exists(path):
            try:
                font = ImageFont.truetype(path, font_size)
                break
            except Exception:
                continue

    if font is None:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), letter, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (size - text_w) // 2 - bbox[0]
    y = (size - text_h) // 2 - bbox[1] - size // 16

    draw.text((x, y), letter, font=font, fill=WHITE)

    out_path = os.path.join(OUT_DIR, f'icon-{size}.png')
    img.save(out_path, 'PNG')
    print(f'wrote: {out_path}')


if __name__ == '__main__':
    for s in SIZES:
        make_icon(s)
    print('Done.')
