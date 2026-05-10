'use strict';

// ── Constants ──────────────────────────────────────────────────────────────

const SETTINGS_KEY = 'mathaino_settings';

const CATEGORY_META = {
  alphabet:    { label: 'Alphabet',     emoji: '🔤' },
  numbers:     { label: 'Numbers',      emoji: '🔢' },
  colors:      { label: 'Colors',       emoji: '🌈' },
  shapes:      { label: 'Shapes',       emoji: '🔷' },
  dinosaurs:   { label: 'Dinosaurs',    emoji: '🦕' },
  animals:     { label: 'Animals',      emoji: '🐘' },
  family:      { label: 'Family',       emoji: '👨‍👩‍👧‍👦' },
  body_parts:  { label: 'Body Parts',   emoji: '🫀' },
  greetings:   { label: 'Greetings',    emoji: '👋' },
  verbs:       { label: 'Verbs',        emoji: '🏃' },
  food:        { label: 'Food',         emoji: '🍕' },
  fruits:      { label: 'Fruits',       emoji: '🍓' },
  nature:      { label: 'Nature',       emoji: '🌳' },
  weather:     { label: 'Weather',      emoji: '🌤️' },
  vehicles:    { label: 'Vehicles',     emoji: '🚛' },
  bathroom:    { label: 'Bathroom',     emoji: '🚿' },
  bedroom:     { label: 'Bedroom',      emoji: '🛏️' },
  kitchen:     { label: 'Kitchen',      emoji: '🍳' },
  living_room: { label: 'Living Room',  emoji: '🛋️' },
  clothes:     { label: 'Clothes',      emoji: '👕' },
  music:       { label: 'Music',        emoji: '🎵' },
  holidays:    { label: 'Holidays',     emoji: '🎄' },
  days_of_week:{ label: 'Days',         emoji: '📅' },
  months:      { label: 'Months',       emoji: '🗓️' },
  technology:  { label: 'Technology',   emoji: '📱' },
};

const CATEGORY_ORDER = [
  'alphabet', 'numbers', 'colors', 'shapes',
  null,
  'days_of_week', 'months',
  null,
  'family', 'greetings', 'body_parts', 'verbs',
  null,
  'animals', 'dinosaurs',
  null,
  'food', 'fruits',
  null,
  'nature', 'weather', 'vehicles',
  null,
  'bathroom', 'bedroom', 'kitchen', 'living_room', 'clothes',
  null,
  'music', 'holidays', 'technology',
];

// ── State ──────────────────────────────────────────────────────────────────

let allDecks      = {};
let deckManifest  = [];
let deck      = [];       // full card list for current language + category
let queue     = [];       // ordered or shuffled indices into deck
let position  = 0;        // index into queue
let language  = 'greek';
let category  = 'all';
let shuffled  = false;
let settings  = { autoplay: true, enabledCategories: null, category: 'all', language: 'greek', levelFilter: null };
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
const elCardCalendar    = document.getElementById('card-calendar');
const elCalendarHeader  = elCardCalendar.querySelector('.calendar-header');
const elCalendarBody    = elCardCalendar.querySelector('.calendar-body');
const elCalendarProgress = document.getElementById('calendar-progress');
const elCardWord        = document.getElementById('card-word');
const elCardRomanized   = document.getElementById('card-romanized');
const elCardTranslation = document.getElementById('card-translation');
const elCardLevelDot    = document.getElementById('card-level-dot');
const elAudioBtn        = document.getElementById('audio-btn');
const elProgressBar     = document.getElementById('progress-bar');
const elProgressLabel   = document.getElementById('progress-label');
const elBtnPrev         = document.getElementById('btn-prev');
const elBtnNext         = document.getElementById('btn-next');
const elShuffleBtn      = document.getElementById('shuffle-btn');
const elNotesBtn             = document.getElementById('notes-btn');
const elNotesOverlay         = document.getElementById('notes-overlay');
const elNotesTitle           = document.getElementById('notes-title');
const elNotesBody            = document.getElementById('notes-body');
const elNotesClose           = document.getElementById('notes-close');
const elHelpOverlay          = document.getElementById('help-overlay');
const elHelpBtn              = document.getElementById('help-btn');
const elHelpClose            = document.getElementById('help-close');
const elHelpCloseBtn         = document.getElementById('help-close-btn');
const elSettingsBtn          = document.getElementById('settings-btn');
const elSettingsOverlay      = document.getElementById('settings-overlay');
const elSettingAutoplay      = document.getElementById('setting-autoplay');
const elSettingsClose        = document.getElementById('settings-close');
const elSettingsCategoryList = document.getElementById('settings-category-list');
const elSettingsDone         = document.getElementById('settings-done');
const elSettingsSelectAll    = document.getElementById('settings-select-all');
const elSettingsSelectNone   = document.getElementById('settings-select-none');
const elSettingsLevelBtns    = document.querySelectorAll('.settings-level-btn');

