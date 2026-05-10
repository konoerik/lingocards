# Plan

## Active
## Backlog
- Add audio paths to greek.json and run generate_audio.py (naming: audio/<card-id>_v1.mp3)
- ~~Deploy to GitHub Pages (create repo, push, enable Pages)~~ — live at konoerik.github.io/lingocards

### Quiz / study mode
- Add a 3-way field-hide toggle to each card: hide target-language word / hide romanization / hide English translation — lets the user quiz themselves; could be a small icon row at the bottom of the card or a persistent topbar toggle; state should probably be per-session (not persisted), and may want to consider how it interacts with the difficulty filter (e.g. hiding romanization is a natural step up in difficulty)

### Identity & architecture
- Evaluate language bundle model — what we've built is implicitly an en-el (English→Greek) bundle; consider adopting an open-source localization pattern (e.g. `bundles/en-el/`, `bundles/en-es/`) so the data layer is explicit about base+target language pair, enabling community contributions of new bundles without touching core app code

### Content & visuals
- Define and document an image generation style guide — prompt template is now consistent but not yet written up formally

### Optimization
- Image prefetch: prefetch active category images on load (A), then add explicit "Download for offline" to parent settings once audio is ready (C) — pending more testing on real mobile connection
- Self-host Nunito font to enable true offline-from-first-launch (low priority — current CDN load is only a first-visit concern)
- Audit service worker cache strategy once audio is added — 175 cards × 3 voices could be ~50MB if cached eagerly; consider lazy-only or user-initiated prefetch

## Done
- Alphabet cards show both upper and lowercase letters side-by-side in the visual; word field hidden (visibility:hidden) to avoid duplicate; card height stabilised with min-height on card-word across breakpoints
- Days-of-week and months replaced no-image placeholder with CSS calendar tile: native-language abbreviation (first letter for days, 3-letter for months with accent stripping), progression segments, ←/→ arrows in header
- Technology category images generated (8 cards); keyboard and Mom card regenerated to fix text/subject issues
- Welcome popup replaced with persistent `?` help button in topbar; auto-opens on first visit, reopenable anytime; content updated to cover all current features
- Add difficulty levels (level 1–3) to all cards across all three decks; green/yellow/red dot on card; difficulty filter in settings panel with persist; empty-deck fallback bug fix
- Add days_of_week (7 cards) and months (12 cards) to Greek, Albanian, and Spanish decks
- Group category tabs with logical ordering and pipe dividers (Fundamentals → Time → People → Animals → Food → Nature → Home → Culture & Tech)
- Convert card images to WebP 512px quality 85 — 100MB → 3.5MB (97%); generate_images.py now writes WebP directly; sw.js bumped to v12
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
