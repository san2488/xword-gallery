const TYPES = {
  midi: { label: 'Modern Midi', icon: '▦', base: 'https://www.seattletimes.com/games-crossword-midi-modern/', prefix: 'seattletimes-pop-midi-', set: 'seattletimes-contemporary-midi-crossword' },
  mini: { label: 'Mini', icon: '▥', base: 'https://www.seattletimes.com/games-crossword-mini/', prefix: 'seattle-crossword-mini-', set: 'seattletimes-crossword-mini' }
};
const STORAGE_KEY = 'crossword-gallery:v3';
const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
const now = Object.fromEntries(parts.map(part => [part.type, part.value]));
const today = `${now.year}-${now.month}-${now.day}`;
const currentMonth = today.slice(0, 7);
const state = loadState();
const gallery = document.querySelector('#gallery');
const monthPicker = document.querySelector('#month-picker');
const sentinel = document.querySelector('#load-sentinel');
let selectedType = 'midi';
let oldestMonth = currentMonth;
let loading = false;
monthPicker.max = currentMonth;
monthPicker.value = currentMonth;
document.querySelector('#type-tabs').innerHTML = Object.entries(TYPES).map(([key, type]) => `<button class="type-tab" id="tab-${key}" type="button" role="tab" aria-selected="${key === selectedType}" aria-controls="gallery" data-type="${key}"><span class="tab-icon" aria-hidden="true">${type.icon}</span> ${type.label}</button>`).join('');

