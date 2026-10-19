/* État partagé de la maquette : préférences, capacités de l'appareil, pointeur, intensité. */

const root = document.documentElement;
const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');

function store(key, value) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
  } catch (e) { return null; }
  return null;
}

function detectGL(force) {
  try {
    const c = document.createElement('canvas');
    const o = { failIfMajorPerformanceCaveat: !force };
    const gl = c.getContext('webgl2', o) || c.getContext('webgl', o);
    if (!gl) return false;
    const ext = gl.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
    return true;
  } catch (e) { return false; }
}

const params = new URLSearchParams(location.search);

export const BP = (window.BP = window.BP || {});
Object.assign(BP, {
  calm: root.classList.contains('calm'),
  reduced: mqReduce.matches,
  fine: mqFine.matches,
  gl: params.get('gl') === '0' ? false : detectGL(params.get('gl') === '1'),
  lowPower: false,
  heat: 0,
  beat: 0,
  audio: { on: false, bass: 0, mid: 0, high: 0 },
  pointer: { x: innerWidth / 2, y: innerHeight * 0.45, vx: 0, vy: 0, speed: 0, moved: false },
  scroll: { y: 0, v: 0 },
  lenis: null,
  store,
  page: document.body.dataset.page || 'home'
});

root.classList.toggle('has-gl', BP.gl && !BP.calm);
root.classList.toggle('gl-off', !(BP.gl && !BP.calm));
root.classList.toggle('no-gl', !BP.gl);

/* Bascule du mode calme : on mémorise, on garde la position, on recharge proprement. */
export function setCalm(on) {
  store('bp-calm', on ? '1' : '0');
  try { sessionStorage.setItem('bp-scroll', String(window.scrollY)); } catch (e) {}
  root.classList.add('is-switching');
  setTimeout(() => location.reload(), 120);
}

export function restoreScroll() {
  let y = null;
  try { y = sessionStorage.getItem('bp-scroll'); sessionStorage.removeItem('bp-scroll'); } catch (e) {}
  if (y !== null) {
    const v = parseFloat(y) || 0;
    requestAnimationFrame(() => window.scrollTo(0, v));
    return true;
  }
  return false;
}

/* Pointeur global, lissé, avec vitesse. */
let lastT = performance.now();
window.addEventListener('pointermove', (e) => {
  const p = BP.pointer;
  const t = performance.now();
  const dt = Math.max(8, t - lastT);
  p.vx = (e.clientX - p.x) / dt;
  p.vy = (e.clientY - p.y) / dt;
  p.speed = Math.min(4, Math.hypot(p.vx, p.vy));
  p.x = e.clientX; p.y = e.clientY;
  p.moved = true;
  lastT = t;
}, { passive: true });

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const mapRange = (v, a, b, c, d) => c + ((v - a) / (b - a)) * (d - c);

/* Générateur pseudo-aléatoire reproductible (visuels provisoires, partitions). */
export function rng(seed) {
  let s = 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i++) s = (Math.imul(31, s) + str.charCodeAt(i)) | 0;
  s = s >>> 0 || 1;
  return function () {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function onVisible(el, cb, opts = {}) {
  if (!('IntersectionObserver' in window)) { cb(true); return () => {}; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) cb(e.isIntersecting, e);
  }, { rootMargin: opts.margin || '200px 0px', threshold: opts.threshold || 0 });
  io.observe(el);
  return () => io.disconnect();
}
