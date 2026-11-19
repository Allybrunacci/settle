/* Settle — statistics: what works for you, stress patterns, and where your body holds pain and tension */
'use strict';

/* ---------- tool results ---------- */
let TS_CACHE = { key: -1, v: null };
// For every tool: uses with a before and after reading, average drop, ratings. "score" shrinks small samples
// towards your overall average, so one lucky session doesn't top the list.
function toolStats(entries) {
  const key = entries ? -2 : S.savedAt + S.entries.length;
  if (!entries && TS_CACHE.key === key && TS_CACHE.v) return TS_CACHE.v;
  const src = entries || S.entries;
  const all = dict(), byZone = { low: dict(), mid: dict(), high: dict() };
  const drops = [];
  for (const e of src) for (const u of e.uses) {
    if (u.before === null || u.after === null) continue;
    const d = u.before - u.after;
    drops.push(d);
    for (const m of [all, byZone[zoneOf(u.before).id]]) {
      const s = m[u.tool] || (m[u.tool] = { id: u.tool, n: 0, sumDrop: 0, ratings: [], helped: 0, last: 0, secs: 0 });
      s.n++;
      s.sumDrop += d;
      if (u.rating) s.ratings.push(u.rating);
      if (d >= 1) s.helped++;
      s.last = Math.max(s.last, u.end || e.at);
      s.secs += u.secs;
    }
  }
  const mean = drops.length ? avg(drops) : 0, k = 2;
  const fin = m => { for (const s of Object.values(m)) { s.avgDrop = s.sumDrop / s.n; s.avgRating = s.ratings.length ? avg(s.ratings) : null; s.score = (s.sumDrop + k * mean) / (s.n + k) + (s.avgRating ? (s.avgRating - 3) * 0.15 : 0); } };
  [all, byZone.low, byZone.mid, byZone.high].forEach(fin);
  const rank = m => Object.values(m).sort((a, b) => b.score - a.score);
  const v = { all, byZone, ranked: rank(all), rankedBy: { low: rank(byZone.low), mid: rank(byZone.mid), high: rank(byZone.high) }, mean, n: drops.length };
  if (!entries) TS_CACHE = { key, v };
  return v;
}

/* ---------- periods ---------- */
const PERIODS = [['7', '7 days'], ['30', '30 days'], ['90', '90 days'], ['all', 'All time']];
function periodRange(p) {
  if (p === 'all') return { from: 0, to: Infinity, prevFrom: null };
  const days = +p;
  const from = fromKey(addDays(todayKey(), -(days - 1))).getTime();
  return { from, to: Infinity, prevFrom: fromKey(addDays(todayKey(), -(2 * days - 1))).getTime(), prevTo: from, days };
}
const inRange = (e, a, b) => e.at >= a && e.at < b;
const calmerText = d => (d > 0.05 ? `${f1(d)} calmer` : d < -0.05 ? `${f1(-d)} higher` : 'no change');
const periodChips = (cur, act = 'period') => `<div class="seg wide" role="radiogroup" aria-label="Period">${PERIODS.map(([id, name]) => `<button type="button" role="radio" aria-checked="${cur === id}" class="${cur === id ? 'on' : ''}" data-act="${act}" data-id="${id}">${name}</button>`).join('')}</div>`;

