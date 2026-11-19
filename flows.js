/* Settle — check in, choose a tool, the tool card (durations), the guided session, and "how did it go?" */
'use strict';

const RATINGS = ['Not at all', 'A little', 'Somewhat', 'Well', 'Really well'];
const PENDING_MINS = 45;
const pendingEntry = () => {
  const p = S.pending;
  if (!p || Date.now() - p.at > PENDING_MINS * 60000) return null;
  return entryById(p.entryId);
};
const crisisCard = () => `<div class="note-card warn" role="note">${icon('heart')}<div><b>You don’t have to handle this alone.</b>
  <p>If you feel unsafe or in crisis, call <a href="tel:131114">Lifeline 13 11 14</a> (any time), or <a href="tel:000">000</a> in an emergency.</p></div></div>`;

/* ---------- suggestions: what to try right now ---------- */
function suggest(level, { feels = [], body = {}, n = 4, exclude = [] } = {}) {
  const st = toolStats();
  const zone = zoneOf(level).id;
  const want = new Set();
  if (feels.some(f => SHUTDOWN_FEELS.includes(f))) want.add('shutdown');
  if (feels.some(f => ['angry', 'irritable'].includes(f))) want.add('anger');
  if (feels.includes('sad')) want.add('low');
  if (Object.keys(body || {}).length) want.add('tension');
  if (level >= 7) want.add('high');
  else if (level >= 4) want.add('anxious');
  else if (!want.size) want.add('sleep');
  const scored = TOOLS.filter(t => !exclude.includes(t.id)).map(t => {
    const s = st.byZone[zone][t.id];
    let score = 0, why = '';
    if (s && s.n) { score += s.score * 1.1; if (s.avgDrop >= 1) why = `Worked for you: ${f1(s.avgDrop)} calmer on average`; }
    const match = t.good.filter(g => want.has(g));
    score += match.length * 1.2;
    if (level >= 7 && t.good.includes('quick')) score += 0.4;
    if (isFav(t.id)) { score += 0.7; why = why || 'One of your favourites'; }
    if (!why && match.length) why = `Good when ${match.map(g => GOOD[g].toLowerCase()).join(' or ')}`;
    return { t, score: score + (t.def <= 3 ? 0.1 : 0), why };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, n);
}

/* ---------- check in ---------- */
let CK = null;
const DRAFT_MINS = 30;
const newDraft = () => ({ id: null, at: Date.now(), left: 0, act: null, feels: [], tags: [], body: {}, note: '', timeSet: false });
function draftFromEntry(e) { return { id: e.id, at: e.at, act: e.act, feels: e.feels.slice(), tags: e.tags.slice(), body: JSON.parse(JSON.stringify(e.body)), note: e.note, timeSet: true }; }
const allTags = () => TAGS.concat(S.customTags.map(t => [`c:${t}`, t]));
function bodyBlock(b) {
  const l = bodyList(b);
  if (!l.length) return `<button type="button" class="btn outline wide" data-act="body">${icon('body')}Mark it on the body</button>`;
  return `<div class="body-sum">${bodyPair({ fill: id => (b[id] ? heatN(b[id].n) : null), cls: 'mini' })}
    <ul class="plain">${l.map(([id, v]) => `<li><span class="dot" style="background:${heatN(v.n)}"></span><b>${esc(regionShort(id))}</b> ${v.n}/10 <span class="muted">${KINDS[v.k]}</span></li>`).join('')}</ul></div>
    <button type="button" class="btn outline wide" data-act="body">${icon('edit')}Change pain and tension</button>`;
}
VIEWS.checkin = {
  title: 'Check in', stage: true, tab: 'today',
  render(param) {
    if (param) {
      const e = entryById(param);
      if (!e) return `${backBtn('#/history')}${empty('search', 'Check-in not found', 'It may have been deleted.')}`;
      if (!CK || CK.id !== e.id) CK = draftFromEntry(e);
    } else if (!CK || CK.id || (CK.left && Date.now() - CK.left > DRAFT_MINS * 60000)) CK = newDraft();
    else CK.left = 0;
    const edit = !!CK.id;
    const hasTool = !!S.active && !S.active.done;
    return `<header class="stage-head"><button type="button" class="icon-btn" data-act="cancel" aria-label="Close">${icon('close')}</button><h1>${edit ? 'Edit check-in' : 'Check in'}</h1>${ART.sprig(true)}</header>
    <div class="flow">
      ${hasTool && !edit ? `<div class="note-card">${icon('clock')}<div><b>You have a session running.</b><p><a href="#/session">Go back to ${esc(toolName(S.active.tool))}</a></p></div></div>` : ''}
      <section class="q-card" id="q-act"><h2>How activated is your nervous system right now?</h2>
        ${scaleHtml('act', CK.act)}<p class="field-err" id="act-err" hidden>${icon('alert', 'sm')}Choose a number from 0 to 10 first.</p>
        <div id="crisis">${CK.act !== null && CK.act >= 9 ? crisisCard() : ''}</div></section>
      <section class="q-card"><h2>How does it feel? <span class="opt">Optional</span></h2>
        ${FEELS.map(g => `<p class="label">${g.g}</p><div class="chips">${g.items.map(([id, name]) => `<button type="button" class="chip${CK.feels.includes(id) ? ' on' : ''}" data-act="feel" data-id="${id}" aria-pressed="${CK.feels.includes(id)}">${name}</button>`).join('')}</div>`).join('')}</section>
      <section class="q-card"><h2>Any pain or tension? <span class="opt">Optional</span></h2><div id="body-block">${bodyBlock(CK.body)}</div></section>
      <section class="q-card"><h2>What’s going on? <span class="opt">Optional</span></h2>
        <div class="chips" id="tag-chips">${allTags().map(([id, name]) => `<button type="button" class="chip${CK.tags.includes(id) ? ' on' : ''}" data-act="tag" data-id="${esc(id)}" aria-pressed="${CK.tags.includes(id)}">${esc(name)}</button>`).join('')}</div>
        <div class="add-row"><label class="sr" for="new-tag">Add your own</label><input id="new-tag" type="text" maxlength="30" placeholder="Add your own…" autocomplete="off" enterkeyhint="done"><button type="button" class="btn small outline" data-act="addtag">${icon('plus')}Add</button></div></section>
      <section class="q-card"><h2><label for="ck-note">Note</label> <span class="opt">Optional</span></h2>
        <textarea id="ck-note" rows="3" maxlength="4000" placeholder="Anything you want to remember about right now">${esc(CK.note)}</textarea></section>
      <section class="q-card when"><h2>When</h2>
        <div class="row-between"><span id="when-txt">${CK.timeSet ? `${relDay(dayOf(CK.at))}, ${fmtTime(CK.at)}` : `Now, ${fmtTime(Date.now())}`}</span><button type="button" class="btn small ghost" data-act="when">${icon('clock')}Change</button></div>
        <div id="when-edit" hidden><label class="label" for="ck-when">Date and time</label><input id="ck-when" type="datetime-local" value="${localInput(CK.at)}" max="${localInput(Date.now() + 60000)}"></div></section>
    </div>
    <div class="actionbar">${edit
      ? `<button type="button" class="btn ghost" data-act="delete">${icon('trash')}Delete</button><button type="button" class="btn primary" data-act="update">${icon('check')}Save changes</button>`
      : `<button type="button" class="btn outline" data-act="save">${icon('check')}Save</button><button type="button" class="btn primary" data-act="tool">Choose a tool${icon('chev-r')}</button>`}</div>`;
  },
  after(view) {
    if (!$('#ck-note', view)) return null;
    bindScales(view, (n, v) => {
      CK.act = v;
      $('#act-err').hidden = true;
      $('#crisis').innerHTML = v >= 9 ? crisisCard() : '';
    });
    $('#ck-note').addEventListener('input', e => { CK.note = e.target.value; });
    $('#ck-when').addEventListener('change', e => {
      const t = new Date(e.target.value).getTime();
      if (isFinite(t)) { CK.at = Math.min(t, Date.now()); CK.timeSet = true; $('#when-txt').textContent = `${relDay(dayOf(CK.at))}, ${fmtTime(CK.at)}`; }
    });
    $('#new-tag').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); VIEWS.checkin.act.addtag(); } });
    // Leaving an edit drops the changes; a new check-in's draft waits up to 30 minutes for you to come back.
    return leaving => { if (!leaving || !CK) return; if (CK.id) CK = null; else CK.left = Date.now(); };
  },
  act: {
    cancel: () => { const id = CK && CK.id; CK = null; go(id ? `#/entry/${id}` : '#/today'); },
    feel: a => { const id = a.dataset.id; CK.feels = CK.feels.includes(id) ? CK.feels.filter(x => x !== id) : CK.feels.concat(id); a.classList.toggle('on'); a.setAttribute('aria-pressed', CK.feels.includes(id)); },
    tag: a => { const id = a.dataset.id; CK.tags = CK.tags.includes(id) ? CK.tags.filter(x => x !== id) : CK.tags.concat(id); a.classList.toggle('on'); a.setAttribute('aria-pressed', CK.tags.includes(id)); },
    addtag: () => {
      const inp = $('#new-tag');
      const t = inp.value.trim().replace(/\s+/g, ' ').slice(0, 30);
      if (!t) { inp.focus(); return; }
      const known = TAGS.find(([, name]) => name.toLowerCase() === t.toLowerCase());
      const ct = S.customTags.find(x => x.toLowerCase() === t.toLowerCase());
      const id = known ? known[0] : `c:${ct || t}`;
      if (!known && !ct) { S.customTags.push(t); save(); }
      if (!CK.tags.includes(id)) CK.tags.push(id);
      inp.value = '';
      render();
    },
    body: () => openBodyEditor(CK.body, b => { if (!CK) return; CK.body = b; const bb = $('#body-block'); if (bb) bb.innerHTML = bodyBlock(b); }),
    when: () => { const w = $('#when-edit'); w.hidden = !w.hidden; if (!w.hidden) $('#ck-when').focus(); },
    save: () => saveCheckin(false),
    tool: () => saveCheckin(true),
    update: () => {
      if (!checkAct()) return;
      const e = entryById(CK.id);
      if (!e) return;
      const oldAct = e.act;
      Object.assign(e, { at: CK.at, act: CK.act, feels: CK.feels, tags: CK.tags, body: CK.body, note: CK.note.trim() });
      // Tools started from this reading (up to the first one rated) follow the correction.
      for (const x of e.uses) { if (x.before === oldAct) x.before = e.act; if (x.after !== null) break; }
      S.entries.sort((a, b) => a.at - b.at);
      const id = CK.id;
      CK = null;
      if (save()) toast(`${icon('check', 'sm')}Changes saved`);
      go(`#/entry/${id}`);
    },
    delete: () => { const id = CK.id; CK = null; deleteEntry(id, '#/history'); },
  },
};
function checkAct() {
  if (CK.act !== null) return true;
  const err = $('#act-err');
  err.hidden = false;
  $('#q-act').scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' });
  $('#q-act input[type=range]').focus({ preventScroll: true });
  return false;
}
function saveCheckin(pickTool) {
  if (!checkAct()) return;
  const e = addEntry({ id: uid(), at: CK.timeSet ? CK.at : Date.now(), act: CK.act, feels: CK.feels, tags: CK.tags, body: CK.body, note: CK.note.trim(), src: 'checkin', uses: [] });
  CK = null;
  if (pickTool) {
    S.pending = { entryId: e.id, at: Date.now() };
    save();
    go('#/pick');
    return;
  }
  if (save()) toast(`${icon('check', 'sm')}Check-in saved: ${e.act}, ${lvlWord(e.act).toLowerCase()}`, { undo: () => { S.entries = S.entries.filter(x => x.id !== e.id); save(); render(true); } });
  go('#/today');
}
function deleteEntry(id, back) {
  const i = S.entries.findIndex(e => e.id === id);
  if (i < 0) return;
  const [e] = S.entries.splice(i, 1);
  const pend = S.pending && S.pending.entryId === id ? S.pending : null;
  if (pend) S.pending = null;
  // A session for this check-in can't be saved without it, so it ends too (and comes back with Undo).
  const act = S.active && S.active.entryId === id ? S.active : null;
  if (act) { S.active = null; wakeOff(); stopBg(); hush(); }
  save();
  toast(act ? 'Check-in and its session deleted' : 'Check-in deleted', { undo: () => { addEntry(e); if (act && !S.active) S.active = act; if (pend && !S.pending) S.pending = pend; save(); render(true); } });
  go(back || '#/history');
}

