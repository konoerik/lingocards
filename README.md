# LingoCards

A Progressive Web App (PWA) flashcard app for young children learning a new language. Cards show an illustration (or CSS-rendered visual), the target-language word, a romanized pronunciation guide, and the English translation.

Greek is the first deck (250 cards). The architecture supports adding additional languages — Spanish, French, etc. — by adding a new deck to `data/words.json` without touching any code.

## Features

- 250 Greek vocabulary cards across 22 categories
- Category tabs with parent-controlled category selection (5-tap gated settings)
- Prev / next navigation with swipe gesture support
- Shuffle toggle
- Audio playback (ElevenLabs voices, gTTS fallback)
- Installable PWA with offline support via service worker

## Card categories

| Category | Cards |
|---|---|
| Alphabet | 24 |
| Animals | 30 |
| Food | 22 |
| Verbs | 16 |
| Clothes | 12 |
| Music | 12 |
| Greetings | 12 |
| Fruits | 10 |
| Body parts | 10 |
| Family | 10 |
| Nature | 10 |
| Numbers | 10 |
| Kitchen | 10 |
| Shapes | 7 |
| Colors | 6 |
| Vehicles | 6 |
| Holidays | 8 |
| Bathroom | 8 |
| Weather | 8 |
| Living room | 8 |
| Bedroom | 6 |
| Dinosaurs | 5 |

## Tech stack

- Vanilla HTML / CSS / JavaScript — no build step, no framework
- Nunito via Google Fonts CDN
- Python scripts for content generation (Pillow, ElevenLabs, gTTS, OpenAI)

## Development

Requires an HTTP server — `fetch('data/words.json')` won't work over `file://`.

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Content generation

All scripts run inside a Python virtual environment.

```bash
python3 -m venv .venv

# Generate card illustrations (requires OPENAI_API_KEY in .env)
.venv/bin/pip install openai python-dotenv
.venv/bin/python scripts/generate_images.py --category animals

# Generate audio (ElevenLabs preferred, gTTS fallback)
.venv/bin/pip install gtts elevenlabs python-dotenv
.venv/bin/python scripts/generate_audio.py

# Regenerate PWA icons from logo.png
.venv/bin/pip install Pillow
.venv/bin/python scripts/generate_icons.py
```

Copy `.env.example` to `.env` and fill in your API keys:

```
OPENAI_API_KEY=...
ELEVENLABS_API_KEY=...   # optional — falls back to gTTS
```

## Adding a new language

1. Add a new deck object to `data/words.json` following the existing Greek deck structure.
2. Each card needs: `id`, `category`, `<language>` (the word), `romanized`, `translation` (English gloss), and optionally `image`, `audio`, `color`, `shape`, or `numeral`.
3. The language dropdown in the UI will enable automatically once the deck has cards.

## Project structure

```
├── index.html
├── manifest.json
├── sw.js
├── data/
│   └── words.json          # all card content
├── src/
│   ├── app.js
│   └── style.css
├── images/
│   └── <category>/         # PNG illustrations
├── audio/
│   └── *.mp3
└── scripts/
    ├── generate_images.py
    ├── generate_audio.py
    └── generate_icons.py
```
