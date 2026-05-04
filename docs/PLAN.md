# Plan

## Active
- [ ] Verify all cards in words.json are correct (Greek spelling, romanization, translation, category) — recurring task after any content addition; priority: new animals, food, verbs, greetings (gr_188–gr_250)
- [ ] Review UI — layout, colors, typography, interaction feel; check on mobile and desktop

## Backlog
- Generate images for new categories (fruits, food, kitchen, living_room, bedroom, bathroom, clothes, holidays, body_parts, family, nature, weather) — shapes may use CSS rendering instead
- Add audio paths and run generate_audio.py for gr_059–gr_250
- Decide on shapes category: CSS-rendered shapes (like colors) vs illustrations
- Replace belly emoji 🫃 with something better
- Deploy to GitHub Pages (create repo, push, enable Pages)
- Add GitHub Actions workflow for auto-deploy on push to main

### Identity & architecture
- Rename the app — current name Μαθαίνω is descriptive but not catchy or brandable; evaluate options (e.g. LexiCards, KidsCards, or a Greek-rooted name) considering PWA home-screen icon label, manifest name, domain availability
- Evaluate language bundle model — what we've built is implicitly an en-el (English→Greek) bundle; consider adopting an open-source localization pattern (e.g. `bundles/en-el/`, `bundles/en-es/`) so the data layer is explicit about base+target language pair, enabling community contributions of new bundles without touching core app code

### Content & visuals
- Audit emoji placeholders — some are semantically wrong (e.g. eagle used for pterodactyl); decide whether to replace bad ones individually, use a generic "image coming soon" placeholder, or remove the emoji fallback entirely once image coverage is complete
- Define and document an image generation style guide (art style, background, framing, color palette) and re-run or audit existing images for cohesion — current images were generated without a consistent prompt template

### Optimization
- Resize generated images from 1024×1024 → 520×520 (2× retina) and convert PNG → WebP at quality 85; expected reduction ~15× per image (~780KB → ~40KB)
- Add post-processing step to generate_images.py so new images are saved at the right size/format from the start (no separate pass needed)
- Self-host Nunito font to enable true offline-from-first-launch (low priority — current CDN load is only a first-visit concern)
- Audit service worker cache strategy once audio is added — 175 cards × 3 voices could be ~50MB if cached eagerly; consider lazy-only or user-initiated prefetch

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