/* ---------- small charts ---------- */
// Horizontal bars. rows: { label, value, text, sub, color }
function hbars(rows, max, opts = {}) {
  if (!rows.length) return '';
  const m = max || Math.max(...rows.map(r => Math.abs(r.value)), 0.0001);
  return `<ul class="hbars${opts.cls ? ' ' + opts.cls : ''}">${rows.map(r => `<li${r.act ? ` data-act="${r.act}" data-id="${esc(r.id)}" role="button" tabindex="0"` : ''}>
    <span class="hb-label">${r.label}${r.sub ? `<small>${r.sub}</small>` : ''}</span>
    <span class="hb-val num">${r.text}</span>
    <span class="hb-track"><i style="transform:scaleX(${clamp(Math.abs(r.value) / m, 0.02, 1).toFixed(3)});${r.color ? `background:${r.color}` : ''}"${r.value < 0 ? ' class="neg"' : ''}></i></span></li>`).join('')}</ul>`;
}
// Activation by day: a dot for the average and a line from the lowest to the highest reading.
function dayChart(entries, from, days) {
  const byDay = {};
  for (const e of entries) (byDay[dayOf(e.at)] || (byDay[dayOf(e.at)] = [])).push(e.act);
  const first = days ? dayOf(from) : dayOf(entries[0].at);
  const span = days || Math.max(1, Math.round((fromKey(todayKey()) - fromKey(first)) / 864e5) + 1);
  const weekly = span > 120;
  const buckets = [];
  if (weekly) {
    let k = weekStart(first);
    while (k <= todayKey()) { const vals = []; for (let i = 0; i < 7; i++) vals.push(...(byDay[addDays(k, i)] || [])); buckets.push({ k, vals }); k = addDays(k, 7); }
  } else for (let i = 0; i < span; i++) { const k = addDays(first, i); buckets.push({ k, vals: byDay[k] || [] }); }
  const W = 340, H = 170, L = 26, R = 8, T = 10, B = 24;
  const n = buckets.length, bw = (W - L - R) / n;
  const x = i => L + bw * (i + 0.5), y = v => T + (1 - v / 10) * (H - T - B);
  const pts = buckets.map((b, i) => (b.vals.length ? { i, a: avg(b.vals), lo: Math.min(...b.vals), hi: Math.max(...b.vals), k: b.k, n: b.vals.length } : null)).filter(Boolean);
  const step = Math.ceil(n / 7);
  const label = k => { const d = fromKey(k); return weekly || n > 31 ? `${d.getDate()} ${MON[d.getMonth()]}` : n <= 7 ? WD[d.getDay()] : `${d.getDate()}/${d.getMonth() + 1}`; };
  const line = pts.map((p, j) => `${j ? 'L' : 'M'}${x(p.i).toFixed(1)},${y(p.a).toFixed(1)}`).join(' ');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Average activation ${weekly ? 'by week' : 'by day'}: ${pts.slice(-14).map(p => `${fmtDay(p.k)} ${f1(p.a)}`).join(', ')}">
    <rect x="${L}" y="${y(10)}" width="${W - L - R}" height="${y(7) - y(10)}" class="band hi"/><rect x="${L}" y="${y(3)}" width="${W - L - R}" height="${y(0) - y(3)}" class="band lo"/>
    ${[0, 5, 10].map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 6}" y="${y(v) + 4}" class="ax" text-anchor="end">${v}</text>`).join('')}
    ${buckets.map((b, i) => (i % step === 0 || i === n - 1 && n <= 7 ? `<text x="${x(i).toFixed(1)}" y="${H - 7}" class="ax" text-anchor="middle">${label(b.k)}</text>` : '')).join('')}
    ${pts.map(p => (p.hi > p.lo ? `<line x1="${x(p.i).toFixed(1)}" x2="${x(p.i).toFixed(1)}" y1="${y(p.hi).toFixed(1)}" y2="${y(p.lo).toFixed(1)}" class="range"/>` : '')).join('')}
    ${pts.length > 1 ? `<path d="${line}" class="ln"/>` : ''}
    ${pts.map(p => `<circle cx="${x(p.i).toFixed(1)}" cy="${y(p.a).toFixed(1)}" r="${n > 60 ? 2.6 : 4.2}" class="pt in" style="fill:var(--a${Math.round(p.a)})"/>`).join('')}
  </svg><p class="chart-key"><span><i class="k-in"></i>${weekly ? 'Weekly' : 'Daily'} average</span><span><i class="k-range"></i>Lowest to highest</span></p>`;
}
const weekStart = k => addDays(k, -((fromKey(k).getDay() + 6) % 7));

/* ---------- triggers, recovery, sleep and glimmers ---------- */
function triggerStats(list) {
  const m = dict();
  for (const e of list) for (const t of e.trig || []) (m[t] || (m[t] = [])).push(e.act);
  return Object.entries(m).map(([name, v]) => ({ name, n: v.length, a: avg(v) })).sort((a, b) => b.n - a.n || b.a - a.a);
}
const fmtDur = ms => { const m = Math.max(1, Math.round(ms / 60000)); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`; };
const median = a => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
// Coming back down: from a reading of 7 or more to the first reading of 3 or less within a day,
// grouped by the first tool you used along the way (or none).
function recoveryStats(list) {
  if (!list.length) return { n: 0, median: null, unresolved: 0, byTool: [] };
  const from = list[0].at, to = list[list.length - 1].at;
  const pts = readings(S.entries.filter(e => e.at >= from - 864e5 && e.at <= to + 864e5));
  const eps = [];
  let ep = null;
  for (const p of pts) {
    if (ep && p.at - ep.start > 864e5) { ep.left = true; eps.push(ep); ep = null; }
    if (ep) {
      if (p.kind === 'after' && !ep.tool && p.u.start >= ep.start - 60000) ep.tool = p.u.tool;
      if (p.v <= 3) { ep.dur = p.at - ep.start; eps.push(ep); ep = null; }
    } else if (p.v >= 7) ep = { start: p.at, tool: null, dur: null };
  }
  const inP = eps.filter(x => x.start >= from && x.start <= to);
  const done = inP.filter(x => x.dur !== null);
  const by = dict();
  for (const x of done) (by[x.tool || ''] || (by[x.tool || ''] = [])).push(x.dur);
  return {
    n: done.length, median: median(done.map(x => x.dur)), unresolved: inP.filter(x => x.left).length,
    byTool: Object.entries(by).map(([id, v]) => ({ id, n: v.length, median: median(v) })).sort((a, b) => a.median - b.median),
  };
}
function sleepStats(list) {
  const byDay = {};
  for (const e of list) (byDay[dayOf(e.at)] || (byDay[dayOf(e.at)] = [])).push(e.act);
  const rows = Object.entries(S.sleep).filter(([k]) => byDay[k]).map(([k, s]) => ({ s, a: avg(byDay[k]) }));
  if (rows.length < 3) return null;
  const group = defs => defs.map(([label, f]) => { const v = rows.filter(r => f(r.s)).map(r => r.a); return { label, value: v.length ? avg(v) : 0, n: v.length }; }).filter(r => r.n);
  const hrs = rows.map(r => r.s.hrs).filter(h => h !== null);
  return {
    n: rows.length, avgHrs: hrs.length ? avg(hrs) : null,
    byHrs: group([['Under 6 hours', s => s.hrs !== null && s.hrs < 6], ['6 to 7½ hours', s => s.hrs !== null && s.hrs >= 6 && s.hrs < 8], ['8 hours or more', s => s.hrs !== null && s.hrs >= 8]]),
    byQ: group([['Poor or terrible sleep', s => s.q && s.q <= 2], ['OK sleep', s => s.q === 3], ['Good or great sleep', s => s.q >= 4]]),
  };
}
// A month on a calendar, each day coloured by its average activation. Tap a day to open it.
function monthCal(off) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + off, 1);
  const y = d.getFullYear(), m = d.getMonth();
  const byDay = {}, glim = new Set(S.glimmers.map(g => dayOf(g.at)));
  for (const e of S.entries) (byDay[dayOf(e.at)] || (byDay[dayOf(e.at)] = [])).push(e.act);
  const t = todayKey();
  const cells = Array.from({ length: (d.getDay() + 6) % 7 }, () => '<span class="mc-cell blank"></span>');
  for (let i = 1; i <= new Date(y, m + 1, 0).getDate(); i++) {
    const k = dkey(new Date(y, m, i)), v = byDay[k], a = v ? avg(v) : null;
    if (k > t) { cells.push(`<span class="mc-cell future"><span>${i}</span></span>`); continue; }
    cells.push(`<a class="mc-cell${a !== null ? ' has' : ''}${k === t ? ' today' : ''}" href="#/history/${k}"${a !== null ? ` style="--c:var(--a${Math.round(a)})"` : ''} aria-label="${fmtDayLong(k)}: ${a !== null ? `average ${f1(a)}, ${plural(v.length, 'check-in')}` : 'no check-ins'}${glim.has(k) ? ', a glimmer' : ''}"><span>${i}</span>${glim.has(k) ? '<i class="mc-glim"></i>' : ''}</a>`);
  }
  const first = S.entries.length ? fromKey(dayOf(S.entries[0].at)) : now;
  const canBack = new Date(y, m, 1) > new Date(first.getFullYear(), first.getMonth(), 1);
  return `<div class="mc-head"><button type="button" class="icon-btn small" data-act="mprev" aria-label="Previous month"${canBack ? '' : ' disabled'}>${icon('chev-l')}</button><b>${MON_LONG[m]} ${y}</b><button type="button" class="icon-btn small" data-act="mnext" aria-label="Next month"${off < 0 ? '' : ' disabled'}>${icon('chev-r')}</button></div>
    <div class="mc-wd" aria-hidden="true">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(x => `<span>${x}</span>`).join('')}</div>
    <div class="mc-grid">${cells.join('')}</div>
    <p class="chart-key"><span><i class="k-in"></i>Colour: that day’s average</span><span><i class="mc-glim"></i>A glimmer</span><span>Tap a day to open it</span></p>`;
}

