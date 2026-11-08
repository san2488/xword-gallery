const TYPES = {
  midi: { label: 'Modern Midi', icon: '▦', base: 'https://www.seattletimes.com/games-crossword-midi-modern/', prefix: 'seattletimes-pop-midi-', set: 'seattletimes-contemporary-midi-crossword', confirmed: date => (date >= '2026-10-18' && date <= '2026-10-24') || date === '2026-11-07' },
  mini: { label: 'Mini', icon: '▥', base: 'https://www.seattletimes.com/games-crossword-mini/', prefix: 'seattle-crossword-mini-', set: 'seattletimes-crossword-mini', confirmed: date => date === '2026-11-07' }
};
const STORAGE_KEY = 'crossword-gallery:v2';
const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
const now = Object.fromEntries(parts.map(part => [part.type, part.value]));
const today = `${now.year}-${now.month}-${now.day}`;
const state = loadState();
let selectedType = 'midi';
let month = today.slice(0, 7);
let savedOnly = false;
const gallery = document.querySelector('#gallery');
const monthPicker = document.querySelector('#month-picker');
const dateSearch = document.querySelector('#date-search');
const savedCount = document.querySelector('#saved-count');
const savedFilter = document.querySelector('#saved-filter');
monthPicker.max = today.slice(0, 7);
document.querySelector('#type-tabs').innerHTML = Object.entries(TYPES).map(([key, type]) => `<button class="type-tab" id="tab-${key}" type="button" role="tab" aria-selected="${key === selectedType}" aria-controls="gallery" data-type="${key}"><span class="tab-icon" aria-hidden="true">${type.icon}</span> ${type.label}</button>`).join('');

