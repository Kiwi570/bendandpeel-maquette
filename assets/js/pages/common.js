/* Briques partagées par les pages secondaires. */
import { BP, onVisible } from '../core/env.js';
import { createMembrane } from '../gl/membrane.js';
import { past } from '../core/dates.js';
import { pastCard } from '../components/cards.js';

const gsap = window.gsap;

/* Membrane WebGL en fond d'en-tête (Sound, Contact) ; version CSS si WebGL indisponible. */
export function membranes() {
  document.querySelectorAll('[data-membrane]').forEach((host) => {
    const fb = document.createElement('div');
    fb.className = 'hero__fallback';
    host.appendChild(fb);
    if (!BP.gl) return;
    try {
      const calmish = host.hasAttribute('data-calm-membrane');
      const m = createMembrane(host, {
        className: 'hero__gl', reveal: 1, heat: calmish ? 0.15 : 0.7,
        palette: calmish ? ['#120a14', '#c58aa8', '#6b3a6e', '#e8399b', '#6a4dff'] : ['#06051a', '#7ce7f2', '#6a4dff', '#e8399b', '#ff5a1f']
      });
      onVisible(host, (v) => m.setVisible(v), { margin: '0px' });
      host.addEventListener('gl:fallback', () => fb.style.opacity = '1');
      fb.style.opacity = '0';
    } catch (e) { /* le fond CSS reste en place */ }
  });
}

/* Formulaires de démonstration : vérification simple, rien n'est envoyé. */
export function simForms() {
  document.querySelectorAll('form[data-sim-form]').forEach((form) => {
    const done = form.querySelector('[data-done]');
    const sujet = new URLSearchParams(location.search).get('sujet');
    if (sujet && form.sujet) form.sujet.value = sujet;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const bad = [...form.querySelectorAll('[required]')].find((i) => !i.value.trim() || (i.type === 'email' && !/^\S+@\S+\.\S+$/.test(i.value)));
      if (bad) {
        bad.setCustomValidity(bad.type === 'email' ? 'Indique une adresse électronique valide.' : 'Ce champ est nécessaire.');
        bad.reportValidity(); bad.setCustomValidity(''); bad.focus();
        return;
      }
      done.hidden = false;
      done.innerHTML = '<b>Démonstration : ce message n’a pas été envoyé.</b><br>Pour écrire vraiment à Bend&amp;Peel : contact@bendandpeel.fr';
      done.focus();
    });
  });
}

/* Barres qui dansent avec le son (page Sound). */
export function bars() {
  const sets = [...document.querySelectorAll('[data-bars]')];
  sets.forEach((b) => { b.innerHTML = Array.from({ length: 48 }, () => '<i></i>').join(''); });
  if (!sets.length || BP.calm) {
    sets.forEach((b, j) => [...b.children].forEach((i, k) => { i.style.height = `${18 + 60 * Math.abs(Math.sin(k * 0.37 + j))}%`; }));
    return;
  }
  gsap.ticker.add((t) => {
    const A = BP.audio;
    sets.forEach((b, j) => {
      const kids = b.children;
      for (let k = 0; k < kids.length; k++) {
        const base = 0.18 + 0.5 * Math.abs(Math.sin(k * 0.37 + j * 1.3 + t * (A.on ? 2.4 : 0.6)));
        const lvl = A.on ? base * (0.5 + A.bass * 0.9 + A.mid * 0.4 * Math.sin(k + t * 3)) : base * 0.6;
        kids[k].style.height = `${Math.min(100, Math.max(6, lvl * 100)).toFixed(1)}%`;
      }
    });
  });
}

/* Mur des visuels passés (Accueillir). */
export function pastWall() {
  const wall = document.querySelector('[data-pastwall]');
  if (!wall) return;
  past().slice(0, 12).forEach((e) => wall.appendChild(pastCard(e)));
}
