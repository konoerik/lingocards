# Plan

## Active

## Backlog
- Source/generate card images (illustrations for dinosaurs/numbers/food/vehicles, photos for animals, SVG swatches for colors)
- Run generate_audio.py with ElevenLabs API key to produce voice files
- Deploy to GitHub Pages (create repo, push, enable Pages)
- Add GitHub Actions workflow for auto-deploy on push to main

## Done
- Scaffold project structure (index.html, src/app.js, src/style.css, data/, audio/, images/, scripts/)
- Create words.json with 34 Greek vocabulary cards (dinosaurs, animals, colors, numbers, vehicles)
- Add 24 Greek alphabet cards (gr_035–gr_058)
- Build card UI: image/emoji display, Greek word, romanized pronunciation, English label, audio button
- Add category tabs (All + per-category, populated from data)
- Implement prev/next arrow navigation with swipe gesture support
- Add shuffle toggle (🔀) in topbar with Fisher-Yates shuffle
- Write generate_audio.py (ElevenLabs primary, gTTS fallback)
- Write generate_icons.py (Pillow); generate icon-192.png and icon-512.png
- Add manifest.json and sw.js for PWA offline support
- Fill in CLAUDE.md and docs/ARCHITECTURE.md
- Initialise git repository
