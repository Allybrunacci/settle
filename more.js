/* Settle — SOS, routines and your own tools, safety plan, your own words, glimmers, sleep, backups, the weekly summary and the report */
'use strict';

const telOf = phone => String(phone || '').replace(/[^\d+]/g, '');
const callRow = c => `<li><a class="call" href="tel:${esc(telOf(c.phone))}">${icon('phone')}<span><b>${esc(c.name || c.phone)}</b>${c.name && c.phone ? `<small>${esc(c.phone)}</small>` : ''}</span></a></li>`;
const fmtHrs = h => `${Math.floor(h)}${h % 1 ? '½' : ''} h`;
const resultText = d => (d > 0.05 ? `${f1(d)} calmer on average` : d < -0.05 ? `${f1(-d)} higher on average` : 'No change on average');

/* ---------- SOS ---------- */
// Starts your SOS routine straight away: no questions first. How activated you were is asked afterwards.
function startSos(replace) {
  const a = S.active;
  if (a && !a.done && a.sos) { if (replace) location.replace('#/session'); else go('#/session'); return; }
  let r = S.routines.find(x => x.id === 'r-sos');
  if (!r || !r.steps.some(s => toolById(s.tool))) {
    const def = defaults('routines').find(x => x.id === 'r-sos');
    if (r) r.steps = def.steps; else S.routines.unshift(r = def);
  }
  const t = routineTool(r);
  startSession(t, { mins: t.def, sos: true, replace });
}
VIEWS.sos = {
  title: 'SOS', stage: true, tab: 'today',
  render() {
    setTimeout(() => { if (UI.cur === 'sos') startSos(true); }, 0);
    return `<div class="flow"><p class="lead center">Starting SOS…</p></div>`;
  },
};
function openSosHelp() {
  const p = S.plan;
  const people = p.people.filter(x => x.phone), pros = p.pros.filter(x => x.phone);
  openSheet(`${sheetHead('You don’t have to do this alone')}
    ${people.length ? `<p class="label">People you can call</p><ul class="plain call-list">${people.map(callRow).join('')}</ul>` : ''}
    <p class="label">Support lines</p><ul class="plain call-list">${(pros.length ? pros : defaults('pros')).map(callRow).join('')}</ul>
    ${p.helps ? `<p class="label">What helps you</p><p class="note">${esc(p.helps)}</p>` : ''}
    <a class="btn outline wide" href="#/plan">${icon('shield')}${p.updated ? 'Open your safety plan' : 'Make a safety plan'}</a>`, { cls: 'tall', label: 'More help' });
}