/* ---------- choose a tool (after a check-in) ---------- */
const PK = { q: '', cat: 'all' };
function toolRow(t, stats) {
  const s = stats && stats.all[t.id];
  const a0 = t.durs[0], a1 = t.durs[t.durs.length - 1];
  const ranges = a0 < 1 ? `${durLabel(a0)}–${durLabel(a1)}` : `${a0}–${a1} min`;
  return `<li class="tool-row"><button type="button" class="tool-main" data-act="open" data-id="${t.id}">
      <span class="tool-ico" aria-hidden="true">${ART.vig(t.cat)}</span>
      <span class="tool-txt"><b>${esc(t.name)}</b><small>${esc(t.short)}</small>
      <span class="meta">${ranges}${s && s.n ? ` · <span class="good">${s.avgDrop > 0.05 ? `${f1(s.avgDrop)} calmer on average` : 'no change on average'}</span> (${plural(s.n, 'use')})` : ''}</span></span></button>
    <button type="button" class="star${isFav(t.id) ? ' on' : ''}" data-act="fav" data-id="${t.id}" aria-pressed="${isFav(t.id)}" aria-label="${isFav(t.id) ? 'Remove from favourites' : 'Add to favourites'}: ${esc(t.name)}">${icon(isFav(t.id) ? 'star' : 'star-o')}</button></li>`;
}
function filterTools(q, cat, good) {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return TOOLS.filter(t => {
    if (cat === 'fav' && !isFav(t.id)) return false;
    if (cat && !['all', 'fav'].includes(cat) && t.cat !== cat) return false;
    if (good && !t.good.includes(good)) return false;
    if (!words.length) return true;
    const hay = `${t.name} ${t.short} ${catById(t.cat).name} ${t.good.map(g => GOOD[g]).join(' ')}`.toLowerCase();
    return words.every(w => hay.includes(w));
  });
}
VIEWS.pick = {
  title: 'Choose a tool', stage: true, tab: 'today',
  render() {
    const e = pendingEntry();
    if (!e) return `<header class="stage-head"><a class="icon-btn" href="#/today" aria-label="Close">${icon('close')}</a><h1>Choose a tool</h1></header>
      <div class="flow">${empty('wind', 'No check-in waiting', 'Check in first, or open any tool from the Tools tab.', `<a class="btn primary" href="#/checkin">Check in</a>`)}</div>`;
    const lev = currentLevel(e);
    const sug = suggest(lev, { feels: e.feels, body: e.body, n: 4 });
    const stats = toolStats();
    const favs = S.favs.map(toolById).filter(Boolean);
    const list = filterTools(PK.q, PK.cat);
    return `<header class="stage-head"><button type="button" class="icon-btn" data-act="close" aria-label="Close">${icon('close')}</button><h1>Choose a tool</h1>${ART.sprig(true)}</header>
    <div class="flow">
      <p class="lead">For your ${fmtTime(e.at)} check-in ${lvl(lev, true)}</p>
      ${lev >= 9 ? crisisCard() : ''}
      <section><h2 class="h3">Suggested for right now</h2><ul class="tool-list">${sug.map(x => toolRow(x.t, stats).replace('<span class="meta">', `<span class="why">${esc(x.why || GOOD[x.t.good[0]])}</span><span class="meta">`)).join('')}</ul></section>
      ${favs.length ? `<section><h2 class="h3">Your favourites</h2><ul class="tool-list">${favs.map(t => toolRow(t, stats)).join('')}</ul></section>` : ''}
      <section><h2 class="h3">All tools</h2>
        <div class="search"><label class="sr" for="pk-q">Search tools</label>${icon('search')}<input id="pk-q" type="search" placeholder="Search tools" value="${esc(PK.q)}" autocomplete="off"></div>
        <div class="chips scroll" role="group" aria-label="Group">${[['all', 'All'], ...CATS.map(c => [c.id, c.name])].map(([id, name]) => `<button type="button" class="chip${PK.cat === id ? ' on' : ''}" data-act="cat" data-id="${id}" aria-pressed="${PK.cat === id}">${name}</button>`).join('')}</div>
        <ul class="tool-list" id="pk-list">${list.map(t => toolRow(t, stats)).join('') || '<li class="muted pad">No tools match. Try another word.</li>'}</ul></section>
    </div>`;
  },
  after(view) {
    const q = $('#pk-q', view);
    if (q) q.addEventListener('input', () => { PK.q = q.value; const stats = toolStats(); $('#pk-list').innerHTML = filterTools(PK.q, PK.cat).map(t => toolRow(t, stats)).join('') || '<li class="muted pad">No tools match. Try another word.</li>'; });
  },
  act: {
    close: () => { go('#/today'); },
    cat: a => { PK.cat = a.dataset.id; render(); },
    open: a => openToolSheet(a.dataset.id),
    fav: a => favButton(a),
  },
};
function favButton(a) {
  const on = toggleFav(a.dataset.id);
  a.classList.toggle('on', on);
  a.setAttribute('aria-pressed', on);
  a.setAttribute('aria-label', `${on ? 'Remove from favourites' : 'Add to favourites'}: ${toolName(a.dataset.id)}`);
  a.innerHTML = icon(on ? 'star' : 'star-o');
  buzz(8);
  toast(on ? `${icon('star', 'sm')}Added to favourites` : 'Removed from favourites');
}

