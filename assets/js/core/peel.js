/* Le « peel » : une couche se décolle comme un sticker.
   Géométrie : le coin choisi glisse vers le coin opposé ; la ligne de pli est la médiatrice
   entre la position d'origine du coin et sa position actuelle. La partie décollée est
   retournée par symétrie autour du pli (le dos du sticker), avec ombre portée. */
import { BP, clamp } from './env.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

function clipHalf(poly, M, n, keepPositive) {
  const out = [];
  const side = (p) => ((p[0] - M[0]) * n[0] + (p[1] - M[1]) * n[1]) * (keepPositive ? 1 : -1);
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const sa = side(a), sb = side(b);
    if (sa >= 0) out.push(a);
    if ((sa >= 0) !== (sb >= 0)) {
      const t = sa / (sa - sb);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}
const reflect = (p, M, n) => {
  const d = (p[0] - M[0]) * n[0] + (p[1] - M[1]) * n[1];
  return [p[0] - 2 * d * n[0], p[1] - 2 * d * n[1]];
};
const toPoly = (pts) => (pts.length < 3 ? 'polygon(0 0, 0 0, 0 0)' : 'polygon(' + pts.map((p) => `${p[0].toFixed(1)}px ${p[1].toFixed(1)}px`).join(', ') + ')');

function gradAngle(g) {
  /* Angle CSS d'un dégradé linéaire dont la direction est le vecteur g. */
  return (Math.atan2(g[0], -g[1]) * 180) / Math.PI;
}
function gradPos(X, g, w, h, angleDeg) {
  const a = (angleDeg * Math.PI) / 180;
  const L = Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a));
  return (X[0] - w / 2) * g[0] + (X[1] - h / 2) * g[1] + L / 2;
}

export class PeelSurface {
  /* front : couche qui se décolle ; flap : dos du sticker ; shade : ombre sur la couche révélée. */
  constructor({ front, flap, shade, corner = 'br', twist = 10, back }) {
    this.front = front; this.flap = flap; this.shade = shade;
    this.corner = corner; this.twist = twist; this.t = -1;
    this.back = back || ['#fff7f1', '#f6dccd', '#e3b2a5', '#b9a3d8'];
    this.size();
  }
  size() {
    const r = (this.front.parentElement || this.front).getBoundingClientRect();
    this.w = r.width || this.front.offsetWidth; this.h = r.height || this.front.offsetHeight;
    const t = this.t; this.t = -1; if (t >= 0) this.set(t);
  }
  set(t) {
    t = clamp(t, 0, 1);
    if (Math.abs(t - this.t) < 0.0004) return;
    this.t = t;
    const { w, h } = this;
    if (t <= 0.0005) {
      this.front.style.clipPath = 'none';
      this.front.style.visibility = '';
      this.flap.style.clipPath = 'polygon(0 0, 0 0, 0 0)';
      if (this.shade) this.shade.style.clipPath = 'polygon(0 0, 0 0, 0 0)';
      return;
    }
    if (t >= 0.9995) {
      this.front.style.visibility = 'hidden';
      this.flap.style.clipPath = 'polygon(0 0, 0 0, 0 0)';
      if (this.shade) this.shade.style.clipPath = 'polygon(0 0, 0 0, 0 0)';
      return;
    }
    this.front.style.visibility = '';
    const corners = { br: [w, h], bl: [0, h], tr: [w, 0], tl: [0, 0] };
    const opposite = { br: [0, 0], bl: [w, 0], tr: [0, h], tl: [w, h] };
    const C = corners[this.corner];
    const A = opposite[this.corner];
    let D = [A[0] - C[0], A[1] - C[1]];
    /* Une légère torsion rend le geste organique, puis s'efface en fin de course. */
    const tw = ((this.twist * (1 - t)) * Math.PI) / 180;
    D = [D[0] * Math.cos(tw) - D[1] * Math.sin(tw), D[0] * Math.sin(tw) + D[1] * Math.cos(tw)];
    const k = t * 1.04;
    const M = [C[0] + D[0] * k, C[1] + D[1] * k];
    const len = Math.hypot(D[0], D[1]) || 1;
    const n = [-D[0] / len, -D[1] / len]; /* pointe vers le coin décollé */
    const rect = [[0, 0], [w, 0], [w, h], [0, h]];
    const keep = clipHalf(rect, M, n, false);
    const cut = clipHalf(rect, M, n, true);
    const flap = cut.map((p) => reflect(p, M, n));
    this.front.style.clipPath = toPoly(keep);
    this.flap.style.clipPath = toPoly(flap);

    /* Dos du sticker : reflet vif au pli, nacre, puis ombre vers la pointe. */
    let depth = 0;
    for (const p of flap) depth = Math.max(depth, -((p[0] - M[0]) * n[0] + (p[1] - M[1]) * n[1]));
    const g = [-n[0], -n[1]];
    const ang = gradAngle(g);
    const s0 = gradPos(M, g, w, h, ang);
    const b = this.back;
    this.flap.style.background = `linear-gradient(${ang.toFixed(2)}deg, ${b[0]} ${s0.toFixed(1)}px, ${b[1]} ${(s0 + Math.max(24, depth * 0.18)).toFixed(1)}px, ${b[2]} ${(s0 + depth * 0.7).toFixed(1)}px, ${b[3]} ${(s0 + depth + 1).toFixed(1)}px)`;

    if (this.shade) {
      const ga = gradAngle(n);
      const s1 = gradPos(M, n, w, h, ga);
      const reach = Math.min(260, 60 + depth * 0.35);
      this.shade.style.clipPath = toPoly(cut);
      this.shade.style.background = `linear-gradient(${ga.toFixed(2)}deg, rgba(8,2,8,.55) ${s1.toFixed(1)}px, rgba(8,2,8,0) ${(s1 + reach).toFixed(1)}px)`;
    }
  }
}