/* ---------- routines ---------- */
const routineMins = r => sum(r.steps.filter(s => toolById(s.tool)).map(s => s.mins));
function openRoutineSheet(id, opts = {}) {
  const st = { before: null, forPending: !opts.fresh };
  const html = () => {
    const r = S.routines.find(x => x.id === id);
    if (!r) return `${sheetHead('Routine')}<p class="muted">This routine has been deleted.</p>`;
    const pe = st.forPending ? pendingEntry() : null;
    const s = toolStats().all[id];
    const mins = routineMins(r);
    return `${sheetHead(esc(r.name), `<span class="sub-vig">${ART.vig('routine')}</span>Routine · ${durLabel(mins)}`)}
    <div class="tool-sheet">
      <p class="lead">${id === 'r-sos' ? 'Your go-to for when it all gets too much. The SOS button on Today starts it straight away, with no questions first.' : 'These tools run one after another, as one session.'}</p>
      <ol class="routine-steps">${r.steps.map(x => { const t = toolById(x.tool); return `<li>${ART.vig(t ? t.cat : 'routine')}<span><b>${esc(toolName(x.tool))}</b><small>${durLabel(x.mins)}${t ? '' : ' · skipped'}</small></span></li>`; }).join('')}</ol>
      <div class="btn-row left"><button type="button" class="btn small ${isFav(id) ? 'fav-on' : 'outline'}" data-act="fav" aria-pressed="${isFav(id)}">${icon(isFav(id) ? 'star' : 'star-o')}${isFav(id) ? 'Favourite' : 'Add to favourites'}</button>
        <button type="button" class="btn small outline" data-act="edit">${icon('edit')}Edit</button></div>
      ${s && s.n ? `<div class="mystats"><b>Your results</b><span>${plural(s.n, 'time')}</span><span>${resultText(s.avgDrop)}</span>${s.avgRating ? `<span>Rated ${f1(s.avgRating)} out of 5</span>` : ''}</div>` : ''}
      <hr>
      ${pe ? `<div class="for-pending"><span>For your ${fmtTime(pe.at)} check-in ${lvl(currentLevel(pe))}</span><button type="button" class="btn small ghost" data-act="notpending">Not for that one</button></div>`
        : `<h3 class="q">How activated are you right now?</h3>${scaleHtml('before', st.before)}<p class="field-err" id="before-err" hidden>${icon('alert', 'sm')}Choose a number first, so you can see what changes.</p>`}
      ${runningHint()}
      <button type="button" class="btn primary wide big" data-act="start"${mins ? '' : ' disabled'}>${icon('play')}Start · ${durLabel(mins)}</button>
    </div>`;
  };
  const sh = openSheet(html(), {
    cls: 'tall', label: 'Routine',
    onSet: s => bindScales(s.el, (n, v) => { st.before = v; const err = $('#before-err', s.el); if (err) err.hidden = true; }),
    act: {
      fav: () => { toggleFav(id); sh.set(html()); buzz(8); if (['tools', 'pick', 'today'].includes(UI.cur)) render(); },
      edit: () => { sh.close(); editRoutine(id); },
      notpending: () => { st.forPending = false; sh.set(html()); },
      start: () => {
        const r = S.routines.find(x => x.id === id);
        if (!r) return;
        const pe = st.forPending ? pendingEntry() : null;
        if (!pe && st.before === null) { const err = $('#before-err', sh.el); if (err) { err.hidden = false; err.scrollIntoView({ block: 'center' }); } return; }
        sh.close();
        const t = routineTool(r);
        startSession(t, { mins: t.def, entry: pe, before: st.before });
      },
    },
  });
}
const STEP_MINS = [0.5, 1, 2, 3, 4, 5, 10, 15, 20, 30];
const snapMins = m => STEP_MINS.reduce((b, x) => (Math.abs(x - m) < Math.abs(b - m) ? x : b), STEP_MINS[0]);
function editRoutine(id) {
  const old = id ? S.routines.find(x => x.id === id) : null;
  const w = old ? JSON.parse(JSON.stringify(old)) : { id: `r-${uid()}`, name: '', steps: [] };
  let adding = !w.steps.length, q = '';
  const items = () => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const tools = allTools().filter(t => words.every(x => `${t.name} ${t.short}`.toLowerCase().includes(x)));
    return tools.map(t => `<li><button type="button" data-act="add" data-id="${esc(t.id)}">${ART.vig(t.cat)}<span><b>${esc(t.name)}</b><small>${esc(t.short)}</small></span>${icon('plus')}</button></li>`).join('') || '<li class="muted pad">No tools match.</li>';
  };
  const html = () => `${sheetHead(old ? 'Edit routine' : 'New routine', 'A few tools in a row, as one session')}
    <label class="label" for="rt-name">Name</label><input id="rt-name" type="text" maxlength="40" value="${esc(w.name)}" placeholder="e.g. After work" autocomplete="off">
    <h3 class="q">Steps${w.steps.length ? ` <span class="muted">· ${durLabel(sum(w.steps.map(s => s.mins)))} in all</span>` : ''}</h3>
    ${w.steps.length ? `<ol class="rt-edit">${w.steps.map((s, i) => `<li><span class="rt-top"><span class="rt-n">${i + 1}</span><b>${esc(toolName(s.tool))}</b>
        <button type="button" class="icon-btn small" data-act="up" data-i="${i}" aria-label="Move ${esc(toolName(s.tool))} up"${i ? '' : ' disabled'}>${icon('up')}</button><button type="button" class="icon-btn small" data-act="del" data-i="${i}" aria-label="Remove ${esc(toolName(s.tool))}">${icon('close')}</button></span>
        <span class="stepper" role="group" aria-label="How long for ${esc(toolName(s.tool))}"><button type="button" class="icon-btn small" data-act="dur" data-i="${i}" data-d="-1" aria-label="Shorter">${icon('minus')}</button><output>${durLabel(s.mins)}</output><button type="button" class="icon-btn small" data-act="dur" data-i="${i}" data-d="1" aria-label="Longer">${icon('plus')}</button></span></li>`).join('')}</ol>` : '<p class="hint">Add the tools you want, in order.</p>'}
    ${adding ? `<div class="rt-choose"><div class="row-between"><h3>Add a step</h3>${w.steps.length ? '<button type="button" class="btn small ghost" data-act="noadd">Done adding</button>' : ''}</div>
        <div class="search"><label class="sr" for="rt-q">Search tools</label>${icon('search')}<input id="rt-q" type="search" placeholder="Search tools" value="${esc(q)}" autocomplete="off"></div>
        <ul class="pick-list" id="rt-list">${items()}</ul></div>`
      : w.steps.length < 10 ? `<button type="button" class="btn outline wide" data-act="adding">${icon('plus')}Add a step</button>` : '<p class="hint">That’s the most steps a routine can have.</p>'}
    <p class="field-err" id="rt-err" hidden>${icon('alert', 'sm')}Add at least one step.</p>
    <div class="sheet-foot"><div class="btn-row">${old && id !== 'r-sos' ? `<button type="button" class="btn ghost danger-text" data-act="delete">${icon('trash')}Delete</button>` : ''}${id === 'r-sos' ? `<button type="button" class="btn ghost" data-act="reset">${icon('redo')}Reset</button>` : ''}<button type="button" class="btn primary" data-act="save">${icon('check')}Save</button></div></div>`;
  const refresh = () => { if (['tools', 'pick', 'today'].includes(UI.cur)) render(); };
  const sh = openSheet(html(), {
    cls: 'tall', label: old ? 'Edit routine' : 'New routine',
    input: e => {
      if (e.target.id === 'rt-name') w.name = e.target.value;
      if (e.target.id === 'rt-q') { q = e.target.value; $('#rt-list', sh.el).innerHTML = items(); }
    },
    act: {
      adding: () => { adding = true; sh.set(html()); const s = $('#rt-q', sh.el); if (s) s.scrollIntoView({ block: 'center' }); },
      noadd: () => { adding = false; sh.set(html()); },
      add: a => {
        const t = toolById(a.dataset.id);
        if (!t || w.steps.length >= 10) return;
        w.steps.push({ tool: t.id, mins: snapMins(clamp(t.def, 0.5, 5)), pattern: '' });
        if (w.steps.length >= 10) adding = false;
        buzz(8);
        sh.set(html());
        toast(`Added ${esc(t.name)}`, { ms: 1500 });
      },
      dur: a => { const s = w.steps[+a.dataset.i]; const i = STEP_MINS.indexOf(snapMins(s.mins)); s.mins = STEP_MINS[clamp(i + +a.dataset.d, 0, STEP_MINS.length - 1)]; sh.set(html()); },
      up: a => { const i = +a.dataset.i; if (i > 0) { [w.steps[i - 1], w.steps[i]] = [w.steps[i], w.steps[i - 1]]; sh.set(html()); } },
      del: a => { w.steps.splice(+a.dataset.i, 1); if (!w.steps.length) adding = true; sh.set(html()); },
      reset: () => { w.steps = defaults('routines').find(x => x.id === 'r-sos').steps; sh.set(html()); },
      save: () => {
        if (!w.steps.length) { $('#rt-err', sh.el).hidden = false; return; }
        const r = cleanRoutine({ id: w.id, name: w.name.trim().replace(/\s+/g, ' ') || 'My routine', steps: w.steps });
        if (!r) return;
        const i = S.routines.findIndex(x => x.id === r.id);
        if (i >= 0) S.routines[i] = r; else S.routines.push(r);
        save();
        sh.close();
        toast(`${icon('check', 'sm')}${esc(r.name)} saved`);
        refresh();
      },
      delete: () => confirmSheet({
        title: `Delete ${esc(old.name)}?`, body: 'Times you’ve used it stay in your history.', yes: 'Delete', danger: true,
        onYes: () => {
          const i = S.routines.indexOf(old), favs = S.favs.slice();
          S.routines.splice(i, 1);
          S.favs = S.favs.filter(x => x !== old.id);
          save();
          refresh();
          toast('Routine deleted', { undo: () => { S.routines.splice(i, 0, old); S.favs = favs; save(); refresh(); } });
        },
      }),
    },
  });
}

