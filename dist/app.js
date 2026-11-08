const BASE = 'https://www.seattletimes.com/games-crossword-midi-modern/';
const SET = 'seattletimes-contemporary-midi-crossword';
const STORAGE_KEY = 'modern-midi-gallery:v1';
const sharedDate = '2026-11-07';

const state = loadState();
const nowParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
const current = Object.fromEntries(nowParts.map(part => [part.type, part.value]));
const today = `${current.year}-${current.month}-${current.day}`;
let month = today.slice(0, 7);
let savedOnly = false;

const gallery = document.querySelector('#gallery');
const monthPicker = document.querySelector('#month-picker');
const dateSearch = document.querySelector('#date-search');
const savedCount = document.querySelector('#saved-count');
const savedFilter = document.querySelector('#saved-filter');
monthPicker.max = today.slice(0, 7);
monthPicker.value = month;

function loadState() {
  try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY)); return { saved: value?.saved || [], visited: value?.visited || [] }; }
  catch { return { saved: [], visited: [] }; }
}
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function linkFor(date) { return `${BASE}?id=seattletimes-pop-midi-${date.replaceAll('-', '')}&set=${SET}&puzzleType=crossword`; }
function daysInMonth(value) {
  const [year, monthNumber] = value.split('-').map(Number);
  const count = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return Array.from({ length: count }, (_, index) => `${value}-${String(index + 1).padStart(2, '0')}`).reverse().filter(date => date <= today);
}
function pretty(date) { return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)); }
function weekday(date) { return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)); }
function isConfirmed(date) { return (date >= '2026-10-18' && date <= '2026-10-24') || date === sharedDate; }
function miniGrid(date) {
  const seed = Number(date.replaceAll('-', ''));
  return Array.from({ length: 25 }, (_, i) => `<i class="${((i * 13 + seed) % 9 < 2 && i !== 12) ? 'block' : ''}"></i>`).join('');
}
function card(date) {
  const saved = state.saved.includes(date), visited = state.visited.includes(date), confirmed = isConfirmed(date);
  return `<article class="puzzle-card ${confirmed ? 'confirmed' : ''} ${visited ? 'visited' : ''}" data-date="${date}">
    <div class="card-top"><div class="mini-grid" aria-hidden="true">${miniGrid(date)}</div><button class="save-button ${saved ? 'active' : ''}" type="button" data-save="${date}" aria-label="${saved ? 'Remove' : 'Save'} ${pretty(date)}" aria-pressed="${saved}">${saved ? '★' : '☆'}</button></div>
    <div><p class="card-date">${new Date(`${date}T12:00:00Z`).getUTCDate()} <span class="sr-only">${pretty(date)}</span></p><div class="card-weekday">${weekday(date)}</div></div>
    <div class="card-bottom"><span class="status">${visited ? 'Opened' : confirmed ? 'Seen in archive' : 'Date link'}</span><a class="play-link" href="${linkFor(date)}" target="_blank" rel="noopener noreferrer" data-open="${date}" aria-label="Play ${pretty(date)} on The Seattle Times">Play ↗</a></div>
  </article>`;
}
function render() {
  const search = dateSearch.value.trim().toLowerCase();
  const dates = daysInMonth(month).filter(date => {
    if (savedOnly && !state.saved.includes(date)) return false;
    return !search || pretty(date).toLowerCase().includes(search) || weekday(date).toLowerCase().includes(search) || date.includes(search);
  });
  gallery.innerHTML = dates.map(card).join('');
  document.querySelector('#empty-state').hidden = dates.length > 0;
  savedCount.textContent = state.saved.length;
  document.querySelector('#next-month').disabled = month >= today.slice(0, 7);
  monthPicker.value = month;
}
function changeMonth(delta) {
  const [year, monthNumber] = month.split('-').map(Number);
  const next = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
  const value = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`;
  if (value <= today.slice(0, 7)) { month = value; render(); }
}
function openDate(date) {
  if (!state.visited.includes(date)) { state.visited.push(date); persist(); }
  window.open(linkFor(date), '_blank', 'noopener,noreferrer');
  render();
}
gallery.addEventListener('click', event => {
  const save = event.target.closest('[data-save]');
  if (save) {
    const date = save.dataset.save;
    state.saved = state.saved.includes(date) ? state.saved.filter(item => item !== date) : [...state.saved, date];
    persist(); render(); return;
  }
  const open = event.target.closest('[data-open]');
  if (open) {
    const date = open.dataset.open;
    if (!state.visited.includes(date)) { state.visited.push(date); persist(); }
    setTimeout(render, 0);
  }
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
const heroPattern = ['.B..#..','..R.#..','#..E..#','..#A#..','..K..#.','...#..S','.#...#.'];
document.querySelector('#hero-grid').innerHTML = heroPattern.join('').split('').map(char => `<span class="grid-cell ${char === '#' ? 'dark' : char === '.' ? '' : 'accent'}">${/[A-Z]/.test(char) ? char : ''}</span>`).join('');
render();
