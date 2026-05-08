#!/usr/bin/env python3
"""
Generate flashcard illustrations via OpenRouter or OpenAI.

Images are fetched as PNG from the API, then immediately resized to 512px and
saved as WebP quality 85. The deck JSON is updated with the .webp path.

Usage:
  .venv/bin/python scripts/generate_images.py
  .venv/bin/python scripts/generate_images.py --category fruits
  .venv/bin/python scripts/generate_images.py --category animals --subcategory farm
  .venv/bin/python scripts/generate_images.py --model dall-e-3
  .venv/bin/python scripts/generate_images.py --model dall-e-3 --quality hd

Requires OPENROUTER_API_KEY or OPENAI_API_KEY in .env or environment.
Safe to re-run — skips cards that already have image files on disk.
Updates data/decks/<lang>.json with image paths after generation.
"""

import argparse
import base64
import io
import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

try:
    from PIL import Image as PilImage
except ImportError:
    sys.exit("Pillow not found — run: .venv/bin/python3 -m pip install Pillow")

ROOT = Path(__file__).parent.parent
MANIFEST_FILE = ROOT / 'data' / 'manifest.json'
DECKS_DIR = ROOT / 'data' / 'decks'

DEFAULT_MODEL = 'gpt-image-1'
OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
OPENAI_URL     = 'https://api.openai.com/v1/images/generations'
OPENAI_MODELS  = {'gpt-image-1', 'dall-e-3', 'dall-e-2'}

# Categories that don't need generated images (handled by CSS or letter display)
SKIP_CATEGORIES = {'alphabet', 'colors', 'numbers', 'shapes'}

# Locked style applied to every prompt — tune here, nowhere else
STYLE = (
    "Children's coloring book style, simple clean outlines filled with flat bright colors. "
    "Pure white background. Single subject centered and filling 80% of the frame. "
    "No frame, no border, no decorative elements. No text, no labels. Square format."
)

# Subject description per category — keep adjectives out, those belong in STYLE
CATEGORY_HINTS = {
    'animals':    '{word}, full body, side view, friendly face',
    'dinosaurs':  '{word} dinosaur, full body, side view, friendly face',
    'vehicles':   '{word}, side view, full vehicle in frame',
    'food':       '{word}, whole item, no face',
    'fruits':     '{word} fruit, whole, no face',
    'kitchen':    '{word} kitchen utensil or appliance',
    'living_room': '{word} as a living room furniture or object',
    'bedroom':    '{word} as a bedroom furniture or object',
    'bathroom':   '{word} as a bathroom item',
    'clothes':    '{word} clothing item, front view, flat lay, no body',
    'body_parts': 'isolated human {word}, no full body shown',
    'family':     '{word} as a cartoon person, full body, front-facing',
    'nature':     '{word} from nature',
    'weather':    'weather icon representing {word}',
    'holidays':   'symbol or icon for {word}',
    'music':      '{word} musical instrument or music item',
    'verbs':      'cartoon child performing the action: {word}',
}


def build_prompt(word, category, description=None):
    if description:
        subject = description
    else:
        template = CATEGORY_HINTS.get(category, '{word}')
        subject = template.format(word=word)
    return f"Children's language flashcard: {subject}. {STYLE}"


# ── OpenRouter ─────────────────────────────────────────────────────────────────

def call_openrouter(prompt, api_key, model, size='512'):
    payload = json.dumps({
        'model': model,
        'messages': [{'role': 'user', 'content': prompt}],
        'modalities': ['image'],
        'image_generation_config': {'image_size': size},
    }).encode('utf-8')

    req = urllib.request.Request(OPENROUTER_URL, data=payload, method='POST')
    req.add_header('Authorization', f'Bearer {api_key}')
    req.add_header('Content-Type', 'application/json')
    req.add_header('HTTP-Referer', 'https://github.com/flashcards')
    req.add_header('X-Title', 'Mathaino Flashcards')

    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f'  OpenRouter error {e.code}: {body}', file=sys.stderr)
        return None
    except Exception as e:
        print(f'  Request error: {e}', file=sys.stderr)
        return None


def extract_openrouter_bytes(response):
    try:
        msg = response['choices'][0]['message']

        images = msg.get('images') or []
        for img in images:
            url = img.get('image_url', {}).get('url', '')
            if url.startswith('data:'):
                _, b64 = url.split(',', 1)
                return base64.b64decode(b64)

        content = msg.get('content', '')
        if isinstance(content, list):
            for block in content:
                if isinstance(block, dict) and block.get('type') == 'image_url':
                    url = block.get('image_url', {}).get('url', '')
                    if url.startswith('data:'):
                        _, b64 = url.split(',', 1)
                        return base64.b64decode(b64)

    except (KeyError, IndexError, ValueError) as e:
        print(f'  Parse error: {e}', file=sys.stderr)

    return None


# ── OpenAI ─────────────────────────────────────────────────────────────────────

def call_openai(prompt, api_key, model, quality='medium'):
    params = {
        'model': model,
        'prompt': prompt,
        'n': 1,
        'size': '1024x1024',
        'quality': quality,
    }
    if model in {'dall-e-3', 'dall-e-2'}:
        params['response_format'] = 'b64_json'
    else:
        params['output_format'] = 'png'

    payload = json.dumps(params).encode('utf-8')

    req = urllib.request.Request(OPENAI_URL, data=payload, method='POST')
    req.add_header('Authorization', f'Bearer {api_key}')
    req.add_header('Content-Type', 'application/json')

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f'  OpenAI error {e.code}: {body}', file=sys.stderr)
        return None
    except Exception as e:
        print(f'  Request error: {e}', file=sys.stderr)
        return None