/* ---------- your own tools ---------- */
function editCustom(id) {
  const old = id ? S.custom.find(x => x.id === id) : null;
  const w = old ? JSON.parse(JSON.stringify(old)) : { id: `u-${uid()}`, name: '', cat: 'rest', short: '', steps: [], durs: [5, 10, 15], def: 5, good: [] };
  let stepsText = w.steps.join('\n');
  const html = () => `${sheetHead(old ? 'Edit your tool' : 'Add your own tool', 'Anything that settles you, like a walk with the dog')}
    <label class="label" for="ct-name">Name</label><input id="ct-name" type="text" maxlength="40" value="${esc(w.name)}" placeholder="e.g. Cuddle the cat" autocomplete="off">
    <p class="field-err" id="ct-err" hidden>${icon('alert', 'sm')}Give it a name.</p>
    <label class="label" for="ct-short">In a sentence <span class="muted">Optional</span></label><input id="ct-short" type="text" maxlength="200" value="${esc(w.short)}" placeholder="What you do" autocomplete="off">
    <label class="label" for="ct-steps">Steps <span class="muted">Optional. One per line, shown one at a time during the session.</span></label><textarea id="ct-steps" rows="4" maxlength="3000">${esc(stepsText)}</textarea>
    <p class="label">Group</p><div class="chips" role="radiogroup" aria-label="Group">${CATS.map(c => `<button type="button" role="radio" class="chip${w.cat === c.id ? ' on' : ''}" aria-checked="${w.cat === c.id}" data-act="cat" data-id="${c.id}">${esc(c.name)}</button>`).join('')}</div>
    <p class="label">Good for <span class="muted">Optional</span></p><div class="chips" role="group" aria-label="Good for">${Object.entries(GOOD).map(([g, name]) => `<button type="button" class="chip${w.good.includes(g) ? ' on' : ''}" aria-pressed="${w.good.includes(g)}" data-act="good" data-id="${g}">${name}</button>`).join('')}</div>
    <p class="label">Lengths to offer</p><div class="chips" role="group" aria-label="Lengths to offer">${ALL_DURS.map(m => `<button type="button" class="chip${w.durs.includes(m) ? ' on' : ''}" aria-pressed="${w.durs.includes(m)}" data-act="dur" data-m="${m}">${durLabel(m)}</button>`).join('')}</div>
    <div class="sheet-foot"><div class="btn-row">${old ? `<button type="button" class="btn ghost danger-text" data-act="delete">${icon('trash')}Delete</button>` : ''}<button type="button" class="btn primary" data-act="save">${icon('check')}Save</button></div></div>`;
  const refresh = () => { if (['tools', 'pick', 'today'].includes(UI.cur)) render(); };
  const sh = openSheet(html(), {
    cls: 'tall', label: old ? 'Edit your tool' : 'Add your own tool',
    input: e => {
      const el = e.target;
      if (el.id === 'ct-name') { w.name = el.value; $('#ct-err', sh.el).hidden = true; }
      if (el.id === 'ct-short') w.short = el.value;
      if (el.id === 'ct-steps') stepsText = el.value;
    },
    act: {
      cat: a => { w.cat = a.dataset.id; sh.set(html()); },
      good: a => { const g = a.dataset.id; w.good = w.good.includes(g) ? w.good.filter(x => x !== g) : w.good.concat(g); sh.set(html()); },
      dur: a => { const m = +a.dataset.m; const next = w.durs.includes(m) ? w.durs.filter(x => x !== m) : w.durs.concat(m).sort((x, y) => x - y); if (next.length) w.durs = next; sh.set(html()); },
      save: () => {
        if (!w.name.trim()) { const err = $('#ct-err', sh.el); err.hidden = false; $('#ct-name', sh.el).focus(); return; }
        const c = cleanCustom(Object.assign({}, w, { name: w.name.trim().replace(/\s+/g, ' '), steps: stepsText.split('\n'), def: w.durs.includes(w.def) ? w.def : w.durs[0] }));
        if (!c) return;
        const i = S.custom.findIndex(x => x.id === c.id);
        if (i >= 0) S.custom[i] = c; else S.custom.push(c);
        save();
        sh.close();
        toast(`${icon('check', 'sm')}${esc(c.name)} saved`);
        refresh();
      },
      delete: () => confirmSheet({
        title: `Delete ${esc(old.name)}?`, body: 'Times you’ve used it stay in your history. It’s also taken out of any routines.', yes: 'Delete', danger: true,
        onYes: () => {
          const snap = { custom: S.custom.slice(), favs: S.favs.slice(), routines: JSON.parse(JSON.stringify(S.routines)) };
          S.custom = S.custom.filter(x => x.id !== old.id);
          S.favs = S.favs.filter(x => x !== old.id);
          for (const r of S.routines) r.steps = r.steps.filter(s => s.tool !== old.id);
          S.routines = S.routines.filter(r => r.steps.length || r.id === 'r-sos');
          const sos = S.routines.find(r => r.id === 'r-sos');
          if (sos && !sos.steps.length) sos.steps = defaults('routines').find(x => x.id === 'r-sos').steps;
          save();
          refresh();
          toast('Tool deleted', { undo: () => { Object.assign(S, snap); save(); refresh(); } });
        },
      }),
    },
  });
}