// ── Bootstrap ──────────────────────────────────────────────────────────────

async function loadDeck(lang) {
  if (allDecks[lang]) return;
  try {
    const res = await fetch(`data/decks/${lang}.json`);
    allDecks[lang] = await res.json();
  } catch (e) {
    console.error(`Failed to load deck: ${lang}`, e);
    allDecks[lang] = [];
  }
}

async function init() {
  loadSettings();

  try {
    const res = await fetch('data/manifest.json');
    const manifest = await res.json();
    deckManifest = manifest.decks || [];
  } catch (e) {
    console.error('Failed to load manifest.json', e);
    return;
  }

  language = settings.language;
  renderLanguageSelect();
  await loadDeck(language);
  switchLanguage(language);
  attachListeners();
  initInstallPrompt();
  showHelpIfFirstVisit();
}

// ── Language & category ────────────────────────────────────────────────────

function switchLanguage(lang) {
  language = lang;
  category = 'all';
  settings.language = lang;
  settings.category = 'all';
  saveSettings();
  buildDeck();
  renderCategoryTabs();

  const cardsWithImages = deck.filter(c => c.image);
  if (cardsWithImages.length > 0) {
    const pick = cardsWithImages[Math.floor(Math.random() * cardsWithImages.length)];
    category = pick.category;
    settings.category = pick.category;
    saveSettings();
    buildDeck();
    updateTabSelection();
  }

  buildQueue();
  renderCard();
}

function renderLanguageSelect() {
  elLanguageSelect.innerHTML = '';
  deckManifest.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.key;
    opt.textContent = `${d.flag} ${d.label}`;
    opt.disabled = !d.enabled;
    elLanguageSelect.appendChild(opt);
  });
  elLanguageSelect.value = language;
  elLanguageSelect.classList.toggle('hidden', deckManifest.length < 2);
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
  let cards = enabled ? all.filter(c => enabled.includes(c.category)) : all;
  if (settings.levelFilter) cards = cards.filter(c => c.level === settings.levelFilter);
  return cards;
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
  elCardImageWrap.classList.remove('has-image', 'has-swatch', 'has-shape', 'has-letter', 'has-speech', 'has-calendar', 'no-image');
  elCardColorSwatch.style.background = '';
  elCardShape.className = 'card-shape';
  elCardLetter.textContent = '';
  elCardLetter.className = 'card-letter';
  elCalendarHeader.innerHTML = '';
  elCalendarBody.innerHTML = '';
  elCalendarProgress.innerHTML = '';
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
    const parts = (card[language] || card.greek).split(' ');
    elCardLetter.innerHTML = parts.length === 2
      ? `<span class="letter-upper">${parts[0]}</span><span class="letter-lower">${parts[1]}</span>`
      : (card[language] || card.greek);
    elCardLetter.className = 'card-letter letter';
  } else if (card.category === 'days_of_week' || card.category === 'months') {
    elCardImageWrap.classList.add('has-calendar');
    const DAY_NUM   = {monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6,sunday:7};
    const MONTH_NUM = {january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12};
    const key   = card.id.replace(/^(days|months)_/, '');
    const total = card.category === 'days_of_week' ? 7 : 12;
    const pos   = card.category === 'days_of_week' ? DAY_NUM[key] : MONTH_NUM[key];
    const native = card[language] || card.greek;
    const stripAccents = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    const isDay = card.category === 'days_of_week';
    const abbr  = isDay
      ? native.trim().split(/\s+/).pop().slice(0, 1).toUpperCase()
      : stripAccents(native.replace(/\s+/g, '')).slice(0, 3).toUpperCase();
    elCalendarHeader.innerHTML =
      `<span class="cal-arrow">${pos > 1 ? '←' : ''}</span>` +
      `<span class="cal-dot"></span><span class="cal-dot"></span>` +
      `<span class="cal-arrow">${pos < total ? '→' : ''}</span>`;
    elCalendarBody.innerHTML = `<span class="cal-abbr ${isDay ? 'cal-abbr--day' : ''}">${abbr}</span>` +
      (!isDay ? `<span class="cal-num">${pos}</span>` : '');
    elCalendarProgress.innerHTML = Array.from({length: total}, (_, i) =>
      `<span class="cal-seg${i + 1 === pos ? ' cal-seg--active' : ''}"></span>`
    ).join('');
  } else if (card.category === 'greetings') {
    elCardImageWrap.classList.add('has-speech');
  } else {
    elCardImageWrap.classList.add('no-image');
  }

  elCardLevelDot.className = 'level-dot' + (card.level ? ` level-${card.level}` : '');
  elAudioBtn.classList.toggle('hidden', !card.audio);
  const wordText = card[language] || card.greek;
  elCardWord.textContent = wordText;
  elCardWord.classList.toggle('word-long',      wordText.length >= 10 && wordText.length < 13);
  elCardWord.classList.toggle('word-very-long', wordText.length >= 13);
  elCardWord.classList.toggle('word-hidden', card.category === 'alphabet');
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

