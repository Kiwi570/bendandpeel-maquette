/* Point d'entrée : met en place le socle commun puis la page courante. */
import { BP, restoreScroll } from './core/env.js';
import { initScroll, initCursor, initTrail, initMagnetic, initTilt, initScrollBend } from './core/motion.js';
import { initPeelStages, initPeelCards, initPageTransition } from './core/peel.js';
import { hydrateAll, initLiquidHover } from './core/media.js';
import { initScores } from './core/score.js';
import { initMenu, initDock, initControls, initCopy, initReveals, initHeat, injectFilters, initBreath } from './core/ui.js';
import { tick } from './core/dates.js';

const PAGES = {
  home: () => import('./pages/home.js'),
  dates: () => import('./pages/dates.js'),
  date: () => import('./pages/date.js'),
  media: () => import('./pages/media.js'),
  sound: () => import('./pages/sound.js'),
  soutenir: () => import('./pages/soutenir.js'),
  accueillir: () => import('./pages/accueillir.js'),
  contact: () => import('./pages/contact.js')
};

const fontsReady = () => Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1500))]);

/* La page est prête : le contenu rempli par les scripts apparaît, la transition d'entrée peut se lever. */
function ready() {
  const r = document.documentElement;
  if (r.classList.contains('is-ready')) return;
  r.classList.add('is-ready');
  document.dispatchEvent(new Event('bp:ready'));
}

async function boot() {
  const gsap = window.gsap;
  if (!gsap || !window.ScrollTrigger) { document.documentElement.classList.add('calm', 'no-motion', 'gl-off'); ready(); return; }
  injectFilters();
  initScroll();
  initPageTransition();
  initMenu();
  initDock();
  initControls();
  initCopy();
  await fontsReady();
  const loader = PAGES[BP.page];
  if (loader) {
    try { const mod = await loader(); if (mod.default) await mod.default(); }
    catch (e) { console.error('Page', BP.page, e); }
  }
  document.querySelectorAll('[data-cd]').forEach(tick);
  ready();
  hydrateAll();
  initScores();
  initPeelStages();
  initPeelCards();
  initReveals();
  initHeat();
  initBreath();
  initCursor();
  initTrail();
  initMagnetic();
  initTilt();
  initScrollBend();
  initLiquidHover();
  window.ScrollTrigger.sort();
  window.ScrollTrigger.refresh();
  restoreScroll();
  window.addEventListener('load', () => window.ScrollTrigger.refresh());
}

boot();