/* ---------- in your own words ---------- */
const STATES = [
  { id: 'calm', ic: 'leaf', title: 'Settled and safe', feel: 'When I’m settled, I notice…', helps: 'What helps me stay here…', ph: 'e.g. My shoulders drop, my breathing is slow and I can think clearly', ph2: 'e.g. Morning walks, time with friends, enough sleep' },
  { id: 'act', ic: 'wind', title: 'Revved up', sub: 'Fight or flight', feel: 'When I’m activated, I notice…', helps: 'What helps me come down…', ph: 'e.g. Tight chest, racing thoughts, clenched jaw, can’t sit still', ph2: 'e.g. Long out-breaths, cold water, a brisk walk' },
  { id: 'shut', ic: 'moon', title: 'Shut down', sub: 'Freeze or collapse', feel: 'When I shut down, I notice…', helps: 'What helps me come back…', ph: 'e.g. Heavy, foggy, numb, don’t want to talk to anyone', ph2: 'e.g. Gentle movement, music, a warm drink, texting a friend' },
];
// At check-in: your own description of the state you seem to be in (if you've written one).
function wordsFor(level, feels) {
  const k = feels.some(f => SHUTDOWN_FEELS.includes(f)) ? 'shut' : level === null || level === undefined ? null : level >= 4 ? 'act' : 'calm';
  if (!k) return '';
  const w = S.words[k], st = STATES.find(x => x.id === k);
  if (!w.feel && !w.helps) return '';
  return `<div class="note-card words ${k}">${icon(st.ic)}<div><b>In your words: ${st.title.toLowerCase()}</b>${w.feel ? `<p>${esc(w.feel)}</p>` : ''}${w.helps ? `<p><b>What helps:</b> ${esc(w.helps)}</p>` : ''}</div></div>`;
}
VIEWS.words = {
  title: 'In your own words', tab: 'today',
  render() {
    return `${backBtn('#/today', 'Today')}${pageHead('In your own words', 'How each state feels for you, and what helps', { flip: true })}
    <p class="muted">Everyone’s nervous system shows it differently. When you check in, Settle shows what you write here for the state you’re in, so you can recognise it sooner and remember what helps.</p>
    ${STATES.map(st => `<section class="card words-card ${st.id}"><h2 class="h3">${icon(st.ic)}${st.title}${st.sub ? ` <span class="muted">· ${st.sub}</span>` : ''}</h2>
      <label class="label" for="w-${st.id}-feel">${st.feel}</label><textarea id="w-${st.id}-feel" data-k="${st.id}" data-f="feel" rows="3" maxlength="600" placeholder="${esc(st.ph)}">${esc(S.words[st.id].feel)}</textarea>
      <label class="label" for="w-${st.id}-helps">${st.helps}</label><textarea id="w-${st.id}-helps" data-k="${st.id}" data-f="helps" rows="2" maxlength="600" placeholder="${esc(st.ph2)}">${esc(S.words[st.id].helps)}</textarea></section>`).join('')}
    <p class="hint center" id="w-saved" aria-live="polite">Saved as you type.</p>`;
  },
  after(view) {
    let t = 0;
    const onInput = e => {
      const el = e.target;
      if (!el.dataset || !el.dataset.k || !S.words[el.dataset.k]) return;
      S.words[el.dataset.k][el.dataset.f] = el.value.slice(0, 600);
      clearTimeout(t);
      t = setTimeout(() => { if (save()) { const s = $('#w-saved'); if (s) s.textContent = `Saved ${fmtTime(Date.now())}`; } }, 500);
    };
    view.addEventListener('input', onInput);
    return () => { clearTimeout(t); view.removeEventListener('input', onInput); save(); };
  },
};

/* ---------- safety plan ---------- */
const PLAN_FIELDS = [
  ['signs', 'My warning signs', 'Thoughts, feelings, body sensations or situations that tell me things are getting too much.', 'e.g. Not sleeping, pulling away from people, my chest feels tight all day'],
  ['helps', 'Things I can do on my own to calm down', 'Tools, activities, sounds, places in my mind.', 'e.g. Cold water on my face, my SOS routine, a walk, music'],
  ['places', 'People and places that help take my mind off things', '', 'e.g. The beach, my sister’s place, the café on the corner'],
  ['safe', 'Making my space safer', 'Things I can do to keep myself safe when it’s hard.', ''],
  ['reasons', 'My reasons to keep going', '', 'e.g. My kids, my dog, the trip I’m planning'],
];
const PLN = { edit: false, draft: null };
const contactRows = (list, key, label) => `${list.map((c, i) => `<div class="contact-row"><label class="sr" for="${key}-n${i}">${label} ${i + 1} name</label><input id="${key}-n${i}" type="text" maxlength="60" data-list="${key}" data-i="${i}" data-k="name" value="${esc(c.name)}" placeholder="Name" autocomplete="off">
    <label class="sr" for="${key}-p${i}">${label} ${i + 1} phone</label><input id="${key}-p${i}" type="tel" maxlength="30" data-list="${key}" data-i="${i}" data-k="phone" value="${esc(c.phone)}" placeholder="Phone" autocomplete="off">
    <button type="button" class="icon-btn small" data-act="delcontact" data-list="${key}" data-i="${i}" aria-label="Remove ${esc(c.name || 'this contact')}">${icon('close')}</button></div>`).join('')}
  <button type="button" class="btn small outline" data-act="addcontact" data-list="${key}"${list.length >= 12 ? ' disabled' : ''}>${icon('plus')}Add ${label.toLowerCase()}</button>`;
