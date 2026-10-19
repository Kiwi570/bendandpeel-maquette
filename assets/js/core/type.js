/* Typographie variable qui se plie, s'étire et respire.
   Les lettres du titre se déplient à l'ouverture, réagissent au pointeur (graisse, rondeur, étirement)
   et respirent doucement. */
import { BP, lerp, clamp } from './env.js';

const gsap = window.gsap;

export function splitChars(el) {
  if (el.__chars) return el.__chars;
  const text = el.textContent;
  el.setAttribute('aria-label', el.getAttribute('aria-label') || text.trim());
  el.innerHTML = '';
  const chars = [];
  for (const ch of text) {
    const s = document.createElement('span');
    s.className = 'ch' + (ch === '&' ? ' amp' : '');
    s.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('span');
    inner.className = 'ci';
    inner.textContent = ch === ' ' ? ' ' : ch;
    s.appendChild(inner);
    s.__ci = inner;
    el.appendChild(s);
    chars.push(s);
  }
  el.__chars = chars;
  return chars;
}

/* Lettres vivantes : graisse et rondeur selon la distance au pointeur, plus une respiration lente. */
export function liveLetters(el, opts = {}) {
  const chars = splitChars(el);
  const base = { w: opts.w || 480, soft: opts.soft ?? 100 };
  const st = chars.map(() => ({ w: base.w, s: base.soft, y: 1, cx: 0, cy: 0 }));
  if (BP.calm) {
    chars.forEach((c) => { c.style.fontVariationSettings = `"opsz" 144, "SOFT" ${base.soft}, "WONK" 1, "wght" ${base.w}`; });
    return { chars, stop() {} };
  }
  let alive = true, active = true;
  function measure() {
    chars.forEach((c, i) => { const r = c.getBoundingClientRect(); st[i].cx = r.left + r.width / 2; st[i].cy = r.top + r.height / 2; st[i].hw = r.width; });
  }
  measure();
  window.addEventListener('resize', measure);
  window.addEventListener('scroll', () => requestAnimationFrame(measure), { passive: true });
  const t0 = performance.now();
  function loop() {
    if (!alive) return;
    if (active) {
      const t = (performance.now() - t0) / 1000;
      const p = BP.pointer;
      const reach = Math.max(180, innerWidth * 0.22);
      chars.forEach((c, i) => {
        const s = st[i];
        const d = Math.hypot(p.x - s.cx, (p.y - s.cy) * 1.3);
        const k = p.moved ? clamp(1 - d / reach) : 0;
        const breath = Math.sin(t * 0.9 + i * 0.55) * 0.5 + 0.5;
        const audio = BP.audio.bass * 0.6;
        const tw = base.w - 120 + breath * 120 + k * 380 + audio * 200;
        const ts = clamp(base.soft - k * 100 + (1 - breath) * 0, 0, 100);
        const ty = 1 + k * 0.14 + audio * 0.06 + breath * 0.015;
        s.w = lerp(s.w, tw, 0.12); s.s = lerp(s.s, ts, 0.12); s.y = lerp(s.y, ty, 0.12);
        c.__ci.style.fontVariationSettings = `"opsz" 144, "SOFT" ${s.s.toFixed(1)}, "WONK" 1, "wght" ${s.w.toFixed(0)}`;
        c.__ci.style.transform = `scaleY(${s.y.toFixed(4)})`;
      });
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  return { chars, measure, setActive(v) { active = v; }, stop() { alive = false; } };
}

/* Ouverture : les lettres se déplient comme une feuille qu'on relève. */
export function unfold(chars, opts = {}) {
  if (BP.calm) return gsap.timeline();
  const tl = gsap.timeline({ delay: opts.delay || 0 });
  tl.fromTo(chars, { rotateX: -92, yPercent: 40, opacity: 0, transformPerspective: 800, filter: 'blur(10px)' },
    { rotateX: 0, yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 1.4, ease: 'expo.out', stagger: { each: 0.07, from: 'center' } });
  return tl;
}
