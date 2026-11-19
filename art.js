/* Settle — illustrations: hand-made SVG scenes and vignettes in an earthy, nature palette. All decorative. */
'use strict';

const ART = (() => {
  let n = 0;
  const id = p => `${p}${++n}`;
  const R = v => Math.round(v * 10) / 10;
  // A leaf shape pointing along +x, then placed and turned.
  const leaf = (x, y, deg, len, w, cls) => `<path class="${cls}" transform="translate(${R(x)} ${R(y)}) rotate(${R(deg)})" d="M0 0C${R(len * 0.3)} ${R(-w)} ${R(len * 0.75)} ${R(-w * 0.9)} ${R(len)} 0C${R(len * 0.75)} ${R(w * 0.9)} ${R(len * 0.3)} ${R(w)} 0 0Z"/>`;
  // Points and directions along a cubic Bézier, for placing leaves on a stem.
  const bez = (p, t) => {
    const u = 1 - t;
    const x = u * u * u * p[0] + 3 * u * u * t * p[2] + 3 * u * t * t * p[4] + t * t * t * p[6];
    const y = u * u * u * p[1] + 3 * u * u * t * p[3] + 3 * u * t * t * p[5] + t * t * t * p[7];
    const dx = 3 * u * u * (p[2] - p[0]) + 6 * u * t * (p[4] - p[2]) + 3 * t * t * (p[6] - p[4]);
    const dy = 3 * u * u * (p[3] - p[1]) + 6 * u * t * (p[5] - p[3]) + 3 * t * t * (p[7] - p[5]);
    return { x, y, a: Math.atan2(dy, dx) * 180 / Math.PI };
  };
  const stem = p => `M${p[0]} ${p[1]}C${p[2]} ${p[3]} ${p[4]} ${p[5]} ${p[6]} ${p[7]}`;

  /* ---------- the landscape: a place you choose, the season, and the time of day ---------- */
  const phase = (h = new Date().getHours()) => (h >= 5 && h < 9 ? 'dawn' : h >= 9 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'dusk' : 'night');
  // Southern hemisphere seasons (Sydney): spring Sep-Nov, summer Dec-Feb, autumn Mar-May, winter Jun-Aug.
  const seasonOf = (d = new Date()) => ['summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter', 'winter', 'winter', 'spring', 'spring', 'spring', 'summer'][d.getMonth()];
  const SUN = { dawn: [112, 86], day: [262, 42], dusk: [300, 84], night: [266, 38] };
  const STARS = [[24, 18], [52, 34], [88, 14], [118, 40], [150, 22], [186, 12], [214, 36], [318, 20], [340, 32], [246, 14], [290, 26], [70, 26]];
  const pine = (x, y, h, cls = 'pine') => { const w = h * 0.42; return `<path class="${cls}" d="M${R(x)} ${R(y - h)}L${R(x + w * 0.62)} ${R(y - h * 0.45)}H${R(x + w * 0.3)}L${R(x + w)} ${R(y)}H${R(x - w)}L${R(x - w * 0.3)} ${R(y - h * 0.45)}H${R(x - w * 0.62)}Z"/><rect class="trunk" x="${R(x - 1)}" y="${R(y)}" width="2" height="${R(h * 0.14)}" rx="1"/>`; };
  function roundTree(x, y, r, season, cls = 'tree') {
    const trunk = `<rect class="trunk" x="${R(x - r * 0.15)}" y="${R(y - r * 0.1)}" width="${R(r * 0.3)}" height="${R(r * 1.1)}" rx="1"/>`;
    if (season === 'winter') return `${trunk}<path class="branch" d="M${R(x)} ${R(y)}V${R(y - r * 1.5)}M${R(x)} ${R(y - r * 0.5)}L${R(x - r * 0.8)} ${R(y - r * 1.35)}M${R(x)} ${R(y - r * 0.8)}L${R(x + r * 0.85)} ${R(y - r * 1.5)}M${R(x - r * 0.4)} ${R(y - r * 0.9)}L${R(x - r * 0.55)} ${R(y - r * 1.6)}"/>`;
    let s = `${trunk}<circle class="${cls}" cx="${R(x)}" cy="${R(y - r * 0.9)}" r="${R(r)}"/>`;
    if (season === 'spring') s += [[-0.45, -1.25], [0.4, -1.05], [0.05, -1.6], [-0.2, -0.65], [0.55, -0.55], [-0.7, -0.8]].map(([dx, dy]) => `<circle class="blossom" cx="${R(x + dx * r)}" cy="${R(y + dy * r)}" r="${R(r * 0.17)}"/>`).join('');
    return s;
  }
  const falling = () => [[150, 60, 30], [176, 74, -20], [128, 82, 60], [236, 58, 10], [210, 90, -40]].map(([x, y, a]) => leaf(x, y, a, 6, 2.4, 'fall')).join('');
  const tufts = pts => `<path class="grass" d="${pts.map(([x, y]) => `M${x} ${y}l2-6M${x + 4} ${y}l-1-5M${x + 8} ${y}l2-4`).join('')}"/>`;
  const flowers = pts => `<g class="flowers">${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.7"/>`).join('')}</g>`;
  const gum = (x, y, h) => `<path class="gum-trunk" d="M${R(x)} ${R(y)}C${R(x - 2)} ${R(y - h * 0.4)} ${R(x + 3)} ${R(y - h * 0.6)} ${R(x - 1)} ${R(y - h * 0.82)}M${R(x + 1)} ${R(y - h * 0.5)}C${R(x + 6)} ${R(y - h * 0.65)} ${R(x + 9)} ${R(y - h * 0.75)} ${R(x + 11)} ${R(y - h * 0.82)}"/>
    <g class="gum"><ellipse cx="${R(x - 2)}" cy="${R(y - h * 0.9)}" rx="${R(h * 0.3)}" ry="${R(h * 0.17)}"/><ellipse cx="${R(x + 11)}" cy="${R(y - h * 0.85)}" rx="${R(h * 0.24)}" ry="${R(h * 0.14)}"/><ellipse cx="${R(x + 3)}" cy="${R(y - h * 1.02)}" rx="${R(h * 0.2)}" ry="${R(h * 0.12)}"/></g>`;
  const spinifex = (x, y, w) => `<path class="spinifex" d="M${R(x - w)} ${y}C${R(x - w)} ${R(y - w * 0.9)} ${R(x + w)} ${R(y - w * 0.9)} ${R(x + w)} ${y}Z"/>`;
  const norfolk = (x, y, h) => { let s = `<rect class="trunk" x="${R(x - 1.2)}" y="${R(y - h)}" width="2.4" height="${R(h)}" rx="1"/>`; for (let i = 0; i < 7; i++) { const ty = y - h + 6 + i * (h - 12) / 7, w = 4 + i * 2.6; s += `<path class="pine" d="M${R(x - w)} ${R(ty + 3)}Q${R(x)} ${R(ty - 3)} ${R(x + w)} ${R(ty + 3)}Q${R(x)} ${R(ty + 0.6)} ${R(x - w)} ${R(ty + 3)}Z"/>`; } return s; };
  const MIST = '<path class="mist" d="M0 112C70 106 140 112 210 108C270 105 320 110 360 107V124C300 127 230 122 160 126C100 129 50 124 0 126Z"/>';
  const PLACE = {
    meadow: s => `<path class="m1" d="M0 96C20 86 30 72 46 72C60 72 66 86 80 84C96 82 104 58 122 58C140 58 148 80 166 82C186 84 196 64 214 64C232 64 240 84 258 86C276 88 288 72 304 72C322 72 336 88 360 90L360 150L0 150Z"/>
      ${s === 'winter' ? '<path class="snow" d="M112 64C118 59 126 59 132 64L128 66L122 63L116 66ZM206 69C211 65 218 65 222 69L218 70L214 68L210 70Z"/>' : ''}
      <path class="h1" d="M0 112C40 96 80 94 120 102C160 110 196 98 236 92C280 86 320 96 360 104L360 150L0 150Z"/>
      ${roundTree(52.3, 106, 8.5, s)}${roundTree(68.7, 106, 6, s, 'tree-2')}${pine(300, 104, 24)}${pine(319, 106, 18, 'pine-2')}
      ${s === 'winter' ? MIST : ''}<path class="lake" d="M196 125C220 116 292 115 330 123C312 133 228 135 196 125Z"/><path class="lake-l" d="M222 122h26M262 126h34M240 129.5h18"/>
      <path class="h2" d="M0 122C26 113 62 111 96 117C126 122 150 135 186 139C230 144 300 142 360 139L360 150L0 150Z"/>
      ${tufts([[22, 126], [118, 124], [250, 144], [340, 142]])}${s === 'winter' ? '' : flowers(s === 'spring' ? [[40, 125], [104, 122], [160, 135], [270, 143], [60, 130], [140, 128], [300, 141]] : [[40, 125], [104, 122], [160, 135], [270, 143]])}
      ${s === 'autumn' ? falling() : ''}`,
    forest: s => `<path class="m1" d="M0 92C40 78 80 76 120 84C160 92 200 74 240 72C280 70 320 82 360 86L360 150L0 150Z"/>
      ${Array.from({ length: 27 }, (_, i) => pine(4 + i * 13.6, 104 + (i % 3) * 2, 15 + ((i * 7) % 9), 'pine-far')).join('')}
      <path class="h1" d="M0 110C60 102 120 104 180 108C240 112 300 104 360 106L360 150L0 150Z"/>
      ${roundTree(96, 118, 9, s)}${roundTree(250, 116, 8, s, 'tree-2')}${s === 'winter' ? MIST.replace('class="mist"', 'class="mist" transform="translate(0 2)"') : ''}
      <path class="h2" d="M0 128C60 120 120 122 180 128C240 134 300 126 360 124L360 150L0 150Z"/>
      <path class="path" d="M168 150C172 140 188 134 196 126C202 120 196 116 190 113L195 113C206 117 212 122 206 129C198 138 186 143 184 150Z"/>
      ${pine(26, 146, 70, 'pine-near')}${pine(54, 148, 52, 'pine-near')}${pine(322, 146, 66, 'pine-near')}${pine(344, 148, 46, 'pine-near')}
      ${tufts([[110, 140], [236, 140], [146, 146]])}${s === 'autumn' ? falling() : ''}${s === 'spring' ? flowers([[120, 136], [230, 137], [150, 143], [214, 145]]) : ''}`,
    beach: s => `<path class="m1" d="M0 96C14 88 30 84 46 88C58 91 66 96 72 98L0 98ZM300 98C312 90 330 86 346 88C352 89 357 91 360 92V98Z"/>
      <rect class="sea" x="0" y="97" width="360" height="30"/><path class="sea-l" d="M20 104h40M96 108h56M190 103h44M262 110h52M44 115h36M150 118h48M280 121h40"/>
      <path class="sand-wet" d="M0 124C60 120 120 123 180 121C240 119 300 123 360 120V130H0Z"/>
      <path class="sand" d="M0 128C70 124 130 127 190 125C250 123 310 127 360 124V150H0Z"/>
      ${norfolk(306, 128, 74)}${norfolk(330, 126, 46)}
      <path class="dune" d="M0 136C30 128 60 128 90 134C110 138 124 146 130 150H0Z"/>${tufts([[16, 134], [40, 131], [70, 133], [96, 138]])}
      <ellipse class="rock" cx="214" cy="139" rx="6" ry="2.5"/><ellipse class="rock" cx="232" cy="143" rx="3.5" ry="1.6"/>${s === 'spring' ? flowers([[30, 140], [58, 138], [84, 142]]) : ''}`,
    mountains: s => `<path class="peak" d="M0 104L40 66L64 84L102 36L136 74L160 58L200 92L236 44L270 76L298 52L330 82L360 70V150H0Z"/>
      ${s === 'winter' || s === 'spring' ? '<path class="snow" d="M94 45L102 36L110 46L106 44L102 48L98 44ZM228 53L236 44L244 54L240 52L236 56L232 52ZM291 60L298 52L305 61L301 59L298 62L294 59Z"/>' : ''}
      <path class="m1" d="M0 104C40 96 80 98 120 102C160 106 200 96 240 98C280 100 320 96 360 100V150H0Z"/>
      ${Array.from({ length: 24 }, (_, i) => pine(8 + i * 15.2, 112 + (i % 2) * 2, 14 + ((i * 5) % 8), 'pine-far')).join('')}
      ${s === 'winter' ? MIST : ''}<path class="lake" d="M60 124C100 116 220 116 300 122C280 132 120 134 60 124Z"/><path class="lake-l" d="M100 121h30M180 125h44M140 129h22"/>
      <path class="h2" d="M0 130C40 124 80 126 120 132C160 138 240 140 360 132V150H0Z"/>${roundTree(330, 140, 7, s)}${tufts([[30, 134], [210, 142], [300, 140]])}${s === 'autumn' ? falling() : ''}`,
    outback: s => `<path class="earth-far" d="M0 100C80 96 160 99 240 97C300 96 340 98 360 99V150H0Z"/>
      <path class="rock-big" d="M214 100C216 88 226 80 250 79C276 78 300 82 310 90C316 95 318 99 318 100Z"/><path class="rock-line" d="M238 82C240 90 238 96 236 100M268 80C270 88 272 94 272 100M292 84C294 90 296 95 296 100"/>
      <path class="earth" d="M0 112C60 106 140 110 200 108C260 106 320 110 360 108V150H0Z"/>
      ${gum(62, 118, 44)}${gum(100, 116, 30)}${gum(330, 122, 38)}
      <path class="earth-near" d="M0 130C70 124 150 128 220 132C280 135 330 130 360 128V150H0Z"/>
      ${spinifex(30, 134, 7)}${spinifex(150, 134, 6)}${spinifex(190, 138, 8)}${spinifex(276, 136, 6)}${spinifex(310, 142, 9)}
      ${s === 'spring' ? flowers([[40, 128], [120, 124], [170, 130], [240, 134], [300, 131], [88, 136]]) : ''}`,
  };
  function scape(when, opts = {}) {
    const ph = when || phase();
    const pr = typeof S !== 'undefined' && S.prefs ? S.prefs : {};
    const place = PLACE[opts.place] ? opts.place : PLACE[pr.place] ? pr.place : 'meadow';
    const season = opts.season && opts.season !== 'auto' ? opts.season : pr.season && pr.season !== 'auto' ? pr.season : seasonOf();
    const [sx, sy] = (ph === 'dawn' || ph === 'dusk') && place === 'mountains' ? (ph === 'dawn' ? [200, 80] : [64, 76]) : SUN[ph];
    const night = ph === 'night';
    const mid = id('moon');
    const sun = night
      ? `<mask id="${mid}"><rect width="360" height="150" fill="#fff"/><circle cx="${sx + 7}" cy="${sy - 4}" r="14" fill="#000"/></mask>
         <circle class="halo" cx="${sx}" cy="${sy}" r="30"/><circle class="sun" cx="${sx}" cy="${sy}" r="15" mask="url(#${mid})"/>`
      : `<circle class="halo" cx="${sx}" cy="${sy}" r="32"/><circle class="sun" cx="${sx}" cy="${sy}" r="17"/>`;
    const top = night
      ? `<rect class="veil" width="360" height="150"/>${STARS.map(([x, y], i) => `<circle class="star" cx="${x}" cy="${y}" r="${i % 3 ? 0.9 : 1.4}"/>`).join('')}${sun}`
      : '<path class="bird" d="M92 40q4-4 8 0q4-4 8 0M116 30q3-3 6 0q3-3 6 0"/>';
    return `<div class="scape ${ph} ${season} at-${place}${opts.cls ? ' ' + opts.cls : ''}" aria-hidden="true"><svg viewBox="0 0 360 150" preserveAspectRatio="xMidYMax slice" focusable="false">
      ${night ? '' : sun}${PLACE[place](season)}${top}</svg></div>`;
  }

  /* ---------- a small round vignette for each group of tools ---------- */
  const VIG = {
    breath: `<circle cx="24" cy="24" r="24" fill="#E2E9D8"/><g fill="none" stroke="#5F7F5A" stroke-width="2.6" stroke-linecap="round"><path d="M10 20h16.5a4.5 4.5 0 1 0-4.5-4.5"/><path d="M10 27h21.5a4.5 4.5 0 1 1-4.5 4.5"/><path d="M10 33.5h8"/></g>${leaf(32.5, 13.5, -24, 11, 4.2, '')}`.replace('class=""', 'fill="#93B27F"'),
    ground: '<circle cx="24" cy="24" r="24" fill="#EFE5D1"/><ellipse cx="24" cy="35.5" rx="12.5" ry="5" fill="#8E7D66"/><ellipse cx="23" cy="27.6" rx="9.2" ry="4.4" fill="#A8977C"/><ellipse cx="24.6" cy="20.8" rx="6.6" ry="3.6" fill="#C2B293"/><ellipse cx="23.8" cy="15.4" rx="4" ry="2.5" fill="#D9CCAE"/><path d="M8.5 39.5q1.5-5 3.2-.2M37 39.5q1.4-4.4 3-.2" fill="none" stroke="#7E9A6C" stroke-width="1.7" stroke-linecap="round"/>',
    touch: `<circle cx="24" cy="24" r="24" fill="#F2E0D4"/><path d="M24 37s-10.5-6.4-10.5-13.6a5.7 5.7 0 0 1 10.5-3.2 5.7 5.7 0 0 1 10.5 3.2C34.5 30.6 24 37 24 37z" fill="#C98068"/><path d="M24 20.2c-.2-3.6 1.2-6.4 3.8-8" fill="none" stroke="#5F7F5A" stroke-width="1.7" stroke-linecap="round"/>${leaf(27.4, 12.4, -30, 10, 3.8, '')}`.replace('class=""', 'fill="#93B27F"'),
    move: '<circle cx="24" cy="24" r="24" fill="#E3EADC"/><g fill="none" stroke-linecap="round"><path d="M15 41C15 31 18 22 27 14" stroke="#5F7F5A" stroke-width="2.3"/><path d="M22.5 41C23.5 33 27.5 26 36 21" stroke="#7E9A6C" stroke-width="2.1"/><path d="M30 41C31 36 34 32 40.5 29" stroke="#93B27F" stroke-width="2"/><path d="M7 21.5h7M9 26h5" stroke="#A9BC96" stroke-width="1.8"/></g><ellipse cx="28" cy="12.6" rx="2.3" ry="4.4" transform="rotate(40 28 12.6)" fill="#B49B6B"/>',
    vagus: '<circle cx="24" cy="24" r="24" fill="#DCE7EA"/><path d="M24 8.5c5.2 7.3 9.3 11.8 9.3 16.6a9.3 9.3 0 0 1-18.6 0c0-4.8 4.1-9.3 9.3-16.6z" fill="#7FA3B1"/><path d="M20.4 25.4a4.2 4.2 0 0 0 3.2 4.3" fill="none" stroke="#D4E4E9" stroke-width="1.9" stroke-linecap="round"/><g fill="none" stroke="#8FB0BC" stroke-width="1.6"><ellipse cx="24" cy="40.2" rx="12" ry="2.4"/><ellipse cx="24" cy="40.2" rx="5.5" ry="1.1"/></g>',
    rest: '<circle cx="24" cy="24" r="24" fill="#DCD9E8"/><path d="M27.6 9.6a10.4 10.4 0 1 0 9.6 14.2 8.2 8.2 0 1 1-9.6-14.2z" fill="#EAD7A0"/><g fill="#F4ECCB"><circle cx="13" cy="14" r="1.2"/><circle cx="17.5" cy="22" r=".9"/><circle cx="38" cy="13" r=".9"/><circle cx="10" cy="26" r=".8"/></g><path d="M3.2 36C12 31 20 31 27 34C34 37 39 35 44.8 36A24 24 0 0 1 3.2 36Z" fill="#A9A0C0"/>',
    routine: '<circle cx="24" cy="24" r="24" fill="#E9E3D2"/><path d="M14 42C20 34 30 34 30 27C30 20 18 21 18 14C18 10 21 7 25 6" fill="none" stroke="#D5C7A6" stroke-width="7" stroke-linecap="round"/><ellipse cx="16" cy="38.5" rx="3.6" ry="2.2" fill="#9C8C73"/><ellipse cx="27" cy="29" rx="3.4" ry="2.1" fill="#9C8C73"/><ellipse cx="19.5" cy="17" rx="3.2" ry="2" fill="#9C8C73"/><ellipse cx="25" cy="8.5" rx="2.6" ry="1.7" fill="#9C8C73"/><path d="M36 30q1.4-5 3-.2M8 24q1.4-4.6 3-.2" fill="none" stroke="#7E9A6C" stroke-width="1.6" stroke-linecap="round"/>',
    glimmer: '<circle cx="24" cy="24" r="24" fill="#F4E9CF"/><path d="M24 9c1.2 7 3.8 9.6 10.8 10.8C27.8 21 25.2 23.6 24 30.6 22.8 23.6 20.2 21 13.2 19.8 20.2 18.6 22.8 16 24 9z" fill="#E2B35E"/><circle cx="35" cy="33" r="2.2" fill="#E9C98A"/><circle cx="14" cy="34" r="1.5" fill="#E9C98A"/><path d="M18 40q6-4 12 0" fill="none" stroke="#93B27F" stroke-width="2" stroke-linecap="round"/>',
  };
  const vig = cat => `<svg class="vig" viewBox="0 0 48 48" aria-hidden="true" focusable="false">${VIG[cat] || VIG.breath}</svg>`;

  /* ---------- empty-state scenes ---------- */
  function fern() {
    const p = [34, 84, 46, 58, 62, 34, 92, 12];
    let s = `<path class="e-stem" d="${stem(p)}"/>`;
    for (let i = 1; i <= 9; i++) {
      const t = i / 10.5, b = bez(p, t), len = 15 * (1 - t) + 5;
      s += leaf(b.x, b.y, b.a - 62, len, len * 0.28, 'e-leaf') + leaf(b.x, b.y, b.a + 62, len, len * 0.28, 'e-leaf2');
    }
    return s;
  }
  const EMPTY = {
    sprout: '<ellipse class="e-shadow" cx="60" cy="78" rx="42" ry="7"/><path class="e-soil" d="M30 78C38 66 82 66 90 78Z"/><path class="e-stem" d="M60 72C60 60 60 52 61.5 43"/><path class="e-leaf" d="M61 52C52 54 43.5 49 41.5 39.5C51 37.5 59.5 42 61 52Z"/><path class="e-leaf2" d="M61.5 45.5C66 37 76.5 33.5 85 36.5C81 46 70 49.5 61.5 45.5Z"/><circle class="e-sun" cx="94" cy="20" r="9"/><ellipse class="e-pebble" cx="28" cy="80" rx="4.5" ry="2.6"/><ellipse class="e-pebble" cx="93" cy="81" rx="3.2" ry="2"/>',
    cairn: '<ellipse class="e-shadow" cx="60" cy="81" rx="40" ry="6"/><ellipse cx="60" cy="72" rx="23" ry="8.5" fill="#8E7D66"/><ellipse cx="58" cy="58.5" rx="17" ry="7.2" fill="#A8977C"/><ellipse cx="61" cy="46.5" rx="12.5" ry="5.8" fill="#C2B293"/><ellipse cx="59.5" cy="37" rx="8.2" ry="4.4" fill="#D9CCAE"/><path class="e-grass" d="M30 80q2-8 4-1M34 80q0-6 2-1M86 80q2-7 4-1M90 80q0-5 2 0"/><circle class="e-sun" cx="96" cy="18" r="8"/>',
    fern: () => `<ellipse class="e-shadow" cx="58" cy="84" rx="34" ry="5"/>${fern()}<ellipse class="e-pebble" cx="80" cy="84" rx="5" ry="2.8"/>`,
    moon: '<ellipse class="e-shadow" cx="60" cy="86" rx="48" ry="3.5"/><path class="e-hill1" d="M8 77C24 65 44 64 60 70C76 76 94 72 112 65C116 73 108 85 60 86C18 86 4 83 8 77Z"/><path class="e-hill2" d="M16 81C34 75 52 76 70 81C86 85 100 82 108 79C104 86 86 88 60 88C34 88 20 87 16 81Z"/><path class="e-moon" d="M76 12a15 15 0 1 0 13 21.5 12 12 0 1 1-13-21.5z"/><g class="e-stars"><circle cx="30" cy="20" r="1.4"/><circle cx="46" cy="34" r="1"/><circle cx="104" cy="16" r="1.2"/><circle cx="20" cy="44" r="1"/><circle cx="58" cy="14" r="1"/></g>',
  };
  const empty = kind => { const e = EMPTY[kind] || EMPTY.sprout; return `<svg class="empty-art" viewBox="0 0 120 90" aria-hidden="true" focusable="false">${typeof e === 'function' ? e() : e}</svg>`; };

  /* ---------- a leafy sprig for page headings ---------- */
  function sprig(flip) {
    const p = [78, 6, 62, 14, 40, 30, 12, 54];
    let s = `<path class="sp-stem" d="${stem(p)}"/>`;
    [0.14, 0.3, 0.46, 0.62, 0.78].forEach((t, i) => {
      const b = bez(p, t), side = i % 2 ? 1 : -1, len = 17 - i * 1.6;
      s += leaf(b.x, b.y, b.a + side * 58, len, len * 0.36, i % 2 ? 'sp-leaf2' : 'sp-leaf');
    });
    s += leaf(12, 54, 150, 12, 4.2, 'sp-leaf');
    return `<svg class="sprig${flip ? ' flip' : ''}" viewBox="0 0 84 62" aria-hidden="true" focusable="false">${s}</svg>`;
  }

  /* ---------- rolling hills behind the session guide ---------- */
  const hills = () => `<svg class="hills" viewBox="0 0 360 90" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path class="hl1" d="M0 46C50 30 100 30 150 40C200 50 250 34 300 30C330 28 350 34 360 38L360 90L0 90Z"/>
    <path class="hl2" d="M0 66C40 56 90 56 130 62C180 70 230 74 280 66C320 60 345 62 360 64L360 90L0 90Z"/>
    <path class="hl-grass" d="M40 62l2-7M44 62l-1-6M48 62l2-5M300 66l2-7M304 66l-1-6M190 72l2-6M194 72l-1-5"/></svg>`;

  // A leaf for the rocking pace marker.
  const leafDot = () => `<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M20 4C30 10 34 22 20 36C6 22 10 10 20 4Z" fill="#93B27F"/><path d="M20 8V33" stroke="#5F7F5A" stroke-width="1.6" stroke-linecap="round"/></svg>`;

  return { scape, phase, seasonOf, vig, empty, sprig, hills, leafDot, PLACES: Object.keys(PLACE) };
})();