VIEWS.plan = {
  title: 'Safety plan', tab: 'today',
  render() {
    const p = S.plan;
    const head = `<div class="no-print">${backBtn('#/today', 'Today')}</div>${pageHead('My safety plan', 'For when things feel like too much', { flip: true })}`;
    const urgent = `<div class="note-card warn">${icon('heart')}<div><b>If you might act on thoughts of harming yourself</b><p>Call <a href="tel:000">000</a> or go to your nearest emergency department. <a href="tel:131114">Lifeline 13 11 14</a> is there any time.</p></div></div>`;
    if (!PLN.edit && p.updated) {
      const field = ([k, title]) => (p[k] ? `<section class="card plan-sec"><h2 class="h3">${title}</h2><p class="note">${esc(p[k])}</p></section>` : '');
      const people = p.people.filter(c => c.name || c.phone), pros = p.pros.filter(c => c.name || c.phone);
      return `${head}${urgent}
        ${PLAN_FIELDS.slice(0, 3).map(field).join('')}
        ${people.length ? `<section class="card plan-sec"><h2 class="h3">People I can reach out to</h2><ul class="plain call-list">${people.map(callRow).join('')}</ul></section>` : ''}
        ${pros.length ? `<section class="card plan-sec"><h2 class="h3">Professionals and support lines</h2><ul class="plain call-list">${pros.map(callRow).join('')}</ul></section>` : ''}
        ${PLAN_FIELDS.slice(3).map(field).join('')}
        <p class="muted">Last updated ${fmtDay(dayOf(p.updated))}</p>
        <div class="btn-row no-print"><button type="button" class="btn outline" data-act="edit">${icon('edit')}Edit</button><button type="button" class="btn ghost" data-act="print">${icon('share')}Print or save</button></div>`;
    }
    const d = PLN.draft || (PLN.draft = JSON.parse(JSON.stringify(p)));
    return `${head}
      ${p.updated ? '' : `<p class="lead">A safety plan is a short list you make while you’re calm, to use when you’re not. Write as much or as little as you like. It stays on this phone.</p>`}
      ${urgent}
      <div class="plan-form">
      ${PLAN_FIELDS.slice(0, 3).map(([k, title, sub, ph]) => `<section class="q-card"><h2><label for="pl-${k}">${title}</label></h2>${sub ? `<p class="hint tight">${sub}</p>` : ''}<textarea id="pl-${k}" data-f="${k}" rows="3" maxlength="2000" placeholder="${esc(ph)}">${esc(d[k])}</textarea></section>`).join('')}
      <section class="q-card"><h2>People I can reach out to</h2><p class="hint tight">Friends or family you can call or message.</p>${contactRows(d.people, 'people', 'Person')}</section>
      <section class="q-card"><h2>Professionals and support lines</h2><p class="hint tight">Your GP, psychologist, and 24/7 lines.</p>${contactRows(d.pros, 'pros', 'Contact')}</section>
      ${PLAN_FIELDS.slice(3).map(([k, title, sub, ph]) => `<section class="q-card"><h2><label for="pl-${k}">${title}</label></h2>${sub ? `<p class="hint tight">${sub}</p>` : ''}<textarea id="pl-${k}" data-f="${k}" rows="3" maxlength="2000" placeholder="${esc(ph)}">${esc(d[k])}</textarea></section>`).join('')}
      </div>
      <div class="btn-row"><button type="button" class="btn ghost" data-act="cancel">Cancel</button><button type="button" class="btn primary" data-act="save">${icon('check')}Save my plan</button></div>`;
  },
  after(view) {
    const onInput = e => {
      const el = e.target, d = PLN.draft;
      if (!d || !el.dataset) return;
      if (el.dataset.f) d[el.dataset.f] = el.value;
      if (el.dataset.list) { const c = d[el.dataset.list][+el.dataset.i]; if (c) c[el.dataset.k] = el.value; }
    };
    view.addEventListener('input', onInput);
    return () => view.removeEventListener('input', onInput);
  },
  act: {
    edit: () => { PLN.edit = true; PLN.draft = null; render(true); },
    print: () => window.print(),
    addcontact: a => { const l = PLN.draft[a.dataset.list]; if (l.length < 12) { l.push({ name: '', phone: '' }); render(); const n = $(`#${a.dataset.list}-n${l.length - 1}`); if (n) n.focus(); } },
    delcontact: a => { PLN.draft[a.dataset.list].splice(+a.dataset.i, 1); render(); },
    cancel: () => { const had = S.plan.updated; PLN.edit = false; PLN.draft = null; if (had) render(true); else go('#/today'); },
    save: () => {
      S.plan = cleanPlan(Object.assign({}, PLN.draft, { updated: Date.now() }));
      PLN.edit = false;
      PLN.draft = null;
      if (save()) toast(`${icon('check', 'sm')}Safety plan saved`);
      render(true);
    },
  },
};

/* ---------- glimmers ---------- */
const glimRow = g => `<li><button type="button" class="glim" data-act="editglimmer" data-id="${esc(g.id)}">${icon('spark', 'sm')}<span>${esc(g.text)}<small>${fmtTime(g.at)} · ${GKIND_LABEL[g.kind] || ''}</small></span></button></li>`;
function glimmerCard() {
  const list = S.glimmers.filter(g => dayOf(g.at) === todayKey());
  return `<section class="card glimmers"><div class="row-between"><h2 class="h3 with-vig">${ART.vig('glimmer')}Glimmers</h2><button type="button" class="btn small outline" data-act="glimmer">${icon('plus')}Add</button></div>
    ${list.length ? `<ul class="plain glim-list">${list.slice().reverse().map(glimRow).join('')}</ul>` : '<p class="muted">Small moments of calm, safety or joy. Noticing them helps your nervous system learn what safe feels like.</p>'}</section>`;
}
function openGlimmer(gid) {
  const old = gid ? S.glimmers.find(g => g.id === gid) : null;
  const w = { text: old ? old.text : '', kind: old ? old.kind : 'moment' };
  const sh = openSheet(`${sheetHead(old ? 'Edit glimmer' : 'Add a glimmer', 'A small moment that made you feel safe, calm or happy')}
    <label class="label" for="gl-text">What was it?</label><textarea id="gl-text" rows="3" maxlength="300" placeholder="e.g. Sun on my face at the bus stop">${esc(w.text)}</textarea>
    <p class="field-err" id="gl-err" hidden>${icon('alert', 'sm')}Write a few words about it.</p>
    <p class="label">What kind?</p><div class="chips" role="radiogroup" aria-label="What kind">${GKINDS.map(([k, n]) => `<button type="button" role="radio" class="chip${w.kind === k ? ' on' : ''}" aria-checked="${w.kind === k}" data-act="kind" data-id="${k}">${n}</button>`).join('')}</div>
    <div class="sheet-foot"><div class="btn-row">${old ? `<button type="button" class="btn ghost danger-text" data-act="delete">${icon('trash')}Delete</button>` : ''}<button type="button" class="btn primary" data-act="save">${icon('check')}Save</button></div></div>`, {
    label: 'Glimmer',
    input: e => { if (e.target.id === 'gl-text') { w.text = e.target.value; $('#gl-err', sh.el).hidden = true; } },
    act: {
      kind: a => { w.kind = a.dataset.id; for (const c of $$('[data-act=kind]', sh.el)) { const on = c.dataset.id === w.kind; c.classList.toggle('on', on); c.setAttribute('aria-checked', on); } },
      save: () => {
        const text = w.text.trim().slice(0, 300);
        if (!text) { $('#gl-err', sh.el).hidden = false; return; }
        if (old) Object.assign(old, { text, kind: w.kind }); else S.glimmers.push({ id: uid(), at: Date.now(), text, kind: w.kind });
        save();
        sh.close();
        toast(`${icon('spark', 'sm')}Glimmer saved`);
        render();
      },
      delete: () => {
        const i = S.glimmers.indexOf(old);
        if (i < 0) return;
        S.glimmers.splice(i, 1);
        save();
        sh.close();
        render();
        toast('Glimmer deleted', { undo: () => { S.glimmers.splice(i, 0, old); save(); render(); } });
      },
    },
  });
}

