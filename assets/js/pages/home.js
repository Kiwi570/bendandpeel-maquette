/* Accueil : ouverture orchestrée, peel du héros, frise, actes en galerie courbée,
   anneau des musiques, prochaines dates sur la carte. */
import { BP, clamp, onVisible } from '../core/env.js';
import { createMembrane } from '../gl/membrane.js';
import { createBend } from '../gl/bend.js';
import { liveLetters, unfold } from '../core/type.js';
import { buildFrise } from '../components/frise.js';
import { buildMap } from '../components/map.js';
import { dateCard } from '../components/cards.js';
import { upcoming, nextOpen, venueOf, dayNum, monthShort, closeLabel, dateURL, status } from '../core/dates.js';
import { hydrateAll, GROK_READY } from '../core/media.js';
import { fillStats } from '../core/stats.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

function hero() {
  const stage = document.getElementById('hero-stage');
  const heroEl = stage.querySelector('.hero');
  const title = document.getElementById('hero-title');
  let membrane = null;
  if (BP.gl) {
    try {
      membrane = createMembrane(heroEl, { heat: 0.2, reveal: BP.calm ? 1 : 0 });
      heroEl.addEventListener('gl:fallback', () => document.documentElement.classList.remove('has-gl'));
    } catch (e) { document.documentElement.classList.remove('has-gl'); }
  }
  const letters = liveLetters(title, { w: 520 });
  /* Image Grok de l'ouverture : fond de la version sans WebGL, dès qu'elle est livrée. */
  if (GROK_READY['bp-ouverture-16x9']) {
    const fb = heroEl.querySelector('.hero__fallback');
    const portrait = innerHeight > innerWidth && GROK_READY['bp-ouverture-9x16'];
    fb.style.background = `center / cover no-repeat url(assets/img/grok/${portrait ? 'bp-ouverture-9x16' : 'bp-ouverture-16x9'}.webp), var(--night)`;
  }
  /* Prochaine date dans le coin du héros */
  const ev = nextOpen();
  const chip = heroEl.querySelector('[data-next-chip]');
  if (ev && chip) {
    const v = venueOf(ev);
    chip.href = dateURL(ev);
    chip.querySelector('.v').textContent = `${dayNum(ev)} ${monthShort(ev)} · ${v.name}, ${v.city}`;
    const t = chip.querySelector('.t');
    if (status(ev) === 'open') { t.dataset.cd = ev.close; t.insertAdjacentText('beforebegin', ''); chip.querySelector('.k').textContent = `Prochaine date · clôture ${closeLabel(ev)}`; }
    chip.dataset.label = v.name;
  }

  if (BP.calm) return;
  /* Ouverture orchestrée : la lumière se déploie, le nom se déplie, la devise s'écrit. */
  const intro = gsap.timeline({ delay: document.documentElement.classList.contains('is-entering') ? 0.6 : 0.1 });
  if (membrane) intro.to(membrane.uniforms.uReveal, { value: 1, duration: 2.4, ease: 'power2.out' }, 0);
  intro.add(unfold(letters.chars), 0.35);
  intro.from(heroEl.querySelectorAll('.hero__top .eyebrow, .hero__bottom > *'), { y: 24, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out' }, 1.1);
  intro.add(() => letters.measure && letters.measure(), 1.8);

  /* Le héros se pèle : le titre plie et s'étire pendant que la couche se décolle. */
  stage.__onPeel = (p) => {
    letters.chars.forEach((c, i) => {
      const k = (i - (letters.chars.length - 1) / 2) / letters.chars.length;
      gsap.set(c, { y: -Math.sin(p * Math.PI * 0.9) * 90 * (0.4 + Math.abs(k)), rotation: k * p * 24, scaleY: 1 + p * 0.5 });
    });
    if (membrane) membrane.setVisible(p < 0.995);
    letters.setActive(p < 0.6);
  };
}

function wordPeel() {
  document.querySelectorAll('.word-peel[data-words]').forEach((el) => {
    const words = el.dataset.words.split('|');
    if (BP.calm) { el.textContent = words.join(', '); return; }
    el.innerHTML = '';
    const spans = words.map((w) => { const s = document.createElement('span'); s.textContent = w; el.appendChild(s); return s; });
    gsap.set(spans, { yPercent: 110, rotateX: -80, opacity: 0, transformOrigin: '50% 100%' });
    gsap.set(spans[0], { yPercent: 0, rotateX: 0, opacity: 1 });
    let i = 0;
    setInterval(() => {
      if (document.hidden) return;
      const a = spans[i]; i = (i + 1) % spans.length; const b = spans[i];
      gsap.to(a, { yPercent: -110, rotateX: 80, opacity: 0, duration: 0.8, ease: 'power3.inOut' });
      gsap.fromTo(b, { yPercent: 110, rotateX: -80, opacity: 0 }, { yPercent: 0, rotateX: 0, opacity: 1, duration: 0.9, ease: 'power3.out' });
    }, 2200);
  });
}

function acts() {
  const stage = document.querySelector('.acts-stage');
  if (!stage) return;
  const acts = stage.querySelector('.acts');
  const track = stage.querySelector('.acts__track');
  if (BP.calm) return;
  let dist = 0;
  const measure = () => {
    dist = Math.max(0, track.scrollWidth - innerWidth);
    stage.style.height = `${dist + innerHeight}px`;
  };
  measure();
  window.addEventListener('resize', measure);
  let vel = 0;
  ScrollTrigger.create({
    trigger: stage, start: 'top top', end: () => `+=${dist}`, invalidateOnRefresh: true,
    onRefreshInit: measure,
    onUpdate: (self) => { gsap.set(track, { x: -dist * self.progress }); vel = self.getVelocity() / 60; }
  });
  if (BP.gl) {
    const figs = [...stage.querySelectorAll('figure[data-bendgl]')];
    hydrateAll(stage);
    try {
      const bend = createBend(acts, figs, { velocity: () => { vel *= 0.92; return vel; }, velScale: 1.4, cyl: 320 });
      onVisible(stage, (v) => bend.setVisible(v), { margin: '0px' });
    } catch (e) { /* version sans WebGL : les images DOM restent visibles */ }
  }
}

function genres() {
  const ring = document.querySelector('.genres__ring');
  if (!ring || BP.calm) return;
  const words = [...ring.children];
  const st = { a: 0, speed: 0.06 };
  let rx = 0, ry = 0;
  const stageEl = ring.parentElement;
  const size = () => { rx = Math.min(stageEl.clientWidth * 0.43, 640); ry = Math.min(stageEl.clientHeight * 0.4, 300); };
  size(); window.addEventListener('resize', size);
  let visible = false;
  onVisible(ring.parentElement, (v) => { visible = v; }, { margin: '0px' });
  gsap.ticker.add((t, dt) => {
    if (!visible) return;
    st.a += (st.speed + BP.audio.bass * 0.35 + Math.abs(BP.scroll.v) * 0.004) * (dt / 1000);
    words.forEach((w, i) => {
      const ang = st.a + (i / words.length) * Math.PI * 2;
      const z = Math.sin(ang);
      const x = Math.cos(ang) * rx, y = z * ry;
      const s = 0.72 + (z + 1) * 0.32;
      w.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${s.toFixed(3)})`;
      w.style.opacity = (0.35 + (z + 1) * 0.33).toFixed(3);
      w.style.zIndex = z > 0 ? 4 : 1;
    });
  });
  gsap.from('.genres__core', { scale: 0.7, borderRadius: '999px', ease: 'none', scrollTrigger: { trigger: '.genres__stage', start: 'top bottom', end: 'center center', scrub: 0.6 } });
}

function nextDates() {
  const grid = document.querySelector('[data-next]');
  if (grid) {
    const n = parseInt(grid.dataset.next, 10) || 3;
    upcoming().slice(0, n).forEach((e) => grid.appendChild(dateCard(e)));
  }
  document.querySelectorAll('[data-map]').forEach((m) => buildMap(m));
}

function salutationsCollage() {
  if (BP.calm) return;
  document.querySelectorAll('.collage').forEach((c) => {
    [...c.children].forEach((f, i) => {
      gsap.fromTo(f, { yPercent: 12 + i * 10 }, { yPercent: -8 - i * 6, ease: 'none', scrollTrigger: { trigger: c, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });
}

export default function () {
  fillStats();
  hero();
  wordPeel();
  document.querySelectorAll('[data-frise]').forEach(buildFrise);
  acts();
  genres();
  nextDates();
  salutationsCollage();
}
