# Plan

## Active
- [ ] Review alphabet cards (alphabet_alpha–alphabet_omega) — currently shows uppercase letter as the icon and "Α α" as the translation; decide whether to split into separate upper/lowercase cards, show both forms in the visual, or change the translation field
## Backlog
- Add audio paths to greek.json and run generate_audio.py (naming: audio/<card-id>_v1.mp3)
- ~~Deploy to GitHub Pages (create repo, push, enable Pages)~~ — live at konoerik.github.io/lingocards

### Identity & architecture
- Evaluate language bundle model — what we've built is implicitly an en-el (English→Greek) bundle; consider adopting an open-source localization pattern (e.g. `bundles/en-el/`, `bundles/en-es/`) so the data layer is explicit about base+target language pair, enabling community contributions of new bundles without touching core app code

### Content & visuals
- Define and document an image generation style guide — prompt template is now consistent but not yet written up formally

### Optimization
- Image prefetch: prefetch active category images on load (A), then add explicit "Download for offline" to parent settings once audio is ready (C) — pending more testing on real mobile connection
- Convert generated PNGs to WebP at quality 85 for serving; images are already generated at 512px
- Self-host Nunito font to enable true offline-from-first-launch (low priority — current CDN load is only a first-visit concern)
- Audit service worker cache strategy once audio is added — 175 cards × 3 voices could be ~50MB if cached eagerly; consider lazy-only or user-initiated prefetch

## Done
- Greek V1 signed off — content (261 cards), images, romanization, UI all approved
- Review UI — layout, colors, typography, interaction feel: fixed nav clipping on short viewports (max-height breakpoints); removed image frame; visual QA infra (Playwright screenshots, scorecard)
- Add welcome popup (first-visit, localStorage) and language notes panel (ℹ️, deck_meta)
- Add keyboard arrow navigation and Escape to close overlays
- Rename app to LingoCards; new logo/icons from provided jpegs; full brand update across manifest, sw.js, index.html, CLAUDE.md, ARCHITECTURE.md
- Add GitHub Actions workflow for auto-deploy on push to main
- Add docs/RELEASE_CHECKLIST.md for infra and Greek package sign-off
- Hide audio button when card has no audio; hide language select when only one deck populated
- Generate images for all categories with gpt-image-1; all approved
- Add localStorage persistence for selected category tab
- Switch image filenames to translation-based (apple.png vs gr_059.png); language-agnostic
- Replace gr_001 Dinosaur with Stegosaurus to eliminate duplicate T-Rex
- Remove emojis from cards — replaced with image, letter/numeral, CSS speech bubble (greetings), or no-image placeholder
- Overhaul generate_images.py — argparse CLI, fixed translation field bug, coloring-book prompt anchor, description field per card, 512px default output, --force/--word/--size/--subcategory flags
- Add description field to 60 abstract/ambiguous cards (verbs, body parts pointing approach, abstract concepts)
- Add .env support for API keys; add .env to .gitignore
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
