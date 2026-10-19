/* Page Dates : carte de la tournée, filtres, dates à venir triées automatiquement, archive par année. */
import { BP } from '../core/env.js';
import { upcoming, past, year } from '../core/dates.js';
import { dateCard, pastCard } from '../components/cards.js';
import { buildMap } from '../components/map.js';
import { buildFrise } from '../components/frise.js';
import { initPeelCards } from '../core/peel.js';
import { fillStats } from '../core/stats.js';

const gsap = window.gsap;

export default function () {
  fillStats();
  const grid = document.querySelector('[data-upcoming]');
  const cards = upcoming().map((e) => { const c = dateCard(e); grid.appendChild(c); return c; });
  if (!cards.length) grid.innerHTML = '<p class="body">Les prochaines dates seront annoncées ici.</p>';

  const filters = document.querySelectorAll('[data-filter]');
  function apply(code) {
    filters.forEach((b) => b.setAttribute('aria-pressed', b.dataset.filter === code ? 'true' : 'false'));
    const shown = cards.filter((c) => code === 'all' || c.dataset.dept === code);
    cards.forEach((c) => { c.hidden = !shown.includes(c); });
    if (!BP.calm) gsap.fromTo(shown, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.04, ease: 'power3.out' });
    window.ScrollTrigger.refresh();
  }
  filters.forEach((b) => b.addEventListener('click', () => apply(b.dataset.filter)));

  document.querySelectorAll('[data-map]').forEach((m) => buildMap(m, {
    onVenue(key, ev) {
      apply('all');
      const card = document.getElementById('d-' + ev.id);
      if (!card) return;
      if (BP.lenis) BP.lenis.scrollTo(card, { offset: -120, duration: 1.4 }); else card.scrollIntoView({ behavior: BP.calm ? 'auto' : 'smooth', block: 'center' });
      card.focus({ preventScroll: true });
    }
  }));
  document.querySelectorAll('[data-frise]').forEach(buildFrise);

  /* Archive : regroupée par année, de la plus récente à la plus ancienne. */
  const arch = document.querySelector('[data-archive]');
  const byYear = new Map();
  past().forEach((e) => { const y = year(e); if (!byYear.has(y)) byYear.set(y, []); byYear.get(y).push(e); });
  byYear.forEach((list, y) => {
    const block = document.createElement('div');
    block.className = 'archive-year';
    block.innerHTML = `<h3>${y}<br><span class="small" style="font-style:normal">${list.length} date${list.length > 1 ? 's' : ''}</span></h3><div class="archive-list"></div>`;
    const l = block.querySelector('.archive-list');
    list.forEach((e) => l.appendChild(pastCard(e)));
    arch.appendChild(block);
  });
  initPeelCards();
}