/* ---------- the tool card: how to do it, why it helps, how long, start ---------- */
function openToolSheet(id, opts = {}) {
  const t = toolById(id);
  if (!t) return;
  const tp = S.toolPrefs[id] || {};
  const g = t.guide;
  const st = { mins: tp.mins || t.def, other: false, pattern: tp.pattern || (g.p ? g.p[0].id : ''), rate: tp.rate || (g.rates ? g.rates[0][0] : 0), before: null, forPending: !opts.fresh };
  if (g.p && !g.p.find(p => p.id === st.pattern)) st.pattern = g.p[0].id;
  if (g.rates && !g.rates.find(r => r[0] === st.rate)) st.rate = g.rates[0][0];
  if (!ALL_DURS.includes(st.mins) && !t.durs.includes(st.mins)) st.other = true;
  const html = () => {
    const pe = st.forPending ? pendingEntry() : null;
    const s = toolStats().all[id];
    const running = S.active && !S.active.done;
    const durs = t.durs;
    return `${sheetHead(esc(t.name), `<span class="sub-vig">${ART.vig(t.cat)}</span>${catById(t.cat).name}`)}
    <div class="tool-sheet">
      <p class="lead">${esc(t.short)}</p>
      <div class="chips tight">${t.good.map(x => `<span class="tag">${GOOD[x]}</span>`).join('')}</div>
      <button type="button" class="btn small ${isFav(id) ? 'fav-on' : 'outline'}" data-act="fav" aria-pressed="${isFav(id)}">${icon(isFav(id) ? 'star' : 'star-o')}${isFav(id) ? 'Favourite' : 'Add to favourites'}</button>
      ${t.caution ? `<div class="note-card warn">${icon('alert')}<div><b>Take care</b><p>${esc(t.caution)}</p></div></div>` : ''}
      ${s && s.n ? `<div class="mystats"><b>Your results</b><span>${plural(s.n, 'time')}</span><span>${s.avgDrop > 0.05 ? `${f1(s.avgDrop)} calmer on average` : s.avgDrop < -0.05 ? `${f1(-s.avgDrop)} higher on average` : 'No change on average'}</span>${s.avgRating ? `<span>Rated ${f1(s.avgRating)} out of 5</span>` : ''}</div>` : ''}
      <hr>
      ${pe ? `<div class="for-pending"><span>For your ${fmtTime(pe.at)} check-in ${lvl(currentLevel(pe))}</span><button type="button" class="btn small ghost" data-act="notpending">Not for that one</button></div>`
        : `<h3 class="q">How activated are you right now?</h3>${scaleHtml('before', st.before)}<p class="field-err" id="before-err" hidden>${icon('alert', 'sm')}Choose a number first, so you can see what changes.</p>`}
      <h3 class="q">How long?</h3>
      <div class="chips durs" role="radiogroup" aria-label="How long">${durs.map(m => `<button type="button" role="radio" class="chip${!st.other && st.mins === m ? ' on' : ''}" aria-checked="${!st.other && st.mins === m}" data-act="dur" data-m="${m}">${durLabel(m)}</button>`).join('')}
        <button type="button" role="radio" class="chip${st.other ? ' on' : ''}" aria-checked="${st.other}" data-act="other">Other</button></div>
      ${st.other ? `<div class="stepper" role="group" aria-label="Minutes"><button type="button" class="icon-btn" data-act="mins" data-d="-1" aria-label="1 minute less">${icon('minus')}</button><output>${durLabel(st.mins)}</output><button type="button" class="icon-btn" data-act="mins" data-d="1" aria-label="1 minute more">${icon('plus')}</button></div>` : ''}
      ${g.p && g.p.length > 1 ? `<h3 class="q">Breathing pace</h3><div class="chips" role="radiogroup" aria-label="Breathing pace">${g.p.map(p => `<button type="button" role="radio" class="chip${st.pattern === p.id ? ' on' : ''}" aria-checked="${st.pattern === p.id}" data-act="pattern" data-id="${p.id}">${esc(p.label)}</button>`).join('')}</div>` : ''}
      ${g.rates ? `<h3 class="q">Pace</h3><div class="chips" role="radiogroup" aria-label="Pace">${g.rates.map(([r, name]) => `<button type="button" role="radio" class="chip${st.rate === r ? ' on' : ''}" aria-checked="${st.rate === r}" data-act="rate" data-r="${r}">${name}</button>`).join('')}</div>` : ''}
      ${running ? `<p class="hint">${icon('info', 'sm')}Starting this ends your ${esc(toolName(S.active.tool))} session, which you can still rate.</p>` : ''}
      <button type="button" class="btn primary wide big" data-act="start">${icon('play')}Start · ${durLabel(st.mins)}</button>
      <details class="how" ${opts.open ? 'open' : ''}><summary>How to do it</summary>${t.intro ? `<p>${esc(t.intro)}</p>` : ''}<ol>${t.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol></details>
      <details class="how"><summary>Why it helps</summary><p>${esc(t.why)}</p></details>
    </div>`;
  };
  const sh = openSheet(html(), {
    cls: 'tall', label: t.name,
    onSet: s => bindScales(s.el, (n, v) => { st.before = v; const err = $('#before-err', s.el); if (err) err.hidden = true; }),
    act: {
      fav: () => { toggleFav(id); sh.set(html()); buzz(8); if (UI.cur === 'tools' || UI.cur === 'pick' || UI.cur === 'today') render(); },
      dur: a => { st.mins = +a.dataset.m; st.other = false; sh.set(html()); },
      other: () => { st.other = true; if (st.mins < 1) st.mins = 1; sh.set(html()); },
      mins: a => { st.mins = clamp(Math.round(st.mins) + +a.dataset.d, 1, 60); sh.set(html()); },
      pattern: a => { st.pattern = a.dataset.id; sh.set(html()); },
      rate: a => { st.rate = +a.dataset.r; sh.set(html()); },
      notpending: () => { st.forPending = false; sh.set(html()); },
      start: () => {
        const pe = st.forPending ? pendingEntry() : null;
        if (!pe && st.before === null) {
          const err = $('#before-err', sh.el);
          if (err) { err.hidden = false; err.scrollIntoView({ block: 'center' }); }
          return;
        }
        sh.close();
        startSession(t, { mins: st.mins, pattern: st.pattern, rate: st.rate, entry: pe, before: st.before });
      },
    },
  });
}
function startSession(t, { mins, pattern, rate, entry, before }) {
  if (S.active && !S.active.done) finishSession(false, true);
  if (S.active && S.active.done) saveUse(Object.assign({ rating: null, after: null, note: '', body: null }, S.active.draft), true);
  let e = entry;
  if (!e) e = addEntry({ id: uid(), at: Date.now(), act: before, feels: [], tags: [], body: {}, note: '', src: 'tool', uses: [] });
  S.active = { entryId: e.id, tool: t.id, mins, plan: mins, pattern, rate, before: currentLevel(e), start: Date.now(), paused: null, pausedMs: 0, done: false, end: null, skip: 0, useId: uid() };
  S.pending = null;
  S.toolPrefs[t.id] = { mins, pattern, rate };
  save();
  audio();
  // iPhone only lets a page speak after a tap, so say nothing (silently) now, while this tap counts.
  try { if (S.prefs.voice && window.speechSynthesis && t.guide.t === 'steps') { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } } catch (e) { /* not supported */ }
  go('#/session');
}

