/* Interface commune : menu, tiroir de réservation, mode calme, son, copie de l'adresse,
   révélations au défilement et montée en intensité de la soirée. */
import { BP, setCalm, clamp, lerp } from './env.js';
import { upcoming, nextOpen, closeLabel, closeShort, venueOf, dayNum, monthShort, tick, status } from './dates.js';
import { drawerItem } from '../components/cards.js';
import { toggleSound, onAudio, isProvisional } from './audio.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

function trapFocus(panel, onClose) {
  const sel = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const key = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    if (e.key !== 'Tab') return;
    const f = [...panel.querySelectorAll(sel)].filter((n) => n.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  };
  document.addEventListener('keydown', key);
  return () => document.removeEventListener('keydown', key);
}

export function initMenu() {
  const btn = document.querySelector('.menu-btn');
  const menu = document.querySelector('.menu');
  if (!btn || !menu) return;
  const close = menu.querySelector('.menu-close');
  let release = null;
  const open = () => {
    menu.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    BP.lenis && BP.lenis.stop();
    if (BP.calm) gsap.set(menu, { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' });
    else gsap.fromTo(menu, { clipPath: 'polygon(100% 0%, 100% 0%, 100% 0%)' }, { clipPath: 'polygon(-100% 0%, 100% 0%, 100% 200%)', duration: 0.8, ease: 'power3.inOut' });
    if (!BP.calm) gsap.fromTo(menu.querySelectorAll('nav a'), { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.05, duration: 0.7, delay: 0.25, ease: 'power3.out' });
    release = trapFocus(menu, shut);
    setTimeout(() => close && close.focus(), 50);
  };
  const shut = () => {
    btn.setAttribute('aria-expanded', 'false');
    BP.lenis && BP.lenis.start();
    if (release) release();
    const done = () => menu.classList.remove('is-open');
    if (BP.calm) done();
    else gsap.to(menu, { clipPath: 'polygon(100% 0%, 100% 0%, 100% 0%)', duration: 0.6, ease: 'power3.inOut', onComplete: done });
    btn.focus();
  };
  btn.addEventListener('click', open);
  close && close.addEventListener('click', shut);
}

/* Bouton « Réserver » toujours présent, et tiroir avec toutes les infos pratiques. */
export function initDock() {
  const pill = document.querySelector('.book-pill');
  const drawer = document.querySelector('.drawer');
  if (!pill || !drawer) return;
  const ev = nextOpen();
  const cd = pill.querySelector('.cd');
  if (ev && cd) {
    const st = status(ev);
    cd.innerHTML = st === 'open'
      ? `<span>clôture ${closeShort(ev)}</span><b data-cd="${ev.close}"></b>`
      : `<span>${dayNum(ev)} ${monthShort(ev)}</span><b>${st === 'closed' ? 'clos' : ''}</b>`;
    cd.querySelectorAll('[data-cd]').forEach(tick);
    pill.setAttribute('aria-label', `Réserver. Prochaine clôture des inscriptions : ${closeLabel(ev)}, pour ${venueOf(ev).name}.`);
  }
  const list = drawer.querySelector('.dlist');
  if (list) upcoming().forEach((e) => list.appendChild(drawerItem(e)));
  const panel = drawer.querySelector('.drawer__panel');
  let release = null;
  const open = () => {
    drawer.hidden = false;
    pill.setAttribute('aria-expanded', 'true');
    BP.lenis && BP.lenis.stop();
    if (!BP.calm) {
      gsap.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 0.7, ease: 'power4.out' });
      gsap.fromTo(drawer.querySelector('.drawer__veil'), { opacity: 0 }, { opacity: 1, duration: 0.5 });
      gsap.fromTo(panel.querySelectorAll('.dlist li, .facts .fact'), { x: 30, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.03, duration: 0.6, delay: 0.15, ease: 'power3.out' });
    }
    release = trapFocus(panel, close);
    setTimeout(() => panel.querySelector('.drawer__close').focus(), 40);
  };
  const close = () => {
    pill.setAttribute('aria-expanded', 'false');
    BP.lenis && BP.lenis.start();
    if (release) release();
    const done = () => { drawer.hidden = true; };
    if (BP.calm) done(); else gsap.to(panel, { xPercent: 100, duration: 0.45, ease: 'power3.in', onComplete: done });
    pill.focus();
  };
  pill.addEventListener('click', open);
  document.querySelectorAll('[data-open-drawer]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); open(); }));
  drawer.querySelector('.drawer__close').addEventListener('click', close);
  drawer.querySelector('.drawer__veil').addEventListener('click', close);
}

export function initControls() {
  document.querySelectorAll('[data-calm]').forEach((b) => {
    b.setAttribute('aria-pressed', BP.calm ? 'true' : 'false');
    b.addEventListener('click', () => setCalm(!BP.calm));
  });
  const sounds = document.querySelectorAll('[data-sound]');
  const paint = (on) => sounds.forEach((b) => {
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    const l = b.querySelector('.lbl'); if (l) l.textContent = on ? 'Couper le son' : 'Activer le son';
  });
  sounds.forEach((b) => b.addEventListener('click', () => toggleSound()));
  onAudio((on) => {
    paint(on);
    document.querySelectorAll('[data-sound-note]').forEach((n) => {
      n.hidden = !on;
      if (on) n.textContent = isProvisional() ? 'Son provisoire généré par le navigateur, en attendant l’extrait de Kalapas.' : 'Extrait en cours de lecture.';
    });
  });
  paint(false);
}

export function initCopy() {
  document.querySelectorAll('[data-copy]').forEach((b) => {
    b.addEventListener('click', async () => {
      const text = b.dataset.copy;
      const lbl = b.querySelector('.btn-txt') || b;
      const prev = lbl.textContent;
      try { await navigator.clipboard.writeText(text); lbl.textContent = 'Adresse copiée'; }
      catch (e) {
        const target = document.querySelector(b.dataset.copyTarget || '.mail');
        if (target) { const r = document.createRange(); r.selectNodeContents(target); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
        lbl.textContent = 'Adresse sélectionnée';
      }
      setTimeout(() => { lbl.textContent = prev; }, 2200);
    });
  });
}

/* Révélations : lignes qui montent, images qui se dévoilent, parallaxe. */
export function initReveals(scope = document) {
  if (BP.calm) return;
  scope.querySelectorAll('[data-split]').forEach((el) => {
    if (el.__split || !window.SplitText) return;
    el.__split = true;
    window.SplitText.create(el, {
      type: 'lines', mask: 'lines', autoSplit: true, linesClass: 'split-line',
      onSplit(self) {
        return gsap.from(self.lines, { yPercent: 105, rotate: 2, duration: 1.1, stagger: 0.08, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      }
    });
  });
  scope.querySelectorAll('[data-reveal]').forEach((el) => {
    gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
  scope.querySelectorAll('[data-stagger]').forEach((el) => {
    gsap.from(el.children, { y: 40, opacity: 0, duration: 0.9, stagger: 0.07, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  scope.querySelectorAll('figure.m[data-unveil]').forEach((fig) => {
    gsap.fromTo(fig, { clipPath: 'inset(18% 12% 18% 12% round 40px)' }, { clipPath: 'inset(0% 0% 0% 0% round 22px)', ease: 'none', scrollTrigger: { trigger: fig, start: 'top 95%', end: 'top 35%', scrub: 0.6 } });
  });
  scope.querySelectorAll('.parallax').forEach((fig) => {
    const inner = fig.querySelectorAll('img, canvas.m__ph, video');
    gsap.fromTo(inner, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

/* La soirée monte en intensité : chaque section donne son niveau, le fond et la membrane suivent. */
export function initHeat() {
  const zones = [...document.querySelectorAll('[data-heat]')];
  if (!zones.length) return;
  const root = document.documentElement;
  const state = { heat: parseFloat(zones[0].dataset.heat) || 0 };
  const apply = () => { BP.heat = state.heat; root.style.setProperty('--heat', state.heat.toFixed(3)); };
  zones.forEach((z) => {
    const h = parseFloat(z.dataset.heat) || 0;
    const bg = z.dataset.bg;
    ScrollTrigger.create({
      trigger: z, start: 'top 55%', end: 'bottom 55%',
      onToggle: (self) => {
        if (!self.isActive) return;
        gsap.to(state, { heat: h, duration: 1.4, ease: 'power2.out', onUpdate: apply });
        if (bg) document.body.style.backgroundColor = bg;
      }
    });
  });
  apply();
}

/* Liste « Ramène ton groove » : chaque ligne respire à son tour. */
export function initBreath(scope = document) {
  if (BP.calm) return;
  scope.querySelectorAll('[data-breathe] > *').forEach((el, i) => {
    gsap.to(el, { '--w': 520, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.35 });
  });
}

export function injectFilters() {
  if (document.getElementById('bp-filters')) return;
  const div = document.createElement('div');
  div.id = 'bp-filters';
  div.setAttribute('aria-hidden', 'true');
  div.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  div.innerHTML = `<svg width="0" height="0"><filter id="bp-liquid" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter></svg>`;
  document.body.appendChild(div);
}
