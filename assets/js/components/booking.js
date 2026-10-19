/* Réservation simulée : rien n'est réservé, le lien vers la billetterie actuelle reste visible. */
import { SHOW, status, closeLabel, venueOf, dayLong, now, eventStart } from '../core/dates.js';

const eur = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

export function buildBooking(host, ev) {
  const st = status(ev);
  const v = venueOf(ev);
  const P = SHOW.prices;
  const disabled = st !== 'open';
  /* Le site actuel indique des places à tarif réduit « disponibles jusqu’à une semaine avant l’événement ». */
  const reduitOpen = !disabled && (eventStart(ev) - now()) > 7 * 864e5;
  host.innerHTML = `
  <form class="book" novalidate>
    <div class="row" style="justify-content:space-between">
      <h3 style="font-size:var(--fs-l)">Réserver</h3>
      <span class="todo" style="color:var(--irid)">Simulation</span>
    </div>
    ${disabled ? `<p class="notice">${st === 'past' ? 'Cette date est passée.' : st === 'live' ? 'La soirée a commencé : il n’y a pas de vente sur place.' : `Les inscriptions sont closes depuis le ${closeLabel(ev)}.`}</p>` : ''}
    <fieldset ${disabled ? 'disabled' : ''}>
      <legend>Choisis ton tarif</legend>
      <label class="opt" for="t-reduit"><input type="radio" id="t-reduit" name="tarif" value="reduit" ${reduitOpen ? '' : 'disabled'}><span><b>Réduit solidaire</b><small>${reduitOpen ? `À partir de ${P.reduit.min} €, sans justificatif${ev.places ? ' · ' + ev.places.reduit + ' places' : ''} · jusqu’à une semaine avant la date` : 'Les places à tarif réduit sont disponibles jusqu’à une semaine avant la date.'}</small></span><span class="p">dès ${P.reduit.min} €</span></label>
      <label class="opt" for="t-normal"><input type="radio" id="t-normal" name="tarif" value="normal" checked><span><b>Normal</b><small>+ ${eur(P.normal.fee)} de frais de billetterie</small></span><span class="p">${P.normal.amount} €</span></label>
      <label class="opt" for="t-soutien"><input type="radio" id="t-soutien" name="tarif" value="soutien"><span><b>Soutien</b><small>+ ${eur(P.soutien.fee)} de frais · aide à garder des places réduites</small></span><span class="p">${P.soutien.amount} €</span></label>
      <div class="field" data-free hidden>
        <label for="t-free">Ton prix (${P.reduit.min} € minimum)</label>
        <input id="t-free" type="number" inputmode="decimal" min="${P.reduit.min}" step="1" value="${P.reduit.min}">
      </div>
    </fieldset>
    <fieldset ${disabled ? 'disabled' : ''}>
      <legend>Nombre de places</legend>
      <div class="row">
        <div class="stepper"><button type="button" data-step="-1" aria-label="Une place de moins">−</button><output id="qty" aria-live="polite">1</output><button type="button" data-step="1" aria-label="Une place de plus">+</button></div>
        <span class="small">Réservation en ligne uniquement, pas de vente sur place.</span>
      </div>
    </fieldset>
    <div class="total"><span>Total estimé</span><b class="num" data-total></b></div>
    <p class="small" data-fee-note></p>
    <div class="row">
      <button class="btn" type="submit" ${disabled ? 'disabled' : ''} data-cursor="book:Simuler">Simuler la réservation <span class="arr">→</span></button>
      <a class="btn btn--ghost ext" href="${ev.ticket}" target="_blank" rel="noopener">Billetterie actuelle</a>
    </div>
    <p class="small">Une adhésion annuelle à l’association est aussi demandée, à partir de ${SHOW.membership.min} € (entre ${SHOW.membership.suggested[0]} et ${SHOW.membership.suggested[1]} € suggérés).</p>
    <div class="notice notice--ok" data-done hidden tabindex="-1"></div>
  </form>`;
  const form = host.querySelector('form');
  const free = form.querySelector('[data-free]');
  const freeIn = form.querySelector('#t-free');
  const qtyEl = form.querySelector('#qty');
  const totalEl = form.querySelector('[data-total]');
  const feeNote = form.querySelector('[data-fee-note]');
  const done = form.querySelector('[data-done]');
  let qty = 1;
  function update() {
    const t = form.tarif.value;
    free.hidden = t !== 'reduit';
    let unit, fee = 0;
    if (t === 'reduit') {
      unit = Math.max(P.reduit.min, parseFloat(freeIn.value) || P.reduit.min);
      feeNote.textContent = 'Tarif réduit : les frais de billetterie s’ajoutent, leur montant n’est pas indiqué sur le site actuel.';
    } else {
      unit = P[t].amount; fee = P[t].fee;
      feeNote.textContent = `Dont ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(fee * qty)} de frais de billetterie.`;
    }
    totalEl.textContent = eur((unit + fee) * qty) + (t === 'reduit' ? ' + frais' : '');
    qtyEl.textContent = String(qty);
  }
  form.addEventListener('change', update);
  freeIn.addEventListener('input', update);
  form.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => { qty = Math.min(10, Math.max(1, qty + parseInt(b.dataset.step, 10))); update(); }));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (disabled) return;
    if (form.tarif.value === 'reduit' && (parseFloat(freeIn.value) || 0) < P.reduit.min) {
      freeIn.focus(); freeIn.setCustomValidity(`Le tarif réduit commence à ${P.reduit.min} €.`); freeIn.reportValidity(); freeIn.setCustomValidity(''); return;
    }
    done.hidden = false;
    done.innerHTML = `<b>Simulation terminée : aucune place n’a été réservée.</b><br>Dans la vraie version, tu recevrais ta confirmation pour le ${dayLong(ev).toLowerCase()} à ${v.name}. Pour réserver aujourd’hui, passe par la <a class="lnk lnk--on" href="${ev.ticket}" target="_blank" rel="noopener">billetterie actuelle</a>.`;
    done.focus();
  });
  update();
  return form;
}
