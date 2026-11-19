/* Settle — Today, Tools, History and a check-in's detail page */
'use strict';

const greeting = () => { const h = new Date().getHours(); return h < 5 ? 'Hello, night owl' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
const entriesOn = k => S.entries.filter(e => dayOf(e.at) === k);
const lastEntry = () => S.entries[S.entries.length - 1] || null;
// Every reading of the day in time order: check-ins, and where you were after each tool.
function readings(entries) {
  const out = [];
  for (const e of entries) {
    out.push({ at: e.at, v: e.act, kind: 'in', e });
    for (const u of e.uses) if (u.after !== null) out.push({ at: u.end || e.at, v: u.after, kind: 'after', e, u });
  }
  return out.sort((a, b) => a.at - b.at);
}

/* ---------- Today ---------- */
function banners() {
  const a = S.active;
  if (a && !a.done) {
    const left = a.mins * 60000 - elapsedOf(a);
    return `<a class="banner" href="#/session">${icon('wind')}<span><b>${esc(toolName(a.tool))} ${left > 0 ? `is ${a.paused ? 'paused' : 'running'}` : 'has finished'}</b><small>${left > 0 ? `${fmtClock(left)} left` : 'Time’s up. Rate how it went'}</small></span><span class="btn small primary">${left > 0 ? 'Resume' : 'Rate it'}</span></a>`;
  }
  if (a && a.done) return `<a class="banner" href="#/after">${icon('check')}<span><b>How did ${esc(toolName(a.tool))} go?</b><small>Rate it so you can see what works</small></span><span class="btn small primary">Rate it</span></a>`;
  const pe = pendingEntry();
  if (pe) return `<div class="banner">${icon('wind')}<span><b>Choose a tool for your ${fmtTime(pe.at)} check-in</b><small>Or skip it, the check-in is saved</small></span><span class="banner-acts"><a class="btn small primary" href="#/pick">Choose</a><button type="button" class="icon-btn small" data-act="unpend" aria-label="Skip choosing a tool">${icon('close')}</button></span></div>`;
  return '';
}
function installCard() {
  if (S.hide.install || STANDALONE()) return '';
  if (IOS) return `<div class="note-card">${icon('phone')}<div><b>Add Settle to your Home Screen</b><p>In Safari, tap Share ${icon('share', 'sm')} then <b>Add to Home Screen</b>. Settle then opens like an app, works offline and keeps your check-ins safe.</p>
    <button type="button" class="btn small ghost" data-act="hideinstall">Got it</button></div></div>`;
  if (INSTALL.prompt) return `<div class="note-card">${icon('phone')}<div><b>Install Settle</b><p>Open it like an app, even offline.</p><div class="btn-row"><button type="button" class="btn small primary" data-act="install">Install</button><button type="button" class="btn small ghost" data-act="hideinstall">Not now</button></div></div></div>`;
  return '';
}
function todayChart(list) {
  const pts = readings(list);
  if (!pts.length) return '';
  const d0 = fromKey(todayKey()).getTime();
  const hr = ts => (ts - d0) / 3600000;
  const lo = Math.min(7, Math.floor(hr(pts[0].at))), hi = Math.max(lo + 6, Math.min(24, Math.ceil(Math.max(hr(Date.now()), hr(pts[pts.length - 1].at)) + 0.5)));
  const W = 320, H = 150, L = 26, R = 8, T = 10, B = 22;
  const x = h => L + ((h - lo) / (hi - lo)) * (W - L - R), y = v => T + (1 - v / 10) * (H - T - B);
  const ticks = [];
  for (let h = Math.ceil(lo / 3) * 3; h <= hi; h += 3) ticks.push(h);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(hr(p.at)).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Today’s readings: ${pts.map(p => `${fmtTime(p.at)} ${p.v}`).join(', ')}">
    <rect x="${L}" y="${y(10)}" width="${W - L - R}" height="${y(7) - y(10)}" class="band hi"/><rect x="${L}" y="${y(3)}" width="${W - L - R}" height="${y(0) - y(3)}" class="band lo"/>
    ${[0, 5, 10].map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 6}" y="${y(v) + 4}" class="ax" text-anchor="end">${v}</text>`).join('')}
    ${ticks.map(h => `<text x="${x(h)}" y="${H - 6}" class="ax" text-anchor="middle">${h % 12 || 12}${h < 12 || h === 24 ? 'am' : 'pm'}</text>`).join('')}
    <path d="${line}" class="ln"/>
    ${pts.map(p => `<circle cx="${x(hr(p.at)).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="${p.kind === 'in' ? 6 : 4.5}" class="pt ${p.kind}" style="fill:var(--a${p.v})"/>`).join('')}
  </svg><p class="chart-key"><span><i class="k-in"></i>Check-in</span><span><i class="k-after"></i>After a tool</span><span><i class="k-band"></i>Settled 0–3 and high 7–10 zones</span></p>`;
}
function entryCard(e, opts = {}) {
  const feels = e.feels.map(feelLabel), tags = e.tags.map(tagLabel);
  const extra = feels.concat(tags);
  return `<li><a class="entry" href="#/entry/${esc(e.id)}">
    <span class="e-time num">${fmtTime(e.at)}</span>
    <span class="e-main">${lvl(e.act, true)}${extra.length ? `<small class="e-tags">${esc(extra.slice(0, 4).join(', '))}${extra.length > 4 ? '…' : ''}</small>` : ''}
      ${e.uses.map(u => `<span class="e-use">${ART.vig((toolById(u.tool) || {}).cat)}<span>${esc(toolName(u.tool))} · ${u.secs >= 60 ? `${Math.round(u.secs / 60)} min` : `${u.secs} sec`}</span>${u.after !== null ? lvlArrow(u.before, u.after) : '<span class="muted">not rated</span>'}${u.rating ? `<span class="muted">${RATINGS[u.rating - 1]}</span>` : ''}</span>`).join('')}
      ${Object.keys(e.body).length ? `<small class="e-body">${icon('body', 'sm')}${esc(bodySummary(e.body))}</small>` : ''}
      ${e.note && !opts.noNote ? `<small class="e-note">“${esc(e.note.length > 90 ? e.note.slice(0, 90) + '…' : e.note)}”</small>` : ''}</span>
    ${icon('chev-r', 'go')}</a></li>`;
}
VIEWS.today = {
  title: 'Today',
  render() {
    const t = todayKey();
    const list = entriesOn(t);
    const last = lastEntry();
    const lastLvl = last ? currentLevel(last) : null;
    const lastAt = last ? Math.max(last.at, ...last.uses.map(u => u.end || 0)) : 0;
    const recent = last && Date.now() - lastAt < 3 * 3600000;
    const favs = S.favs.map(toolById).filter(Boolean);
    const st = toolStats();
    const best = st.ranked.filter(x => x.n >= 2 && x.avgDrop > 0).slice(0, 3);
    const vals = list.map(e => e.act);
    return `${pageHead(greeting(), '', { eyebrow: fmtDayLong(t) })}
    ${banners()}
    <section class="hero card">${ART.scape()}<div class="hero-body">
      <h2>How’s your nervous system?</h2>
      ${last ? `<p class="last">Last reading ${ago(lastAt)}: ${lvl(lastLvl, true)}</p>` : '<p class="last">Check in any time: when you wake, when something happens, before bed.</p>'}
      <a class="btn primary big wide" href="#/checkin">${icon('plus')}Check in</a>
      ${recent && lastLvl >= 9 ? crisisCard() : ''}
    </div></section>
    ${installCard()}
    ${list.length ? `<section class="card"><div class="row-between"><h2 class="h3">Today</h2><span class="muted">${plural(list.length, 'check-in')} · average ${f1(avg(vals))} · highest ${Math.max(...vals)}</span></div>${todayChart(list)}</section>` : ''}
    ${recent && lastLvl >= 4 ? `<section><h2 class="h3">Try right now</h2><ul class="tool-list">${suggest(lastLvl, { feels: last.feels, body: last.body, n: 3 }).map(x => toolRow(x.t, st).replace('<span class="meta">', `<span class="why">${esc(x.why || '')}</span><span class="meta">`)).join('')}</ul></section>` : ''}
    <section><div class="row-between"><h2 class="h3">Favourites</h2><a class="link" href="#/tools">All tools</a></div>
      ${favs.length ? `<div class="fav-row">${favs.map(f => `<button type="button" class="fav-chip" data-act="open" data-id="${f.id}">${ART.vig(f.cat)}<span>${esc(f.name)}</span></button>`).join('')}</div>`
        : `<p class="muted">Tap the star on any tool and it will show up here, ready to start.</p>`}</section>
    ${best.length ? `<section class="card"><div class="row-between"><h2 class="h3">What works for you</h2><a class="link" href="#/insights">Insights</a></div>
      <ol class="best">${best.map(b => `<li><button type="button" class="linkish" data-act="open" data-id="${esc(b.id)}">${esc(toolName(b.id))}</button><span><span class="good">${f1(b.avgDrop)} calmer on average</span> <span class="muted">· ${plural(b.n, 'use')}</span></span></li>`).join('')}</ol></section>` : ''}
    <section><div class="row-between"><h2 class="h3">Today’s check-ins</h2>${S.entries.length ? '<a class="link" href="#/history">History</a>' : ''}</div>
      ${list.length ? `<ul class="entries">${list.slice().reverse().map(e => entryCard(e)).join('')}</ul>` : '<p class="muted">Nothing yet today.</p>'}</section>`;
  },
  act: {
    open: a => openToolSheet(a.dataset.id),
    fav: a => favButton(a),
    unpend: () => { S.pending = null; save(); render(); },
    hideinstall: () => { S.hide.install = true; save(); render(); },
    install: async () => { const p = INSTALL.prompt; INSTALL.prompt = null; if (p) { p.prompt(); try { await p.userChoice; } catch (e) { /* dismissed */ } } render(); },
  },
  // A running session's banner counts down, and turns into "Rate it" when the time is up.
  after() {
    const a = S.active;
    if (!a || a.done || a.paused || a.mins * 60000 - elapsedOf(a) <= 0) return null;
    const timer = setInterval(() => {
      if (S.active !== a || UI.cur !== 'today') return;
      const left = a.mins * 60000 - elapsedOf(a);
      const sm = $('.banner small');
      if (left <= 0) { clearInterval(timer); render(); } else if (sm) sm.textContent = `${fmtClock(left)} left`;
    }, 1000);
    return () => clearInterval(timer);
  },
};

/* ---------- Tools ---------- */
const TL = { q: '', cat: 'all', good: '' };
VIEWS.tools = {
  title: 'Tools',
  render() {
    const st = toolStats();
    const list = filterTools(TL.q, TL.cat, TL.good);
    const grouped = !TL.q && TL.cat === 'all' && !TL.good;
    const body = !list.length
      ? empty('search', 'No tools match', TL.cat === 'fav' && !S.favs.length ? 'You haven’t starred any tools yet. Tap the star next to a tool to add it.' : 'Try another word, or clear the filters.', '<button type="button" class="btn outline" data-act="clear">Clear filters</button>')
      : grouped
        ? CATS.map(c => `<section class="cat"><h2 class="h3">${ART.vig(c.id)}${c.name}</h2><ul class="tool-list">${list.filter(t => t.cat === c.id).map(t => toolRow(t, st)).join('')}</ul></section>`).join('')
        : `<p class="muted" aria-live="polite">${plural(list.length, 'tool')}</p><ul class="tool-list">${list.map(t => toolRow(t, st)).join('')}</ul>`;
    return `${pageHead('Tools', `${TOOLS.length} body-based ways to settle your nervous system`, { flip: true })}
      <div class="search"><label class="sr" for="tl-q">Search tools</label>${icon('search')}<input id="tl-q" type="search" placeholder="Search, e.g. breath, jaw, sleep" value="${esc(TL.q)}" autocomplete="off"></div>
      <div class="chips scroll" role="group" aria-label="Group">${[['all', 'All'], ['fav', 'Favourites'], ...CATS.map(c => [c.id, c.name])].map(([id, name]) => `<button type="button" class="chip${TL.cat === id ? ' on' : ''}" data-act="cat" data-id="${id}" aria-pressed="${TL.cat === id}">${id === 'fav' ? icon('star', 'sm') : ''}${name}</button>`).join('')}</div>
      <div class="chips scroll" role="group" aria-label="Good for"><span class="chips-label">Good for</span>${Object.entries(GOOD).map(([id, name]) => `<button type="button" class="chip${TL.good === id ? ' on' : ''}" data-act="good" data-id="${id}" aria-pressed="${TL.good === id}">${name}</button>`).join('')}</div>
      <div id="tl-list">${body}</div>`;
  },
  after(view) {
    const q = $('#tl-q', view);
    let timer = 0;
    q.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => { TL.q = q.value; const pos = q.selectionStart; render(); const n = $('#tl-q'); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { /* type=search */ } }, 180); });
  },
  act: {
    cat: a => { TL.cat = a.dataset.id; render(); },
    good: a => { TL.good = TL.good === a.dataset.id ? '' : a.dataset.id; render(); },
    clear: () => { Object.assign(TL, { q: '', cat: 'all', good: '' }); render(); },
    open: a => openToolSheet(a.dataset.id),
    fav: a => { favButton(a); if (TL.cat === 'fav') render(); },
  },
};

/* ---------- History ---------- */
const HI = { f: 'all', shown: 60 };
VIEWS.history = {
  title: 'History',
  render() {
    if (!S.entries.length) return `${pageHead('History')}${empty('clock', 'No check-ins yet', 'Your check-ins and the tools you try will show up here.', '<a class="btn primary" href="#/checkin">Check in</a>')}`;
    const f = { all: () => true, tool: e => e.uses.length > 0, body: e => Object.keys(e.body).length > 0, note: e => !!(e.note || e.uses.some(u => u.note)) }[HI.f];
    const list = S.entries.filter(f).slice().reverse();
    const shown = list.slice(0, HI.shown);
    const days = [];
    for (const e of shown) { const k = dayOf(e.at); if (!days.length || days[days.length - 1].k !== k) days.push({ k, items: [] }); days[days.length - 1].items.push(e); }
    return `${pageHead('History', `${plural(S.entries.length, 'check-in')} since ${fmtDay(dayOf(S.entries[0].at))}`)}
      <div class="chips scroll" role="group" aria-label="Show">${[['all', 'All'], ['tool', 'With a tool'], ['body', 'Pain or tension'], ['note', 'With a note']].map(([id, name]) => `<button type="button" class="chip${HI.f === id ? ' on' : ''}" data-act="f" data-id="${id}" aria-pressed="${HI.f === id}">${name}</button>`).join('')}</div>
      ${days.length ? days.map(d => { const all = entriesOn(d.k).map(e => e.act); return `<section class="day"><h2 class="day-head"><span>${relDay(d.k)}</span><small>${plural(all.length, 'check-in')} · average ${f1(avg(all))}</small></h2><ul class="entries">${d.items.map(e => entryCard(e)).join('')}</ul></section>`; }).join('')
        : '<p class="muted pad">Nothing matches this filter yet.</p>'}
      ${list.length > HI.shown ? `<button type="button" class="btn outline wide" data-act="more">Show older check-ins</button>` : ''}
      <button type="button" class="btn ghost wide" data-act="csv">${icon('download')}Export all as a spreadsheet (CSV)</button>`;
  },
  act: {
    f: a => { HI.f = a.dataset.id; HI.shown = 60; render(); },
    more: () => { HI.shown += 60; render(); },
    csv: () => exportCsv(),
  },
};

/* ---------- one check-in ---------- */
VIEWS.entry = {
  title: 'Check-in', tab: 'history',
  render(id) {
    const e = entryById(id);
    if (!e) return `${backBtn('#/history', 'History')}${empty('search', 'Check-in not found', 'It may have been deleted.')}`;
    const recent = Date.now() - e.at < 3 * 3600000;
    return `${backBtn('#/history', 'History')}
    ${pageHead(`${fmtTime(e.at)} check-in`, '', { eyebrow: relDay(dayOf(e.at)), flip: true })}
    <section class="card">
      <div class="big-lvl">${lvl(e.act)}<div><b>${lvlWord(e.act)}</b><p class="muted">${LEVELS[e.act][1]}</p></div></div>
      ${e.src === 'tool' ? '<p class="hint">Recorded when you started a tool.</p>' : ''}
      ${e.feels.length ? `<p class="label">Feelings</p><div class="chips tight">${e.feels.map(f => `<span class="tag">${esc(feelLabel(f))}</span>`).join('')}</div>` : ''}
      ${e.tags.length ? `<p class="label">What was going on</p><div class="chips tight">${e.tags.map(f => `<span class="tag">${esc(tagLabel(f))}</span>`).join('')}</div>` : ''}
      ${e.note ? `<p class="label">Note</p><p class="note">${esc(e.note)}</p>` : ''}
    </section>
    ${Object.keys(e.body).length ? `<section class="card"><h2 class="h3">Pain and tension</h2><div class="body-sum">${bodyPair({ fill: r => (e.body[r] ? heatN(e.body[r].n) : null), cls: 'mini' })}
      <ul class="plain">${bodyList(e.body).map(([r, v]) => `<li><span class="dot" style="background:${heatN(v.n)}"></span><b>${esc(regionShort(r))}</b> ${v.n}/10 <span class="muted">${KINDS[v.k]}</span></li>`).join('')}</ul></div></section>` : ''}
    <section><h2 class="h3">Tools</h2>
      ${e.uses.length ? `<ul class="uses">${e.uses.map(u => useCard(e, u)).join('')}</ul>` : '<p class="muted">No tools with this check-in.</p>'}
      ${recent && !(S.active && !S.active.done) ? `<button type="button" class="btn outline wide" data-act="pick">${icon('wind')}Try a tool for this check-in</button>` : ''}</section>
    <div class="btn-row"><a class="btn outline" href="#/checkin/${esc(e.id)}">${icon('edit')}Edit</a><button type="button" class="btn ghost danger-text" data-act="del">${icon('trash')}Delete</button></div>`;
  },
  act: {
    pick: () => { S.pending = { entryId: UI.param, at: Date.now() }; save(); go('#/pick'); },
    del: () => confirmSheet({ title: 'Delete this check-in?', body: 'This deletes the check-in and the tools you used with it. You can undo straight afterwards.', yes: 'Delete', danger: true, onYes: () => deleteEntry(UI.param, '#/history') }),
    editUse: a => editUse(UI.param, a.dataset.id),
    delUse: a => {
      const e = entryById(UI.param);
      const i = e.uses.findIndex(u => u.id === a.dataset.id);
      if (i < 0) return;
      const [u] = e.uses.splice(i, 1);
      save();
      render();
      toast(`Removed ${esc(toolName(u.tool))}`, { undo: () => { e.uses.splice(i, 0, u); save(); render(); } });
    },
    open: a => openToolSheet(a.dataset.id, { fresh: true }),
  },
};
function useCard(e, u) {
  const d = u.after !== null && u.before !== null ? u.before - u.after : null;
  const b = u.body;
  return `<li class="card use"><div class="row-between"><button type="button" class="linkish h4" data-act="open" data-id="${esc(u.tool)}">${esc(toolName(u.tool))}</button><span class="muted">${fmtTime(u.start || e.at)} · ${u.secs >= u.mins * 60 - 2 ? durLabel(u.mins) : `${fmtSecs(u.secs)} of ${durLabel(u.mins)}`}</span></div>
    ${u.after !== null ? `<p class="use-lvls">${lvlArrow(u.before, u.after)} <span class="${d > 0 ? 'good' : d < 0 ? 'bad' : 'muted'}">${d > 0 ? `${d} calmer` : d < 0 ? `${-d} higher` : 'no change'}</span></p>` : '<p class="muted">Not rated</p>'}
    ${u.rating ? `<p>Worked: <b>${RATINGS[u.rating - 1]}</b> (${u.rating}/5)</p>` : ''}
    ${b ? `<p class="muted">${icon('body', 'sm')}Pain and tension after: ${esc(bodySummary(b, 4) || 'none')}</p>` : ''}
    ${u.note ? `<p class="note">${esc(u.note)}</p>` : ''}
    <div class="btn-row"><button type="button" class="btn small ghost" data-act="editUse" data-id="${esc(u.id)}">${icon('edit')}Edit</button><button type="button" class="btn small ghost danger-text" data-act="delUse" data-id="${esc(u.id)}">${icon('trash')}Remove</button></div></li>`;
}
function editUse(entryId, useId) {
  const e = entryById(entryId);
  const u = e && e.uses.find(x => x.id === useId);
  if (!u) return;
  const r = { rating: u.rating, after: u.after, note: u.note };
  const html = () => `${sheetHead(`Edit ${esc(toolName(u.tool))}`)}
    <h3 class="q">How well did it work?</h3><div class="rating" role="radiogroup" aria-label="How well did it work">${RATINGS.map((w, i) => `<button type="button" role="radio" class="rate${r.rating === i + 1 ? ' on' : ''}" aria-checked="${r.rating === i + 1}" data-act="rate" data-n="${i + 1}"><b>${i + 1}</b><span>${w}</span></button>`).join('')}</div>
    <h3 class="q">How activated were you after?</h3>${scaleHtml('after', r.after, { mark: u.before })}
    <h3 class="q"><label for="eu-note">Note</label></h3><textarea id="eu-note" rows="3" maxlength="2000">${esc(r.note)}</textarea>
    <div class="sheet-foot"><button type="button" class="btn primary wide" data-act="save">${icon('check')}Save changes</button></div>`;
  const sh = openSheet(html(), {
    cls: 'tall', label: 'Edit tool use',
    onSet: s => { bindScales(s.el, (n, v) => { r.after = v; }); $('#eu-note', s.el).addEventListener('input', ev => { r.note = ev.target.value; }); },
    act: {
      rate: a => { r.rating = +a.dataset.n; for (const x of $$('.rate', sh.el)) { const on = +x.dataset.n === r.rating; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); } },
      save: () => {
        const oldAfter = u.after;
        Object.assign(u, { rating: r.rating, after: r.after, note: r.note.trim() });
        // Tools started after this one (up to the next rated one) began from this reading, so they follow the correction.
        for (let j = e.uses.indexOf(u) + 1; j < e.uses.length; j++) { const x = e.uses[j]; if (x.before === oldAfter) x.before = r.after; if (x.after !== null) break; }
        sh.close();
        if (save()) toast(`${icon('check', 'sm')}Changes saved`);
        render();
      },
    },
  });
}
