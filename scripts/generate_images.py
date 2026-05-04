#!/usr/bin/env python3
"""
Generate PNG illustrations for flashcard words via OpenRouter image generation.

Usage:
  export OPENROUTER_API_KEY=sk-or-...
  .venv/bin/python scripts/generate_images.py

Options (env vars):
  MODEL      Override model (default: black-forest-labs/flux-1.1-pro)
  CATEGORY   Only process one category, e.g. CATEGORY=dinosaurs

Safe to re-run — skips cards that already have image files on disk.
Updates data/words.json with image paths after generation.
"""

import base64
import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

ROOT = Path(__file__).parent.parent
WORDS_FILE = ROOT / 'data' / 'words.json'

DEFAULT_MODEL = 'google/gemini-2.5-flash-image'
OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

SKIP_CATEGORIES = {'alphabet'}

CATEGORY_HINTS = {
    'colors':    'a large filled circle in the color {english}, solid color, no other elements',
    'numbers':   'the digit {english} in a bold playful rounded font, with that many small stars scattered around it',
    'animals':   'a cute friendly cartoon {english}, full body, side view',
    'dinosaurs': 'a cute friendly cartoon {english} dinosaur, full body, side view',
    'vehicles':  'a simple cartoon {english}, side view, full vehicle visible',
    'food':      'a cute cartoon {english}, whole item, appetising',
    'fruits':    'a cute cartoon {english} fruit, whole item',
    'kitchen':   'a simple cartoon {english} kitchen item',
    'living room': 'a simple cartoon {english} living room item',
    'bedroom':   'a simple cartoon {english} bedroom item',
    'bathroom':  'a simple cartoon {english} bathroom item',
}


def build_prompt(english, category):
    template = CATEGORY_HINTS.get(category, 'a simple cartoon {english}')
    subject = template.format(english=english)
    return (
        f"Children's flashcard illustration: {subject}. "
        "Style: bright cheerful colors, thick black outlines, flat cartoon, white background, "
        "single centered object, no text or labels, suitable for a 3-year-old. "
        "Square composition."
    )


def call_openrouter(prompt, api_key, model):
    payload = json.dumps({
        'model': model,
        'messages': [{'role': 'user', 'content': prompt}],
        'modalities': ['image'],
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


def extract_image_bytes(response):
    """Pull PNG bytes out of the OpenRouter image response."""
    try:
        msg = response['choices'][0]['message']

        # Multimodal response: images list on the message
        images = msg.get('images') or []
        for img in images:
            url = img.get('image_url', {}).get('url', '')
            if url.startswith('data:'):
                _, b64 = url.split(',', 1)
                return base64.b64decode(b64)

        # Some models return content as a list of blocks
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


def main():
    api_key = os.environ.get('OPENROUTER_API_KEY', '')
    if not api_key:
        print('Error: OPENROUTER_API_KEY not set.', file=sys.stderr)
        sys.exit(1)

    model = os.environ.get('MODEL', DEFAULT_MODEL)
    only_category = os.environ.get('CATEGORY', '').strip().lower()

    print(f'Model: {model}')
    if only_category:
        print(f'Category filter: {only_category}')

    data = json.loads(WORDS_FILE.read_text(encoding='utf-8'))
    decks = data.get('decks', {})

    generated = skipped = failed = 0
    changed = False

    for lang, cards in decks.items():
        for card in cards:
            category = card.get('category', '')

            if category in SKIP_CATEGORIES:
                skipped += 1
                continue

            if only_category and category != only_category:
                skipped += 1
                continue

            english = card.get('english', '')
            if not english:
                continue

            card_id = card['id']
            image_path = card.get('image') or f'images/{category}/{card_id}.png'
            out_file = ROOT / image_path

            if out_file.exists():
                skipped += 1
                continue

            out_file.parent.mkdir(parents=True, exist_ok=True)
            print(f'Generating {image_path} ({english}) ...', end=' ', flush=True)

            response = call_openrouter(build_prompt(english, category), api_key, model)
            if not response:
                print('FAILED (no response)')
                failed += 1
                continue

            img_bytes = extract_image_bytes(response)
            if not img_bytes:
                print('FAILED (no image in response)')
                # Dump raw response for debugging
                print(f'  Raw keys: {list(response.get("choices", [{}])[0].get("message", {}).keys())}', file=sys.stderr)
                failed += 1
                continue

            out_file.write_bytes(img_bytes)
            card['image'] = image_path
            changed = True
            print('ok')
            generated += 1

    if changed:
        WORDS_FILE.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding='utf-8'
        )
        print('\nUpdated data/words.json with new image paths.')

    print(f'\nDone. Generated: {generated}  Skipped: {skipped}  Failed: {failed}')
    if failed:
        sys.exit(1)


if __name__ == '__main__':
    main()
