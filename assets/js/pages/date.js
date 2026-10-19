/* Page d'une date : tout vient du fichier des dates (?d=identifiant). */
import { BP } from '../core/env.js';
import { byId, nextOpen, upcoming, status, STATUS_LABEL, venueOf, dayLong, closeLabel, tick, eventStart, SHOW } from '../core/dates.js';
import { dateSpec } from '../core/paint.js';
import { hydrate } from '../core/media.js';
import { buildFrise } from '../components/frise.js';
import { buildBooking } from '../components/booking.js';
import { buildMap } from '../components/map.js';
import { dateCard } from '../components/cards.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export default function () {
  const id = new URLSearchParams(location.search).get('d');
  const ev = (id && byId(id)) || nextOpen();
  if (!ev) return;
  const v = venueOf(ev);
  const st = status(ev);
  const isPast = st === 'past';
  const f = (k) => document.querySelector(`[data-f="${k}"]`);
  document.title = `${dayLong(ev)} · ${v.name} · Bend&Peel`;

  f('eyebrow').textContent = ev.title ? `Bend&Peel · ${ev.title}` : (ev.season ? `Saison ${ev.season}` : 'Bend&Peel');
  f('title').textContent = dayLong(ev);
  f('venue').innerHTML = `${esc(v.name)}${v.city && v.city !== v.name ? ', ' + esc(v.city) : ''}`;
  f('tags').innerHTML = `
    <span class="tag tag--${st === 'open' ? 'ember' : st === 'live' ? 'live' : 'past'}"><span class="status status--${st}">${STATUS_LABEL[st]}</span></span>
    ${isPast ? '' : '<span class="tag num">19 h → 0 h 30</span><span class="tag">Arrivée 19 h – 20 h</span>'}
    ${ev.jauge ? `<span class="tag num">Jauge ${ev.jauge}</span>` : ''}`;

  if (st === 'open') {
    f('countdown').innerHTML = `<p class="small" style="margin-bottom:10px">Clôture des inscriptions : ${esc(closeLabel(ev))}</p>
      <div class="countdown num" data-cd="${ev.close}" data-cd-mode="grid" aria-label="Temps restant avant la clôture des inscriptions">
        <div><b data-k="d">0</b><span>jours</span></div><div><b data-k="h">00</b><span>heures</span></div><div><b data-k="m">00</b><span>min</span></div><div><b data-k="s">00</b><span>s</span></div></div>`;
    tick(f('countdown').querySelector('[data-cd]'));
    f('countdown').querySelector('[data-cd]').addEventListener('cd:done', () => location.reload());
  } else if (st === 'closed') {
    f('countdown').innerHTML = `<p class="notice">Inscriptions closes depuis le ${esc(closeLabel(ev))}. Il n’y a pas de vente sur place.</p>`;
  } else if (isPast) {
    f('countdown').innerHTML = `<p class="notice">Cette date est passée. <a class="lnk lnk--on" href="dates.html">Voir les prochaines dates</a></p>`;
  }

  /* Visuel de la date : celui du site pour une date passée, un visuel propre à la date sinon. */
  const vis = document.querySelector('[data-date-visual]');
  if (ev.img) { vis.dataset.file = ev.img; vis.dataset.alt = `Visuel de la soirée du ${ev.date.split('-').reverse().join('/')}`; }
  else { vis.__dateSpec = dateSpec(ev); vis.dataset.grok = 'bp-date-' + ev.id; vis.dataset.alt = 'Visuel propre à cette date'; }
  hydrate(vis);
  const venueVis = document.querySelector('[data-venue-visual]');
  if (venueVis) {
    venueVis.__dateSpec = Object.assign({}, dateSpec(ev), { seed: ev.venue + '-lieu' });
    if (!ev.img) { venueVis.dataset.grok = 'bp-lieu-' + ev.venue; venueVis.dataset.tag = `Visuel d’ambiance provisoire · Grok : bp-lieu-${ev.venue}`; }
    venueVis.dataset.alt = `Visuel d’ambiance pour ${v.name}`;
    hydrate(venueVis);
  }

  f('keytitle').textContent = isPast ? 'Ce soir-là' : 'Ce qu’il faut savoir';
  f('tagnote').innerHTML = `<p class="body">${isPast ? 'Une date passée de Bend&amp;Peel, telle qu’elle figure sur le site actuel.' : 'Arrivée uniquement entre 19 h et 20 h : la soirée commence ensemble, par le théâtre des salutations.'}</p>`;
  const facts = [
    ['Date', dayLong(ev)],
    isPast ? null : ['Horaires', '19 h → 0 h 30'],
    isPast ? null : ['Arrivée', '19 h – 20 h uniquement'],
    ev.jauge ? ['Jauge', `${ev.jauge} personnes`] : null,
    ev.close ? ['Clôture des inscriptions', closeLabel(ev)] : null,
    ['Lieu', `${v.name}${v.city && v.city !== v.name ? ', ' + v.city : ''}`]
  ].filter(Boolean);
  f('facts').innerHTML = facts.map(([k, val]) => `<div class="fact"><span>${esc(k)}</span><b>${esc(val)}</b></div>`).join('') +
    (ev.places ? `<div class="fact"><span>Répartition des places</span><b class="num">${ev.places.normalSoutien} + ${ev.places.reduit}</b><div class="gauge" aria-hidden="true"><i style="width:${(ev.places.normalSoutien / (ev.places.normalSoutien + ev.places.reduit)) * 100}%"></i><i style="flex:1"></i></div><p class="small" style="margin-top:8px">${ev.places.normalSoutien} places normal ou soutien, ${ev.places.reduit} places à tarif réduit. Places restantes : à fournir par la billetterie.</p></div>` : '');
  if (isPast) document.querySelectorAll('[data-frise]').forEach((n) => n.remove());
  else document.querySelectorAll('[data-frise]').forEach(buildFrise);

  const book = document.querySelector('[data-booking]');
  if (isPast) {
    book.innerHTML = `<div class="book"><h3 style="font-size:var(--fs-l)">Cette date est passée</h3><p class="body">Les inscriptions sont fermées. La page de cette date reste consultable sur la billetterie actuelle.</p><div class="row"><a class="btn" href="dates.html">Prochaines dates <span class="arr">→</span></a><a class="btn btn--ghost ext" href="${ev.ticket}" target="_blank" rel="noopener">Page de la date sur le site actuel</a></div></div>`;
  } else buildBooking(book, ev);

  f('venuename').textContent = v.name;
  f('address').innerHTML = v.address ? `${esc(v.address)}` : `${esc(v.city)}`;
  document.querySelectorAll('[data-map]').forEach((m) => {
    const res = buildMap(m, { onVenue: (key, e) => { location.href = `date.html?d=${encodeURIComponent(e.id)}`; } });
    res.svg.querySelectorAll('g.venue').forEach((g) => { if (g.dataset.venue !== ev.venue) g.style.opacity = '0.35'; });
  });

  const prat = f('practical');
  const items = [
    'Réservation en ligne uniquement, pas de vente sur place.',
    ev.covoit ? `Covoiturage, hébergement, revente de billets : <a class="lnk lnk--on ext" href="${ev.covoit}" target="_blank" rel="noopener">tableau partagé de cette date</a>.` : 'Un tableau partagé par date sert au covoiturage, à l’hébergement et à la revente de billets.',
    'Billets non remboursables, mais transmissibles : écris à contact@bendandpeel.fr pour changer le nom.',
    'Ados bienvenu·es dès 16 ans, avec réservation préalable par mail.',
    `Adhésion annuelle à l’association : dès ${SHOW.membership.min} €.`,
    `<a class="lnk lnk--on ext" href="${ev.ticket}" target="_blank" rel="noopener">Page de cette date sur la billetterie actuelle</a>`
  ];
  prat.innerHTML = items.map((t) => `<li><span>${t}</span></li>`).join('');

  const others = document.querySelector('[data-others]');
  upcoming().filter((e) => e.id !== ev.id).slice(0, 3).forEach((e) => others.appendChild(dateCard(e)));
}
