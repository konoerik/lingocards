'use strict';

// ── Constants ──────────────────────────────────────────────────────────────

const SETTINGS_KEY = 'mathaino_settings';

const CATEGORY_META = {
  dinosaurs:   { label: 'Dinosaurs',    emoji: '🦕' },
  animals:     { label: 'Animals',      emoji: '🐘' },
  colors:      { label: 'Colors',       emoji: '🌈' },
  numbers:     { label: 'Numbers',      emoji: '🔢' },
  fruits:      { label: 'Fruits',       emoji: '🍓' },
  food:        { label: 'Food',         emoji: '🍕' },
  vehicles:    { label: 'Vehicles',     emoji: '🚛' },
  kitchen:     { label: 'Kitchen',      emoji: '🍳' },
  living_room: { label: 'Living Room',  emoji: '🛋️' },
  bedroom:     { label: 'Bedroom',      emoji: '🛏️' },
  bathroom:    { label: 'Bathroom',     emoji: '🚿' },
  clothes:     { label: 'Clothes',      emoji: '👕' },
  holidays:    { label: 'Holidays',     emoji: '🎄' },
  body_parts:  { label: 'Body Parts',   emoji: '🫀' },
  family:      { label: 'Family',       emoji: '👨‍👩‍👧‍👦' },
  nature:      { label: 'Nature',       emoji: '🌳' },
  shapes:      { label: 'Shapes',       emoji: '🔷' },
  weather:     { label: 'Weather',      emoji: '🌤️' },
  alphabet:    { label: 'Alphabet',     emoji: 'Αα' },
  music:       { label: 'Music',        emoji: '🎵' },
  verbs:       { label: 'Verbs',        emoji: '🏃' },
  greetings:   { label: 'Greetings',    emoji: '👋' },
};

// ── State ──────────────────────────────────────────────────────────────────

let allDecks  = {};
let deck      = [];       // full card list for current language + category
let queue     = [];       // ordered or shuffled indices into deck
let position  = 0;        // index into queue
let language  = 'greek';
let category  = 'all';
let shuffled  = false;
let settings  = { autoplay: true, enabledCategories: null, category: 'all' };
let currentAudio = null;

// Swipe tracking
let swipeStartX = 0;
let swipeStartY = 0;

// 5-tap settings gate
let settingsTapCount = 0;
let settingsTapTimer = null;

// ── DOM refs ───────────────────────────────────────────────────────────────

const elLanguageSelect  = document.getElementById('language-select');
const elCategoryTabs    = document.getElementById('category-tabs');
const elCard            = document.getElementById('card');
const elCardImageWrap   = document.getElementById('card-image-wrap');
const elCardImage       = document.getElementById('card-image');
const elCardColorSwatch = document.getElementById('card-color-swatch');
const elCardShape       = document.getElementById('card-shape');
const elCardLetter      = document.getElementById('card-letter');
const elCardWord        = document.getElementById('card-word');
const elCardRomanized   = document.getElementById('card-romanized');
const elCardTranslation = document.getElementById('card-translation');
const elAudioBtn        = document.getElementById('audio-btn');
const elProgressBar     = document.getElementById('progress-bar');
const elProgressLabel   = document.getElementById('progress-label');
const elBtnPrev         = document.getElementById('btn-prev');
const elBtnNext         = document.getElementById('btn-next');
const elShuffleBtn      = document.getElementById('shuffle-btn');
const elSettingsBtn          = document.getElementById('settings-btn');
const elSettingsOverlay      = document.getElementById('settings-overlay');
const elSettingAutoplay      = document.getElementById('setting-autoplay');
const elSettingsClose        = document.getElementById('settings-close');
const elSettingsCategoryList = document.getElementById('settings-category-list');
const elSettingsDone         = document.getElementById('settings-done');
const elSettingsSelectAll    = document.getElementById('settings-select-all');
const elSettingsSelectNone   = document.getElementById('settings-select-none');

// ── Bootstrap ──────────────────────────────────────────────────────────────

async function init() {
  loadSettings();

  try {
    const res = await fetch('data/words.json');
    const data = await res.json();
    allDecks = data.decks;
  } catch (e) {
    console.error('Failed to load words.json', e);
    return;
  }

  elLanguageSelect.value = language;
  updateLanguageSelect();
  switchLanguage(language);
  if (settings.category && settings.category !== 'all') {
    switchCategory(settings.category);
  }
  attachListeners();
}

// ── Language & category ────────────────────────────────────────────────────

function switchLanguage(lang) {
  language = lang;
  category = 'all';
  settings.category = 'all';
  saveSettings();
  buildDeck();
  renderCategoryTabs();
  buildQueue();
  renderCard();
}

function updateLanguageSelect() {
  const populated = Object.keys(allDecks).filter(k => (allDecks[k] || []).length > 0);
  elLanguageSelect.classList.toggle('hidden', populated.length < 1);
}

