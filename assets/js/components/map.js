/* Carte dessinée de la tournée : Drôme, Isère, Hautes-Alpes.
   Les lieux s'allument, les dates à venir pulsent doucement, les dates passées s'estompent,
   la route de la saison se trace dans l'ordre des dates. */
import { MAP, project } from '../data/map.js';
import { VENUES, upcoming, past, venueOf, dayNum, monthShort, year, dateURL, status } from '../core/dates.js';
import { BP } from '../core/env.js';

const NS = 'http://www.w3.org/2000/svg';
const LABEL = {
  lampisterie: [16, -10, 'start'], bled: [-16, 8, 'end'], exosquelette: [16, 26, 'start'], bajart: [16, -6, 'start'],
  dodecadome: [-16, -6, 'end'], nidrouge: [16, 8, 'start'], colombia: [-16, -14, 'end']
};

export function buildMap(host, opts = {}) {
  const up = upcoming();
  const pa = past();
  const venues = {};
  for (const e of up) (venues[e.venue] ||= { up: [], past: [] }).up.push(e);
  for (const e of pa) (venues[e.venue] ||= { up: [], past: [] }).past.push(e);
  const [vx, vy, vw, vh] = MAP.viewBox;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `${vx} ${vy} ${vw} ${vh}`);
  svg.setAttribute('class', 'tour-map');
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-label', 'Carte de la tournée en Drôme, Isère et Hautes-Alpes');
  let html = '';
  for (const code of Object.keys(MAP.depts)) {
    const d = MAP.depts[code];
    html += `<path class="dept" data-dept="${code}" d="${d.d}"></path>`;
  }
  for (const code of Object.keys(MAP.depts)) {
    const d = MAP.depts[code];
    html += `<text class="dept-lbl" x="${d.label[0]}" y="${d.label[1]}" text-anchor="middle">${d.name}</text>`;
  }
  const routePts = up.map((e) => project(VENUES[e.venue].lon, VENUES[e.venue].lat));
  if (routePts.length > 1) {
    let d = `M${routePts[0][0].toFixed(1)},${routePts[0][1].toFixed(1)}`;
    for (let i = 1; i < routePts.length; i++) {
      const a = routePts[i - 1], b = routePts[i];
      const mx = (a[0] + b[0]) / 2 + (b[1] - a[1]) * 0.18, my = (a[1] + b[1]) / 2 - (b[0] - a[0]) * 0.18;
      d += ` Q${mx.toFixed(1)},${my.toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`;
    }
    html += `<path class="route" d="${d}"></path>`;
  }
  const pastOnly = Object.keys(venues).filter((k) => !venues[k].up.length);
  const withUp = Object.keys(venues).filter((k) => venues[k].up.length);
  for (const key of [...pastOnly, ...withUp]) {
    const v = VENUES[key]; if (!v) continue;
    const [x, y] = project(v.lon, v.lat);
    const info = venues[key];
    const isUp = info.up.length > 0;
    const r = isUp ? 9 : 4 + Math.min(6, info.past.length * 0.6);
    const next = info.up[0];
    const lab = LABEL[key];
    const aria = isUp
      ? `${v.name}, ${v.city}. Prochaine date : ${dayNum(next)} ${monthShort(next)} ${year(next)}. ${info.up.length} date${info.up.length > 1 ? 's' : ''} à venir.`
      : `${v.name}. ${info.past.length} date${info.past.length > 1 ? 's' : ''} passée${info.past.length > 1 ? 's' : ''}.`;
    html += `<g class="venue ${isUp ? 'is-up' : 'is-past'}" data-venue="${key}" ${isUp ? `tabindex="0" role="link"` : ''} aria-label="${aria}">
      ${isUp ? `<circle class="v-halo" cx="${x}" cy="${y}" r="${r * 1.6}"></circle>` : ''}
      <circle class="${isUp ? 'v-up' : 'v-past'}" cx="${x}" cy="${y}" r="${r}"></circle>
      ${isUp && lab ? `<text class="v-lbl" x="${x + lab[0]}" y="${y + lab[1]}" text-anchor="${lab[2]}">${v.city}</text>` : ''}
      <circle class="v-hit" cx="${x}" cy="${y}" r="${Math.max(26, r * 3)}"></circle>
    </g>`;
  }
  svg.innerHTML = html;
  host.appendChild(svg);
  const tip = document.createElement('div');
  tip.className = 'tour-tip'; tip.hidden = true; tip.setAttribute('role', 'status');
  host.appendChild(tip);

  /* Tailles constantes à l'écran, quelle que soit la largeur de la carte. */
  function fit() {
    const cw = svg.clientWidth || host.clientWidth || 800;
    const u = vw / cw;
    svg.querySelectorAll('g.venue').forEach((g) => {
      const info = venues[g.dataset.venue];
      const isUp = info.up.length > 0;
      const r = (isUp ? 6.5 : 2.6 + Math.min(4, info.past.length * 0.45)) * u;
      g.querySelector(isUp ? '.v-up' : '.v-past').setAttribute('r', r.toFixed(1));
      const halo = g.querySelector('.v-halo'); if (halo) halo.setAttribute('r', (r * 1.7).toFixed(1));
      g.querySelector('.v-hit').setAttribute('r', (20 * u).toFixed(1));
      const t = g.querySelector('.v-lbl');
      if (t) {
        const lab = LABEL[g.dataset.venue];
        const [x, y] = project(VENUES[g.dataset.venue].lon, VENUES[g.dataset.venue].lat);
        t.setAttribute('x', (x + Math.sign(lab[0]) * 12 * u).toFixed(1));
        t.setAttribute('y', (y + (lab[1] / 16) * 10 * u + 4 * u).toFixed(1));
        t.style.fontSize = `${(cw < 520 ? 11.5 : 13.5) * u}px`;
      }
    });
    svg.querySelectorAll('.dept-lbl').forEach((t) => { t.style.fontSize = `${(cw < 520 ? 13 : 17) * u}px`; });
  }
  fit();
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(host);

  const depts = new Set(withUp.map((k) => VENUES[k].dept));
  svg.querySelectorAll('.dept').forEach((p) => p.classList.toggle('is-on', depts.has(p.dataset.dept)));

  function show(g) {
    const key = g.dataset.venue; const v = VENUES[key]; const info = venues[key];
    const hr = host.getBoundingClientRect(); const cr = g.querySelector('.v-hit').getBoundingClientRect();
    tip.style.left = `${cr.left + cr.width / 2 - hr.left}px`;
    tip.style.top = `${cr.top + cr.height / 2 - hr.top}px`;
    const lines = info.up.slice(0, 3).map((e) => `${dayNum(e)} ${monthShort(e)} ${year(e)}${status(e) === 'closed' ? ' (inscriptions closes)' : ''}`);
    tip.innerHTML = `<b>${v.name}</b>${v.city}${lines.length ? '<br>' + lines.join('<br>') : ''}${info.past.length ? `<br><span style="opacity:.6">${info.past.length} date${info.past.length > 1 ? 's' : ''} passée${info.past.length > 1 ? 's' : ''}</span>` : ''}`;
    tip.hidden = false;
  }
  svg.querySelectorAll('g.venue').forEach((g) => {
    g.addEventListener('pointerenter', () => show(g));
    g.addEventListener('pointerleave', () => { tip.hidden = true; });
    g.addEventListener('focus', () => show(g));
    g.addEventListener('blur', () => { tip.hidden = true; });
    const go = () => {
      const info = venues[g.dataset.venue];
      if (!info.up.length) return;
      if (opts.onVenue) opts.onVenue(g.dataset.venue, info.up[0]);
      else location.href = dateURL(info.up[0]);
    };
    g.addEventListener('click', go);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    if (venues[g.dataset.venue].up.length) g.setAttribute('data-cursor', 'label:Voir');
  });

  if (!BP.calm) {
    const gsap = window.gsap;
    const paths = svg.querySelectorAll('.dept, .route');
    paths.forEach((p) => { const L = p.getTotalLength(); p.style.strokeDasharray = p.classList.contains('route') ? '' : `${L} ${L}`; p.__L = L; if (!p.classList.contains('route')) p.style.strokeDashoffset = L; });
    const route = svg.querySelector('.route');
    let routeMask = null;
    if (route) {
      routeMask = route.cloneNode(); routeMask.removeAttribute('class');
      const L = route.getTotalLength();
      const mask = document.createElementNS(NS, 'mask'); mask.id = 'route-mask-' + Math.random().toString(36).slice(2, 7);
      routeMask.setAttribute('stroke', '#fff'); routeMask.setAttribute('stroke-width', '8'); routeMask.setAttribute('fill', 'none');
      routeMask.style.strokeDasharray = `${L} ${L}`; routeMask.style.strokeDashoffset = L;
      mask.appendChild(routeMask); svg.prepend(mask);
      route.setAttribute('mask', `url(#${mask.id})`);
      routeMask.__L = L;
    }
    gsap.set(svg.querySelectorAll('g.venue'), { opacity: 0 });
    const tl = gsap.timeline({ scrollTrigger: { trigger: host, start: 'top 75%', end: 'center 45%', scrub: 0.8 } });
    tl.to(svg.querySelectorAll('.dept'), { strokeDashoffset: 0, duration: 1, stagger: 0.12, ease: 'none' }, 0);
    tl.to(svg.querySelectorAll('g.venue.is-past'), { opacity: 1, duration: 0.2, stagger: 0.02 }, 0.5);
    tl.to(svg.querySelectorAll('g.venue.is-up'), { opacity: 1, duration: 0.2, stagger: 0.05 }, 0.7);
    if (routeMask) tl.to(routeMask, { strokeDashoffset: 0, duration: 0.8, ease: 'none' }, 0.8);
  }
  return { svg, venues };
}
