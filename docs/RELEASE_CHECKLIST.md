# Release Checklist

## Infrastructure

- [ ] GitHub repo exists and `main` is up to date
- [ ] GitHub Pages enabled — Settings → Pages → Source: **GitHub Actions**
- [ ] Deploy workflow triggered and green (check Actions tab)
- [ ] Live URL loads and renders correctly
- [ ] PWA installs cleanly on iOS (Add to Home Screen) and Android

---

## Language Package Sign-off

Complete this section before marking a deck release-ready. Copy and fill in one block per language.

### Greek (en → el)

#### Content — spot-check at least 10% of cards across categories
- [ ] Greek spellings are correct
- [ ] Romanizations are accurate and consistent (stress marks present)
- [ ] English translations are correct and age-appropriate
- [ ] No duplicate concepts within a category (e.g. two cards that look the same)

#### Visuals
- [ ] Every generatable card has an image — no blank image slots visible in the app
- [ ] Skip-category cards render correctly: colors → swatch, numbers → numeral, alphabet → letter, greetings → speech bubble
- [ ] Image style is consistent across categories (coloring-book, white background)

#### Audio
- [ ] Audio button is hidden on all cards that lack audio files (`card.audio` absent)
- [ ] For cards that have audio: auto-play triggers on card change (when enabled)
- [ ] Manual audio tap plays a random voice

#### App behaviour
- [ ] All category tabs load and filter correctly
- [ ] Shuffle produces a different order
- [ ] Prev/next arrows and swipe both navigate correctly
- [ ] Selected category persists across page refresh
- [ ] Parent settings open on 5-tap, category toggles apply correctly
- [ ] App works offline after first visit (service worker active)

#### Sign-off
| Field | Value |
|---|---|
| Reviewed by | |
| Date | |
| Git SHA | |
| Status | `pending` / `approved` |