/* ---------- sleep and energy ---------- */
function sleepLine(s) {
  return [s.hrs !== null ? `${fmtHrs(s.hrs)} sleep` : '', s.q ? `${SLEEP_Q[s.q - 1].toLowerCase()} quality` : '', s.energy ? `energy ${ENERGY[s.energy - 1].toLowerCase()}` : ''].filter(Boolean).join(' · ');
}
function sleepCard() {
  const k = todayKey(), s = S.sleep[k];
  if (s) return `<div class="sleep-line">${icon('moon', 'sm')}<span>Last night: <b>${esc(sleepLine(s))}</b></span><button type="button" class="btn small ghost" data-act="sleep">Edit</button></div>`;
  if (S.hide.sleepSkip === k || new Date().getHours() >= 15) return '';
  return `<div class="note-card sleep-ask">${icon('moon')}<div><b>How did you sleep?</b><p>Sleep and energy shape how activated you feel. It takes a few seconds.</p>
    <div class="btn-row"><button type="button" class="btn small primary" data-act="sleep">Log sleep</button><button type="button" class="btn small ghost" data-act="sleepskip">Not today</button></div></div></div>`;
}
function openSleep(k = todayKey()) {
  const cur = S.sleep[k];
  const lastHrs = Object.keys(S.sleep).sort().reverse().map(x => S.sleep[x].hrs).find(h => h !== null && h !== undefined);
  const w = { hrs: cur && cur.hrs !== null ? cur.hrs : lastHrs !== undefined ? lastHrs : 7.5, q: cur ? cur.q : null, energy: cur ? cur.energy : null };
  const html = () => `${sheetHead('Sleep and energy', k === todayKey() ? 'Last night' : `The night before ${fmtDay(k)}`)}
    <h3 class="q">Hours of sleep</h3>
    <div class="stepper" role="group" aria-label="Hours of sleep"><button type="button" class="icon-btn" data-act="hrs" data-d="-0.5" aria-label="Half an hour less">${icon('minus')}</button><output class="num">${fmtHrs(w.hrs)}</output><button type="button" class="icon-btn" data-act="hrs" data-d="0.5" aria-label="Half an hour more">${icon('plus')}</button></div>
    <h3 class="q">How well did you sleep?</h3><div class="chips" role="radiogroup" aria-label="How well did you sleep">${SLEEP_Q.map((n, i) => `<button type="button" role="radio" class="chip${w.q === i + 1 ? ' on' : ''}" aria-checked="${w.q === i + 1}" data-act="q" data-n="${i + 1}">${n}</button>`).join('')}</div>
    <h3 class="q">Your energy right now</h3><div class="chips" role="radiogroup" aria-label="Your energy">${ENERGY.map((n, i) => `<button type="button" role="radio" class="chip${w.energy === i + 1 ? ' on' : ''}" aria-checked="${w.energy === i + 1}" data-act="energy" data-n="${i + 1}">${n}</button>`).join('')}</div>
    <div class="sheet-foot"><div class="btn-row">${cur ? `<button type="button" class="btn ghost danger-text" data-act="delete">${icon('trash')}Delete</button>` : ''}<button type="button" class="btn primary" data-act="save">${icon('check')}Save</button></div></div>`;
  const sh = openSheet(html(), {
    label: 'Sleep and energy',
    act: {
      hrs: a => { w.hrs = clamp(w.hrs + +a.dataset.d, 0, 16); sh.set(html()); },
      q: a => { w.q = +a.dataset.n; sh.set(html()); },
      energy: a => { w.energy = +a.dataset.n; sh.set(html()); },
      save: () => { S.sleep[k] = { hrs: w.hrs, q: w.q, energy: w.energy, at: Date.now() }; save(); sh.close(); toast(`${icon('moon', 'sm')}Sleep saved`); render(); },
      delete: () => { const was = S.sleep[k]; delete S.sleep[k]; save(); sh.close(); render(); toast('Sleep deleted', { undo: () => { S.sleep[k] = was; save(); render(); } }); },
    },
  });
}