function buildCategoryEntries(activeCatSet) {
  const result = [];
  let lastWasCat = false;
  let pendingDivider = false;
  for (const entry of CATEGORY_ORDER) {
    if (entry === null) {
      if (lastWasCat) pendingDivider = true;
      lastWasCat = false;
    } else if (activeCatSet.has(entry)) {
      if (pendingDivider) { result.push(null); pendingDivider = false; }
      result.push(entry);
      lastWasCat = true;
    }
  }
  const known = new Set(CATEGORY_ORDER.filter(Boolean));
  for (const cat of activeCatSet) {
    if (!known.has(cat)) result.push(cat);
  }
  return result;
}

function makeTabBtn(cat) {
  const meta = CATEGORY_META[cat];
  const emoji = cat === 'all' ? '⭐' : (meta ? meta.emoji : '');
  const label = cat === 'all' ? 'All' : (meta ? meta.label : cat);
  const btn = document.createElement('button');
  btn.className = 'tab-btn';
  btn.setAttribute('role', 'tab');
  btn.dataset.category = cat;
  btn.innerHTML = `<span class="tab-emoji">${emoji}</span><span class="tab-label${cat === 'all' ? ' tab-label--always' : ''}">${label}</span>`;
  btn.setAttribute('title', label);
  btn.setAttribute('aria-selected', cat === category ? 'true' : 'false');
  btn.addEventListener('click', () => switchCategory(cat));
  return btn;
}

