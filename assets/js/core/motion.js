/* Mouvement global : défilement fluide, curseur, traînée de lumière, boutons magnétiques, cartes inclinées. */
import { BP, clamp, lerp } from './env.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

export function initScroll() {
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(window.SplitText);
  if (window.CustomEase) gsap.registerPlugin(window.CustomEase);
  ScrollTrigger.config({ ignoreMobileResize: true });

  if (!BP.calm && window.Lenis) {
    const lenis = new window.Lenis({
      lerp: 0.085,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
      smoothWheel: true,
      syncTouch: false,
      anchors: { offset: -90 }
    });
    BP.lenis = lenis;
    lenis.on('scroll', (l) => {
      BP.scroll.y = l.scroll;
      BP.scroll.v = l.velocity;
      ScrollTrigger.update();
    });
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    let last = window.scrollY;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      BP.scroll.v = y - last; BP.scroll.y = y; last = y;
    }, { passive: true });
    gsap.ticker.add(() => { BP.scroll.v *= 0.85; });
  }

  /* L'en-tête prend un fond dès qu'on quitte le haut de page. */
  const hd = document.querySelector('.hd');
  if (hd) {
    ScrollTrigger.create({
      start: 60,
      end: 'max',
      onToggle: (self) => hd.style.setProperty('--hd-bg', self.isActive ? '1' : '0')
    });
  }
}

/* Curseur personnalisé : il change selon ce qu'il survole. */
export function initCursor() {
  if (BP.calm || !BP.fine) return;
  const cur = document.createElement('div');
  cur.className = 'cur';
  cur.setAttribute('aria-hidden', 'true');
  cur.innerHTML = '<div class="cur__ring"><span class="cur__lbl"></span></div><div class="cur__dot"></div>';
  document.body.appendChild(cur);
  document.documentElement.classList.add('has-cursor');
  const ring = cur.querySelector('.cur__ring');
  const dot = cur.querySelector('.cur__dot');
  const lbl = cur.querySelector('.cur__lbl');
  const pos = { x: BP.pointer.x, y: BP.pointer.y };
  const setRing = { x: gsap.quickSetter(ring, 'x', 'px'), y: gsap.quickSetter(ring, 'y', 'px') };
  const setDot = { x: gsap.quickSetter(dot, 'x', 'px'), y: gsap.quickSetter(dot, 'y', 'px') };
  gsap.ticker.add(() => {
    const p = BP.pointer;
    pos.x = lerp(pos.x, p.x, 0.2);
    pos.y = lerp(pos.y, p.y, 0.2);
    setRing.x(pos.x); setRing.y(pos.y);
    setDot.x(p.x); setDot.y(p.y);
  });
  let state = '';
  function setState(s, text) {
    if (s === state && lbl.textContent === (text || '')) return;
    state = s;
    cur.className = 'cur' + (s ? ' is-' + s.split(' ').join(' is-') : '');
    lbl.textContent = text || '';
  }
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('[data-cursor], a, button, input, textarea, select, label');
    if (!t) return setState('');
    const c = t.getAttribute('data-cursor');
    if (c) {
      const [kind, ...rest] = c.split(':');
      if (kind === 'book') return setState('label book', rest.join(':') || 'Réserver');
      if (kind === 'label') return setState('label', rest.join(':'));
      return setState(kind);
    }
    if (t.matches('input, textarea, select')) return setState('text');
    setState('link');
  });
  document.addEventListener('pointerleave', () => gsap.to(cur, { opacity: 0, duration: 0.3 }));
  document.addEventListener('pointerenter', () => gsap.to(cur, { opacity: 1, duration: 0.3 }));
}

/* Traînée de lumière irisée qui suit le curseur ou le doigt. */
export function initTrail() {
  if (BP.calm) return;
  const c = document.createElement('canvas');
  c.className = 'trail';
  c.setAttribute('aria-hidden', 'true');
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  let w = 0, h = 0, dpr = 1;
  function size() {
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    w = innerWidth; h = innerHeight;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  window.addEventListener('resize', size);
  const pts = [];
  const MAX = 26;
  let hue = 18;
  let idle = 0;
  let running = false;
  function push(x, y) {
    pts.push({ x, y, life: 1 });
    if (pts.length > MAX) pts.shift();
    if (!running) { running = true; gsap.ticker.add(draw); }
  }
  window.addEventListener('pointermove', (e) => push(e.clientX, e.clientY), { passive: true });
  function draw() {
    ctx.clearRect(0, 0, w, h);
    idle = 0;
    const heat = BP.heat;
    for (const p of pts) p.life -= 0.035 + (1 - heat) * 0.015;
    while (pts.length && pts[0].life <= 0) pts.shift();
    if (pts.length < 2) {
      if (!pts.length) { running = false; gsap.ticker.remove(draw); }
      return;
    }
    hue = (hue + 0.6 + heat * 1.6) % 360;
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const t = i / pts.length;
      const life = Math.max(0, b.life);
      const width = (3 + t * 16) * life * (0.8 + heat * 0.6);
      const hh = (hue + i * 6) % 360;
      ctx.strokeStyle = `hsla(${hh}, 95%, ${62 + heat * 6}%, ${0.08 * life + 0.05 * t})`;
      ctx.lineWidth = width * 2.4;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.strokeStyle = `hsla(${(hh + 40) % 360}, 100%, 82%, ${0.22 * life * t})`;
      ctx.lineWidth = Math.max(1, width * 0.35);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}

/* Boutons magnétiques : ils se laissent attirer par le pointeur. */
export function initMagnetic(scope = document) {
  if (BP.calm || !BP.fine) return;
  scope.querySelectorAll('[data-magnetic], .btn, .book-pill').forEach((el) => {
    if (el.__mag) return;
    el.__mag = true;
    const strength = parseFloat(el.dataset.magnetic) || 0.32;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.45)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.45)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      xTo(dx * strength); yTo(dy * strength);
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* Cartes qui s'inclinent en 3D, avec un reflet qui suit le pointeur. */
export function initTilt(scope = document) {
  if (BP.calm || !BP.fine) return;
  scope.querySelectorAll('[data-tilt]').forEach((el) => {
    if (el.__tilt) return;
    el.__tilt = true;
    const max = parseFloat(el.dataset.tilt) || 9;
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.8, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.8, ease: 'power3.out' });
    gsap.set(el, { transformPerspective: 900 });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * max * 2);
      rx(-(py - 0.5) * max * 2);
      el.style.setProperty('--gx', `${px * 100}%`);
      el.style.setProperty('--gy', `${py * 100}%`);
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}

/* La typographie se plie et s'étire avec la vitesse du défilement. */
export function initScrollBend() {
  if (BP.calm) return;
  const els = [...document.querySelectorAll('[data-bend]')];
  if (!els.length) return;
  let v = 0;
  gsap.ticker.add(() => {
    const target = clamp(BP.scroll.v || 0, -60, 60);
    v = lerp(v, target, 0.12);
    if (Math.abs(v) < 0.02 && Math.abs(target) < 0.02) return;
    const skew = v * 0.09;
    const stretch = 1 + Math.min(0.22, Math.abs(v) * 0.006);
    for (const el of els) {
      el.style.transform = `skewY(${skew.toFixed(3)}deg) scaleY(${stretch.toFixed(4)})`;
    }
  });
}
