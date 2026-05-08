#!/usr/bin/env python3
"""
Generate audio files for all words in data/decks/<lang>.json.

Primary:  ElevenLabs API (multiple voices per word, high quality)
Fallback: gTTS (free, single voice per word)

Usage:
  pip install elevenlabs gtts          # inside .venv
  python scripts/generate_audio.py

Set ELEVENLABS_API_KEY in your environment to use ElevenLabs:
  export ELEVENLABS_API_KEY=your_key_here
  python scripts/generate_audio.py

Safe to re-run — skips files that already exist.
"""

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
MANIFEST_FILE = ROOT / 'data' / 'manifest.json'
DECKS_DIR = ROOT / 'data' / 'decks'
AUDIO_DIR = ROOT / 'audio'
AUDIO_DIR.mkdir(exist_ok=True)

# ElevenLabs voice IDs — Greek voices
# Adjust these to your preferred voice IDs from the ElevenLabs voice library.
# Find IDs at https://api.elevenlabs.io/v1/voices (with your API key)
ELEVENLABS_VOICES = {
    'greek': {
        'voice_1': 'pNInz6obpgDQGcFmaJgB',  # Adam — warm male (placeholder, swap for Greek voice)
        'voice_2': 'EXAVITQu4vr4xnSDxMaL',  # Bella — female (placeholder)
        'voice_3': 'ErXwobaYiN019PkySvjV',  # Antoni — younger male (placeholder)
    },
    'spanish': {
        'voice_1': 'pNInz6obpgDQGcFmaJgB',
        'voice_2': 'EXAVITQu4vr4xnSDxMaL',
    },
}

GTTS_LANG = {
    'greek':   'el',
    'spanish': 'es',
}


def generate_elevenlabs(text, voice_id, out_path, api_key):
    """Generate audio via ElevenLabs API and save to out_path."""
    import urllib.request
    import urllib.error

    url = f'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}'
    payload = json.dumps({
        'text': text,
        'model_id': 'eleven_multilingual_v2',
        'voice_settings': {'stability': 0.5, 'similarity_boost': 0.75},
    }).encode()

    req = urllib.request.Request(url, data=payload, method='POST')
    req.add_header('xi-api-key', api_key)
    req.add_header('Content-Type', 'application/json')
    req.add_header('Accept', 'audio/mpeg')

    try:
        with urllib.request.urlopen(req) as resp:
            out_path.write_bytes(resp.read())
        return True
    except urllib.error.HTTPError as e:
        print(f'  ElevenLabs error {e.code}: {e.reason}', file=sys.stderr)
        return False


def generate_gtts(text, lang_code, out_path):
    """Generate audio via gTTS and save to out_path."""
    try:
        from gtts import gTTS
    except ImportError:
        print('  gTTS not installed. Run: pip install gtts', file=sys.stderr)
        return False

    try:
        tts = gTTS(text=text, lang=lang_code, slow=False)
        tts.save(str(out_path))
        return True
    except Exception as e:
        print(f'  gTTS error: {e}', file=sys.stderr)
        return False


def process_deck(lang, cards, api_key):
    lang_voices = ELEVENLABS_VOICES.get(lang, {})
    gtts_lang = GTTS_LANG.get(lang, 'en')
    word_field = lang  # card field name matches the language key

    generated = 0
    skipped = 0
    failed = 0

    for card in cards:
        word = card.get(word_field) or card.get('greek', '')
        if not word:
            continue

        audio = card.get('audio', {})
        if not audio:
            continue

        for voice_key, rel_path in audio.items():
            out_path = ROOT / rel_path
            if out_path.exists():
                skipped += 1
                continue

            out_path.parent.mkdir(parents=True, exist_ok=True)
            print(f'Generating {rel_path} ...', end=' ', flush=True)

            success = False

            if api_key and voice_key in lang_voices:
                voice_id = lang_voices[voice_key]
                success = generate_elevenlabs(word, voice_id, out_path, api_key)

            if not success and voice_key == 'voice_1':
                # gTTS fallback for voice_1 only
                success = generate_gtts(word, gtts_lang, out_path)

            if success:
                print('ok')
                generated += 1
            else:
                print('FAILED')
                failed += 1

    return generated, skipped, failed


def main():
    api_key = os.environ.get('ELEVENLABS_API_KEY', '')
    if api_key:
        print('Using ElevenLabs API')
    else:
        print('ELEVENLABS_API_KEY not set — using gTTS fallback (voice_1 only)')

    manifest = json.loads(MANIFEST_FILE.read_text(encoding='utf-8'))

    total_gen = total_skip = total_fail = 0

    for deck_meta in manifest.get('decks', []):
        lang = deck_meta['key']
        deck_file = DECKS_DIR / f'{lang}.json'
        if not deck_file.exists():
            continue
        cards = json.loads(deck_file.read_text(encoding='utf-8'))
        if not cards:
            continue
        print(f'\n── {lang.capitalize()} deck ({len(cards)} cards) ──')
        g, s, f = process_deck(lang, cards, api_key)
        total_gen += g
        total_skip += s
        total_fail += f

    print(f'\nDone. Generated: {total_gen}  Skipped: {total_skip}  Failed: {total_fail}')
    if total_fail:
        sys.exit(1)


if __name__ == '__main__':
    main()
