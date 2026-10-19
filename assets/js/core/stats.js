/* Chiffres calculés depuis le fichier des dates : ils restent justes quand une date passe. */
import { upcoming, past, VENUES } from './dates.js';

export function fillStats() {
  const up = upcoming();
  const pa = past();
  const stats = {
    up: up.length,
    venues: new Set(up.map((e) => e.venue)).size,
    depts: new Set(up.map((e) => VENUES[e.venue].dept)).size,
    past: pa.length,
    all: up.length + pa.length
  };
  document.querySelectorAll('[data-stat]').forEach((el) => { el.textContent = String(stats[el.dataset.stat] ?? el.textContent); });
  return stats;
}
