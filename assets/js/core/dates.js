/* Tri automatique des dates, statuts et comptes à rebours, à l'heure de Paris. */
import { EVENTS, VENUES, SHOW } from '../data/dates.js';
export { EVENTS, VENUES, SHOW };

const params = new URLSearchParams(location.search);
const forcedNow = params.get('now') ? new Date(params.get('now')) : null;
let offset = 0;
if (forcedNow && !isNaN(forcedNow)) offset = forcedNow.getTime() - Date.now();
export const now = () => new Date(Date.now() + offset);

const TZ = 'Europe/Paris';
const fmt = (o) => new Intl.DateTimeFormat('fr-FR', Object.assign({ timeZone: TZ }, o));
const fDayShort = fmt({ weekday: 'short', day: 'numeric', month: 'short' });
const fDayLong = fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fDayMonth = fmt({ day: 'numeric', month: 'long' });
const fMonthShort = fmt({ month: 'short' });
const fYear = fmt({ year: 'numeric' });
const fWeekday = fmt({ weekday: 'long' });
const fTime = fmt({ hour: 'numeric', minute: '2-digit' });

/* L'heure du début de soirée, utilisée pour les dates passées sans horaires. */
const at = (iso) => new Date(iso);
export const eventStart = (e) => at(e.start);
export const eventEnd = (e) => at(e.end);

export function status(e, t = now()) {
  if (t >= eventEnd(e)) return 'past';
  if (t >= eventStart(e)) return 'live';
  if (e.close && t >= at(e.close)) return 'closed';
  return 'open';
}
export const STATUS_LABEL = {
  open: 'Inscriptions ouvertes',
  closed: 'Inscriptions closes',
  live: 'En ce moment',
  past: 'Date passée'
};

export function upcoming(t = now()) {
  return EVENTS.filter((e) => eventEnd(e) > t).sort((a, b) => eventStart(a) - eventStart(b));
}
export function past(t = now()) {
  return EVENTS.filter((e) => eventEnd(e) <= t).sort((a, b) => eventStart(b) - eventStart(a));
}
export function nextOpen(t = now()) {
  return upcoming(t).find((e) => status(e, t) === 'open') || upcoming(t)[0] || null;
}
export const byId = (id) => EVENTS.find((e) => e.id === id) || null;
export const venueOf = (e) => VENUES[e.venue] || { name: e.venue, city: '' };

export function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
export function dayShort(e) { return fDayShort.format(eventStart(e)); }
export function dayLong(e) { return cap(fDayLong.format(eventStart(e))); }
export function dayNum(e) { return String(parseInt(e.date.slice(8, 10), 10)); }
export function monthShort(e) { return fMonthShort.format(eventStart(e)).replace('.', ''); }
export function year(e) { return fYear.format(eventStart(e)); }
export function closeLabel(e) {
  if (!e.close) return '';
  const d = at(e.close);
  return `${fWeekday.format(d)} ${fDayMonth.format(d)} à ${fTime.format(d).replace(':', ' h ').replace(' h 00', ' h')}`;
}
export function closeShort(e) {
  if (!e.close) return '';
  return fmt({ day: 'numeric', month: 'short' }).format(at(e.close)).replace('.', '');
}
export function hourLabel(iso) { return fTime.format(at(iso)).replace(':', ' h ').replace(' h 00', ' h'); }

export function countdown(target, t = now()) {
  const ms = Math.max(0, at(target) - t);
  const s = Math.floor(ms / 1000);
  return { ms, d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
export function countdownText(target, t = now()) {
  const c = countdown(target, t);
  if (c.ms <= 0) return 'clos';
  if (c.d >= 2) return `J-${c.d}`;
  if (c.d === 1) return `1 j ${c.h} h`;
  if (c.h >= 1) return `${c.h} h ${String(c.m).padStart(2, '0')} min`;
  return `${c.m} min ${String(c.s).padStart(2, '0')} s`;
}
export const pad2 = (n) => String(n).padStart(2, '0');

export function dateURL(e) { return `date.html?d=${encodeURIComponent(e.id)}`; }

/* Tout élément [data-cd="ISO"] affiche le temps restant, mis à jour chaque seconde. */
const ticking = new Set();
let timer = null;
export function tick(el) {
  ticking.add(el);
  render(el);
  if (!timer) timer = setInterval(() => ticking.forEach(render), 1000);
}
function render(el) {
  if (!el.isConnected) { ticking.delete(el); return; }
  const iso = el.dataset.cd;
  const mode = el.dataset.cdMode || 'text';
  if (mode === 'grid') {
    const c = countdown(iso);
    const set = (k, v) => { const n = el.querySelector(`[data-k="${k}"]`); if (n && n.textContent !== v) n.textContent = v; };
    set('d', String(c.d)); set('h', pad2(c.h)); set('m', pad2(c.m)); set('s', pad2(c.s));
    if (c.ms <= 0 && !el.__done) { el.__done = true; el.dispatchEvent(new CustomEvent('cd:done', { bubbles: true })); }
  } else {
    const v = countdownText(iso);
    if (el.textContent !== v) el.textContent = v;
  }
}