/* ---------- the guided session ---------- */
const elapsedOf = a => Math.max(0, (a.done ? a.end : a.paused || Date.now()) - a.start - a.pausedMs);
// One step schedule per session, built from the length you chose: "+1 min" just gives the last step (or the loop) more time.
function schedFor(a) {
  if (PL.scFor === a.useId) return PL.sc;
  const t = toolById(a.tool);
  PL.sc = t && t.guide.t === 'steps' ? schedule(t, (a.plan || a.mins) * 60) : null;
  PL.scFor = a.useId;
  return PL.sc;
}
function schedule(t, totalSecs) {
  const g = t.guide;
  let s = g.s ? g.s.map(x => ({ text: x[0], secs: x[1], flex: x[2] === undefined ? 1 : x[2] })) : t.steps.map((x, i) => ({ text: x, secs: g.w ? g.w[i] : g.each || 20, flex: 1 }));
  if (g.stretch) {
    const fixed = sum(s.filter(x => !x.flex).map(x => x.secs)), flex = sum(s.filter(x => x.flex).map(x => x.secs));
    const f = flex ? Math.max(0.35, (totalSecs - fixed) / flex) : 1;
    s = s.map(x => ({ ...x, secs: x.flex ? x.secs * f : x.secs }));
  }
  let at = 0;
  for (const x of s) { x.at = at; at += x.secs; }
  return { steps: s, total: at, loop: !!g.loop, from: g.from || 0 };
}
function stepAt(sc, secs) {
  let t = secs;
  if (t >= sc.total) {
    if (!sc.loop) return { i: sc.steps.length - 1, p: 1, over: true };
    const ls = sc.steps[sc.from].at, len = sc.total - ls;
    t = ls + ((t - ls) % len);
  }
  for (let i = sc.steps.length - 1; i >= 0; i--) if (t >= sc.steps[i].at) return { i, p: (t - sc.steps[i].at) / sc.steps[i].secs, over: false };
  return { i: 0, p: 0, over: false };
}
function breathAt(ph, secs) {
  const cyc = sum(ph.map(p => p[1]));
  let t = secs % cyc, scale = 0.55;
  const lo = 0.55, hi = 1, hi2 = 1.07;
  const ease = p => 0.5 - 0.5 * Math.cos(Math.PI * p);
  for (let i = 0; i < ph.length; i++) {
    const [k, d] = ph[i];
    const start = scale;
    const target = k === 'in' ? hi : k === 'in2' ? hi2 : k === 'out' ? lo : start;
    if (t < d) {
      const p = t / d;
      return { i, k, label: ph[i][2] || PHASE_WORDS[k], left: Math.ceil(d - t), p, scale: start + (target - start) * ease(p), cycle: Math.floor(secs / cyc) };
    }
    t -= d;
    scale = target;
  }
  return { i: 0, k: ph[0][0], label: PHASE_WORDS[ph[0][0]], left: ph[0][1], p: 0, scale: lo, cycle: 0 };
}
const PHASE_WORDS = { in: 'Breathe in', in2: 'Top up', hold: 'Hold', out: 'Breathe out', rest: 'Pause' };
const SENSES = [['eye', 5, 'things you can see'], ['hand', 4, 'things you can feel'], ['ear', 3, 'things you can hear'], ['nose', 2, 'things you can smell'], ['mouth', 1, 'thing you can taste']];
const CATEGORIES = ['Animals', 'Foods', 'Cities and towns', 'Countries', 'Names', 'Fruit and veg', 'Bands and singers', 'Movies and shows', 'Things in a kitchen', 'Sports', 'Plants and flowers', 'Things that are green', 'Things at the beach', 'Jobs', 'Things in nature', 'Things that make you smile'];
const LETTERS = 'ABCDEFGHIJKLMNOPRSTUVWY';
const PL = { sense: 0, got: 0, rounds: 0, taps: [], cat: '', letter: 0, lastKey: '', raf: 0, timer: 0, useId: '', sc: null, scFor: '' };
const minorHtml = t => `<button type="button" class="btn small ghost" data-act="sound" aria-pressed="${S.prefs.sound}">${icon(S.prefs.sound ? 'volume' : 'mute')}${S.prefs.sound ? 'Sound on' : 'Sound off'}</button>
  <button type="button" class="btn small ghost" data-act="bg">${icon('wave')}Background: ${{ off: 'off', noise: 'soft noise', waves: 'waves' }[S.prefs.bg]}</button>
  ${t && t.guide.t === 'steps' && 'speechSynthesis' in window ? `<button type="button" class="btn small ghost" data-act="voice" aria-pressed="${S.prefs.voice}">${icon('voice')}${S.prefs.voice ? 'Voice on' : 'Voice off'}</button>` : ''}`;