function loadState() {
  const emptyByType = () => Object.fromEntries(Object.keys(TYPES).map(type => [type, []]));
  const result = { saved: emptyByType(), visited: emptyByType() };
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored) {
      for (const kind of ['saved', 'visited']) for (const type of Object.keys(TYPES))
        result[kind][type] = Array.isArray(stored[kind]?.[type]) ? stored[kind][type] : [];
      return result;
    }
    const older = JSON.parse(localStorage.getItem('modern-midi-gallery:v1'));
    if (older) {
      result.saved.midi = Array.isArray(older.saved) ? older.saved : [];
      result.visited.midi = Array.isArray(older.visited) ? older.visited : [];
    }
  } catch { /* Ignore malformed local storage. */ }
  return result;
}
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function linkFor(date, type = selectedType) {
  const puzzle = TYPES[type];
  const params = new URLSearchParams({ id: puzzle.prefix + date.replaceAll('-', ''), set: puzzle.set, puzzleType: 'crossword' });
  return `${puzzle.base}?${params}`;
}
function daysInMonth(value) {
  const [year, monthNumber] = value.split('-').map(Number);
  const count = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return Array.from({ length: count }, (_, index) => `${value}-${String(index + 1).padStart(2, '0')}`).reverse().filter(date => date <= today);
}
function pretty(date) { return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)); }
function weekday(date) { return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)); }
function smallGrid(date) {
  const seed = Number(date.replaceAll('-', ''));
  return Array.from({ length: 25 }, (_, i) => `<i class="${((i * 13 + seed) % 9 < 2 && i !== 12) ? 'block' : ''}"></i>`).join('');
}
function card(date) {
  const saved = state.saved[selectedType].includes(date);
  const visited = state.visited[selectedType].includes(date);
  const confirmed = TYPES[selectedType].confirmed(date);
  return `<article class="puzzle-card ${confirmed ? 'confirmed' : ''} ${visited ? 'visited' : ''}" data-date="${date}">
    <div class="card-top"><div class="mini-grid" aria-hidden="true">${smallGrid(date)}</div><button class="save-button ${saved ? 'active' : ''}" type="button" data-save="${date}" aria-label="${saved ? 'Remove' : 'Save'} ${TYPES[selectedType].label} ${pretty(date)}" aria-pressed="${saved}">${saved ? '★' : '☆'}</button></div>
    <div class="card-meta"><p class="card-date">${new Date(`${date}T12:00:00Z`).getUTCDate()} <span class="sr-only">${pretty(date)}</span></p><div class="card-weekday">${weekday(date)}</div></div>
    <div class="card-bottom"><span class="status">${visited ? 'Opened' : confirmed ? 'Seen in archive' : 'Date link'}</span><a class="play-link" href="${linkFor(date)}" target="_blank" rel="noopener noreferrer" data-open="${date}" aria-label="Play ${TYPES[selectedType].label} ${pretty(date)} on The Seattle Times">Play ↗</a></div>
  </article>`;
}
function render() {
  const search = dateSearch.value.trim().toLowerCase();
  const dates = daysInMonth(month).filter(date => (!savedOnly || state.saved[selectedType].includes(date)) && (!search || pretty(date).toLowerCase().includes(search) || weekday(date).toLowerCase().includes(search) || date.includes(search)));
  gallery.innerHTML = dates.map(card).join('');
  document.querySelector('#empty-state').hidden = dates.length > 0;
  savedCount.textContent = state.saved[selectedType].length;
  document.querySelector('#next-month').disabled = month >= today.slice(0, 7);
  monthPicker.value = month;
  document.querySelector('#publisher-link').href = TYPES[selectedType].base;
  document.querySelector('#archive-link').href = TYPES[selectedType].base;
  for (const tab of document.querySelectorAll('.type-tab')) tab.setAttribute('aria-selected', String(tab.dataset.type === selectedType));
}
function changeMonth(delta) {
  const [year, monthNumber] = month.split('-').map(Number);
  const next = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
  const value = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`;
  if (value <= today.slice(0, 7)) { month = value; render(); }
}
function chooseType(type) { if (TYPES[type]) { selectedType = type; render(); } }
function openDate(date) {
  if (!state.visited[selectedType].includes(date)) { state.visited[selectedType].push(date); persist(); }
  window.open(linkFor(date), '_blank', 'noopener,noreferrer');
  render();
}
gallery.addEventListener('click', event => {
  const save = event.target.closest('[data-save]');
  if (save) {
    const date = save.dataset.save, items = state.saved[selectedType];
    state.saved[selectedType] = items.includes(date) ? items.filter(item => item !== date) : [...items, date];
    persist(); render(); return;
  }
  const open = event.target.closest('[data-open]');
  if (open && !state.visited[selectedType].includes(open.dataset.open)) {
    state.visited[selectedType].push(open.dataset.open);
    persist(); setTimeout(render, 0);
  }
});
document.querySelectorAll('.type-tab').forEach(tab => {
  tab.addEventListener('click', () => chooseType(tab.dataset.type));
  tab.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const keys = Object.keys(TYPES);
    const offset = event.key === 'ArrowRight' ? 1 : -1;
    const next = keys[(keys.indexOf(selectedType) + offset + keys.length) % keys.length];
    chooseType(next);
    document.querySelector(`#tab-${next}`).focus();
  });
});
document.querySelector('#previous-month').addEventListener('click', () => changeMonth(-1));
document.querySelector('#next-month').addEventListener('click', () => changeMonth(1));
monthPicker.addEventListener('change', () => { if (monthPicker.value) { month = monthPicker.value; render(); } });
dateSearch.addEventListener('input', render);
savedFilter.addEventListener('click', () => { savedOnly = !savedOnly; savedFilter.setAttribute('aria-pressed', String(savedOnly)); render(); });
document.querySelector('#today-button').addEventListener('click', () => openDate(today));
document.querySelector('#random-button').addEventListener('click', () => {
  const candidates = daysInMonth(month);
  if (candidates.length) openDate(candidates[Math.floor(Math.random() * candidates.length)]);
});
render();
