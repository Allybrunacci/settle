/* Settle — body map: front and back outlines made of tappable areas, the pain/tension editor, and heat colours */
'use strict';

const BODY = (() => {
  const P = n => Math.round(n * 10) / 10;
  // A tapered capsule from (x1,y1) to (x2,y2), widths w1 and w2.
  function cap(x1, y1, w1, x2, y2, w2) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux, r1 = w1 / 2, r2 = w2 / 2;
    const p = (x, y) => `${P(x)},${P(y)}`;
    return `M${p(x1 + nx * r1, y1 + ny * r1)} L${p(x2 + nx * r2, y2 + ny * r2)} A${r2},${r2} 0 0 0 ${p(x2 - nx * r2, y2 - ny * r2)} L${p(x1 - nx * r1, y1 - ny * r1)} A${r1},${r1} 0 0 0 ${p(x1 + nx * r1, y1 + ny * r1)} Z`;
  }
  // Mirror a path drawn on the viewer's left (only M/L/C/Z with "x,y" pairs) to the viewer's right.
  const mirror = d => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (m, x, y) => `${P(200 - +x)},${y}`);
  const limb = (x1, y1, w1, x2, y2, w2) => [cap(x1, y1, w1, x2, y2, w2), cap(200 - x1, y1, w1, 200 - x2, y2, w2)];

  const NECK = 'M89,52 L111,52 L111,86 C107,88.5 103,89.5 100,89.5 C97,89.5 93,88.5 89,86 Z';
  const SHOULDER = 'M89,75 C79,75 66,78 58,85 C51,91 48,100 50,108 C57,107 66,108 73,110 C74,100 80,91 89,86 Z';
  const CHEST = 'M89,86 C80,91 74,100 73,110 L74,143 C87,149 113,149 126,143 L127,110 C126,100 120,91 111,86 C107,88.5 103,89.5 100,89.5 C97,89.5 93,88.5 89,86 Z';
  const STOMACH = 'M74,146 C87,152 113,152 126,146 L127,170 C127,180 128,188 128,196 C115,201 85,201 72,196 C72,188 73,180 73,170 Z';
  const UPPER_BACK = 'M89,86 C80,91 74,100 73,110 L74,160 C87,166 113,166 126,160 L127,110 C126,100 120,91 111,86 C107,88.5 103,89.5 100,89.5 C97,89.5 93,88.5 89,86 Z';
  const LOWER_BACK = 'M74,163 C87,169 113,169 126,163 L127,176 C127,183 128,189 128,196 C115,201 85,201 72,196 C72,189 73,183 73,176 Z';
  const HIP_FRONT = 'M72,199 C80,202.5 90,204 99,204 L99,250 C90,249 80,245 74,239 C69.5,234 67.5,229 67.5,222 C67.5,213 69.5,205 72,199 Z';
  const HIP_BACK = 'M72,199 C80,202.5 90,204 99,204 L99,252 C92,258 80,257 74,250 C69,244 67.5,236 67.5,226 C67.5,214 69.5,206 72,199 Z';
  const HEAD = 'M79.6,40 A21,26 0 1 1 120.4,40 Z';
  const JAW = 'M79.6,40 A21,26 0 0 0 120.4,40 Z';
  const HEAD_BACK = 'M79,34 A21,26 0 1 1 121,34 A21,26 0 1 1 79,34 Z';

  const arm = limb(62, 104, 22, 51, 164, 17), fore = limb(48.5, 179, 16, 41, 228, 13), hand = limb(40.5, 235, 15, 37, 258, 12.5);
  const thigh = limb(85, 250, 28, 84, 322, 21), knee = limb(84, 334, 20, 83.5, 348, 19.5), calf = limb(83.5, 360, 19, 82, 424, 13);
  const footF = limb(82, 432, 14, 79, 449, 18), footB = limb(82, 432, 14, 82.5, 447, 15);
  const hips = (d, l, r) => [[l, d], [r, mirror(d)]];
  // Viewer-left is the person's right on the front view, and the person's left on the back view.
  const side = (pair, idL, idR, front) => (front ? [[idR, pair[0]], [idL, pair[1]]] : [[idL, pair[0]], [idR, pair[1]]]);
  function regions(front) {
    const s = (pair, base) => side(pair, base + 'L', base + 'R', front);
    return [
      ...s(thigh, 'thigh'), ...s(knee, 'knee'), ...s(calf, 'calf'), ...s(front ? footF : footB, 'foot'),
      ...s(arm, 'arm'), ...s(fore, 'forearm'), ...s(hand, 'hand'),
      ...(front ? hips(HIP_FRONT, 'hipR', 'hipL') : hips(HIP_BACK, 'hipL', 'hipR')),
      front ? ['stomach', STOMACH] : ['lowerBack', LOWER_BACK],
      front ? ['chest', CHEST] : ['upperBack', UPPER_BACK],
      front ? ['throat', NECK] : ['neck', NECK],
      ...side([SHOULDER, mirror(SHOULDER)], 'shoulderL', 'shoulderR', front),
      ...(front ? [['head', HEAD], ['jaw', JAW]] : [['headBack', HEAD_BACK]]),
    ];
  }
  return { front: regions(true), back: regions(false) };
})();

