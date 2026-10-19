/* Cartes de dates (à venir et passées), liste compacte du tiroir. */
import { status, STATUS_LABEL, venueOf, dayNum, monthShort, year, dateURL, closeLabel, tick, dayLong } from '../core/dates.js';
import { dateFigure, hydrate } from '../core/media.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function dateCard(ev) {
  const v = venueOf(ev);
  const st = status(ev);
  const a = document.createElement('a');
  a.className = 'pcard dcard';
  a.href = dateURL(ev);
  a.dataset.cursor = st === 'open' ? 'book:Réserver' : 'label:Voir';
  a.dataset.label = `${dayNum(ev)} ${monthShort(ev)} · ${v.name}`;
  a.dataset.dept = v.dept;
  a.dataset.venue = ev.venue;
  a.id = 'd-' + ev.id;
  a.innerHTML = `
    <div class="pcard__under" aria-hidden="true">${st === 'open' ? 'Réserver →' : 'Voir la date →'}</div>
    <div class="pcard__front">
      <div class="dcard__body">
        <div class="dcard__date"><small>${esc(dayLong(ev).split(' ')[0])}</small>${dayNum(ev)} ${esc(monthShort(ev))} <span class="it">${year(ev)}</span></div>
        <div class="dcard__where">${esc(v.name)}<span>${esc(v.city)}${v.dept ? ' (' + v.dept + ')' : ''}</span></div>
        <div class="dcard__meta">
          <span class="status status--${st}">${STATUS_LABEL[st]}</span>
          ${st === 'open' ? `<span class="small">Clôture dans <b class="cd-inline num" data-cd="${ev.close}"></b></span>` : ''}
          ${ev.jauge ? `<span class="small">Jauge ${ev.jauge}</span>` : ''}
        </div>
      </div>
    </div>
    <div class="pcard__flapwrap" aria-hidden="true"><div class="pcard__flap"></div></div>`;
  const fig = dateFigure(ev);
  fig.dataset.liquid = '';
  a.querySelector('.pcard__front').prepend(fig);
  hydrate(fig);
  a.querySelectorAll('[data-cd]').forEach(tick);
  a.setAttribute('aria-label', `${dayLong(ev)}, ${v.name}, ${v.city}. ${STATUS_LABEL[st]}${st === 'open' ? ', clôture des inscriptions le ' + closeLabel(ev) : ''}.`);
  return a;
}

export function pastCard(ev) {
  const v = venueOf(ev);
  const a = document.createElement('a');
  a.className = 'past';
  a.href = dateURL(ev);
  a.dataset.cursor = 'label:Voir';
  a.dataset.label = `${dayNum(ev)} ${monthShort(ev)} ${year(ev)}`;
  const fig = dateFigure(ev);
  fig.dataset.notag = '';
  a.appendChild(fig);
  const t = document.createElement('div');
  t.innerHTML = `<b>${dayNum(ev)} ${esc(monthShort(ev))} ${year(ev)}${ev.title ? ' · <span class="it">' + esc(ev.title) + '</span>' : ''}</b><br><span>${esc(v.name)}${v.city && v.city !== v.name ? ', ' + esc(v.city) : ''}</span>`;
  a.appendChild(t);
  hydrate(fig);
  return a;
}

export function drawerItem(ev) {
  const v = venueOf(ev);
  const st = status(ev);
  const li = document.createElement('li');
  li.innerHTML = `<a href="${dateURL(ev)}" data-label="${esc(v.name)}">
    <span class="d-day">${dayNum(ev)}<small>${esc(monthShort(ev))}</small></span>
    <span class="d-where">${esc(v.name)}<small>${esc(v.city)} · ${ev.jauge ? 'jauge ' + ev.jauge : ''}</small></span>
    <span class="d-cd">${st === 'open' ? `clôture<br><b class="num" data-cd="${ev.close}"></b>` : `<span class="status status--${st}">${STATUS_LABEL[st]}</span>`}</span>
  </a>`;
  li.querySelectorAll('[data-cd]').forEach(tick);
  return li;
}