/* Une scène épinglée : on fait défiler, la couche de dessus se pèle et révèle celle de dessous. */
export function initPeelStages(scope = document) {
  const stages = [...scope.querySelectorAll('.peel-stage')];
  if (BP.calm) return stages;
  stages.forEach((stage) => {
    const front = stage.querySelector('.peel-front');
    const flap = stage.querySelector('.peel-flap');
    const shade = stage.querySelector('.peel-shade');
    if (!front || !flap) return;
    const surf = new PeelSurface({ front, flap, shade, corner: stage.dataset.corner || 'br', back: stage.dataset.back ? stage.dataset.back.split(',') : undefined });
    stage.__peel = surf;
    const hold = parseFloat(stage.dataset.hold || '0.12');
    const ease = gsap.parseEase('power2.inOut');
    ScrollTrigger.create({
      trigger: stage,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const p = clamp((self.progress - hold) / (1 - hold * 1.6));
        surf.set(ease(p));
        stage.style.setProperty('--peel', p.toFixed(3));
        if (stage.__onPeel) stage.__onPeel(p);
      },
      onRefresh: () => surf.size()
    });
    window.addEventListener('resize', () => surf.size());
  });
  return stages;
}

/* Cartes : le coin se soulève au survol et laisse voir « Réserver ». */
export function initPeelCards(scope = document) {
  scope.querySelectorAll('.pcard').forEach((card) => {
    if (card.__peel) return;
    const front = card.querySelector('.pcard__front');
    const flap = card.querySelector('.pcard__flap');
    if (!front || !flap) return;
    const surf = new PeelSurface({ front, flap, corner: 'br', twist: 6, back: ['#fff7f1', '#f3d3c2', '#dcae9f', '#b59ad4'] });
    card.__peel = surf;
    const rest = BP.calm ? 0 : 0.03;
    const st = { t: rest };
    const apply = () => surf.set(st.t);
    requestAnimationFrame(() => { surf.size(); apply(); });
    if (BP.calm) return;
    const ro = new ResizeObserver(() => { surf.size(); apply(); });
    ro.observe(card);
    const open = () => gsap.to(st, { t: 0.2, duration: 0.7, ease: 'power3.out', onUpdate: apply });
    const close = () => gsap.to(st, { t: rest, duration: 0.6, ease: 'power3.inOut', onUpdate: apply });
    card.addEventListener('pointerenter', open);
    card.addEventListener('pointerleave', close);
    card.addEventListener('focusin', open);
    card.addEventListener('focusout', close);
  });
}

/* Transition de page : la nouvelle page se décolle de l'écran ; on la recouvre avant de partir. */
export function initPageTransition() {
  const root = document.documentElement;
  const wrap = document.querySelector('.page-peel');
  if (!wrap) return;
  const front = wrap.querySelector('.page-peel__front');
  const flap = wrap.querySelector('.page-peel__flap');
  const surf = new PeelSurface({ front, flap, corner: 'tr', twist: 14 });
  const st = { t: 0 };
  const apply = () => surf.set(st.t);
  try { sessionStorage.removeItem('bp-peel'); } catch (e) {}

  if (root.classList.contains('is-entering')) {
    wrap.classList.add('is-on');
    surf.size();
    if (BP.calm) {
      gsap.to(wrap, { opacity: 0, duration: 0.3, onComplete: () => { wrap.classList.remove('is-on'); root.classList.remove('is-entering'); gsap.set(wrap, { opacity: 1 }); } });
    } else {
      apply();
      gsap.to(st, { t: 1, duration: 1.05, ease: 'power3.inOut', delay: 0.08, onUpdate: apply, onComplete: () => { wrap.classList.remove('is-on'); root.classList.remove('is-entering'); } });
    }
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download') || a.dataset.noTransition !== undefined) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/\.html$|\/$|^[^.]*$/.test(url.pathname.split('/').pop() || '/')) return;
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
    e.preventDefault();
    try { sessionStorage.setItem('bp-peel', '1'); } catch (err) {}
    const lbl = wrap.querySelector('.page-peel__lbl');
    if (lbl) lbl.textContent = a.dataset.label || a.textContent.trim().slice(0, 40);
    wrap.classList.add('is-on');
    surf.size();
    if (BP.calm) {
      gsap.fromTo(wrap, { opacity: 0 }, { opacity: 1, duration: 0.25, onComplete: () => { location.href = url.href; } });
      return;
    }
    st.t = 1; apply();
    gsap.to(st, { t: 0, duration: 0.75, ease: 'power3.inOut', onUpdate: apply, onComplete: () => { location.href = url.href; } });
  });
  window.addEventListener('pageshow', (ev) => {
    if (ev.persisted) { wrap.classList.remove('is-on'); root.classList.remove('is-entering'); st.t = 1; apply(); }
  });
}
