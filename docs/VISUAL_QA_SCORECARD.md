# Visual QA Scorecard

<!-- One file per round. Duplicate and rename: VISUAL_QA_2026-05-07_r1.md -->

## Round info
| Field | Value |
|---|---|
| Date | |
| Git SHA | |
| Tester | |
| Screenshots from | `make screenshots` |

---

## Status legend
| Code | Meaning |
|---|---|
| ✅ | Pass — no issues |
| ⚠️ | Minor — visible but not broken; note in Findings |
| ❌ | Broken — layout break, clipping, unreadable; note in Findings |
| — | Not checked |

## Checks
| ID | Area | What to look for |
|---|---|---|
| A | Nav buttons | Both arrows fully visible, not clipped by bottom edge |
| B | Card fits viewport | Card content doesn't overflow; no vertical scrollbar |
| C | Font — Greek word | Large word readable; long words scale down without overflowing |
| D | Font — romanization + translation | Both lines visible below the word |
| E | Topbar | Logo, language selector, shuffle, settings gear all intact |
| F | Category tabs | Tab row visible; scrolls horizontally if needed |
| G | Images | Card image loads and fits inside card bounds |

---

## Scorecard

### iOS / Safari (webkit)
| Device | A nav | B card | C word | D sub | E topbar | F tabs | G image | Notes |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| iPhone SE 3rd (375×667) | | | | | | | | |
| iPhone 14 (390×844) | | | | | | | | |
| iPhone 17 Pro Max (430×956) | | | | | | | | |

### Android / Chrome (chromium)
| Device | A nav | B card | C word | D sub | E topbar | F tabs | G image | Notes |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| Pixel 7 (412×915) | | | | | | | | |
| Galaxy S24 (360×780) | | | | | | | | |
| Galaxy A54 (360×800) | | | | | | | | |

### Tablet + Desktop
| Device / engine | A nav | B card | C word | D sub | E topbar | F tabs | G image | Notes |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| iPad 10th — webkit (820×1180) | | | | | | | | |
| iPad 10th — chromium (820×1180) | | | | | | | | |
| MacBook Air 13 — webkit (1280×800) | | | | | | | | |
| MacBook Air 13 — chromium (1280×800) | | | | | | | | |
| Desktop 1440 — chromium (1440×900) | | | | | | | | |

---

## Findings

| # | Device | Engine | Check | Description | CSS target | Priority |
|---|---|---|---|---|---|---|
| 1 | | | | | | P1/P2/P3 |

**Priority guide:** P1 = broken/unusable · P2 = visible glitch · P3 = polish

---

## Fixes applied this round

| Finding # | Change made | File | Line |
|---|---|---|---|
| | | | |

---

## Sign-off
- [ ] All P1 findings fixed and re-checked
- [ ] All P2 findings fixed or deferred to backlog
- [ ] Screenshots re-run after fixes and reviewed
