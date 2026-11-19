/* Settle — settings, backups, export, calendar reminders, first-run welcome, theme and start-up */
'use strict';

const INSTALL = { prompt: null };
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); INSTALL.prompt = e; if (UI.cur === 'today') render(); });

/* ---------- theme ---------- */
function applyTheme() {
  const dark = S.prefs.theme === 'dark' || (S.prefs.theme === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const m = $('meta[name="theme-color"]');
  if (m) m.content = dark ? '#121715' : '#F4F1EA';
}
if (window.matchMedia) { try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme()); } catch (e) { /* old browser */ } }

/* ---------- files ---------- */
function download(name, text, type) {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function exportData() {
  download(`settle-backup-${todayKey()}.json`, JSON.stringify(S, null, 1), 'application/json');
  S.hide.lastBackup = Date.now();
  save();
  toast(`${icon('check', 'sm')}Backup saved to your downloads`);
}
function importData(file) {
  const r = new FileReader();
  r.onload = () => {
    let d = null;
    try { d = JSON.parse(r.result); } catch (e) { d = null; }
    if (!d || typeof d !== 'object' || !Array.isArray(d.entries) || !d.prefs) { toast('That file isn’t a Settle backup. Choose a file named like settle-backup-2026-11-19.json.', { ms: 6000 }); return; }
    const n = d.entries.length;
    confirmSheet({
      title: 'Restore this backup?', body: `It replaces everything on this phone with the backup (${plural(n, 'check-in')}${d.savedAt ? `, saved ${fmtDay(dayOf(d.savedAt))}` : ''}).`, yes: 'Restore', danger: true,
      onYes: () => { const old = S; S = migrate(d); S.onboarded = true; save(); applyTheme(); render(true); toast('Backup restored', { undo: () => { S = old; save(); applyTheme(); render(true); } }); },
    });
  };
  r.readAsText(file);
}
const csvCell = v => { const s = String(v == null ? '' : v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
function exportCsv() {
  const head = ['Date', 'Time', 'Activation', 'Level', 'Feelings', 'What was going on', 'Pain and tension', 'Note', 'Tool', 'Planned minutes', 'Minutes done', 'Before', 'After', 'Change', 'How well it worked (1-5)', 'Tool note'];
  const rows = [head];
  for (const e of S.entries) {
    const d = new Date(e.at);
    const base = [dkey(d), `${pad(d.getHours())}:${pad(d.getMinutes())}`, e.act, lvlWord(e.act), e.feels.map(feelLabel).join('; '), e.tags.map(tagLabel).join('; '),
      bodyList(e.body).map(([id, v]) => `${regionName(id)} ${v.n} (${KINDS[v.k]})`).join('; '), e.note];
    if (!e.uses.length) rows.push(base.concat(['', '', '', '', '', '', '', '']));
    for (const u of e.uses) rows.push(base.concat([toolName(u.tool), u.mins, Math.round(u.secs / 6) / 10, u.before ?? '', u.after ?? '', u.after !== null && u.before !== null ? u.after - u.before : '', u.rating || '', u.note]));
  }
  download(`settle-check-ins-${todayKey()}.csv`, '\ufeff' + rows.map(r => r.map(csvCell).join(',')).join('\r\n'), 'text/csv');
  toast(`${icon('check', 'sm')}Spreadsheet saved to your downloads`);
}
// A calendar file with a daily "check in" reminder at each time you choose.
function remindersIcs() {
  const t = new Date();
  const stamp = `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}T${pad(t.getUTCHours())}${pad(t.getUTCMinutes())}00Z`;
  const day = addDays(todayKey(), 1).replace(/-/g, '');
  const url = location.href.split('#')[0] + '#/checkin';
  const ev = S.prefs.remind.map(hm => {
    const [h, m] = hm.split(':');
    return ['BEGIN:VEVENT', `UID:settle-${hm.replace(':', '')}-${day}@settle.app`, `DTSTAMP:${stamp}`, `DTSTART:${day}T${h}${m}00`, 'DURATION:PT5M', 'RRULE:FREQ=DAILY',
      'SUMMARY:Check in with Settle', `DESCRIPTION:How activated is your nervous system right now? ${url}`, `URL:${url}`, 'TRANSP:TRANSPARENT',
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Check in with Settle', 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT'].join('\r\n');
  });
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Settle//Check-in reminders//EN', 'CALSCALE:GREGORIAN', ...ev, 'END:VCALENDAR'].join('\r\n') + '\r\n';
}
const fmtHM = hm => { const [h, m] = hm.split(':').map(Number); return `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'am' : 'pm'}`; };

/* ---------- settings ---------- */
function openSettings() {
  const html = () => `${sheetHead('Settings')}
    <section class="set"><h3>Sound</h3>
      ${switchRow('sound', 'Sounds', 'Soft breathing cues, step chimes and an end bell', S.prefs.sound)}
      ${IOS ? switchRow('silent', 'Play when iPhone is on Silent', 'Sounds play even with the Silent switch on. This pauses music from other apps.', S.prefs.silent) : ''}
      <div class="set-row"><span><b>Volume</b></span><input type="range" name="volume" min="0" max="1" step="0.1" value="${S.prefs.volume}" aria-label="Volume"></div>
      <div class="set-row"><span><b>Background sound</b><small>Plays during sessions</small></span><div class="seg" role="radiogroup" aria-label="Background sound">${[['off', 'Off'], ['noise', 'Soft noise'], ['waves', 'Waves']].map(([id, n]) => `<button type="button" role="radio" aria-checked="${S.prefs.bg === id}" class="${S.prefs.bg === id ? 'on' : ''}" data-act="bg" data-id="${id}">${n}</button>`).join('')}</div></div>
      ${'speechSynthesis' in window ? switchRow('voice', 'Read steps aloud', 'Your phone’s voice reads each step, so you can close your eyes', S.prefs.voice) : ''}
      ${'vibrate' in navigator ? switchRow('haptics', 'Vibration', 'Gentle buzzes for breathing and taps', S.prefs.haptics) : ''}
      <button type="button" class="btn small outline" data-act="test">${icon('volume')}Test sound</button></section>
    <section class="set"><h3>Appearance</h3><div class="seg wide" role="radiogroup" aria-label="Theme">${[['auto', 'Match phone'], ['light', 'Light'], ['dark', 'Dark']].map(([id, n]) => `<button type="button" role="radio" aria-checked="${S.prefs.theme === id}" class="${S.prefs.theme === id ? 'on' : ''}" data-act="theme" data-id="${id}">${n}</button>`).join('')}</div></section>
    <section class="set"><h3>Check-in reminders</h3><p class="muted">Add daily reminders to your phone’s calendar. Web apps can’t send their own reminders, so your calendar does it.</p>
      <ul class="times">${S.prefs.remind.map((t, i) => `<li><span class="num">${fmtHM(t)}</span><button type="button" class="icon-btn small" data-act="deltime" data-i="${i}" aria-label="Remove ${fmtHM(t)}">${icon('close')}</button></li>`).join('') || '<li class="muted">No times yet.</li>'}</ul>
      <div class="add-row"><label class="sr" for="rm-time">Add a time</label><input id="rm-time" type="time" value="12:00"><button type="button" class="btn small outline" data-act="addtime">${icon('plus')}Add time</button></div>
      <button type="button" class="btn outline wide" data-act="ics" ${S.prefs.remind.length ? '' : 'disabled'}>${icon('cal')}Add reminders to my calendar</button></section>
    <section class="set"><h3>Your data</h3><p class="muted">${icon('shield', 'sm')}Everything stays on this phone. Nothing is sent anywhere. Back up now and then, so you don’t lose it if you change phones or clear your browser.${S.hide.lastBackup ? ` Last backup: ${fmtDay(dayOf(S.hide.lastBackup))}.` : ''}</p>
      <div class="stack"><button type="button" class="btn outline wide" data-act="backup">${icon('download')}Back up (save a file)</button>
      <label class="btn outline wide file">${icon('upload')}Restore a backup<input type="file" accept="application/json,.json" data-file="restore"></label>
      <button type="button" class="btn outline wide" data-act="csv">${icon('list')}Export check-ins as a spreadsheet</button>
      <button type="button" class="btn ghost wide danger-text" data-act="wipe">${icon('trash')}Delete everything</button></div></section>
    <section class="set"><h3>If you need more support</h3><p>Settle is a self-care tracker, not medical advice. If things feel too much, please reach out:</p>
      <ul class="plain support"><li><a href="tel:131114">${icon('phone', 'sm')}Lifeline 13 11 14</a> <span class="muted">24/7 crisis support</span></li>
      <li><a href="tel:1300224636">${icon('phone', 'sm')}Beyond Blue 1300 22 4636</a> <span class="muted">24/7 support</span></li>
      <li><a href="tel:000">${icon('phone', 'sm')}000</a> <span class="muted">Emergency</span></li></ul></section>
    <section class="set about"><h3>About</h3><p>Settle ${APP_VERSION}. The tools are adapted from common breathing, somatic, grounding and self-soothing practices, including Somatic Experiencing, polyvagal-informed approaches, DBT and mindfulness. Stop any tool that feels wrong for you.</p>
      <button type="button" class="btn small ghost" data-act="intro">Show the welcome again</button></section>`;
  const sh = openSheet(html(), {
    cls: 'tall', label: 'Settings',
    change: (e, s) => {
      const el = e.target;
      if (el.dataset.file === 'restore') { if (el.files[0]) { s.close(); importData(el.files[0]); } return; }
      if (['sound', 'silent', 'voice', 'haptics'].includes(el.name)) { S.prefs[el.name] = el.checked; save(); if (el.name === 'sound' && !el.checked) stopBg(); if (el.name === 'voice' && !el.checked) hush(); }
      if (el.name === 'volume') { S.prefs.volume = +el.value; save(); if (SND.master) SND.master.gain.value = 0.15 + 0.85 * S.prefs.volume; }
    },
    act: {
      bg: a => { S.prefs.bg = a.dataset.id; save(); sh.set(html()); },
      theme: a => { S.prefs.theme = a.dataset.id; save(); applyTheme(); sh.set(html()); },
      test: () => { if (!S.prefs.sound) { toast('Sounds are off. Turn them on first.'); return; } bell(0); cue('in'); },
      addtime: () => { const v = $('#rm-time', sh.el).value; if (/^\d\d:\d\d$/.test(v) && !S.prefs.remind.includes(v)) { S.prefs.remind.push(v); S.prefs.remind.sort(); save(); sh.set(html()); } },
      deltime: a => { S.prefs.remind.splice(+a.dataset.i, 1); save(); sh.set(html()); },
      ics: () => { download('settle-check-in-reminders.ics', remindersIcs(), 'text/calendar'); toast('Open the downloaded file to add the reminders to your calendar', { ms: 5000 }); },
      backup: () => { exportData(); sh.set(html()); },
      csv: () => exportCsv(),
      wipe: () => confirmSheet({ title: 'Delete everything?', body: `This deletes all ${plural(S.entries.length, 'check-in')}, your favourites and your settings from this phone. Make a backup first if you might want them back.`, yes: 'Delete everything', danger: true,
        onYes: () => { const old = S; S = freshState(); S.onboarded = true; save(); applyTheme(); go('#/today'); render(true); toast('Everything deleted', { undo: () => { S = old; save(); applyTheme(); render(true); } }); } }),
      intro: () => { sh.close(); startOnboarding(); },
    },
  });
}

/* ---------- first-run welcome ---------- */
const STARTERS = ['sigh', 'exhale', '54321', 'feet', 'heart', 'butterfly', 'shake', 'hum', 'orient', 'jaw', 'scan', 'cold'];
function startOnboarding() {
  const root = $('#onboard-root');
  let step = 0;
  const picks = new Set(S.favs.length ? S.favs : []);
  const steps = [
    () => `<div class="ob-art" aria-hidden="true"><svg viewBox="0 0 120 120"><circle cx="60" cy="44" r="16" class="sun"/><path d="M18 74c14-9 28-9 42 0s28 9 42 0" class="w1"/><path d="M26 92c11-5 23-5 34 0s23 5 34 0" class="w2"/><path d="M36 108h48" class="w3"/></svg></div>
      <h1>Welcome to Settle</h1><p class="lead">Notice how activated your nervous system is, try body-based tools to settle it, and learn what works for you.</p>
      <ul class="plain ob-list"><li>${icon('plus')}Check in any time with a quick 0 to 10 rating</li><li>${icon('body')}Mark where you feel pain or tension</li><li>${icon('wind')}${TOOLS.length} breathing, grounding, touch and movement tools</li><li>${icon('chart')}See your patterns and what calms you most</li></ul>`,
    () => `<h1>The scale</h1><p class="lead">How activated, revved up or on alert your body feels right now.</p>
      <div class="ob-scale" aria-hidden="true">${Array.from({ length: 11 }, (_, i) => `<span style="background:var(--a${i})">${i}</span>`).join('')}</div>
      <ul class="plain ob-levels"><li>${lvl(0)}<span><b>Deeply calm.</b> Heavy, loose, at ease.</span></li><li>${lvl(5)}<span><b>Activated.</b> Noticeably tense or restless, harder to focus.</span></li><li>${lvl(10)}<span><b>Maxed out.</b> Panic or complete overwhelm.</span></li></ul>
      <p class="muted">There’s no right number. Feeling numb, foggy or shut down? Rate your activation and pick those feelings too.</p>`,
    () => `<h1>Pick a few favourites</h1><p class="lead">They’ll be on your Today screen, ready to start. You can change them any time.</p>
      <div class="chips">${STARTERS.map(id => `<button type="button" class="chip${picks.has(id) ? ' on' : ''}" data-ob="pick" data-id="${id}" aria-pressed="${picks.has(id)}">${esc(toolName(id))}</button>`).join('')}</div>
      <p class="muted">${icon('shield', 'sm')}Everything you enter stays on this phone. Nothing is sent anywhere.</p>`,
  ];
  const draw = () => {
    root.innerHTML = `<div class="onboard" role="dialog" aria-modal="true" aria-label="Welcome"><div class="ob-body">${steps[step]()}</div>
      <div class="ob-foot"><div class="dots" aria-hidden="true">${steps.map((s, i) => `<i class="${i === step ? 'on' : ''}"></i>`).join('')}</div>
      <div class="btn-row">${step < steps.length - 1 ? `<button type="button" class="btn ghost" data-ob="skip">Skip</button><button type="button" class="btn primary" data-ob="next">Next${icon('chev-r')}</button>` : `<button type="button" class="btn primary wide" data-ob="done">${icon('check')}Start using Settle</button>`}</div></div></div>`;
    const h = $('h1', root);
    if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  };
  const finish = () => { S.onboarded = true; if (picks.size) S.favs = Array.from(new Set(S.favs.concat(Array.from(picks)))); save(); root.innerHTML = ''; render(true); };
  root.onclick = e => {
    const b = e.target.closest('[data-ob]');
    if (!b) return;
    const k = b.dataset.ob;
    if (k === 'next') { step++; draw(); } else if (k === 'skip' || k === 'done') finish();
    else if (k === 'pick') { const id = b.dataset.id; if (picks.has(id)) picks.delete(id); else picks.add(id); b.classList.toggle('on'); b.setAttribute('aria-pressed', picks.has(id)); }
  };
  draw();
}

/* ---------- start-up ---------- */
// When the app comes back on screen it checks for a newer version and reloads, but never mid check-in or session.
let UPDATE_READY = false, lastUpdateCheck = 0;
const busy = () => document.body.classList.contains('stage') || !!SHEET || !!$('#onboard-root').innerHTML;
async function checkForUpdate() {
  if (UPDATE_READY || !/^https?:$/.test(location.protocol) || /[?&]nosw/.test(location.search) || Date.now() - lastUpdateCheck < 60000) return;
  lastUpdateCheck = Date.now();
  try {
    const r = await fetch('core.js', { cache: 'no-store' });
    const m = /APP_VERSION = '([^']+)'/.exec(r.ok ? await r.text() : '');
    if (m && m[1] !== APP_VERSION) { UPDATE_READY = true; if (!busy()) location.reload(); }
  } catch (e) { /* offline: try again later */ }
}
let DAY = null;
function checkDay() {
  const t = todayKey();
  if (t === DAY) return;
  DAY = t;
  if (!SHEET && UI.cur === 'today') render();
}
function boot() {
  S = load();
  applyTheme();
  DAY = todayKey();
  $('#view').addEventListener('click', onViewClick);
  document.addEventListener('click', e => { if (e.target.closest('[data-action="settings"]')) { e.preventDefault(); openSettings(); } });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && SHEET) { closeSheet(); return; }
    const r = e.target.closest && e.target.closest('[role="button"][data-act]');
    if (r && r.tagName !== 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); r.click(); }
  });
  window.addEventListener('hashchange', () => { closeSheet(true); render(true); if (UPDATE_READY && !busy()) location.reload(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { checkDay(); checkForUpdate(); if (UI.cur === 'today') render(); } });
  setInterval(checkDay, 30000);
  window.addEventListener('storage', e => { if (e.key === STORE_KEY && UI.cur !== 'session') { S = load(); if (!SHEET) render(); } });
  // Phones may close a backgrounded app at any time: save whatever is in progress when it's hidden.
  document.addEventListener('visibilitychange', () => { if (document.hidden && (S.active || S.pending)) save(); });
  window.addEventListener('pagehide', () => { if (S.active) save(); });
  // A session that ran out while the app was closed goes straight to "how did it go?".
  if (S.active && !S.active.done && !S.active.paused && S.active.mins * 60000 - elapsedOf(S.active) <= 0) finishSession(true, true);
  render(true);
  if (!S.onboarded) startOnboarding();
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !/[?&]nosw/.test(location.search)) navigator.serviceWorker.register('sw.js').catch(() => {});
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(p => p || navigator.storage.persist()).catch(() => {}); } catch (e) { /* not supported */ }
}
document.addEventListener('DOMContentLoaded', boot);
