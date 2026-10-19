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

async function boot() {
  const gsap = window.gsap;
  if (!gsap || !window.ScrollTrigger) { document.documentElement.classList.add('calm', 'no-motion'); return; }
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
  document.querySelectorAll('[data-cd]').forEach(tick);
  window.ScrollTrigger.sort();
  window.ScrollTrigger.refresh();
  restoreScroll();
  document.documentElement.classList.add('is-ready');
  window.addEventListener('load', () => window.ScrollTrigger.refresh());
}

boot();