def extract_openai_bytes(response):
    try:
        b64 = response['data'][0]['b64_json']
        return base64.b64decode(b64)
    except (KeyError, IndexError, ValueError) as e:
        print(f'  Parse error: {e}', file=sys.stderr)
    return None


# ── Shared entry point ─────────────────────────────────────────────────────────

def generate(prompt, args, openrouter_key, openai_key):
    if args.model in OPENAI_MODELS:
        response = call_openai(prompt, openai_key, args.model, args.quality)
        return extract_openai_bytes(response) if response else None
    else:
        response = call_openrouter(prompt, openrouter_key, args.model, args.size)
        return extract_openrouter_bytes(response) if response else None


# ── CLI & main ─────────────────────────────────────────────────────────────────

def load_dotenv():
    env_file = ROOT / '.env'
    if not env_file.exists():
        return
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, _, val = line.partition('=')
        val = val.strip().strip('"').strip("'")
        os.environ.setdefault(key.strip(), val)


def parse_args():
    parser = argparse.ArgumentParser(description='Generate flashcard illustrations via OpenRouter or OpenAI.')
    parser.add_argument('-c', '--category', help='Only generate images for this category')
    parser.add_argument('-s', '--subcategory', help='Only generate images for this subcategory')
    parser.add_argument('-w', '--word', nargs='+', help='Only generate images for these words (matches translation, case-insensitive)')
    parser.add_argument('-m', '--model', default=DEFAULT_MODEL, help=f'Model to use (default: {DEFAULT_MODEL})')
    parser.add_argument('-f', '--force', action='store_true', help='Overwrite existing images')
    parser.add_argument('--size', default='512', choices=['512', '1K', '2K', '4K'], help='Output resolution for OpenRouter models (default: 512)')
    parser.add_argument('--quality', default='medium', choices=['low', 'medium', 'high', 'auto', 'standard', 'hd'], help='Quality: low/medium/high/auto for gpt-image-1; standard/hd for DALL-E 3 (default: medium)')
    return parser.parse_args()


def main():
    load_dotenv()
    args = parse_args()

    openrouter_key = os.environ.get('OPENROUTER_API_KEY', '')
    openai_key     = os.environ.get('OPENAI_API_KEY', '')

    if args.model in OPENAI_MODELS:
        if not openai_key:
            print('Error: OPENAI_API_KEY not set in .env or environment.', file=sys.stderr)
            sys.exit(1)
    else:
        if not openrouter_key:
            print('Error: OPENROUTER_API_KEY not set in .env or environment.', file=sys.stderr)
            sys.exit(1)

    print(f'Model:   {args.model}')
    if args.model in OPENAI_MODELS:
        print(f'Quality: {args.quality}')
    else:
        print(f'Size:    {args.size}')
    if args.category:
        print(f'Category: {args.category}')
    if args.subcategory:
        print(f'Subcategory: {args.subcategory}')

    manifest = json.loads(MANIFEST_FILE.read_text(encoding='utf-8'))

    generated = skipped = failed = 0

    for deck_meta in manifest.get('decks', []):
        lang = deck_meta['key']
        deck_file = DECKS_DIR / f'{lang}.json'
        if not deck_file.exists():
            continue
        cards = json.loads(deck_file.read_text(encoding='utf-8'))
        if not cards:
            continue

        changed = False

        for card in cards:
            category = card.get('category', '')

            if category in SKIP_CATEGORIES:
                skipped += 1
                continue

            if args.category and category != args.category:
                skipped += 1
                continue

            if args.subcategory and card.get('subcategory') != args.subcategory:
                skipped += 1
                continue

            word = card.get('translation', '')
            if not word:
                continue

            if args.word and word.lower() not in [w.lower() for w in args.word]:
                skipped += 1
                continue

            description = card.get('description', '')

            if card.get('image'):
                image_path = card['image']
            else:
                name = ''.join(c if c.isalnum() else '_' for c in word.lower()).strip('_')
                image_path = f'images/{category}/{name}.webp'
            out_file = ROOT / image_path

            if out_file.exists() and not args.force:
                skipped += 1
                continue

            out_file.parent.mkdir(parents=True, exist_ok=True)
            print(f'Generating {image_path} ({word}) ...', end=' ', flush=True)

            img_bytes = generate(build_prompt(word, category, description), args, openrouter_key, openai_key)
            if not img_bytes:
                print('FAILED')
                failed += 1
                continue

            with PilImage.open(io.BytesIO(img_bytes)) as img:
                img = img.convert("RGBA")
                img = img.resize((512, 512), PilImage.LANCZOS)
                img.save(out_file, "WEBP", quality=85, method=6)
            card['image'] = image_path
            changed = True
            print('ok')
            generated += 1

        if changed:
            deck_file.write_text(
                json.dumps(cards, ensure_ascii=False, indent=2),
                encoding='utf-8'
            )
            print(f'\nUpdated data/decks/{lang}.json with new image paths.')

    print(f'\nDone. Generated: {generated}  Skipped: {skipped}  Failed: {failed}')
    if failed:
        sys.exit(1)


if __name__ == '__main__':
    main()