/* ---------- Insights ---------- */
const IN = { p: '30', z: 'any', m: 0 };
const TIMES = [['Early morning', '4–8 am', h => h >= 4 && h < 8], ['Morning', '8 am–12', h => h >= 8 && h < 12], ['Afternoon', '12–5 pm', h => h >= 12 && h < 17], ['Evening', '5–9 pm', h => h >= 17 && h < 21], ['Night', '9 pm–4 am', h => h >= 21 || h < 4]];
const DURS = [['Under 2 min', s => s < 120], ['2 to 4 min', s => s >= 120 && s < 300], ['5 to 9 min', s => s >= 300 && s < 600], ['10 min or more', s => s >= 600]];
function trendText(cur, prev) {
  if (prev === null || cur === null) return '';
  const d = cur - prev;
  if (Math.abs(d) < 0.2) return `<span class="muted">About the same as the period before</span>`;
  return d < 0 ? `<span class="good">${icon('down', 'sm')}${f1(-d)} lower than the period before</span>` : `<span class="warn-text">${icon('up', 'sm')}${f1(d)} higher than the period before</span>`;
}
VIEWS.insights = {
  title: 'Insights',
  render() {
    const R = periodRange(IN.p);
    const list = S.entries.filter(e => inRange(e, R.from, R.to));
    const head = `${pageHead('Insights', 'Your stress levels and what settles you')}${periodChips(IN.p)}`;
    if (!list.length) return `${head}${empty('chart', S.entries.length ? 'No check-ins in this period' : 'Nothing to show yet', S.entries.length ? 'Choose a longer period to see more.' : 'Check in a few times and try some tools. Your patterns will show up here.', S.entries.length ? '' : '<a class="btn primary" href="#/checkin">Check in</a>')}`;
    const prev = R.prevFrom !== null ? S.entries.filter(e => inRange(e, R.prevFrom, R.prevTo)) : [];
    const acts = list.map(e => e.act), mean = avg(acts);
    const pmean = prev.length ? avg(prev.map(e => e.act)) : null;
    const days = new Set(list.map(e => dayOf(e.at))).size;
    const zoneN = ZONES.map(z => acts.filter(v => v >= z.lo && v <= z.hi).length);
    const st = toolStats(list);
    const ranked = (IN.z === 'any' ? st.ranked : st.rankedBy[IN.z]).slice(0, 8);
    const maxDrop = Math.max(1, ...ranked.map(r => Math.abs(r.avgDrop)));
    const uses = list.flatMap(e => e.uses.filter(u => u.after !== null && u.before !== null));
    const peak = list.reduce((m, e) => (!m || e.act > m.act ? e : m), null);
    // Time of day and day of the week
    const tod = TIMES.map(([name, sub, f]) => { const v = list.filter(e => f(new Date(e.at).getHours())).map(e => e.act); return { label: name, sub, value: v.length ? avg(v) : 0, n: v.length }; });
    const wd = [1, 2, 3, 4, 5, 6, 0].map(d => { const v = list.filter(e => new Date(e.at).getDay() === d).map(e => e.act); return { d, v: v.length ? avg(v) : null, n: v.length }; });
    const durs = DURS.map(([name, f]) => { const v = uses.filter(u => f(u.secs)).map(u => u.before - u.after); return { label: name, value: v.length ? avg(v) : 0, n: v.length }; }).filter(r => r.n);
    const feelCount = dict();
    for (const e of list) for (const f of e.feels) (feelCount[f] || (feelCount[f] = [])).push(e.act);
    const feels = Object.entries(feelCount).sort((a, b) => b[1].length - a[1].length).slice(0, 10);
    const tagCount = dict();
    for (const e of list) for (const t of e.tags) (tagCount[t] || (tagCount[t] = [])).push(e.act);
    const tags = Object.entries(tagCount).map(([id, v]) => ({ id, n: v.length, a: avg(v) })).sort((a, b) => b.a - a.a).slice(0, 10);
    const trig = triggerStats(list).slice(0, 10);
    const rec = recoveryStats(list);
    const slp = sleepStats(list);
    const gl = S.glimmers.filter(g => g.at >= R.from && g.at < R.to);
    const glDays = new Set(gl.map(g => dayOf(g.at)));
    const dayAvg = {};
    for (const e of list) (dayAvg[dayOf(e.at)] || (dayAvg[dayOf(e.at)] = [])).push(e.act);
    const withG = Object.entries(dayAvg).filter(([k]) => glDays.has(k)).map(([, v]) => avg(v)), withoutG = Object.entries(dayAvg).filter(([k]) => !glDays.has(k)).map(([, v]) => avg(v));
    const gKinds = GKINDS.map(([k, n]) => [n, gl.filter(g => g.kind === k).length]).filter(x => x[1]).sort((a, b) => b[1] - a[1]);
    return `${head}
    <section class="kpis">
      <div class="kpi"><span class="k-label">Average activation</span><span class="k-val num">${f1(mean)}</span><span class="k-sub">${lvlWord(mean)}</span>${trendText(mean, pmean) ? `<span class="k-sub">${trendText(mean, pmean)}</span>` : ''}</div>
      <div class="kpi"><span class="k-label">Check-ins</span><span class="k-val num">${list.length}</span><span class="k-sub">on ${plural(days, 'day')} · ${f1(list.length / days)} a day</span></div>
      <div class="kpi"><span class="k-label">Tools used</span><span class="k-val num">${uses.length}</span><span class="k-sub">${uses.length ? `${f1(avg(uses.map(u => u.before - u.after)))} calmer on average` : 'Try one after a check-in'}</span></div>
      <div class="kpi"><span class="k-label">Highest</span><span class="k-val num">${peak.act}</span><span class="k-sub">${fmtDay(dayOf(peak.at))}, ${fmtTime(peak.at)}</span></div>
    </section>
    <section class="card"><h2 class="h3">How often you were in each zone</h2>
      <div class="zbar" role="img" aria-label="${ZONES.map((z, i) => `${z.name} ${Math.round(zoneN[i] / acts.length * 100)}%`).join(', ')}">${ZONES.map((z, i) => (zoneN[i] ? `<i class="z-${z.id}" style="flex:${zoneN[i]}"></i>` : '')).join('')}</div>
      <ul class="zkey">${ZONES.map((z, i) => `<li><i class="z-${z.id}"></i>${icon({ low: 'leaf', mid: 'wind', high: 'cloud' }[z.id], 'sm')}<b>${z.name}</b> <span class="muted">${z.range}</span> <span class="num">${Math.round(zoneN[i] / acts.length * 100)}%</span></li>`).join('')}</ul></section>
    <section class="card"><h2 class="h3">Activation over time</h2>${dayChart(list, R.from, R.days)}</section>
    <section class="card month"><h2 class="h3">Month by month</h2>${monthCal(IN.m)}</section>
    <section class="card"><h2 class="h3">What works best for you</h2>
      <div class="seg wide" role="radiogroup" aria-label="Starting level">${[['any', 'Any level', 'Any'], ['high', 'High, 7 to 10', '7–10'], ['mid', 'Activated, 4 to 6', '4–6'], ['low', 'Settled, 0 to 3', '0–3']].map(([id, name, short]) => `<button type="button" role="radio" aria-checked="${IN.z === id}" aria-label="${name}" class="${IN.z === id ? 'on' : ''}" data-act="zone" data-id="${id}">${short}</button>`).join('')}</div>
      <p class="hint tight">Tools that settled you most, starting from that level.</p>
      ${ranked.length ? `${hbars(ranked.map(r => ({ label: esc(toolName(r.id)), sub: `${plural(r.n, 'use')}${r.avgRating ? ` · rated ${f1(r.avgRating)}/5` : ''}${r.n < 3 ? ' · early days' : ''}`, value: r.avgDrop, text: calmerText(r.avgDrop), act: 'open', id: r.id })), maxDrop, { cls: 'tools' })}
        <p class="hint">Average points calmer after each tool. Ranked by how much your activation dropped, allowing for how often you’ve used each one.</p>`
        : `<p class="muted">${IN.z === 'any' ? 'Rate a tool after you use it and your results show up here.' : 'No tools rated from this starting level in this period yet.'}</p>`}</section>
    <section class="card"><h2 class="h3">Coming back down</h2>
      ${rec.n ? `<p class="big-stat"><span class="num">${fmtDur(rec.median)}</span><small>is how long it usually takes you to get from 7 or more back to 3 or less (${plural(rec.n, 'time')})</small></p>
        ${rec.byTool.length > 1 || (rec.byTool[0] && rec.byTool[0].id) ? `<p class="label">By the first tool you used</p>${hbars(rec.byTool.slice(0, 8).map(r => ({ label: r.id ? esc(toolName(r.id)) : 'No tool', sub: `${plural(r.n, 'time')}${r.n < 3 ? ' · early days' : ''}`, value: r.median, text: fmtDur(r.median), act: r.id ? 'open' : '', id: r.id })), Math.max(...rec.byTool.map(r => r.median)), { cls: 'tools' })}<p class="hint">Typical time back to settled. Shorter is better.</p>` : ''}`
        : '<p class="muted">When you go from 7 or more back down to 3 or less (checking in again, or rating a tool), you’ll see how long it usually takes and what speeds it up.</p>'}
      ${rec.unresolved ? `<p class="hint">${plural(rec.unresolved, 'time')} you didn’t check in as settled within a day.</p>` : ''}</section>
    <section class="card"><h2 class="h3">Time of day</h2>${hbars(tod.filter(r => r.n).map(r => ({ ...r, text: f1(r.value), sub: `${r.sub} · ${plural(r.n, 'check-in')}`, color: `var(--a${Math.round(r.value)})` })), 10)}
      <p class="hint">Average activation when you checked in.</p></section>
    <section class="card"><h2 class="h3">Day of the week</h2><div class="cols" role="img" aria-label="${wd.filter(w => w.n).map(w => `${WD_LONG[w.d]} ${f1(w.v)}`).join(', ')}">${wd.map(w => `<div class="col"><span class="c-val num">${w.n ? f1(w.v) : '–'}</span><span class="c-track"><i style="transform:scaleY(${w.n ? clamp(w.v / 10, 0.03, 1).toFixed(3) : 0})${w.n ? `;background:var(--a${Math.round(w.v)})` : ''}"></i></span><span class="c-lab">${WD[w.d]}</span></div>`).join('')}</div></section>
    ${durs.length ? `<section class="card"><h2 class="h3">How long works best</h2>${hbars(durs.map(r => ({ ...r, sub: plural(r.n, 'use'), text: calmerText(r.value) })), Math.max(1, ...durs.map(r => Math.abs(r.value))), { cls: 'tools' })}<p class="hint">Average points calmer, by how long you spent on a tool.</p></section>` : ''}
    ${feels.length ? `<section class="card"><h2 class="h3">Feelings you log most</h2><ul class="counts">${feels.map(([f, v]) => `<li><b>${esc(feelLabel(f))}</b><span class="num">${v.length}×</span><span class="muted">average ${f1(avg(v))}</span></li>`).join('')}</ul></section>` : ''}
    ${tags.length ? `<section class="card"><h2 class="h3">What’s going on when you’re most activated</h2>${hbars(tags.map(t => ({ label: esc(tagLabel(t.id)), sub: plural(t.n, 'check-in'), value: t.a, text: f1(t.a), color: `var(--a${Math.round(t.a)})` })), 10)}<p class="hint">Average activation when you tagged each one.</p></section>` : ''}
    ${trig.length ? `<section class="card"><h2 class="h3">Your triggers</h2>${hbars(trig.map(t => ({ label: esc(t.name), sub: `average ${f1(t.a)}`, value: t.n, text: `${t.n}×`, color: `var(--a${Math.round(t.a)})` })), Math.max(...trig.map(t => t.n)))}<p class="hint">How often each came up, coloured by your average activation at the time.</p></section>` : ''}
    <section class="card"><h2 class="h3">Sleep and activation</h2>
      ${slp ? `<p class="muted tight">${plural(slp.n, 'day')} with sleep logged${slp.avgHrs !== null ? ` · ${f1(slp.avgHrs)} h on average` : ''}</p>
        ${slp.byHrs.length ? `<p class="label">By hours slept</p>` + hbars(slp.byHrs.map(r => ({ ...r, text: f1(r.value), sub: plural(r.n, 'day'), color: `var(--a${Math.round(r.value)})` })), 10) : ''}
        ${slp.byQ.length ? `<p class="label">By how well you slept</p>` + hbars(slp.byQ.map(r => ({ ...r, text: f1(r.value), sub: plural(r.n, 'day'), color: `var(--a${Math.round(r.value)})` })), 10) : ''}
        <p class="hint">Your average activation on the day after each kind of night.</p>`
        : '<p class="muted">Log your sleep in the morning for a few days to see how it affects your activation.</p>'}
      <div class="btn-row"><button type="button" class="btn small outline" data-act="sleep">${icon('moon')}Log last night’s sleep</button></div></section>
    ${gl.length ? `<section class="card"><h2 class="h3 with-vig">${ART.vig('glimmer')}Glimmers</h2>
      <p class="muted tight">${plural(gl.length, 'glimmer')} on ${plural(glDays.size, 'day')}${gKinds.length ? ` · mostly ${esc(gKinds.slice(0, 2).map(x => x[0].toLowerCase()).join(' and '))}` : ''}</p>
      ${withG.length >= 2 && withoutG.length >= 2 ? `<p>On days you noticed a glimmer your average activation was <b>${f1(avg(withG))}</b>, and <b>${f1(avg(withoutG))}</b> on days you didn’t.</p>` : ''}
      <ul class="plain glim-list">${gl.slice(-3).reverse().map(g => `<li class="glim">${icon('spark', 'sm')}<span>${esc(g.text)}<small>${relDay(dayOf(g.at))}</small></span></li>`).join('')}</ul></section>` : ''}
    <a class="card linkcard" href="#/body">${icon('body')}<span><b>Where you feel it in your body</b><small>See your body map</small></span>${icon('chev-r')}</a>
    <a class="card linkcard" href="#/report">${icon('list')}<span><b>Make a report</b><small>A summary to print or share with your GP or therapist</small></span>${icon('chev-r')}</a>`;
  },
  act: {
    period: a => { IN.p = a.dataset.id; render(); },
    zone: a => { IN.z = a.dataset.id; render(); },
    open: a => { if (a.dataset.id) openToolSheet(a.dataset.id, { fresh: true }); },
    mprev: () => { IN.m--; render(); },
    mnext: () => { IN.m = Math.min(0, IN.m + 1); render(); },
    sleep: () => openSleep(),
  },
};