// One outline. fill(id) returns a colour or null; sel is the selected area.
function bodySvg(view, { fill = () => null, sel = null, cls = '', title } = {}) {
  const front = view === 'front';
  const regs = BODY[view];
  const paths = regs.map(([id, d]) => {
    const f = fill(id);
    return `<path d="${d}" data-r="${id}" class="rg${f ? ' on' : ''}${sel === id ? ' sel' : ''}"${f ? ` style="fill:${f}"` : ''}><title>${esc(regionName(id))}</title></path>`;
  }).join('');
  const ring = sel && regs.find(r => r[0] === sel) ? `<path class="ring" d="${regs.find(r => r[0] === sel)[1]}"/>` : '';
  return `<figure class="fig ${cls}"><svg viewBox="22 4 156 452" aria-hidden="true" focusable="false">${paths}${ring}
    <text x="27" y="122" class="side">${front ? 'R' : 'L'}</text><text x="173" y="122" class="side" text-anchor="end">${front ? 'L' : 'R'}</text></svg>
    <figcaption>${title || (front ? 'Front' : 'Back')}</figcaption></figure>`;
}
const bodyPair = (opts = {}) => `<div class="figs${opts.cls ? ' ' + opts.cls : ''}">${bodySvg('front', opts)}${bodySvg('back', opts)}</div>`;
const heatLegend = (lo = '1 mild', hi = '10 severe', mid = '') => `<div class="legend"><span>${lo}</span><span class="ramp" aria-hidden="true"></span>${mid ? `<span>${mid}</span>` : ''}<span>${hi}</span></div>`;

// Which area did a tap mean? The one under the finger, or else the nearest one within reach (small areas like hands).
function regionFromEvent(e, svg) {
  const hit = e.target.closest && e.target.closest('[data-r]');
  if (hit) return hit.dataset.r;
  if (!svg || !svg.createSVGPoint) return null;
  const pt = svg.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  const m = svg.getScreenCTM();
  if (!m) return null;
  const p = pt.matrixTransform(m.inverse());
  let best = null, bd = 16;
  for (const el of svg.querySelectorAll('[data-r]')) {
    const b = el.getBBox();
    const dx = Math.max(b.x - p.x, 0, p.x - (b.x + b.width)), dy = Math.max(b.y - p.y, 0, p.y - (b.y + b.height));
    const d = Math.hypot(dx, dy);
    if (d < bd) { bd = d; best = el.dataset.r; }
  }
  return best;
}