function switchCategory(cat) {
  category = cat;
  settings.category = cat;
  saveSettings();
  buildDeck();
  buildQueue();
  renderCard();
  updateTabSelection();
}

// ── Deck & queue ───────────────────────────────────────────────────────────

function getActiveCards() {
  const all = allDecks[language] || [];
  const enabled = settings.enabledCategories;
  return enabled ? all.filter(c => enabled.includes(c.category)) : all;
}

function buildDeck() {
  const active = getActiveCards();
  deck = category === 'all' ? active : active.filter(c => c.category === category);
}

function buildQueue(keepPosition = false) {
  const indices = deck.map((_, i) => i);

  if (shuffled) {
    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
  }

  queue = indices;
  if (!keepPosition) position = 0;
}

// ── Card rendering ─────────────────────────────────────────────────────────

function renderCard(direction = 'next') {
  if (queue.length === 0) return;

  position = Math.max(0, Math.min(position, queue.length - 1));

  const card = deck[queue[position]];

  // Slide-in animation direction
  elCard.classList.remove('from-prev');
  void elCard.offsetHeight;
  if (direction === 'prev') elCard.classList.add('from-prev');

  // Image / color swatch / letter / placeholder
  elCardImageWrap.classList.remove('has-image', 'has-swatch', 'has-shape', 'has-letter', 'has-speech', 'no-image');
  elCardColorSwatch.style.background = '';
  elCardShape.className = 'card-shape';
  elCardLetter.textContent = '';
  elCardLetter.className = 'card-letter';
  if (card.color) {
    elCardImageWrap.classList.add('has-swatch');
    elCardColorSwatch.style.background = card.color;
  } else if (card.shape) {
    elCardImageWrap.classList.add('has-shape');
    elCardShape.className = 'card-shape shape-' + card.shape;
  } else if (card.image) {
    elCardImageWrap.classList.add('has-image');
    elCardImage.src = card.image;
    elCardImage.alt = card.translation;
  } else if (card.numeral) {
    elCardImageWrap.classList.add('has-letter');
    elCardLetter.textContent = card.numeral;
    elCardLetter.className = 'card-letter number';
  } else if (card.category === 'alphabet') {
    elCardImageWrap.classList.add('has-letter');
    elCardLetter.textContent = card.emoji;
    elCardLetter.className = 'card-letter letter';
  } else if (card.category === 'greetings') {
    elCardImageWrap.classList.add('has-speech');
  } else {
    elCardImageWrap.classList.add('no-image');
  }

  elAudioBtn.classList.toggle('hidden', !card.audio);
  elCardWord.textContent = card[language] || card.greek;
  elCardRomanized.textContent = card.romanized || '';
  elCardTranslation.textContent = card.translation;

  // Progress
  const pct = queue.length > 1
    ? Math.round((position / (queue.length - 1)) * 100)
    : 100;
  elProgressBar.style.setProperty('--progress', `${pct}%`);
  elProgressLabel.textContent = `${position + 1} / ${queue.length}`;

  // Arrow state
  elBtnPrev.disabled = position === 0;
  elBtnNext.disabled = position === queue.length - 1;

  if (settings.autoplay) playAudio(card);
}

// ── Navigation ─────────────────────────────────────────────────────────────

function goNext() {
  if (position < queue.length - 1) {
    position++;
    renderCard('next');
  }
}

function goPrev() {
  if (position > 0) {
    position--;
    renderCard('prev');
  }
}

function toggleShuffle() {
  shuffled = !shuffled;
  elShuffleBtn.setAttribute('aria-pressed', shuffled ? 'true' : 'false');
  buildQueue();
  renderCard();
}

// ── Category tabs ──────────────────────────────────────────────────────────

function renderCategoryTabs() {
  elCategoryTabs.innerHTML = '';

  const categories = ['all', ...new Set(getActiveCards().map(c => c.category))];

  categories.forEach(cat => {
    const meta = CATEGORY_META[cat];
    const btn = document.createElement('button');
    btn.className = 'tab-btn';
    btn.setAttribute('role', 'tab');
    btn.dataset.category = cat;
    const emoji = cat === 'all' ? '⭐' : (meta ? meta.emoji : '');
    const label = cat === 'all' ? 'All' : (meta ? meta.label : cat);
    const labelClass = cat === 'all' ? 'tab-label tab-label--always' : 'tab-label';
    btn.innerHTML = `<span class="tab-emoji">${emoji}</span><span class="${labelClass}">${label}</span>`;
    btn.setAttribute('title', label);
    btn.setAttribute('aria-selected', cat === category ? 'true' : 'false');
    btn.addEventListener('click', () => switchCategory(cat));
    elCategoryTabs.appendChild(btn);
  });
}

function updateTabSelection() {
  elCategoryTabs.querySelectorAll('.tab-btn').forEach(btn => {
    btn.setAttribute('aria-selected', btn.dataset.category === category ? 'true' : 'false');
  });
}