/* ---------- Body ---------- */
const BD = { p: '30', q: 'all', mode: 'overall', sel: null };
// Sensations you've used at least once, for the filter chips.
const usedQuals = () => { const u = new Set(); for (const e of S.entries) for (const v of Object.values(e.body || {})) for (const q of v.q || []) u.add(q); return QUALS.filter(([id]) => u.has(id)); };
const MODES = [['overall', 'Overall'], ['strength', 'How strong'], ['often', 'How often']];
VIEWS.body = {
  title: 'Body',
  render() {
    const R = periodRange(BD.p);
    const list = S.entries.filter(e => inRange(e, R.from, R.to));
    const stats = bodyStats(list, BD.q);
    const rows = Object.values(stats);
    const head = `${pageHead('Body', 'Where you feel pain, tension and other sensations', { flip: true })}${periodChips(BD.p)}`;
    if (!rows.length) return `${head}${empty('body', S.entries.some(e => Object.keys(e.body).length) ? 'Nothing marked in this period' : 'Nothing marked on the body yet', 'When you check in, tap “Mark it on the body” to show where you feel it. This map then shows where it shows up most.', '<a class="btn primary" href="#/checkin">Check in</a>')}`;
    const val = r => (BD.mode === 'strength' ? r.avg : BD.mode === 'often' ? r.share : r.load);
    const max = Math.max(...rows.map(val));
    const colour = r => (BD.mode === 'strength' ? heatN(r.avg) : BD.mode === 'often' ? heat(clamp(r.share, 0.04, 1)) : heat(clamp(r.load / max, 0.06, 1)));
    const fill = id => (stats[id] ? colour(stats[id]) : null);
    const top = rows.slice().sort((a, b) => val(b) - val(a));
    const legend = BD.mode === 'strength' ? heatLegend('1 mild', '10 severe') : BD.mode === 'often' ? heatLegend('Rarely', 'Every check-in') : heatLegend('Less', 'Most');
    const s = BD.sel && stats[BD.sel];
    return `${head}
    ${qualChips()}
    <section class="card body-card">
      <div class="seg" role="radiogroup" aria-label="Colour by">${MODES.map(([id, name]) => `<button type="button" role="radio" aria-checked="${BD.mode === id}" class="${BD.mode === id ? 'on' : ''}" data-act="mode" data-id="${id}">${name}</button>`).join('')}</div>
      <p class="hint">${{ overall: 'How much it adds up: how often you marked each area and how strongly.', strength: 'The average strength when you marked each area, from 1 to 10.', often: 'The share of your check-ins where you marked each area.' }[BD.mode]}</p>
      <div class="figs heat" data-figs>${bodySvg('front', { fill, sel: BD.sel })}${bodySvg('back', { fill, sel: BD.sel })}</div>
      ${legend}
      ${s ? regionDetail(s, list) : '<p class="hint center">Tap an area for details.</p>'}
    </section>
    <section class="card"><h2 class="h3">Most affected areas</h2>
      ${hbars(top.slice(0, 10).map(r => ({ label: esc(regionShort(r.id)), sub: `${r.count} of ${plural(list.length, 'check-in')} · average ${f1(r.avg)}`, value: val(r), text: BD.mode === 'often' ? `${Math.round(r.share * 100)}%` : BD.mode === 'strength' ? f1(r.avg) : f1(r.load), color: colour(r), act: 'sel', id: r.id })), BD.mode === 'strength' ? 10 : BD.mode === 'often' ? 1 : max)}</section>`;
  },
  after(view) {
    const figs = $('[data-figs]', view);
    if (figs) figs.addEventListener('click', e => { const id = regionFromEvent(e, e.target.closest('svg')); if (id) { BD.sel = BD.sel === id ? null : id; render(); } });
  },
  act: {
    period: a => { BD.p = a.dataset.id; render(); },
    qual: a => { BD.q = a.dataset.id; render(); },
    mode: a => { BD.mode = a.dataset.id; render(); },
    sel: a => { BD.sel = a.dataset.id; render(); const c = $('.body-card'); if (c) c.scrollIntoView({ block: 'start', behavior: reduceMotion() ? 'auto' : 'smooth' }); },
    clearsel: () => { BD.sel = null; render(); },
    open: a => openToolSheet(a.dataset.id, { fresh: true }),
  },
};
function qualChips() {
  const used = usedQuals();
  if (used.length < 2 && BD.q === 'all') return '';
  if (BD.q !== 'all' && !used.some(([id]) => id === BD.q)) used.push([BD.q, QUAL_LABEL[BD.q] || BD.q]);
  return `<div class="chips scroll" role="radiogroup" aria-label="Show sensation">${[['all', 'Everything']].concat(used).map(([id, name]) => `<button type="button" role="radio" aria-checked="${BD.q === id}" class="chip${BD.q === id ? ' on' : ''}" data-act="qual" data-id="${id}">${esc(name)}</button>`).join('')}</div>`;
}
function regionDetail(s, list) {
  const withIt = list.filter(e => e.body[s.id] && (BD.q === 'all' || (e.body[s.id].q || []).includes(BD.q)));
  const quals = {};
  for (const e of withIt) for (const q of e.body[s.id].q || []) quals[q] = (quals[q] || 0) + 1;
  const st = toolStats(withIt);
  const best = st.ranked.filter(r => r.avgDrop > 0).slice(0, 3);
  // Relief: each tool is compared with the marking just before it (the check-in, or the previous tool's re-marking).
  const relief = dict();
  for (const e of withIt) {
    let base = e.body;
    for (const u of e.uses) {
      if (!u.body) continue;
      const b = base[s.id] ? base[s.id].n : 0, a = u.body[s.id] ? u.body[s.id].n : 0;
      if (b) (relief[u.tool] || (relief[u.tool] = [])).push(b - a);
      base = u.body;
    }
  }
  const rel = Object.entries(relief).map(([id, v]) => ({ id, d: avg(v), n: v.length })).filter(r => r.d > 0).sort((a, b) => b.d - a.d).slice(0, 3);
  return `<div class="region-detail"><div class="row-between"><h3>${esc(regionName(s.id))}</h3><button type="button" class="icon-btn small" data-act="clearsel" aria-label="Close details">${icon('close')}</button></div>
    <ul class="facts"><li><span>Marked</span><b>${s.count} of ${plural(list.length, 'check-in')} (${Math.round(s.share * 100)}%)</b></li>
      <li><span>Average strength</span><b>${f1(s.avg)} out of 10</b></li><li><span>Strongest</span><b>${s.max}</b></li>
      <li><span>Felt as</span><b>${Object.entries(quals).sort((a, b) => b[1] - a[1]).map(([q, n]) => `${esc(QUAL_LABEL[q] || q)} (${n})`).join(', ')}</b></li>
      <li><span>Last marked</span><b>${relDay(dayOf(s.last))}</b></li></ul>
    ${rel.length ? `<p class="label">Eased it most</p><ul class="plain">${rel.map(r => `<li><button type="button" class="linkish" data-act="open" data-id="${esc(r.id)}">${esc(toolName(r.id))}</button> <span class="good">${f1(r.d)} less on average</span></li>`).join('')}</ul>` : ''}
    ${best.length ? `<p class="label">Calmed you most when you felt it here</p><ul class="plain">${best.map(r => `<li><button type="button" class="linkish" data-act="open" data-id="${esc(r.id)}">${esc(toolName(r.id))}</button> <span class="good">${f1(r.avgDrop)} calmer</span> <span class="muted">(${plural(r.n, 'use')})</span></li>`).join('')}</ul>` : ''}</div>`;
}