function emptyByType() { return Object.fromEntries(Object.keys(TYPES).map(type => [type, []])); }
function loadState() {
  const result = { visited: emptyByType(), completed: emptyByType() };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) {
      for (const kind of ['visited', 'completed']) for (const type of Object.keys(TYPES))
        result[kind][type] = Array.isArray(saved[kind]?.[type]) ? saved[kind][type] : [];
      return result;
    }
    const old = JSON.parse(localStorage.getItem('crossword-gallery:v2'));
    if (old) for (const type of Object.keys(TYPES))
      result.visited[type] = Array.isArray(old.visited?.[type]) ? old.visited[type] : [];
    else {
      const first = JSON.parse(localStorage.getItem('modern-midi-gallery:v1'));
      if (first && Array.isArray(first.visited)) result.visited.midi = first.visited;
    }
  } catch { /* Ignore malformed local state. */ }
  return result;
}
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function linkFor(date, type = selectedType) {
  const puzzle = TYPES[type];
  const params = new URLSearchParams({ id: puzzle.prefix + date.replaceAll('-', ''), set: puzzle.set, puzzleType: 'crossword' });
  return `${puzzle.base}?${params}`;
}
function pretty(date) { return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)); }
function monthName(value) { return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}-01T12:00:00Z`)); }
function weekday(date) { return new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)); }
function previousMonth(value) {
  const [year, number] = value.split('-').map(Number);
  const previous = new Date(Date.UTC(year, number - 2, 1));
  return `${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, '0')}`;
}
function datesFor(value) {
  const [year, number] = value.split('-').map(Number);
  const count = new Date(Date.UTC(year, number, 0)).getUTCDate();
  return Array.from({ length: count }, (_, index) => `${value}-${String(index + 1).padStart(2, '0')}`).reverse().filter(date => date <= today);
}
function card(date) {
  const completed = state.completed[selectedType].includes(date);
  const name = `${TYPES[selectedType].label} ${pretty(date)}`;
  return `<article class="puzzle-card ${completed ? 'completed' : ''}">
    <a class="card-link" href="${linkFor(date)}" target="_blank" rel="noopener noreferrer" data-open="${date}" aria-label="Play ${name} on The Seattle Times">
      <span class="card-number">${Number(date.slice(-2))}</span>
      <span class="card-bottom"><span class="card-weekday">${weekday(date)}</span><span class="card-status">Play ↗</span></span>
    </a>
    <button class="complete-button" type="button" data-complete="${date}" aria-label="Mark ${name} ${completed ? 'not complete' : 'complete'}" aria-pressed="${completed}" title="${completed ? 'Mark not complete' : 'Mark complete'}">✓</button>
  </article>`;
}
function appendMonth(value) {
  const section = document.createElement('section');
  section.className = 'month-section';
  section.id = `month-${value}`;
  section.setAttribute('aria-label', monthName(value));
  section.innerHTML = `<h2 class="month-heading">${monthName(value)}</h2><div class="month-grid">${datesFor(value).map(card).join('')}</div>`;
  gallery.append(section);
  oldestMonth = value;
}
function refreshCards() {
  for (const section of gallery.querySelectorAll('.month-section')) {
    const value = section.id.slice(6);
    section.querySelector('.month-grid').innerHTML = datesFor(value).map(card).join('');
  }
}
function activeMonth() {
  let result = monthPicker.value || currentMonth;
  for (const section of gallery.querySelectorAll('.month-section')) {
    if (section.getBoundingClientRect().top < window.innerHeight * 0.5) result = section.id.slice(6);
  }
  return result;
}
function resetToMonth(value, scroll = false) {
  gallery.replaceChildren();
  appendMonth(value);
  monthPicker.value = value;
  if (scroll) requestAnimationFrame(() => document.querySelector(`#month-${value}`).scrollIntoView({ block: 'start' }));
}
function chooseType(type) {
  if (!TYPES[type] || type === selectedType) return;
  const value = activeMonth();
  selectedType = type;
  for (const tab of document.querySelectorAll('.type-tab')) tab.setAttribute('aria-selected', String(tab.dataset.type === type));
  document.querySelector('#archive-link').href = TYPES[type].base;
  resetToMonth(value, true);
}
function openDate(date) {
  if (!state.visited[selectedType].includes(date)) { state.visited[selectedType].push(date); persist(); }
  window.open(linkFor(date), '_blank', 'noopener,noreferrer');
  refreshCards();
}
gallery.addEventListener('click', event => {
  const complete = event.target.closest('[data-complete]');
  if (complete) {
    const date = complete.dataset.complete;
    const items = state.completed[selectedType];
    state.completed[selectedType] = items.includes(date) ? items.filter(item => item !== date) : [...items, date];
    persist();
    refreshCards();
    return;
  }
  const open = event.target.closest('[data-open]');
  if (open && !state.visited[selectedType].includes(open.dataset.open)) {
    state.visited[selectedType].push(open.dataset.open);
    persist();
    requestAnimationFrame(refreshCards);
  }
});
document.querySelectorAll('.type-tab').forEach(tab => {
  tab.addEventListener('click', () => chooseType(tab.dataset.type));
  tab.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const keys = Object.keys(TYPES);
    const next = keys[(keys.indexOf(selectedType) + (event.key === 'ArrowRight' ? 1 : -1) + keys.length) % keys.length];
    chooseType(next);
    document.querySelector(`#tab-${next}`).focus();
  });
});
monthPicker.addEventListener('change', () => {
  if (monthPicker.value && monthPicker.value <= currentMonth) resetToMonth(monthPicker.value, true);
});
document.querySelector('#today-button').addEventListener('click', () => openDate(today));
document.querySelector('#random-button').addEventListener('click', () => {
  const dates = datesFor(activeMonth());
  if (dates.length) openDate(dates[Math.floor(Math.random() * dates.length)]);
});
const loader = new IntersectionObserver(entries => {
  if (!entries[0].isIntersecting || loading) return;
  loading = true;
  requestAnimationFrame(() => {
    appendMonth(previousMonth(oldestMonth));
    loading = false;
    loader.unobserve(sentinel);
    loader.observe(sentinel);
  });
}, { rootMargin: '250px' });
resetToMonth(currentMonth);
loader.observe(sentinel);
