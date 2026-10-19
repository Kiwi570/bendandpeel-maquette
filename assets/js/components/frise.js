/* Frise de la soirée, de 19 h à 0 h 30 : fenêtre d'arrivée, deux temps, rituel de clôture vers minuit. */
import { BP } from '../core/env.js';

const SPAN = 330; /* minutes entre 19 h et 0 h 30 */
const pct = (min) => ((min / SPAN) * 100).toFixed(2);

export function buildFrise(host) {
  const hours = [['19 h', 0], ['20 h', 60], ['21 h', 120], ['22 h', 180], ['23 h', 240], ['0 h', 300], ['0 h 30', 330]];
  host.innerHTML = `
    <div class="frise__track" role="img" aria-label="Déroulé d'une soirée : arrivée uniquement entre 19 h et 20 h ; de 19 h à 20 h 30, le théâtre des salutations ; de 20 h 30 à 0 h 30, Partition pour corps sensibles, en trois actes ; vers minuit, le rituel de clôture.">
      <div class="frise__axis"></div><div class="frise__fill"></div>
      ${hours.map(([l, m]) => `<span class="frise__hour" style="--at:${pct(m)}">${l}</span>`).join('')}
      <div class="frise__arrive" style="--a:0;--b:${pct(60)}"><span>Arrivée 19 h – 20 h</span></div>
      <div class="frise__seg" style="--a:0;--b:${pct(90)}"><b>Le théâtre des salutations</b><small>19 h – 20 h 30</small></div>
      <div class="frise__seg" style="--a:${pct(90)};--b:100"><b>Partition pour corps sensibles</b><small>20 h 30 – 0 h 30</small>
        <div class="frise__acts"><span>Acte 1 · Les contraintes de jeu</span><span>Acte 2 · Mise en mouvement collective</span><span>Acte 3 · Composition collective</span></div></div>
      <div class="frise__mark" style="--at:${pct(300)}"><span>Vers minuit<br>rituel de clôture</span></div>
    </div>`;
  if (BP.calm) return host;
  const gsap = window.gsap;
  const fill = host.querySelector('.frise__fill');
  const parts = host.querySelectorAll('.frise__hour, .frise__arrive, .frise__seg, .frise__mark');
  gsap.set(host, { '--p': 0 });
  gsap.set(parts, { opacity: 0, y: 14 });
  const tl = gsap.timeline({ scrollTrigger: { trigger: host, start: 'top 80%', end: 'bottom 45%', scrub: 0.8 } });
  tl.to(host, { '--p': 1, ease: 'none', duration: 1 }, 0);
  parts.forEach((p, i) => tl.to(p, { opacity: 1, y: 0, duration: 0.18, ease: 'power2.out' }, 0.04 + (i / parts.length) * 0.8));
  return host;
}