function renderCategoryTabs() {
  elCategoryTabs.innerHTML = '';
  elCategoryTabs.appendChild(makeTabBtn('all'));

  const activeCatSet = new Set(getActiveCards().map(c => c.category));
  buildCategoryEntries(activeCatSet).forEach(entry => {
    if (entry === null) {
      const div = document.createElement('span');
      div.className = 'tab-divider';
      div.setAttribute('aria-hidden', 'true');
      elCategoryTabs.appendChild(div);
    } else {
      elCategoryTabs.appendChild(makeTabBtn(entry));
    }
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

  elSettingsLevelBtns.forEach(btn => {
    const val = btn.dataset.level ? Number(btn.dataset.level) : null;
    btn.setAttribute('aria-pressed', String(val === settings.levelFilter));
  });

  elSettingsOverlay.classList.remove('hidden');
}

function applySettings() {
  const all = allDecks[language] || [];
  const availableCats = [...new Set(all.map(c => c.category))];
  const checked = [...elSettingsCategoryList.querySelectorAll('input[type="checkbox"]')]
    .filter(cb => cb.checked)
    .map(cb => cb.dataset.cat);

  settings.enabledCategories = checked.length === availableCats.length ? null : checked;

  const activeLevel = [...elSettingsLevelBtns].find(b => b.getAttribute('aria-pressed') === 'true');
  settings.levelFilter = activeLevel?.dataset.level ? Number(activeLevel.dataset.level) : null;

  if (settings.enabledCategories && !settings.enabledCategories.includes(category)) {
    category = 'all';
  }

  buildDeck();

  if (deck.length === 0) {
    category = 'all';
    buildDeck();
  }

  settings.category = category;
  saveSettings();

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

// ── Help ───────────────────────────────────────────────────────────────────

function openHelp() {
  elHelpOverlay.classList.remove('hidden');
}

function closeHelp() {
  localStorage.setItem('lingocards_welcomed', '1');
  elHelpOverlay.classList.add('hidden');
}

function showHelpIfFirstVisit() {
  if (!localStorage.getItem('lingocards_welcomed')) openHelp();
}

// ── Language notes ─────────────────────────────────────────────────────────

function openNotes() {
  const meta  = deckManifest.find(d => d.key === language) || {};
  const notes = meta.user_notes || [];
  elNotesTitle.textContent = (meta.label || language) + ' — Notes';
  elNotesBody.innerHTML = notes.map(n =>
    `<div class="note-card">
      <div class="note-card-title">${n.title}</div>
      <div class="note-card-body">${n.body}</div>
    </div>`
  ).join('');
  elNotesOverlay.classList.remove('hidden');
}

function closeNotes() {
  elNotesOverlay.classList.add('hidden');
}

// ── Event listeners ────────────────────────────────────────────────────────

function attachListeners() {
  elLanguageSelect.addEventListener('change', async e => {
    await loadDeck(e.target.value);
    switchLanguage(e.target.value);
  });

  elBtnPrev.addEventListener('click', goPrev);
  elBtnNext.addEventListener('click', goNext);

  elNotesBtn.addEventListener('click', openNotes);
  elNotesClose.addEventListener('click', closeNotes);
  elHelpBtn.addEventListener('click', openHelp);
  elHelpClose.addEventListener('click', closeHelp);
  elHelpCloseBtn.addEventListener('click', closeHelp);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (!elHelpOverlay.classList.contains('hidden'))    { closeHelp();    return; }
      if (!elNotesOverlay.classList.contains('hidden'))   { closeNotes();   return; }
      if (!elSettingsOverlay.classList.contains('hidden')){ closeSettings(); return; }
    }
    if (!elHelpOverlay.classList.contains('hidden')) return;
    if (!elSettingsOverlay.classList.contains('hidden')) return;
    if (!elNotesOverlay.classList.contains('hidden')) return;
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goPrev(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
  });

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

  elSettingsLevelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const isLevel = !!btn.dataset.level;
      const wasActive = btn.getAttribute('aria-pressed') === 'true';
      elSettingsLevelBtns.forEach(b => b.setAttribute('aria-pressed', 'false'));
      if (!wasActive || !isLevel) {
        btn.setAttribute('aria-pressed', 'true');
      } else {
        elSettingsLevelBtns[0].setAttribute('aria-pressed', 'true'); // back to All
      }
    });
  });
}

// ── Install prompt ─────────────────────────────────────────────────────────

function initInstallPrompt() {
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || navigator.standalone === true;
  if (isInstalled || localStorage.getItem('install-dismissed')) return;

  const banner   = document.getElementById('install-banner');
  const msgEl    = document.getElementById('install-msg');
  const installBtn = document.getElementById('install-btn');
  const dismissBtn = document.getElementById('install-dismiss');

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  if (isIOS) {
    msgEl.textContent = "Tap the Share button then 'Add to Home Screen'";
    installBtn.classList.add('hidden');
    banner.classList.remove('hidden');
  }

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    const prompt = e;
    msgEl.textContent = 'Install LingoCards for offline use';
    banner.classList.remove('hidden');
    installBtn.addEventListener('click', async () => {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      banner.classList.add('hidden');
      if (outcome === 'accepted') localStorage.setItem('install-dismissed', '1');
    }, { once: true });
  });

  window.addEventListener('appinstalled', () => {
    banner.classList.add('hidden');
    localStorage.setItem('install-dismissed', '1');
  });

  dismissBtn.addEventListener('click', () => {
    banner.classList.add('hidden');
    localStorage.setItem('install-dismissed', '1');
  });
}

// ── Service worker ─────────────────────────────────────────────────────────

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// ── Go ─────────────────────────────────────────────────────────────────────

init();