/* ---------- backups ---------- */
// The share sheet lets you save the file to Files, iCloud Drive or anywhere else. Where that isn't possible, it downloads.
async function shareBackup() {
  const name = `settle-backup-${todayKey()}.json`;
  let file = null;
  try { file = new File([JSON.stringify(S, null, 1)], name, { type: 'application/json' }); } catch (e) { file = null; }
  let can = false;
  try { can = !!(file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })); } catch (e) { can = false; }
  if (can) {
    try {
      await navigator.share({ files: [file], title: 'Settle backup' });
      S.hide.lastBackup = Date.now();
      S.hide.backupSnooze = 0;
      save();
      toast(`${icon('check', 'sm')}Backup saved`);
      if (UI.cur === 'today' && !SHEET) render();
      return;
    } catch (e) { if (e && e.name === 'AbortError') return; }
  }
  exportData();
  if (UI.cur === 'today' && !SHEET) render();
}
function backupCard() {
  if (S.entries.length < 3) return '';
  const since = S.hide.lastBackup || S.entries[0].at;
  if (Date.now() - since < 14 * 864e5 || Date.now() < S.hide.backupSnooze) return '';
  return `<div class="note-card">${icon('cloud')}<div><b>${S.hide.lastBackup ? `Your last backup was ${ago(S.hide.lastBackup)}` : 'Keep a copy of your check-ins'}</b><p>Everything is only on this phone. Save a backup to Files or iCloud Drive so you don’t lose it.</p>
    <div class="btn-row"><button type="button" class="btn small primary" data-act="backup">${icon('share')}Back up now</button><button type="button" class="btn small ghost" data-act="backuplater">Later</button></div></div></div>`;
}

/* ---------- the weekly summary ---------- */
function periodSummary(from, to) {
  const list = S.entries.filter(e => inRange(e, from, to));
  const acts = list.map(e => e.act);
  const byDay = {};
  for (const e of list) (byDay[dayOf(e.at)] || (byDay[dayOf(e.at)] = [])).push(e.act);
  const days = Object.entries(byDay).map(([k, v]) => ({ k, a: avg(v), n: v.length }));
  const st = toolStats(list);
  const sleep = Object.entries(S.sleep).filter(([k]) => { const t = fromKey(k).getTime(); return t >= from && t < to; }).map(([, v]) => v);
  const hrs = sleep.map(s => s.hrs).filter(h => h !== null);
  return {
    list, acts, days, mean: acts.length ? avg(acts) : null,
    calm: days.slice().sort((a, b) => a.a - b.a)[0] || null,
    tough: days.slice().sort((a, b) => b.a - a.a)[0] || null,
    best: st.ranked.filter(r => r.avgDrop > 0)[0] || null,
    used: list.reduce((n, e) => n + e.uses.length, 0),
    glimmers: S.glimmers.filter(g => g.at >= from && g.at < to).length,
    sleepHrs: hrs.length ? avg(hrs) : null,
    high: acts.filter(v => v >= 7).length,
  };
}
function weekCard() {
  if (![1, 2, 3].includes(new Date().getDay())) return '';
  const mon = addDays(weekStart(todayKey()), -7);
  if (S.hide.week === mon) return '';
  const from = fromKey(mon).getTime(), to = fromKey(addDays(mon, 7)).getTime();
  const W = periodSummary(from, to);
  if (W.list.length < 3) return '';
  const P = periodSummary(fromKey(addDays(mon, -7)).getTime(), from);
  const d = P.mean !== null ? W.mean - P.mean : null;
  return `<section class="card week-card"><div class="row-between"><h2 class="h3 with-vig">${ART.vig('ground')}Your week</h2><button type="button" class="icon-btn small" data-act="hideweek" aria-label="Hide your week">${icon('close')}</button></div>
    <p class="muted tight">${fmtDay(mon)} to ${fmtDay(addDays(mon, 6))}</p>
    <ul class="facts">
      <li><span>Check-ins</span><b>${W.list.length} on ${plural(W.days.length, 'day')}</b></li>
      <li><span>Average activation</span><b>${f1(W.mean)}${d === null ? '' : Math.abs(d) < 0.2 ? ' · about the same' : d < 0 ? ` · <span class="good">${f1(-d)} lower</span>` : ` · <span class="warn-text">${f1(d)} higher</span>`}</b></li>
      ${W.days.length > 1 ? `<li><span>Calmest day</span><b>${WD_LONG[fromKey(W.calm.k).getDay()]} · ${f1(W.calm.a)}</b></li><li><span>Toughest day</span><b>${WD_LONG[fromKey(W.tough.k).getDay()]} · ${f1(W.tough.a)}</b></li>` : ''}
      ${W.best ? `<li><span>Helped most</span><b>${esc(toolName(W.best.id))} · ${f1(W.best.avgDrop)} calmer</b></li>` : ''}
      ${W.glimmers ? `<li><span>Glimmers</span><b>${W.glimmers}</b></li>` : ''}
      ${W.sleepHrs !== null ? `<li><span>Average sleep</span><b>${f1(W.sleepHrs)} h</b></li>` : ''}
    </ul>
    <div class="btn-row"><a class="btn small outline" href="#/report">${icon('list')}Make a report</a></div></section>`;
}

/* ---------- your space (links on Today) ---------- */
const spaceTiles = () => `<section><h2 class="h3">Your space</h2><div class="tiles">
  <a class="tile" href="#/plan">${icon('shield')}<span><b>Safety plan</b><small>${S.plan.updated ? 'For when it’s too much' : 'Make one, just in case'}</small></span></a>
  <a class="tile" href="#/words">${icon('voice')}<span><b>Your own words</b><small>How each state feels</small></span></a>
  <button type="button" class="tile" data-act="routines">${icon('list')}<span><b>Routines</b><small>Tools in a row</small></span></button>
  <a class="tile" href="#/report">${icon('chart')}<span><b>Report</b><small>For your GP or therapist</small></span></a>
</div></section>`;

