# Plan

## Active
- [ ] Verify all cards in words.json are correct (Greek spelling, romanization, English translation, category) — recurring task after any content addition
- [ ] Review UI — layout, colors, typography, interaction feel; check on mobile and desktop

## Backlog
- Generate images for new categories (fruits, food, kitchen, living_room, bedroom, bathroom, clothes, holidays, body_parts, family, nature, weather) — shapes may use CSS rendering instead
- Add audio paths and run generate_audio.py for gr_059–gr_175
- Decide on shapes category: CSS-rendered shapes (like colors) vs illustrations
- Replace belly emoji 🫃 with something better
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