const updateMinor = () => { const m = $('.minor'); if (m) m.innerHTML = minorHtml(toolById(S.active && S.active.tool)); };

function guideHtml(t, a) {
  const g = t.guide;
  if (g.t === 'breath') return `<div class="pacer${reduceMotion() ? ' still' : ''}" id="pacer"><svg class="ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="56" class="track"/><circle cx="60" cy="60" r="56" class="prog" id="ring" pathLength="100"/></svg>
      <div class="orb" id="orb"></div><div class="pacer-txt" aria-live="polite"><b id="ph-label">Get ready</b><span id="ph-left" class="num"></span></div></div>`;
  if (g.t === 'steps') return `<div class="steps-guide">${g.head ? `<p class="label center">${esc(g.head)}</p>` : ''}<p class="step-txt" id="step-txt" aria-live="polite"></p>
      <div class="step-bar" aria-hidden="true"><i id="step-bar"></i></div><p class="muted center" id="step-n"></p>
      <div class="btn-row center"><button type="button" class="btn small ghost" data-act="prevstep">${icon('chev-l')}Back</button><button type="button" class="btn small ghost" data-act="nextstep">Next${icon('chev-r')}</button></div></div>`;
  if (g.t === 'senses') return `<div class="senses" id="senses"></div>`;
  if (g.t === 'bilateral') return `<div class="bilateral"><div class="pads" aria-hidden="true"><span class="pad" id="pad-l">L</span><span class="pad" id="pad-r">R</span></div>
      <p class="center muted">Tap left, then right, with the lights.</p><div class="chips center" role="radiogroup" aria-label="Pace">${g.rates.map(([r, name]) => `<button type="button" role="radio" class="chip${a.rate === r ? ' on' : ''}" aria-checked="${a.rate === r}" data-act="setrate" data-r="${r}">${name}</button>`).join('')}</div></div>`;
  if (g.t === 'sway') return `<div class="sway"><div class="sway-track" aria-hidden="true"><span class="sway-dot" id="sway-dot">${ART.leafDot()}</span></div><p class="center step-txt small" id="sway-txt">Rock with the leaf</p>
      <div class="chips center" role="radiogroup" aria-label="Pace">${g.rates.map(([r, name]) => `<button type="button" role="radio" class="chip${a.rate === r ? ' on' : ''}" aria-checked="${a.rate === r}" data-act="setrate" data-r="${r}">${name}</button>`).join('')}</div></div>`;
  if (g.t === 'tapcount') return `<div class="tapcount"><button type="button" class="tap-orb" data-act="tapbreath" aria-label="Tap at the end of each out-breath"><span class="num" id="tc-n">0</span><small>Tap after each out-breath</small></button>
      <p class="center" id="tc-rate" aria-live="polite">Breathe naturally.</p></div>`;
  if (g.t === 'alpha') return `<div class="alpha"><p class="label center" id="al-cat"></p><p class="al-letter" id="al-letter" aria-live="polite"></p><p class="center muted">Name one thing that starts with this letter.</p>
      <div class="btn-row center"><button type="button" class="btn outline" data-act="newcat">${icon('redo')}New category</button><button type="button" class="btn primary" data-act="nextletter">Next letter${icon('chev-r')}</button></div></div>`;
  return '';
}
function sensesHtml() {
  if (PL.sense >= SENSES.length) return `<div class="center"><p class="step-txt">That’s all five senses. Notice how you feel now.</p><button type="button" class="btn outline" data-act="sensesagain">${icon('redo')}Go again</button></div>`;
  const [ic, n, what] = SENSES[PL.sense];
  return `<div class="sense">${icon(ic, 'xl')}<p class="step-txt">Name <b>${n}</b> ${what}</p>
    <div class="bubbles" aria-label="${PL.got} of ${n}">${Array.from({ length: n }, (_, i) => `<span class="bubble${i < PL.got ? ' on' : ''}"></span>`).join('')}</div>
    <button type="button" class="btn primary big" data-act="gotone">${icon('check')}Got one</button></div>`;
}
VIEWS.session = {
  title: 'Session', stage: true, tab: 'tools',
  render() {
    const a = S.active;
    if (!a) return `<div class="flow">${empty('wind', 'No session running', 'Pick a tool to start one.', '<a class="btn primary" href="#/tools">Open tools</a>')}</div>`;
    const t = toolById(a.tool);
    if (!t) return `<div class="flow">${empty('alert', 'That tool isn’t available', 'It may have been removed in an update.', '<a class="btn primary" href="#/tools">Open tools</a>')}</div>`;
    const pat = t.guide.p ? (t.guide.p.find(p => p.id === a.pattern) || t.guide.p[0]) : null;
    return `<div class="player" data-guide="${t.guide.t}">
      <header class="ph"><button type="button" class="icon-btn" data-act="stop" aria-label="Stop the session">${icon('close')}</button>
        <div class="ph-title"><b>${esc(t.name)}</b><small>${pat ? esc(pat.label) + ' · ' : ''}${durLabel(a.mins)}</small></div>
        <button type="button" class="icon-btn" data-act="how" aria-label="How to do it">${icon('help')}</button></header>
      <div class="guide">${guideHtml(t, a)}${ART.hills()}</div>
      <div class="timer"><div class="t-row"><span class="t-left num" id="t-left">${fmtClock(a.mins * 60000 - elapsedOf(a))}</span><span class="t-of" id="t-of">left</span></div>
        <div class="t-bar" aria-hidden="true"><i id="t-bar"></i></div></div>
      <div class="controls">
        <button type="button" class="btn outline" data-act="pause" id="pause-btn">${a.paused ? `${icon('play')}Resume` : `${icon('pause')}Pause`}</button>
        <button type="button" class="btn outline" data-act="more">${icon('plus')}1 min</button>
        <button type="button" class="btn primary" data-act="finish">${icon('check')}Finish</button></div>
      <div class="minor">${minorHtml(t)}</div></div>`;
  },
  after() {
    const a = S.active;
    if (!a) return null;
    if (a.done) { setTimeout(() => go('#/after'), 0); return null; }
    const t = toolById(a.tool);
    if (!t) return null;
    const g = t.guide;
    // Guide progress (senses, letters, breath taps) belongs to this session, so a re-draw doesn't reset it.
    if (PL.useId !== a.useId) Object.assign(PL, { useId: a.useId, sense: 0, got: 0, rounds: 0, taps: [], cat: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)], letter: 0 });
    PL.lastKey = '';
    const sc = schedFor(a);
    const pat = g.p ? (g.p.find(p => p.id === a.pattern) || g.p[0]) : null;
    if (g.t === 'senses') $('#senses').innerHTML = sensesHtml();
    if (g.t === 'alpha') { $('#al-cat').textContent = PL.cat; $('#al-letter').textContent = LETTERS[PL.letter]; }
    if (g.t === 'tapcount' && PL.taps.length) $('#tc-n').textContent = (PL.taps.length - 1) % 10 + 1;
    if (!a.paused) { wakeOn(); startBg(S.prefs.bg); }
    const els = { left: $('#t-left'), bar: $('#t-bar'), of: $('#t-of') };
    let lastSec = -1;
    const frame = () => {
      const cur = S.active;
      if (!cur || cur !== a || UI.cur !== 'session') return;
      const el = elapsedOf(a), total = a.mins * 60000, left = total - el;
      if (left <= 0) { finishSession(true); return; }
      const sec = Math.floor(el / 1000);
      if (sec !== lastSec) {
        lastSec = sec;
        els.left.textContent = fmtClock(left);
        els.of.textContent = a.paused ? 'paused' : 'left';
      }
      els.bar.style.transform = `scaleX(${clamp(el / total, 0, 1)})`;
      const s = el / 1000;
      if (pat) {
        const b = breathAt(pat.ph, s);
        const key = `${b.cycle}:${b.i}`;
        $('#ph-label').textContent = a.paused ? 'Paused' : b.label;
        $('#ph-left').textContent = a.paused ? '' : b.left;
        if (!reduceMotion()) $('#orb').style.transform = `scale(${b.scale.toFixed(4)})`;
        $('#ring').style.strokeDashoffset = String(100 - b.p * 100);
        $('#pacer').dataset.k = b.k;
        if (key !== PL.lastKey && !a.paused) { if (PL.lastKey) { cue(b.k); if (b.k === 'in' || b.k === 'out') buzz(b.k === 'in' ? 35 : [15, 60, 15]); } PL.lastKey = key; }
      } else if (sc) {
        const st = stepAt(sc, s + a.skip);
        const key = `${st.i}`;
        if (key !== PL.lastKey) {
          $('#step-txt').textContent = sc.steps[st.i].text;
          $('#step-n').textContent = `${st.i + 1} of ${sc.steps.length}${sc.loop && s + a.skip >= sc.total ? ' · going round again' : ''}`;
          if (PL.lastKey !== '' && !a.paused) { cue('hold'); buzz(20); }
          if (!a.paused) speak(sc.steps[st.i].text);
          PL.lastKey = key;
        }
        $('#step-bar').style.transform = `scaleX(${st.over ? 1 : clamp(st.p, 0, 1)})`;
        if (st.over && !$('#step-n').dataset.over) { $('#step-n').dataset.over = '1'; $('#step-n').textContent = 'Stay with this as long as you like.'; }
      } else if (g.t === 'bilateral') {
        const beat = Math.floor(s * a.rate);
        const side = beat % 2;
        if (String(beat) !== PL.lastKey && !a.paused) {
          PL.lastKey = String(beat);
          $('#pad-l').classList.toggle('lit', side === 0);
          $('#pad-r').classList.toggle('lit', side === 1);
          tick(side);
          buzz(12);
        }
      } else if (g.t === 'sway') {
        const ph = (s % a.rate) / a.rate;
        const x = Math.sin(ph * 2 * Math.PI);
        if (!reduceMotion()) $('#sway-dot').style.left = `${(50 + x * 42).toFixed(2)}%`;
        const half = ph < 0.25 || ph >= 0.75 ? 1 : 0;
        if (String(half) !== PL.lastKey && !a.paused) { PL.lastKey = String(half); $('#sway-txt').textContent = half ? 'Rock one way…' : '…and back'; tone(half ? 330 : 294, 1.2, { gain: 0.06, attack: 0.3 }); }
      }
      PL.raf = requestAnimationFrame(frame);
    };
    PL.raf = requestAnimationFrame(frame);
    // Timers still tick when the screen isn't drawing (e.g. an iPhone with the screen dimmed), so the end bell still rings.
    PL.timer = setInterval(() => { const cur = S.active; if (cur === a && !a.done && !a.paused && a.mins * 60000 - elapsedOf(a) <= 0) finishSession(true); }, 1000);
    const vis = () => { if (!document.hidden && S.active === a && !a.done && !a.paused) { wakeOn(); cancelAnimationFrame(PL.raf); PL.raf = requestAnimationFrame(frame); } };
    document.addEventListener('visibilitychange', vis);
    return () => { cancelAnimationFrame(PL.raf); clearInterval(PL.timer); document.removeEventListener('visibilitychange', vis); wakeOff(); stopBg(); hush(); };
  },
  act: {
    pause: () => {
      const a = S.active;
      if (!a) return;
      if (a.paused) { a.pausedMs += Date.now() - a.paused; a.paused = null; wakeOn(); startBg(S.prefs.bg); } else { a.paused = Date.now(); wakeOff(); stopBg(); hush(); }
      save();
      $('#pause-btn').innerHTML = a.paused ? `${icon('play')}Resume` : `${icon('pause')}Pause`;
      $('#t-of').textContent = a.paused ? 'paused' : 'left';
      PL.lastKey = '';
    },
    more: () => { const a = S.active; if (!a) return; a.mins = Math.min(120, a.mins + 1); save(); $('.ph-title small').textContent = durLabel(a.mins); toast('Added a minute'); },
    finish: () => finishSession(false),
    stop: () => openSheet(`${sheetHead('Stop now?')}<p class="lead">You can still rate how it went, even if you stopped early.</p>
      <div class="stack"><button type="button" class="btn primary wide" data-act="rate">${icon('check')}Stop and rate it</button>
      <button type="button" class="btn outline wide" data-close>Keep going</button>
      <button type="button" class="btn ghost wide danger-text" data-act="discard">${icon('trash')}Discard this session</button></div>`,
    { label: 'Stop now?', act: { rate: (b, e, sh) => { sh.close(); finishSession(false); }, discard: (b, e, sh) => { sh.close(); discardSession(); } } }),
    how: () => { const t = toolById(S.active && S.active.tool); if (t) openSheet(`${sheetHead(esc(t.name))}${t.intro ? `<p>${esc(t.intro)}</p>` : ''}<ol class="how-list">${t.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol>${t.caution ? `<div class="note-card warn">${icon('alert')}<div><p>${esc(t.caution)}</p></div></div>` : ''}`, { label: 'How to do it' }); },
    sound: () => { const a = S.active; S.prefs.sound = !S.prefs.sound; save(); if (!S.prefs.sound) stopBg(); else { audio(); if (a && !a.paused) startBg(S.prefs.bg); } updateMinor(); },
    bg: () => { const a = S.active; const order = ['off', 'noise', 'waves']; S.prefs.bg = order[(order.indexOf(S.prefs.bg) + 1) % 3]; if (S.prefs.bg !== 'off' && !S.prefs.sound) S.prefs.sound = true; save(); if (a && !a.paused) startBg(S.prefs.bg); else stopBg(); updateMinor(); },
    voice: () => { S.prefs.voice = !S.prefs.voice; save(); if (!S.prefs.voice) hush(); else { const t = $('#step-txt'); if (t) speak(t.textContent); } updateMinor(); },
    nextstep: () => skipStep(1),
    prevstep: () => skipStep(-1),
    gotone: () => {
      PL.got++;
      buzz(15);
      tone(523 + PL.got * 40, 0.4, { gain: 0.08 });
      if (PL.got >= SENSES[PL.sense][1]) { PL.sense++; PL.got = 0; }
      $('#senses').innerHTML = sensesHtml();
    },
    sensesagain: () => { PL.sense = 0; PL.got = 0; PL.rounds++; $('#senses').innerHTML = sensesHtml(); },
    setrate: a => { const s = S.active; if (!s) return; s.rate = +a.dataset.r; S.toolPrefs[s.tool] = Object.assign({}, S.toolPrefs[s.tool], { rate: s.rate }); save(); for (const c of $$('[data-act=setrate]')) { const on = +c.dataset.r === s.rate; c.classList.toggle('on', on); c.setAttribute('aria-checked', on); } },
    tapbreath: () => {
      const now = Date.now();
      PL.taps.push(now);
      if (PL.taps.length > 40) PL.taps.shift();
      const n = (PL.taps.length - 1) % 10 + 1;
      $('#tc-n').textContent = n;
      const orb = $('.tap-orb');
      if (orb && !reduceMotion()) { orb.classList.remove('rip'); void orb.offsetWidth; orb.classList.add('rip'); }
      buzz(10);
      if (n === 10) tone(659, 0.6, { gain: 0.08 });
      const iv = PL.taps.slice(-7).map((t, i, a) => (i ? t - a[i - 1] : null)).filter(x => x && x >= 1500 && x < 30000).sort((x, y) => x - y);
      $('#tc-rate').textContent = iv.length >= 2 ? `About ${Math.round(60000 / iv[Math.floor(iv.length / 2)])} breaths a minute${PL.taps.length > 10 ? ` · ${PL.taps.length} breaths so far` : ''}` : 'Keep going. Tap once at the end of each out-breath.';
    },
    nextletter: () => { PL.letter = (PL.letter + 1) % LETTERS.length; if (!PL.letter) PL.cat = CATEGORIES[(CATEGORIES.indexOf(PL.cat) + 1) % CATEGORIES.length]; $('#al-letter').textContent = LETTERS[PL.letter]; $('#al-cat').textContent = PL.cat; buzz(8); },
    newcat: () => { let c = PL.cat; while (c === PL.cat) c = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]; PL.cat = c; PL.letter = 0; $('#al-cat').textContent = c; $('#al-letter').textContent = LETTERS[0]; },
  },
};
// Next/Back move the step clock (not the session timer). tw is where we are within one pass of the steps.
function skipStep(d) {
  const a = S.active;
  if (!a) return;
  const sc = schedFor(a);
  if (!sc) return;
  const s = elapsedOf(a) / 1000 + a.skip;
  const ls = sc.steps[sc.from].at, len = sc.total - ls;
  const again = sc.loop && s >= sc.total;
  const tw = again ? ls + ((s - ls) % len) : s;
  const st = stepAt(sc, s);
  let target;
  if (d > 0) target = st.i + 1 < sc.steps.length ? s + (sc.steps[st.i + 1].at - tw) : s + Math.max(0, sc.total - tw);
  else if (st.over || st.p > 0.2) target = s - (tw - sc.steps[st.i].at);
  else if (st.i > (again ? sc.from : 0)) target = s - (tw - sc.steps[st.i - 1].at);
  else if (again) target = s - (tw - ls) - sc.steps[sc.steps.length - 1].secs;
  else target = s - tw;
  a.skip += Math.max(0, target) - s + 0.01;
  save();
  PL.lastKey = '';
  const n = $('#step-n');
  if (n) delete n.dataset.over;
}
function finishSession(auto, silent) {
  const a = S.active;
  if (!a || a.done) return;
  const now = Date.now();
  a.end = a.paused || now;
  if (auto) { const due = a.start + a.pausedMs + a.mins * 60000; a.end = Math.min(a.end, due); }
  a.done = true;
  a.paused = null;
  save();
  wakeOff(); stopBg(); hush();
  if (silent) return;
  if (auto && now - (a.start + a.pausedMs + a.mins * 60000) < 8000) { bell(0); bell(2.4, 330); buzz([180, 120, 180]); }
  go('#/after');
}
function discardSession() {
  const a = S.active;
  if (!a) return;
  const e = entryById(a.entryId);
  const removed = e && e.src === 'tool' && !e.uses.length ? e : null;
  if (removed) S.entries = S.entries.filter(x => x !== removed);
  S.active = null;
  save();
  wakeOff(); stopBg(); hush();
  toast('Session discarded', { undo: () => { if (removed) addEntry(removed); S.active = Object.assign(a, { done: true, end: a.end || Date.now() }); save(); go('#/after'); } });
  go('#/today');
}