let LAST_KIND = 't';
// The editor: tap areas on the outlines (or pick from a list), choose tension/pain/both and how strong (1–10).
function openBodyEditor(start, onDone, opts = {}) {
  const b = JSON.parse(JSON.stringify(start || {}));
  let sel = null, list = false;
  const fill = id => (b[id] ? heatN(b[id].n) : null);
  const panel = () => {
    if (list) {
      return `<div class="bpanel"><div class="row-between"><h3>Choose areas</h3><button type="button" class="btn small ghost" data-act="figure">${icon('body')}Show the body</button></div>
        ${REGION_GROUPS.map(([g, ids]) => `<p class="label">${g}</p><div class="chips">${ids.map(id => `<button type="button" class="chip${b[id] ? ' on' : ''}${sel === id ? ' focus' : ''}" data-act="pick" data-r="${id}" aria-pressed="${!!b[id]}">${esc(regionShort(id))}${b[id] ? ` <b>${b[id].n}</b>` : ''}</button>`).join('')}</div>`).join('')}
        ${sel ? strength() : ''}</div>`;
    }
    if (!sel) {
      const l = bodyList(b);
      return `<div class="bpanel">${l.length
        ? `<p class="label">Marked</p><div class="chips">${l.map(([id, v]) => `<button type="button" class="chip on" data-act="pick" data-r="${id}">${esc(regionShort(id))} <b>${v.n}</b> <small>${KINDS[v.k]}</small></button>`).join('')}</div>`
        : '<p class="hint">Tap the body where you feel pain or tension. You can mark as many areas as you like.</p>'}
        <button type="button" class="btn small ghost" data-act="list">${icon('list')}Choose from a list instead</button></div>`;
    }
    return `<div class="bpanel">${strength()}</div>`;
  };
  const strength = () => {
    const cur = b[sel];
    const k = cur ? cur.k : LAST_KIND;
    return `<div class="strength" aria-label="${esc(regionName(sel))}">
      <div class="row-between"><h3>${esc(regionName(sel))}</h3>${cur ? `<button type="button" class="btn small ghost" data-act="clear">${icon('trash')}Remove</button>` : ''}</div>
      <div class="seg" role="radiogroup" aria-label="What is it?">${Object.entries(KINDS).map(([id, name]) => `<button type="button" role="radio" aria-checked="${k === id}" class="${k === id ? 'on' : ''}" data-act="kind" data-k="${id}">${name}</button>`).join('')}</div>
      <p class="label">How strong? <span class="muted">1 is barely there, 10 is the worst imaginable</span></p>
      <div class="nums" role="radiogroup" aria-label="How strong">${Array.from({ length: 10 }, (_, i) => i + 1).map(n => `<button type="button" role="radio" aria-checked="${cur && cur.n === n}" class="nb${cur && cur.n === n ? ' on' : ''}" style="--h:${heatN(n)}" data-act="n" data-n="${n}">${n}</button>`).join('')}</div>
    </div>`;
  };
  const html = () => `${sheetHead('Pain and tension', 'Where do you feel it right now?')}
    ${list ? '' : `<div class="figs edit" data-figs>${bodySvg('front', { fill, sel })}${bodySvg('back', { fill, sel })}</div>${heatLegend()}`}
    ${panel()}
    <div class="sheet-foot"><button type="button" class="btn primary wide" data-act="done">${icon('check')}Done</button></div>`;
  // However the editor is closed (Done, the close button, Escape or tapping outside), the marks are kept.
  const sh = openSheet(html(), {
    cls: 'tall body-sheet', label: 'Pain and tension',
    onClose: () => onDone(b),
    act: {
      pick: a => { sel = a.dataset.r; sh.set(html()); focusPanel(); },
      list: () => { list = true; sh.set(html()); },
      figure: () => { list = false; sh.set(html()); },
      kind: a => { LAST_KIND = a.dataset.k; if (b[sel]) b[sel].k = a.dataset.k; sh.set(html()); },
      n: a => { b[sel] = { n: +a.dataset.n, k: b[sel] ? b[sel].k : LAST_KIND }; buzz(8); sh.set(html()); },
      clear: () => { delete b[sel]; sel = null; sh.set(html()); },
      done: () => sh.close(),
    },
    onSet: s => {
      const figs = $('[data-figs]', s.el);
      if (!figs) return;
      figs.addEventListener('click', e => {
        const svg = e.target.closest('svg');
        const id = regionFromEvent(e, svg);
        if (!id) return;
        sel = id;
        buzz(6);
        sh.set(html());
        focusPanel();
      });
    },
  });
  const focusPanel = () => { const p = $('.bpanel', sh.el); if (p && p.scrollIntoView) p.scrollIntoView({ block: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' }); };
  sh.set(html());
  return sh;
}

/* ---------- body statistics for the Body section ---------- */
// For check-ins in a period: how often each area was marked, how strongly, and a combined "load".
function bodyStats(entries, kind = 'all') {
  const out = {};
  for (const e of entries) {
    for (const [id, v] of Object.entries(e.body || {})) {
      if (kind !== 'all' && v.k !== kind && v.k !== 'b') continue;
      const r = out[id] || (out[id] = { id, count: 0, total: 0, max: 0, last: 0 });
      r.count++;
      r.total += v.n;
      r.max = Math.max(r.max, v.n);
      r.last = Math.max(r.last, e.at);
    }
  }
  const n = entries.length || 1;
  for (const r of Object.values(out)) { r.avg = r.total / r.count; r.share = r.count / n; r.load = r.total / n; }
  return out;
}
