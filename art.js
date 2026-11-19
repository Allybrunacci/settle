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

  /* ---------- the landscape: changes with the time of day ---------- */
  const phase = (h = new Date().getHours()) => (h >= 5 && h < 9 ? 'dawn' : h >= 9 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'dusk' : 'night');
  const SUN = { dawn: [112, 86], day: [262, 42], dusk: [300, 84], night: [266, 38] };
  const STARS = [[24, 18], [52, 34], [88, 14], [118, 40], [150, 22], [186, 12], [214, 36], [318, 20], [340, 46], [300, 58], [132, 58], [70, 52]];
  function scape(when, opts = {}) {
    const ph = when || phase();
    const [sx, sy] = SUN[ph];
    const night = ph === 'night';
    const mid = id('moon');
    const sky = night
      ? `${STARS.map(([x, y], i) => `<circle class="star" cx="${x}" cy="${y}" r="${i % 3 ? 0.9 : 1.4}"/>`).join('')}
         <mask id="${mid}"><rect width="360" height="150" fill="#fff"/><circle cx="${sx + 7}" cy="${sy - 4}" r="14" fill="#000"/></mask>
         <circle class="halo" cx="${sx}" cy="${sy}" r="30"/><circle class="sun" cx="${sx}" cy="${sy}" r="15" mask="url(#${mid})"/>`
      : `<circle class="halo" cx="${sx}" cy="${sy}" r="32"/><circle class="sun" cx="${sx}" cy="${sy}" r="17"/>
         <path class="bird" d="M92 40q4-4 8 0q4-4 8 0M116 30q3-3 6 0q3-3 6 0"/>`;
    return `<div class="scape ${ph}${opts.cls ? ' ' + opts.cls : ''}" aria-hidden="true"><svg viewBox="0 0 360 150" preserveAspectRatio="xMidYMax slice" focusable="false">
      ${sky}
      <path class="m1" d="M0 96C20 86 30 72 46 72C60 72 66 86 80 84C96 82 104 58 122 58C140 58 148 80 166 82C186 84 196 64 214 64C232 64 240 84 258 86C276 88 288 72 304 72C322 72 336 88 360 90L360 150L0 150Z"/>
      <path class="h1" d="M0 112C40 96 80 94 120 102C160 110 196 98 236 92C280 86 320 96 360 104L360 150L0 150Z"/>
      <g class="trees"><rect class="trunk" x="51" y="98" width="2.6" height="9" rx="1"/><circle class="tree" cx="52.3" cy="92" r="8.5"/>
        <rect class="trunk" x="67.6" y="99" width="2.2" height="7" rx="1"/><circle class="tree-2" cx="68.7" cy="94.5" r="6"/>
        <rect class="trunk" x="299" y="98" width="2.2" height="7" rx="1"/><path class="tree" d="M300.1 80L308 96H292.2ZM300.1 86L310 102H290.2Z"/>
        <rect class="trunk" x="318" y="100" width="2" height="6" rx="1"/><path class="tree-2" d="M319 86L325 99H313ZM319 91L326.5 104H311.5Z"/></g>
      <path class="lake" d="M196 125C220 116 292 115 330 123C312 133 228 135 196 125Z"/>
      <path class="lake-l" d="M222 122h26M262 126h34M240 129.5h18"/>
      <path class="h2" d="M0 122C26 113 62 111 96 117C126 122 150 135 186 139C230 144 300 142 360 139L360 150L0 150Z"/>
      <path class="grass" d="M22 126l2-7M26 126l-1-6M30 126l2-5M118 124l2-6M122 124l-1-5M250 144l2-6M254 144l-1-5M340 142l2-6M344 142l-1-5"/>
      <g class="flowers"><circle cx="40" cy="125" r="1.8"/><circle cx="104" cy="122" r="1.6"/><circle cx="160" cy="135" r="1.8"/><circle cx="270" cy="143" r="1.6"/></g>
    </svg></div>`;
  }

  /* ---------- a small round vignette for each group of tools ---------- */
  const VIG = {
    breath: `<circle cx="24" cy="24" r="24" fill="#E2E9D8"/><g fill="none" stroke="#5F7F5A" stroke-width="2.6" stroke-linecap="round"><path d="M10 20h16.5a4.5 4.5 0 1 0-4.5-4.5"/><path d="M10 27h21.5a4.5 4.5 0 1 1-4.5 4.5"/><path d="M10 33.5h8"/></g>${leaf(32.5, 13.5, -24, 11, 4.2, '')}`.replace('class=""', 'fill="#93B27F"'),
    ground: '<circle cx="24" cy="24" r="24" fill="#EFE5D1"/><ellipse cx="24" cy="35.5" rx="12.5" ry="5" fill="#8E7D66"/><ellipse cx="23" cy="27.6" rx="9.2" ry="4.4" fill="#A8977C"/><ellipse cx="24.6" cy="20.8" rx="6.6" ry="3.6" fill="#C2B293"/><ellipse cx="23.8" cy="15.4" rx="4" ry="2.5" fill="#D9CCAE"/><path d="M8.5 39.5q1.5-5 3.2-.2M37 39.5q1.4-4.4 3-.2" fill="none" stroke="#7E9A6C" stroke-width="1.7" stroke-linecap="round"/>',
    touch: `<circle cx="24" cy="24" r="24" fill="#F2E0D4"/><path d="M24 37s-10.5-6.4-10.5-13.6a5.7 5.7 0 0 1 10.5-3.2 5.7 5.7 0 0 1 10.5 3.2C34.5 30.6 24 37 24 37z" fill="#C98068"/><path d="M24 20.2c-.2-3.6 1.2-6.4 3.8-8" fill="none" stroke="#5F7F5A" stroke-width="1.7" stroke-linecap="round"/>${leaf(27.4, 12.4, -30, 10, 3.8, '')}`.replace('class=""', 'fill="#93B27F"'),
    move: '<circle cx="24" cy="24" r="24" fill="#E3EADC"/><g fill="none" stroke-linecap="round"><path d="M15 41C15 31 18 22 27 14" stroke="#5F7F5A" stroke-width="2.3"/><path d="M22.5 41C23.5 33 27.5 26 36 21" stroke="#7E9A6C" stroke-width="2.1"/><path d="M30 41C31 36 34 32 40.5 29" stroke="#93B27F" stroke-width="2"/><path d="M7 21.5h7M9 26h5" stroke="#A9BC96" stroke-width="1.8"/></g><ellipse cx="28" cy="12.6" rx="2.3" ry="4.4" transform="rotate(40 28 12.6)" fill="#B49B6B"/>',
    vagus: '<circle cx="24" cy="24" r="24" fill="#DCE7EA"/><path d="M24 8.5c5.2 7.3 9.3 11.8 9.3 16.6a9.3 9.3 0 0 1-18.6 0c0-4.8 4.1-9.3 9.3-16.6z" fill="#7FA3B1"/><path d="M20.4 25.4a4.2 4.2 0 0 0 3.2 4.3" fill="none" stroke="#D4E4E9" stroke-width="1.9" stroke-linecap="round"/><g fill="none" stroke="#8FB0BC" stroke-width="1.6"><ellipse cx="24" cy="40.2" rx="12" ry="2.4"/><ellipse cx="24" cy="40.2" rx="5.5" ry="1.1"/></g>',
    rest: '<circle cx="24" cy="24" r="24" fill="#DCD9E8"/><path d="M27.6 9.6a10.4 10.4 0 1 0 9.6 14.2 8.2 8.2 0 1 1-9.6-14.2z" fill="#EAD7A0"/><g fill="#F4ECCB"><circle cx="13" cy="14" r="1.2"/><circle cx="17.5" cy="22" r=".9"/><circle cx="38" cy="13" r=".9"/><circle cx="10" cy="26" r=".8"/></g><path d="M3.2 36C12 31 20 31 27 34C34 37 39 35 44.8 36A24 24 0 0 1 3.2 36Z" fill="#A9A0C0"/>',
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

  return { scape, phase, vig, empty, sprig, hills, leafDot };
})();