/* ---------- how did it go? ---------- */
function useFromActive(r) {
  const a = S.active;
  const secs = Math.round(Math.min(a.mins * 60000, elapsedOf(a)) / 1000);
  return { id: a.useId || uid(), tool: a.tool, mins: a.mins, secs, start: a.start, end: a.end || Date.now(), pattern: a.pattern || '', before: a.before, after: r.after, rating: r.rating, note: (r.note || '').trim(), body: r.body || null };
}
function saveUse(r, quiet) {
  const a = S.active;
  if (!a) return null;
  const e = entryById(a.entryId);
  const u = useFromActive(r);
  if (e) e.uses.push(u);
  S.active = null;
  save();
  if (!quiet && e) {
    const d = u.before !== null && u.after !== null ? u.before - u.after : null;
    toast(`${icon('check', 'sm')}Saved${d === null ? '' : `: ${u.before} → ${u.after}${d > 0 ? `, ${plural(d, 'point')} calmer` : d < 0 ? `, ${plural(-d, 'point')} higher` : ', no change'}`}`);
  }
  return e;
}
function afterFeedback(before, after) {
  if (after === null || before === null) return '';
  const d = before - after;
  if (d >= 3) return `${icon('spark', 'sm')}That’s ${d} points calmer. Notice what that feels like in your body.`;
  if (d > 0) return `${icon('down', 'sm')}${plural(d, 'point')} calmer. Small shifts add up.`;
  if (d === 0) return 'No change, and that’s useful to know. Some tools take practice, or try another one.';
  return 'A little higher. That happens. Try something different, or take a break from tools for now.';
}
VIEWS.after = {
  title: 'How did it go?', stage: true, tab: 'today',
  render() {
    const a = S.active;
    if (!a) return `<div class="flow">${empty('check', 'Nothing to rate', 'Your sessions are saved in History.', '<a class="btn primary" href="#/today">Go to Today</a>')}</div>`;
    if (!a.done) { setTimeout(() => go('#/session'), 0); return ''; }
    const r = a.draft || (a.draft = { rating: null, after: null, note: '', body: null });
    const t = toolById(a.tool);
    const e = entryById(a.entryId);
    const secs = Math.round(Math.min(a.mins * 60000, elapsedOf(a)) / 1000);
    const full = secs >= a.mins * 60 - 2;
    const hadBody = e && Object.keys(latestBody(e)).length;
    return `<header class="stage-head"><span></span><h1>How did that go?</h1>${ART.sprig(true)}</header>
    <div class="flow">
      <p class="lead">${esc(t ? t.name : 'Your tool')} · ${full ? durLabel(a.mins) : `${fmtSecs(secs)} of ${durLabel(a.mins)}`}</p>
      <section class="q-card" id="q-rating"><h2>How well did it work?</h2>
        <div class="rating" role="radiogroup" aria-label="How well did it work">${RATINGS.map((w, i) => `<button type="button" role="radio" class="rate${r.rating === i + 1 ? ' on' : ''}" aria-checked="${r.rating === i + 1}" data-act="rate" data-n="${i + 1}"><b>${i + 1}</b><span>${w}</span></button>`).join('')}</div>
        <p class="field-err" id="rating-err" hidden>${icon('alert', 'sm')}Choose how well it worked.</p></section>
      <section class="q-card" id="q-after"><h2>How activated are you now?</h2>
        ${scaleHtml('after', r.after, { mark: a.before, prompt: `Before, you were at ${a.before}` })}
        <p class="field-err" id="after-err" hidden>${icon('alert', 'sm')}Choose a number from 0 to 10.</p>
        <p class="feedback" id="after-fb" aria-live="polite">${afterFeedback(a.before, r.after)}</p></section>
      <section class="q-card"><h2>Pain or tension now <span class="opt">Optional</span></h2>
        <div id="after-body">${afterBodyBlock(e, r.body)}</div>
        <button type="button" class="btn outline wide" data-act="body">${icon('body')}${r.body ? 'Change' : hadBody ? 'Update pain and tension' : 'Mark it on the body'}</button></section>
      <section class="q-card"><h2><label for="af-note">Note</label> <span class="opt">Optional</span></h2>
        <textarea id="af-note" rows="3" maxlength="2000" placeholder="What did you notice?">${esc(r.note)}</textarea></section>
      ${t ? `<label class="switch-row card-row"><span><b>${icon('star', 'sm')}Favourite</b><small>Keep ${esc(t.name)} at the top of your list</small></span><span class="switch"><input type="checkbox" id="af-fav" ${isFav(t.id) ? 'checked' : ''}><span aria-hidden="true"></span></span></label>` : ''}
      <button type="button" class="btn ghost wide danger-text" data-act="discard">${icon('trash')}Don’t save this session</button>
    </div>
    <div class="actionbar"><button type="button" class="btn outline" data-act="another">${icon('redo')}Save, try another</button><button type="button" class="btn primary" data-act="save">${icon('check')}Save</button></div>`;
  },
  after(view) {
    const a = S.active;
    if (!a || !a.done) return null;
    bindScales(view, (n, v) => { a.draft.after = v; save(); $('#after-err').hidden = true; $('#after-fb').innerHTML = afterFeedback(a.before, v); });
    let t = 0;
    $('#af-note').addEventListener('input', e => { a.draft.note = e.target.value; clearTimeout(t); t = setTimeout(save, 600); });
    const fav = $('#af-fav');
    if (fav) fav.addEventListener('change', () => { if (fav.checked !== isFav(a.tool)) toggleFav(a.tool); });
    return () => { clearTimeout(t); if (S.active === a) save(); };
  },
  act: {
    rate: b => {
      const a = S.active;
      a.draft.rating = +b.dataset.n;
      save();
      for (const x of $$('.rate')) { const on = +x.dataset.n === a.draft.rating; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); }
      $('#rating-err').hidden = true;
      buzz(8);
    },
    body: () => {
      const a = S.active;
      const e = entryById(a.entryId);
      openBodyEditor(a.draft.body || (e ? latestBody(e) : {}), b => { if (S.active !== a) return; a.draft.body = b; save(); render(); });
    },
    save: () => afterSave(false),
    another: () => afterSave(true),
    discard: () => discardSession(),
  },
};
// The most recent pain/tension marking for a check-in: after the last tool that re-marked it, or at check-in.
function latestBody(e) {
  for (let i = e.uses.length - 1; i >= 0; i--) if (e.uses[i].body) return e.uses[i].body;
  return e.body;
}
function afterBodyBlock(e, now) {
  const before = e ? latestBody(e) : {};
  const was = e && before !== e.body ? 'Before this tool' : 'At check-in';
  if (!now) return Object.keys(before).length ? `<p class="hint">${was}: ${esc(bodySummary(before, 4))}</p>` : '';
  const ids = Array.from(new Set(Object.keys(before).concat(Object.keys(now))));
  if (!ids.length) return '<p class="hint">No pain or tension marked.</p>';
  return `<ul class="plain">${ids.map(id => `<li><b>${esc(regionShort(id))}</b> ${before[id] ? before[id].n : 0} → ${now[id] ? now[id].n : 0}</li>`).join('')}</ul>`;
}
function afterSave(another) {
  const a = S.active;
  if (!a) return;
  const r = a.draft || {};
  let ok = true;
  if (!r.rating) { $('#rating-err').hidden = false; ok = false; }
  if (r.after === null || r.after === undefined) { $('#after-err').hidden = false; ok = false; }
  if (!ok) { $(!r.rating ? '#q-rating' : '#q-after').scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' }); return; }
  const e = saveUse(r);
  if (another && e) { S.pending = { entryId: e.id, at: Date.now() }; save(); go('#/pick'); } else go('#/today');
}
