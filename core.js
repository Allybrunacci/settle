/* Settle — core: helpers, dates, the activation scale, saved data, router, sheets, toasts, sound, wake lock */
'use strict';

const APP_VERSION = '1.1.0';
const STORE_KEY = 'settle:v1';

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const sum = a => a.reduce((t, n) => t + n, 0);
const avg = a => (a.length ? sum(a) / a.length : null);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + 's'}`;
const icon = (id, cls) => `<svg class="ico${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const reduceMotion = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const MINUS = '\u2212';
const f1 = n => { const r = Math.round(n * 10) / 10; return (Object.is(r, -0) ? 0 : r).toFixed(1); };
const signed = n => (n > 0.05 ? `+${f1(n)}` : n < -0.05 ? `${MINUS}${f1(-n)}` : '0.0');
// A drop in activation, shown as calmer (down) or more activated (up).
const dropText = d => (d > 0.05 ? `${icon('down', 'sm')}${f1(d)} calmer` : d < -0.05 ? `${icon('up', 'sm')}${f1(-d)} higher` : 'no change');
const isNum = n => typeof n === 'number' && isFinite(n);
const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const STANDALONE = () => !!((window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone);

/* ---------- dates ---------- */
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WD_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MON_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pad = n => String(n).padStart(2, '0');
const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const todayKey = () => dkey(new Date());
const addDays = (k, n) => { const d = fromKey(k); d.setDate(d.getDate() + n); return dkey(d); };
const dayOf = ts => dkey(new Date(ts));
const isKey = k => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k);
function fmtTime(ts) {
  const d = new Date(ts);
  const h = d.getHours();
  return `${h % 12 || 12}:${pad(d.getMinutes())} ${h < 12 ? 'am' : 'pm'}`;
}
const fmtDay = k => { const d = fromKey(k); return `${WD[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}${d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : ''}`; };
const fmtDayLong = k => { const d = fromKey(k); return `${WD_LONG[d.getDay()]} ${d.getDate()} ${MON_LONG[d.getMonth()]}`; };
function relDay(k) {
  const t = todayKey();
  if (k === t) return 'Today';
  if (k === addDays(t, -1)) return 'Yesterday';
  return fmtDay(k);
}
const fmtClock = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${pad(s % 60)}`; };
const fmtMins = m => (m < 1 ? `${Math.round(m * 60)} sec` : `${Math.round(m * 10) / 10} min`);
function fmtSecs(s) {
  s = Math.round(s);
  if (s < 60) return `${s} sec`;
  const m = Math.floor(s / 60), r = s % 60;
  return r && m < 10 ? `${m} min ${r} sec` : `${Math.round(s / 60)} min`;
}
function ago(ts) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return relDay(dayOf(ts));
}
// Local "YYYY-MM-DDTHH:MM" for <input type=datetime-local>.
const localInput = ts => { const d = new Date(ts); return `${dkey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };

/* ---------- the activation scale ---------- */
const LEVELS = [
  ['Deeply calm', 'Heavy, loose and at ease. Breathing slow and easy.'],
  ['Very calm', 'Relaxed and settled.'],
  ['Calm', 'Mostly at ease, alert enough.'],
  ['Steady', 'Comfortable and clear-headed, a little alert.'],
  ['A bit on edge', 'Some tension or restlessness, but in control.'],
  ['Activated', 'Noticeably tense or restless. Harder to focus.'],
  ['Quite activated', 'Heart a bit fast, breathing shallow, hard to switch off.'],
  ['Highly activated', 'Very tense or wired. Thoughts racing.'],
  ['Very high', 'Hard to think straight. Strong urge to fight, run or escape.'],
  ['Overwhelmed', 'Flooded: shaky, panicky or close to it.'],
  ['Maxed out', 'Panic or complete overwhelm. Can’t settle at all.'],
];
const ZONES = [
  { id: 'low', name: 'Settled', range: '0–3', lo: 0, hi: 3 },
  { id: 'mid', name: 'Activated', range: '4–6', lo: 4, hi: 6 },
  { id: 'high', name: 'High', range: '7–10', lo: 7, hi: 10 },
];
const zoneOf = n => (n <= 3 ? ZONES[0] : n <= 6 ? ZONES[1] : ZONES[2]);
const lvlWord = n => LEVELS[clamp(Math.round(n), 0, 10)][0];
// A level chip: colour + number (+ word), so colour is never the only cue.
const lvl = (n, word) => `<span class="lvl" style="--c:var(--a${clamp(Math.round(n), 0, 10)})"><b>${n}</b>${word ? `<span>${lvlWord(n)}</span>` : ''}</span>`;
const lvlArrow = (a, b) => `<span class="pair">${lvl(a)}<span class="arrow" aria-label="to">${icon('arrow-r', 'sm')}</span>${lvl(b)}</span>`;