/* ---------- report for appointments ---------- */
const RP = { p: '30', notes: false };
const RP_PERIODS = [['7', '7 days'], ['14', '14 days'], ['30', '30 days'], ['90', '3 months']];
VIEWS.report = {
  title: 'Report', tab: 'insights',
  render() {
    const days = +RP.p;
    const fromK = addDays(todayKey(), -(days - 1));
    const from = fromKey(fromK).getTime();
    const list = S.entries.filter(e => e.at >= from);
    const controls = `<div class="no-print">${backBtn('#/insights', 'Insights')}
      ${pageHead('Report', 'A summary to share with your GP, psychologist or physio', { flip: true })}
      <div class="seg wide" role="radiogroup" aria-label="Period">${RP_PERIODS.map(([id, name]) => `<button type="button" role="radio" aria-checked="${RP.p === id}" class="${RP.p === id ? 'on' : ''}" data-act="period" data-id="${id}">${name}</button>`).join('')}</div>
      ${switchRow('notes', 'Include notes', 'Your check-in and tool notes', RP.notes)}
      <button type="button" class="btn primary wide" data-act="print"${list.length ? '' : ' disabled'}>${icon('share')}Print or save as PDF</button>
      <p class="hint">On iPhone, tap Print, then the share button at the top of the print screen to save a PDF or send it.</p></div>`;
    if (!list.length) return `${controls}${empty('chart', 'No check-ins in this period', 'Choose a longer period.')}`;
    const W = periodSummary(from, Infinity);
    const zoneN = ZONES.map(z => W.acts.filter(v => v >= z.lo && v <= z.hi).length);
    const tod = TIMES.map(([name, sub, f]) => { const v = list.filter(e => f(new Date(e.at).getHours())).map(e => e.act); return { label: name, sub, value: v.length ? avg(v) : 0, n: v.length }; }).filter(r => r.n);
    const st = toolStats(list);
    const tools = st.ranked.slice(0, 8);
    const bmap = bodyStats(list);
    const bs = Object.values(bmap).sort((a, b) => b.load - a.load);
    const maxLoad = bs.length ? bs[0].load : 1;
    const feelCount = dict();
    for (const e of list) for (const f of e.feels) feelCount[f] = (feelCount[f] || 0) + 1;
    const feels = Object.entries(feelCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const trig = triggerStats(list).slice(0, 8);
    const rec = recoveryStats(list);
    const notes = RP.notes ? list.filter(e => e.note || e.uses.some(u => u.note)) : [];
    return `${controls}<article class="report">
      <header class="rp-head"><h1 class="rp-title">Nervous system summary</h1><p>${fmtDay(fromK)} to ${fmtDay(todayKey())} · from Settle, a self-care tracker</p>
        <p class="rp-scale">Activation is self-rated from 0 (deeply calm) to 10 (completely overwhelmed).</p></header>
      <section class="rp-sec"><h2>Summary</h2><ul class="facts">
        <li><span>Check-ins</span><b>${list.length} on ${plural(W.days.length, 'day')}</b></li>
        <li><span>Average activation</span><b>${f1(W.mean)} (${lvlWord(W.mean).toLowerCase()})</b></li>
        <li><span>Highest</span><b>${Math.max(...W.acts)}</b></li>
        <li><span>Time settled (0–3)</span><b>${Math.round(zoneN[0] / W.acts.length * 100)}% of check-ins</b></li>
        <li><span>Time highly activated (7–10)</span><b>${Math.round(zoneN[2] / W.acts.length * 100)}% of check-ins</b></li>
        <li><span>Calming tools used</span><b>${W.used}</b></li>
        ${rec.n ? `<li><span>Typical time to settle from 7+ to 3 or less</span><b>${fmtDur(rec.median)} (${plural(rec.n, 'time')})</b></li>` : ''}
        ${W.sleepHrs !== null ? `<li><span>Average sleep</span><b>${f1(W.sleepHrs)} h</b></li>` : ''}
        ${W.glimmers ? `<li><span>Glimmers noted</span><b>${W.glimmers}</b></li>` : ''}
      </ul></section>
      <section class="rp-sec"><h2>Activation by day</h2>${dayChart(list, from, days)}</section>
      ${tod.length ? `<section class="rp-sec"><h2>Time of day</h2>${hbars(tod.map(r => ({ ...r, text: f1(r.value), sub: `${r.sub} · ${plural(r.n, 'check-in')}`, color: `var(--a${Math.round(r.value)})` })), 10)}</section>` : ''}
      ${bs.length ? `<section class="rp-sec"><h2>Body: pain, tension and other sensations</h2><div class="body-sum">${bodyPair({ fill: id => (bmap[id] ? heat(clamp(bmap[id].load / maxLoad, 0.06, 1)) : null), cls: 'mini' })}
        <ul class="plain">${bs.slice(0, 8).map(r => `<li><b>${esc(regionShort(r.id))}</b> ${r.count}× · average ${f1(r.avg)}/10</li>`).join('')}</ul></div></section>` : ''}
      ${feels.length || trig.length ? `<section class="rp-sec"><h2>Feelings and triggers</h2>
        ${feels.length ? `<p><b>Feelings logged most:</b> ${feels.map(([f, n]) => `${esc(feelLabel(f))} (${n})`).join(', ')}</p>` : ''}
        ${trig.length ? `<p><b>Triggers:</b> ${trig.map(t => `${esc(t.name)} (${t.n}, average ${f1(t.a)})`).join(', ')}</p>` : ''}</section>` : ''}
      ${tools.length ? `<section class="rp-sec"><h2>What helps</h2><table class="rp-table"><thead><tr><th>Tool</th><th>Uses</th><th>Average change</th><th>Rated</th></tr></thead>
        <tbody>${tools.map(r => `<tr><td>${esc(toolName(r.id))}</td><td>${r.n}</td><td>${calmerText(r.avgDrop)}</td><td>${r.avgRating ? `${f1(r.avgRating)}/5` : '–'}</td></tr>`).join('')}</tbody></table></section>` : ''}
      ${notes.length ? `<section class="rp-sec"><h2>Notes</h2><ul class="rp-notes">${notes.map(e => `<li><b>${fmtDay(dayOf(e.at))}, ${fmtTime(e.at)} · ${e.act}</b>${e.note ? `<p>${esc(e.note)}</p>` : ''}${e.uses.filter(u => u.note).map(u => `<p><i>${esc(toolName(u.tool))}:</i> ${esc(u.note)}</p>`).join('')}</li>`).join('')}</ul></section>` : ''}
    </article>`;
  },
  after(view) {
    const onChange = e => { if (e.target.name === 'notes') { RP.notes = e.target.checked; render(); } };
    view.addEventListener('change', onChange);
    return () => view.removeEventListener('change', onChange);
  },
  act: {
    period: a => { RP.p = a.dataset.id; render(); },
    print: () => window.print(),
  },
};
