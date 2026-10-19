/* La partition graphique : portées, liaisons, points d'appui, flèches de direction,
   soufflets et spirales qui se tracent au défilement et décrivent le mouvement des corps.
   Les signes sont générés à partir d'une graine : chaque section a sa partition. */
import { BP, rng } from './env.js';

const NS = 'http://www.w3.org/2000/svg';
const MARKS = ['pp', 'mf', 'ff', 'rubato', 'dolce', 'accel.', 'rit.', 'tutti', 'ppp', 'cresc.'];

function el(tag, attrs, parent) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

function staff(g, r, w, h, y0, amp, gap) {
  const phase = r() * 6, f = 1.5 + r() * 2.5;
  for (let l = 0; l < 5; l++) {
    let d = '';
    for (let x = -20; x <= w + 20; x += 24) {
      const y = y0 + l * gap + Math.sin((x / w) * Math.PI * f + phase) * amp + Math.sin((x / w) * 13 + l) * amp * 0.08;
      d += (x === -20 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1) + ' ';
    }
    el('path', { d, class: 'draw' + (l === 2 ? ' thick' : '') }, g);
  }
  return (x) => y0 + 2 * gap + Math.sin((x / w) * Math.PI * f + phase) * amp;
}

export function buildScore(svg, opts = {}) {
  const r = rng(opts.seed || 'score');
  const box = svg.getBoundingClientRect();
  const w = Math.max(320, Math.round(box.width || svg.parentElement.clientWidth));
  const h = Math.max(240, Math.round(box.height || svg.parentElement.clientHeight));
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.innerHTML = '';
  const density = opts.density ?? 1;
  const g = el('g', {}, svg);
  const staves = Math.max(1, Math.round((opts.staves ?? 2) * (h > 1400 ? 1.6 : 1)));
  const lines = [];
  for (let s = 0; s < staves; s++) {
    const y0 = h * ((s + 0.5) / staves) - 20 + (r() - 0.5) * h * 0.08;
    lines.push(staff(g, r, w, h, y0, h * (0.02 + r() * 0.04) * (0.6 + density * 0.6), 9 + density * 3));
  }
  const n = Math.round((10 + 18 * density) * Math.max(1, w / 1400));
  for (let i = 0; i < n; i++) {
    const L = lines[Math.floor(r() * lines.length)];
    const x = 30 + r() * (w - 60);
    const y = L(x) + (r() - 0.5) * 50;
    const kind = r();
    const accent = r() < 0.18 ? ' accent' : '';
    if (kind < 0.24) {
      el('circle', { cx: x, cy: y, r: 3 + r() * 5, class: 'fill' + accent }, g);
    } else if (kind < 0.42) {
      const span = 60 + r() * 220, up = r() > 0.5 ? -1 : 1;
      el('path', { d: `M${x},${y} Q${x + span / 2},${y + up * (30 + r() * 50)} ${x + span},${y}`, class: 'draw' + accent }, g);
    } else if (kind < 0.56) {
      const len = 40 + r() * 90, a = (r() - 0.5) * 1.6;
      const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
      const hx = Math.cos(a + 2.6) * 10, hy = Math.sin(a + 2.6) * 10, kx = Math.cos(a - 2.6) * 10, ky = Math.sin(a - 2.6) * 10;
      el('path', { d: `M${x},${y} L${ex},${ey} M${ex + hx},${ey + hy} L${ex},${ey} L${ex + kx},${ey + ky}`, class: 'draw' + accent }, g);
    } else if (kind < 0.68) {
      const len = 70 + r() * 120, op = 8 + r() * 10, cresc = r() > 0.5;
      const d = cresc ? `M${x},${y} L${x + len},${y - op} M${x},${y} L${x + len},${y + op}` : `M${x},${y - op} L${x + len},${y} M${x},${y + op} L${x + len},${y}`;
      el('path', { d, class: 'draw' + accent }, g);
    } else if (kind < 0.78) {
      let d = `M${x},${y}`; const turns = 2 + r() * 1.5, R = 10 + r() * 16;
      for (let a = 0; a < Math.PI * 2 * turns; a += 0.3) { const rr = (a / (Math.PI * 2 * turns)) * R; d += ` L${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`; }
      el('path', { d, class: 'draw' + accent }, g);
    } else if (kind < 0.86) {
      let d = `M${x},${y}`; const len = 50 + r() * 80, amp = 5 + r() * 6;
      for (let k = 1; k <= 10; k++) d += ` L${x + (len * k) / 10},${y + (k % 2 ? -amp : amp)}`;
      el('path', { d, class: 'draw' + accent }, g);
    } else if (kind < 0.93) {
      el('path', { d: `M${x - 14},${y} A14,14 0 0 1 ${x + 14},${y}`, class: 'draw' + accent }, g);
      el('circle', { cx: x, cy: y - 4, r: 2.5, class: 'fill' + accent }, g);
    } else {
      const t = el('text', { x, y, class: accent.trim() }, g);
      t.textContent = MARKS[Math.floor(r() * MARKS.length)];
    }
  }
  return svg;
}

/* Tracé au défilement : chaque trait se dessine quand sa section traverse l'écran. */
export function initScores(scope = document) {
  const gsap = window.gsap;
  const svgs = [...scope.querySelectorAll('svg.score')];
  svgs.forEach((svg) => {
    const opts = { seed: svg.dataset.seed || svg.id || 'score', density: parseFloat(svg.dataset.density || '1'), staves: parseInt(svg.dataset.staves || '2', 10) };
    buildScore(svg, opts);
    const paths = [...svg.querySelectorAll('.draw')];
    const dots = [...svg.querySelectorAll('circle.fill, text')];
    if (BP.calm) return;
    paths.forEach((p) => {
      const len = p.getTotalLength ? p.getTotalLength() : 600;
      p.style.strokeDasharray = `${len} ${len}`;
      p.style.strokeDashoffset = String(len);
      p.__len = len;
    });
    gsap.set(dots, { opacity: 0 });
    const host = svg.parentElement;
    const tl = gsap.timeline({ scrollTrigger: { trigger: host, start: 'top 85%', end: 'bottom 30%', scrub: 0.6 } });
    paths.forEach((p, i) => tl.to(p, { strokeDashoffset: 0, ease: 'none', duration: 1 }, (i / paths.length) * 0.6));
    dots.forEach((d) => tl.to(d, { opacity: 1, duration: 0.05 }, 0.1 + Math.random() * 0.7));
  });
}
