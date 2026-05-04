# Roadmap
<!-- Load only when explicitly discussing goals or priorities.
     This is a high-level document — avoid granular tasks here, those belong in PLAN.md. -->

## Goal

A visual lexicon PWA that a young child can browse with a parent, learning vocabulary in a target language through images, sound, and their native-language translation. Greek is the first deck. The app should be comprehensive enough to serve as a genuine reference — not just a starter pack — while staying simple enough for a child to navigate with minimal adult help.

## Educational philosophy

**Vocabulary tiers — priority order:**
- **Tier 1 (core):** body parts, family, animals, food, colors, numbers, common household objects. High-frequency, concrete nouns a child encounters every day. Aim for comprehensive coverage (25–35 cards per category).
- **Tier 2 (useful):** nature, weather, clothes, vehicles, music. Valuable but less urgent. Current depth (~8–12 cards) is appropriate; expand when Tier 1 is solid.
- **Tier 3 (enrichment):** dinosaurs, holidays, alphabet. Motivating but not foundational. Keep thin.

**Sequencing within a category:** concrete and familiar before abstract; high-frequency before rare. Within animals: pets and farm animals before exotic wildlife.

**Parts of speech:** nouns first (age-appropriate — this is how children naturally acquire language). Verbs (action words) and greetings/phrases are the next meaningful gaps; adjectives and more complex grammar come later.

**Card count guidance:** 8–15 cards is the sweet spot for a single drill session. The parent category filter handles curation — card counts in the data can grow freely as a reference, because parents control what the child sees at any given stage.

**Subcategories:** stored as a `subcategory` field on cards (not yet rendered in UI). Enables future parent-filter drill-down (e.g. "just farm animals today") without restructuring data.

## Phases

### Phase 1: Solid Greek foundation
Build out the core Greek deck to reference quality:
- Tier 1 categories fully populated (animals ~30, food ~22, body parts, family, colors, numbers)
- Verbs category (15–20 common action words)
- Greetings & phrases (10–12 high-frequency expressions)
- Images generated for all Tier 1 and Tier 2 categories
- Audio for all cards (ElevenLabs primary, gTTS fallback)
- Image optimization (resize + WebP conversion)
- PWA deploy to GitHub Pages

### Phase 2: Parent console & filtering
- Age and interest tags on cards; filter UI in parent console
- Subcategory drill-down in parent console (e.g. farm animals, sea animals)
- Per-category file split + lazy loading (manifest + `data/<lang>/<category>.json`)

### Phase 3: Second language
- Spanish deck or another language chosen by the community
- Confirm base-language abstraction holds (non-English speakers can swap `translation` field)

## Out of Scope
- Backend, user accounts, or cloud sync (localStorage only)
- Spaced repetition or formal progress tracking (keeps the app child-friendly and stateless)
- Adjectives, full sentences, or grammar exercises (out of age range for the initial audience)