// Heat colours for the body map: honey (mild) through terracotta to oxblood (severe). t is 0..1.
const HEAT = [[242, 214, 138], [236, 178, 103], [219, 128, 82], [183, 82, 62], [128, 46, 48]];
function heat(t) {
  t = clamp(t, 0, 1) * (HEAT.length - 1);
  const i = Math.min(HEAT.length - 2, Math.floor(t)), f = t - i;
  const c = HEAT[i].map((v, k) => Math.round(v + (HEAT[i + 1][k] - v) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
const heatN = n => heat((clamp(n, 1, 10) - 1) / 9);

/* ---------- saved data ---------- */
function freshState() {
  return {
    v: 1, created: todayKey(), onboarded: false,
    prefs: { sound: true, silent: false, haptics: true, volume: 0.7, theme: 'auto', voice: false, bg: 'off', remind: ['10:00', '14:00', '19:00'] },
    favs: [],
    toolPrefs: {},
    entries: [],
    customTags: [],
    active: null,
    pending: null,
    hide: {},
    savedAt: 0,
  };
}
const obj = x => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
const arr = x => (Array.isArray(x) ? x : []);
const str = (x, n) => String(x == null ? '' : x).slice(0, n);
const lvlOrNull = x => (x === null || x === undefined || x === '' || !isFinite(+x) ? null : clamp(Math.round(+x), 0, 10));
function cleanBody(b) {
  const out = {};
  for (const [k, v] of Object.entries(obj(b))) {
    if (!/^[a-zA-Z]{2,20}$/.test(k) || !v || typeof v !== 'object') continue;
    const n = clamp(Math.round(+v.n || 0), 0, 10);
    if (n > 0) out[k] = { n, k: ['t', 'p', 'b'].includes(v.k) ? v.k : 't' };
  }
  return out;
}
const ID_RE = /^[a-z0-9]{1,24}$/i, TOOL_RE = /^[a-z0-9-]{1,30}$/;
const cleanId = x => (ID_RE.test(String(x || '')) ? String(x) : uid());
function cleanDraft(r) {
  if (!r || typeof r !== 'object') return undefined;
  return { rating: r.rating ? clamp(Math.round(+r.rating), 1, 5) : null, after: lvlOrNull(r.after), note: str(r.note, 2000), body: r.body ? cleanBody(r.body) : null };
}
function cleanUse(u) {
  u = obj(u);
  if (!TOOL_RE.test(String(u.tool || ''))) return null;
  return {
    id: cleanId(u.id), tool: String(u.tool), mins: clamp(+u.mins || 1, 0.25, 120), secs: clamp(Math.round(+u.secs || 0), 0, 7200),
    start: +u.start || 0, end: +u.end || 0, pattern: str(u.pattern, 20),
    before: lvlOrNull(u.before), after: lvlOrNull(u.after), rating: u.rating ? clamp(Math.round(+u.rating), 1, 5) : null,
    note: str(u.note, 2000), body: u.body ? cleanBody(u.body) : null,
  };
}
function cleanEntry(e) {
  e = obj(e);
  const at = +e.at;
  if (!at || !isFinite(at)) return null;
  const act = lvlOrNull(e.act);
  if (act === null) return null;
  return {
    id: cleanId(e.id), at, act,
    feels: arr(e.feels).map(x => str(x, 30)).filter(Boolean).slice(0, 30),
    tags: arr(e.tags).map(x => str(x, 40)).filter(Boolean).slice(0, 30),
    body: cleanBody(e.body), note: str(e.note, 4000), src: e.src === 'tool' ? 'tool' : 'checkin',
    uses: arr(e.uses).map(cleanUse).filter(Boolean),
  };
}
function migrate(d) {
  const s = freshState();
  if (!d || typeof d !== 'object') return s;
  s.created = isKey(d.created) ? d.created : s.created;
  s.onboarded = !!d.onboarded;
  const p = obj(d.prefs);
  s.prefs.sound = p.sound !== false;
  s.prefs.silent = !!p.silent;
  s.prefs.haptics = p.haptics !== false;
  s.prefs.volume = clamp(p.volume === undefined ? 0.7 : +p.volume || 0, 0, 1);
  s.prefs.theme = ['auto', 'light', 'dark'].includes(p.theme) ? p.theme : 'auto';
  s.prefs.voice = !!p.voice;
  s.prefs.bg = ['off', 'noise', 'waves'].includes(p.bg) ? p.bg : 'off';
  if (Array.isArray(p.remind)) s.prefs.remind = p.remind.filter(t => /^\d\d:\d\d$/.test(t)).slice(0, 8);
  s.favs = arr(d.favs).map(x => String(x || '')).filter(x => TOOL_RE.test(x));
  for (const [k, v] of Object.entries(obj(d.toolPrefs))) if (TOOL_RE.test(k)) s.toolPrefs[k] = { mins: clamp(+obj(v).mins || 0, 0, 120) || undefined, pattern: str(obj(v).pattern, 20), rate: +obj(v).rate || undefined };
  s.entries = arr(d.entries).map(cleanEntry).filter(Boolean).sort((a, b) => a.at - b.at);
  s.customTags = arr(d.customTags).map(x => str(x, 30).trim()).filter(Boolean).slice(0, 40);
  const a = obj(d.active);
  if (ID_RE.test(String(a.entryId || '')) && TOOL_RE.test(String(a.tool || '')) && +a.start) {
    s.active = { entryId: String(a.entryId), tool: String(a.tool), mins: clamp(+a.mins || 1, 0.25, 120), plan: clamp(+a.plan || +a.mins || 1, 0.25, 120), pattern: str(a.pattern, 20), rate: +a.rate || 0, before: lvlOrNull(a.before), start: +a.start, paused: +a.paused || null, pausedMs: +a.pausedMs || 0, done: !!a.done, end: +a.end || null, skip: +a.skip || 0, useId: cleanId(a.useId) };
    const dr = cleanDraft(a.draft);
    if (dr) s.active.draft = dr;
  }
  const pe = obj(d.pending);
  if (ID_RE.test(String(pe.entryId || '')) && +pe.at) s.pending = { entryId: String(pe.entryId), at: +pe.at };
  const h = obj(d.hide);
  s.hide = { install: !!h.install, lastBackup: +h.lastBackup || 0 };
  s.savedAt = +d.savedAt || 0;
  return s;
}
let S = freshState();
let SAVE_OK = true;
function load() {
  let raw = null;
  try { raw = localStorage.getItem(STORE_KEY); } catch (e) { SAVE_OK = false; }
  if (!raw) return freshState();
  try { return migrate(JSON.parse(raw)); } catch (e) {
    try { localStorage.setItem(`${STORE_KEY}:unreadable-${Date.now()}`, raw); } catch (_) { /* full */ }
    return freshState();
  }
}
function save() {
  S.savedAt = Date.now();
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); SAVE_OK = true; return true; } catch (e) {
    SAVE_OK = false;
    toast('Couldn’t save on this phone. Storage may be full. Your latest changes are kept while the app stays open; make a backup in Settings.', { ms: 8000, cls: 'bad' });
    return false;
  }
}
const entryById = id => S.entries.find(e => e.id === id) || null;
function addEntry(e) {
  S.entries.push(e);
  S.entries.sort((a, b) => a.at - b.at);
  return e;
}
const isFav = id => S.favs.includes(id);
function toggleFav(id) {
  if (isFav(id)) S.favs = S.favs.filter(x => x !== id); else S.favs.push(id);
  save();
  return isFav(id);
}
// The activation level just before a new tool use in this entry (the last "after", or the check-in).
function currentLevel(e) {
  for (let i = e.uses.length - 1; i >= 0; i--) if (e.uses[i].after !== null) return e.uses[i].after;
  return e.act;
}

/* ---------- toasts ---------- */
let toastTimer = null;
function toast(msg, opts = {}) {
  const root = $('#toast-root');
  if (!root) return () => {};
  clearTimeout(toastTimer);
  root.innerHTML = '';
  const action = opts.action || (opts.undo ? { label: 'Undo', fn: opts.undo } : null);
  const el = document.createElement('div');
  el.className = 'toast' + (opts.cls ? ' ' + opts.cls : '');
  el.innerHTML = `<span>${msg}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
  root.append(el);
  const hide = () => { clearTimeout(toastTimer); el.classList.add('out'); setTimeout(() => el.remove(), 250); };
  toastTimer = setTimeout(hide, opts.ms || (action ? 6500 : 3000));
  if (action) el.querySelector('button').addEventListener('click', () => { hide(); action.fn(); });
  return hide;
}

/* ---------- bottom sheets ---------- */
let SHEET = null;
function openSheet(html, opts = {}) {
  closeSheet(true);
  const root = $('#sheet-root');
  const back = document.createElement('div');
  back.className = 'backdrop';
  const el = document.createElement('div');
  el.className = 'sheet' + (opts.cls ? ' ' + opts.cls : '');
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  if (opts.label) el.setAttribute('aria-label', opts.label);
  el.tabIndex = -1;
  root.append(back, el);
  document.body.classList.add('locked');
  const opener = document.activeElement;
  const sh = {
    el, back, opts, closed: false,
    close: () => closeSheet(),
    set(content) { const top = el.scrollTop; el.innerHTML = `<div class="grab" aria-hidden="true"></div>${content}`; el.scrollTop = top; if (opts.onSet) opts.onSet(sh); },
  };
  sh.set(html);
  SHEET = sh;
  sh.opener = opener;
  back.addEventListener('click', () => closeSheet());
  el.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) { e.preventDefault(); closeSheet(); return; }
    const a = e.target.closest('[data-act]');
    if (a && opts.act && opts.act[a.dataset.act] && !a.disabled) { e.preventDefault(); opts.act[a.dataset.act](a, e, sh); }
  });
  if (opts.input) el.addEventListener('input', e => opts.input(e, sh));
  if (opts.change) el.addEventListener('change', e => opts.change(e, sh));
  el.addEventListener('submit', e => { e.preventDefault(); if (opts.submit) opts.submit(e, sh); });
  el.focus({ preventScroll: true });
  if (opts.onOpen) opts.onOpen(sh);
  return sh;
}
function closeSheet(instant) {
  const sh = SHEET;
  if (!sh) return;
  SHEET = null;
  sh.closed = true;
  document.body.classList.remove('locked');
  if (sh.opts.onClose) sh.opts.onClose(sh);
  const done = () => { sh.el.remove(); sh.back.remove(); };
  if (instant) done(); else { sh.el.classList.add('closing'); sh.back.classList.add('closing'); setTimeout(done, 200); }
  try { if (!instant && sh.opener && document.contains(sh.opener)) sh.opener.focus({ preventScroll: true }); } catch (e) { /* gone */ }
}
const sheetHead = (title, sub) => `<div class="sheet-head"><div><h2>${title}</h2>${sub ? `<p class="sub">${sub}</p>` : ''}</div><button type="button" class="icon-btn" data-close aria-label="Close">${icon('close')}</button></div>`;
function confirmSheet({ title, body, yes = 'Yes', no = 'Cancel', danger = false, onYes }) {
  openSheet(`${sheetHead(title)}<p class="lead">${body}</p>
    <div class="btn-row"><button type="button" class="btn ghost" data-close>${no}</button><button type="button" class="btn ${danger ? 'danger' : 'primary'}" data-act="yes">${yes}</button></div>`,
  { label: title, act: { yes: (a, e, sh) => { sh.close(); onYes(); } } });
}
const switchRow = (name, title, sub, on) => `<label class="switch-row"><span><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span><span class="switch"><input type="checkbox" name="${name}" ${on ? 'checked' : ''}><span aria-hidden="true"></span></span></label>`;

/* ---------- the activation picker (slider + − / +), used by check-in, before and after ---------- */
// value null = not set yet (the thumb is hidden until you touch the bar or a button).
function scaleHtml(name, value, opts = {}) {
  const set = value !== null && value !== undefined;
  const v = set ? value : 5;
  return `<div class="scale${set ? '' : ' unset'}${opts.mark !== undefined && opts.mark !== null ? ' marked' : ''}" data-scale="${name}" style="--c:var(--a${v})">
    <div class="scale-read" aria-live="polite">
      <span class="scale-num">${set ? v : '–'}</span>
      <span class="scale-txt"><b>${set ? lvlWord(v) : (opts.prompt || 'Slide or tap to choose')}</b><small>${set ? LEVELS[v][1] : '0 is deeply calm, 10 is completely overwhelmed.'}</small></span>
    </div>
    <div class="scale-row">
      <button type="button" class="icon-btn step" data-step="-1" aria-label="Less activated">${icon('minus')}</button>
      <div class="scale-track">
        <input type="range" min="0" max="10" step="1" value="${v}" name="${name}" aria-label="${esc(opts.label || 'How activated')}" aria-valuetext="${set ? `${v}, ${lvlWord(v)}` : 'not chosen'}">
        ${opts.mark !== undefined && opts.mark !== null ? `<span class="scale-mark" style="--m:${opts.mark}" title="Before: ${opts.mark}"><span>Before ${opts.mark}</span></span>` : ''}
      </div>
      <button type="button" class="icon-btn step" data-step="1" aria-label="More activated">${icon('plus')}</button>
    </div>
    <div class="scale-ends" aria-hidden="true"><span>0 calm</span><span>5</span><span>10 overwhelmed</span></div>
  </div>`;
}
// Wires every .scale inside root. onSet(name, value) is called on every change.
function bindScales(root, onSet) {
  for (const sc of $$('.scale', root)) {
    if (sc.dataset.bound) continue;
    sc.dataset.bound = '1';
    const input = $('input[type=range]', sc);
    const show = v => {
      sc.classList.remove('unset');
      sc.style.setProperty('--c', `var(--a${v})`);
      $('.scale-num', sc).textContent = v;
      $('.scale-txt b', sc).textContent = lvlWord(v);
      $('.scale-txt small', sc).textContent = LEVELS[v][1];
      input.setAttribute('aria-valuetext', `${v}, ${lvlWord(v)}`);
      onSet(sc.dataset.scale, v);
    };
    input.addEventListener('input', () => show(+input.value));
    // iPhone sliders only move when you drag the thumb itself, so work the value out from where the finger is:
    // a tap sets the level there, a sideways drag from anywhere moves it, and a vertical swipe still scrolls the page.
    const fromX = x => { const r = input.getBoundingClientRect(); return clamp(Math.round(((x - r.left - 16) / Math.max(1, r.width - 32)) * 10), 0, 10); };
    let down = null;
    input.addEventListener('pointerdown', e => { if (e.button > 0) return; down = { x: e.clientX, y: e.clientY, drag: false, id: e.pointerId }; });
    input.addEventListener('pointermove', e => {
      if (!down || e.pointerId !== down.id) return;
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (!down.drag && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) { down.drag = true; try { input.setPointerCapture(e.pointerId); } catch (_) { /* not supported */ } }
      if (down.drag) { const v = fromX(e.clientX); if (v !== +input.value || sc.classList.contains('unset')) { input.value = v; show(v); } }
    });
    input.addEventListener('pointerup', e => {
      if (!down || e.pointerId !== down.id) return;
      const tap = !down.drag && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 10;
      down = null;
      if (tap) { const v = fromX(e.clientX); input.value = v; show(v); }
    });
    input.addEventListener('pointercancel', () => { down = null; });
    input.addEventListener('keydown', e => { if (sc.classList.contains('unset') && /^(Enter| )$/.test(e.key)) show(+input.value); });
    for (const b of $$('[data-step]', sc)) {
      b.addEventListener('click', () => {
        const v = sc.classList.contains('unset') ? 5 : clamp(+input.value + +b.dataset.step, 0, 10);
        input.value = v;
        show(v);
        buzz(8);
      });
    }
  }
}

/* ---------- sound ---------- */
const SND = { ctx: null, master: null, bg: null, bgKind: 'off' };
function audio() {
  if (!S.prefs.sound) return null;
  try { if (navigator.audioSession) navigator.audioSession.type = S.prefs.silent ? 'playback' : 'ambient'; } catch (e) { /* not supported */ }
  try {
    if (!SND.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      SND.ctx = new AC();
      SND.master = SND.ctx.createGain();
      SND.master.connect(SND.ctx.destination);
    }
    SND.master.gain.value = 0.15 + 0.85 * S.prefs.volume;
    if (SND.ctx.state === 'suspended') SND.ctx.resume().catch(() => {});
    return SND.ctx;
  } catch (e) { return null; }
}
// A soft sine note with a slow attack; optional glide to another pitch and stereo pan.
function tone(freq, dur, { gain = 0.16, attack = 0.08, to = 0, pan = 0, at = 0 } = {}) {
  const c = audio();
  if (!c) return;
  try {
    const t = c.currentTime + 0.02 + at;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur * 0.8);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let out = g;
    if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p; }
    o.connect(g);
    out.connect(SND.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  } catch (e) { /* audio is optional */ }
}
// A singing-bowl-like bell made of inharmonic partials.
function bell(at = 0, base = 392) {
  [[1, 0.22, 4.5], [2.76, 0.09, 2.8], [5.4, 0.05, 1.6], [8.93, 0.025, 1.0]].forEach(([r, g, d]) => tone(base * r, d, { gain: g, attack: 0.01, at }));
}
function cue(kind) {
  if (kind === 'in') tone(294, 1.4, { to: 392, gain: 0.12, attack: 0.25 });
  else if (kind === 'in2') tone(392, 0.8, { to: 440, gain: 0.1, attack: 0.15 });
  else if (kind === 'out') tone(392, 1.8, { to: 262, gain: 0.12, attack: 0.25 });
  else if (kind === 'hold' || kind === 'rest') tone(523, 0.5, { gain: 0.05, attack: 0.05 });
}
const tick = side => tone(side ? 660 : 550, 0.18, { gain: 0.14, attack: 0.008, pan: side ? 0.85 : -0.85 });
// Background sound: soft brown noise, steady or rising and falling like waves.
function startBg(kind) {
  stopBg();
  if (kind === 'off') return;
  const c = audio();
  if (!c) return;
  try {
    const secs = 8, len = c.sampleRate * secs, buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.2; }
      const a = d[0], b = d[len - 1];
      for (let i = 0; i < len; i++) d[i] -= (b - a) * (i / (len - 1));
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = kind === 'waves' ? 700 : 900;
    const g = c.createGain();
    g.gain.value = 0.0001;
    g.gain.exponentialRampToValueAtTime(kind === 'waves' ? 0.22 : 0.28, c.currentTime + 2);
    src.connect(lp); lp.connect(g); g.connect(SND.master);
    let lfo = null;
    if (kind === 'waves') {
      lfo = c.createOscillator();
      const depth = c.createGain();
      lfo.frequency.value = 0.08;
      depth.gain.value = 0.16;
      lfo.connect(depth); depth.connect(g.gain);
      lfo.start();
    }
    src.start();
    SND.bg = { src, g, lfo };
    SND.bgKind = kind;
  } catch (e) { SND.bg = null; }
}
function stopBg() {
  const b = SND.bg;
  SND.bg = null;
  SND.bgKind = 'off';
  if (!b || !SND.ctx) return;
  try {
    const t = SND.ctx.currentTime;
    b.g.gain.cancelScheduledValues(t);
    b.g.gain.setValueAtTime(Math.max(0.0001, b.g.gain.value), t);
    b.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    b.src.stop(t + 0.7);
    if (b.lfo) b.lfo.stop(t + 0.7);
  } catch (e) { /* already stopped */ }
}
const buzz = (p = 12) => { try { if (S.prefs.haptics && navigator.vibrate) navigator.vibrate(p); } catch (e) { /* not supported */ } };

/* ---------- spoken prompts (the phone's own voice) ---------- */
let VOICE = null;
function speak(text) {
  try {
    if (!S.prefs.voice || !window.speechSynthesis) return;
    speechSynthesis.cancel();
    if (!VOICE) {
      const vs = speechSynthesis.getVoices();
      VOICE = vs.find(v => /en-AU/i.test(v.lang)) || vs.find(v => /en-GB/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null;
    }
    const u = new SpeechSynthesisUtterance(String(text).replace(/[“”]/g, ''));
    if (VOICE) u.voice = VOICE;
    u.rate = 0.88;
    u.volume = 0.9;
    speechSynthesis.speak(u);
  } catch (e) { /* not supported */ }
}
const hush = () => { try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { /* not supported */ } };

/* ---------- keep the screen on during a session ---------- */
// One request at a time; if the session stops while a request is still pending, the lock is let go as soon as it arrives.
let WL = null, WL_ASKING = false, WL_WANT = false;
async function wakeOn() {
  WL_WANT = true;
  if (WL || WL_ASKING || !('wakeLock' in navigator)) return;
  WL_ASKING = true;
  try {
    const w = await navigator.wakeLock.request('screen');
    if (!WL_WANT) { w.release().catch(() => {}); return; }
    WL = w;
    w.addEventListener('release', () => { if (WL === w) WL = null; });
  } catch (e) { WL = null; } finally { WL_ASKING = false; }
}
function wakeOff() { WL_WANT = false; const w = WL; WL = null; try { if (w) w.release().catch(() => {}); } catch (e) { /* released */ } }

/* ---------- router ---------- */
const VIEWS = {};
const UI = { cleanup: null, cur: null, param: '', prev: '' };
function route() {
  const parts = (location.hash || '').replace(/^#\/?/, '').split('/');
  const name = VIEWS[parts[0]] ? parts[0] : 'today';
  return { name, param: decodeURIComponent(parts.slice(1).join('/')) };
}
function go(hash) { if (location.hash === hash) render(true); else location.hash = hash; }
function render(fresh) {
  const { name, param } = route();
  if (name !== UI.cur || param !== UI.param) fresh = true;
  // Always undo the previous draw's loops and listeners; "leaving" tells it whether this is a different screen.
  if (UI.cleanup) { const c = UI.cleanup; UI.cleanup = null; try { c(!!fresh); } catch (e) { console.error(e); } }
  if (fresh && UI.cur && UI.cur !== name) UI.prev = UI.cur;
  UI.cur = name;
  UI.param = param;
  const v = VIEWS[name];
  const view = $('#view');
  document.body.classList.toggle('stage', !!v.stage);
  document.body.dataset.view = name;
  const keep = !fresh ? window.scrollY : 0;
  view.innerHTML = v.render(param);
  if (fresh) { view.classList.remove('view-in'); void view.offsetWidth; view.classList.add('view-in'); window.scrollTo(0, 0); } else window.scrollTo(0, keep);
  if (v.after) UI.cleanup = v.after(view, param) || null;
  for (const t of $$('.tab')) {
    const on = t.dataset.tab === (v.tab || name);
    t.classList.toggle('active', on);
    if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
  }
  document.title = name === 'today' ? 'Settle' : `${v.title} · Settle`;
  if (fresh) { const h = $('#view h1'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }
}
function onViewClick(e) {
  const a = e.target.closest('[data-act]');
  if (!a || a.disabled || !$('#view').contains(a)) return;
  const v = VIEWS[UI.cur];
  const fn = v && v.act && v.act[a.dataset.act];
  if (fn) { e.preventDefault(); fn(a, e); }
}
const backBtn = (hash, label = 'Back') => `<a class="back" href="${hash}">${icon('chev-l')}<span>${label}</span></a>`;
// Empty states get a small illustration (a seedling, a cairn, a fern or a moon) instead of an icon.
const EMPTY_ART = { clock: 'sprout', chart: 'fern', body: 'cairn', search: 'fern', wind: 'sprout', check: 'cairn', alert: 'moon' };
const empty = (ic, title, body, action) => `<div class="empty">${typeof ART !== 'undefined' ? ART.empty(EMPTY_ART[ic] || 'sprout') : icon(ic, 'lg')}<h3>${title}</h3><p>${body}</p>${action || ''}</div>`;
const pageHead = (title, sub, opts = {}) => `<header class="page-head">${opts.eyebrow ? `<p class="eyebrow">${opts.eyebrow}</p>` : ''}<h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}${typeof ART !== 'undefined' ? ART.sprig(opts.flip) : ''}</header>`;