// ── Audio ──────────────────────────────────────────────────────────────────

function playAudio(card, random = false) {
  if (!card.audio) return;

  const voices = Object.values(card.audio).filter(Boolean);
  if (voices.length === 0) return;

  const src = random
    ? voices[Math.floor(Math.random() * voices.length)]
    : voices[0];

  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  const audio = new Audio(src);
  currentAudio = audio;
  audio.play().catch(() => { currentAudio = null; });
  audio.addEventListener('ended', () => { currentAudio = null; });
}

// ── Settings ───────────────────────────────────────────────────────────────

function handleSettingsTap() {
  settingsTapCount++;
  clearTimeout(settingsTapTimer);
  settingsTapTimer = setTimeout(() => { settingsTapCount = 0; }, 2000);
  if (settingsTapCount >= 5) {
    settingsTapCount = 0;
    openSettings();
  }
}

function updateDoneBtn() {
  const anyChecked = [...elSettingsCategoryList.querySelectorAll('input[type="checkbox"]')]
    .some(cb => cb.checked);
  elSettingsDone.disabled = !anyChecked;
}

function openSettings() {
  const all = allDecks[language] || [];
  const availableCats = [...new Set(all.map(c => c.category))];
  const enabled = settings.enabledCategories ?? availableCats;

  elSettingsCategoryList.innerHTML = '';
  availableCats.forEach(cat => {
    const meta = CATEGORY_META[cat];
    const row = document.createElement('label');
    row.className = 'settings-category-row';
    row.innerHTML = `
      <span class="settings-cat-info">
        <span class="settings-cat-emoji">${meta ? meta.emoji : ''}</span>
        <span>${meta ? meta.label : cat}</span>
      </span>
      <input type="checkbox" data-cat="${cat}" ${enabled.includes(cat) ? 'checked' : ''} />`;
    elSettingsCategoryList.appendChild(row);
  });

  elSettingsCategoryList.addEventListener('change', updateDoneBtn);
  updateDoneBtn();

  elSettingAutoplay.checked = settings.autoplay;
  elSettingsOverlay.classList.remove('hidden');
}

function applySettings() {
  const all = allDecks[language] || [];
  const availableCats = [...new Set(all.map(c => c.category))];
  const checked = [...elSettingsCategoryList.querySelectorAll('input[type="checkbox"]')]
    .filter(cb => cb.checked)
    .map(cb => cb.dataset.cat);

  settings.enabledCategories = checked.length === availableCats.length ? null : checked;
  saveSettings();

  if (settings.enabledCategories && !settings.enabledCategories.includes(category)) {
    category = 'all';
  }

  buildDeck();
  renderCategoryTabs();
  buildQueue();
  renderCard();
}

function closeSettings() {
  elSettingsOverlay.classList.add('hidden');
}

// ── Persistence ────────────────────────────────────────────────────────────

function loadSettings() {
  try {
    settings = { ...settings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) };
  } catch { /* use defaults */ }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ── Swipe gesture ──────────────────────────────────────────────────────────

function onTouchStart(e) {
  swipeStartX = e.touches[0].clientX;
  swipeStartY = e.touches[0].clientY;
}

function onTouchEnd(e) {
  const dx = e.changedTouches[0].clientX - swipeStartX;
  const dy = e.changedTouches[0].clientY - swipeStartY;

  // Only count horizontal swipes (dx > dy in magnitude, and > 40px threshold)
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
    if (dx < 0) goNext();
    else goPrev();
  }
}

// ── Event listeners ────────────────────────────────────────────────────────

function attachListeners() {
  elLanguageSelect.addEventListener('change', e => switchLanguage(e.target.value));

  elBtnPrev.addEventListener('click', goPrev);
  elBtnNext.addEventListener('click', goNext);

  elShuffleBtn.addEventListener('click', toggleShuffle);

  elAudioBtn.addEventListener('click', () => {
    const card = deck[queue[position]];
    if (card) playAudio(card, true);
  });

  elCard.addEventListener('touchstart', onTouchStart, { passive: true });
  elCard.addEventListener('touchend', onTouchEnd, { passive: true });

  elSettingsBtn.addEventListener('click', handleSettingsTap);

  elSettingAutoplay.addEventListener('change', e => {
    settings.autoplay = e.target.checked;
    saveSettings();
  });

  elSettingsClose.addEventListener('click', closeSettings);
  elSettingsDone.addEventListener('click', () => { applySettings(); closeSettings(); });
  elSettingsSelectAll.addEventListener('click', () => {
    elSettingsCategoryList.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
    updateDoneBtn();
  });
  elSettingsSelectNone.addEventListener('click', () => {
    elSettingsCategoryList.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    updateDoneBtn();
  });
}

// ── Service worker ─────────────────────────────────────────────────────────

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// ── Go ─────────────────────────────────────────────────────────────────────

init();
