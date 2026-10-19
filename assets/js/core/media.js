/* Images et vidéos : un seul inventaire. Chaque emplacement reçoit d'abord un visuel peint
   en code, puis la vraie image (WebP hébergé avec le site) se fond par-dessus.
   Les emplacements « grok » gardent leur visuel provisoire jusqu'à réception des images Grok :
   il suffira de déposer le fichier dans assets/img/grok/ et de passer ready à true. */
import { BP, onVisible } from './env.js';
import { paint, dateSpec } from './paint.js';
import { SIZES } from '../data/sizes.js';

const IMG = 'assets/img/';
const VID = 'assets/video/';

export const MEDIA = {
  /* Photos de la page Photo/Vidéo du site actuel */
  photo01: { img: 'photos/photo-01-foule-magenta', ph: { motif: 'beams', palette: 'magenta' }, alt: 'Foule qui danse sous une lumière magenta pendant une soirée Bend&Peel.' },
  photo02: { img: 'photos/photo-02-danseurs', ph: { motif: 'beams', palette: 'ember' }, alt: 'Participantes et participants qui dansent dans une lumière chaude.' },
  photo03: { img: 'photos/photo-03-silhouettes-ambre', ph: { motif: 'beams', palette: 'ember' }, alt: 'Silhouettes en contre-jour dans une brume ambrée.' },
  photo04: { img: 'photos/photo-04-foule-orange', ph: { motif: 'beams', palette: 'ember' }, alt: 'Bras levés dans la lumière orange des projecteurs.' },
  photo05: { img: 'photos/photo-05-foule-bleue', ph: { motif: 'beams', palette: 'uv' }, alt: 'Salle pleine de corps en mouvement sous une lumière bleue.' },
  photo06: { img: 'photos/photo-06-jambes-ambre', ph: { motif: 'beams', palette: 'ember' }, alt: 'Jambes en mouvement dans une lumière ambrée.' },
  photo07: { img: 'photos/photo-07-penombre', ph: { motif: 'beams', palette: 'dusk' }, alt: 'Participantes et participants dans la pénombre, éclairés de petites lumières.' },
  /* Vidéos du site actuel : boucle muette pour l'ambiance, vidéo complète pour la visionneuse */
  vidHome: { loop: 'loop-accueil', full: 'presentation', img: 'videos/loop-accueil-affiche', ph: { motif: 'beams', palette: 'uv' }, alt: 'Vidéo de présentation de Bend&Peel : la salle danse sous des lumières bleues.', label: 'Vidéo de présentation, sous-titrée en anglais' },
  vidBeams: { loop: 'loop-faisceaux', full: 'video-01', img: 'videos/video-01-affiche', ph: { motif: 'beams', palette: 'uv' }, alt: 'Silhouettes qui dansent sous des faisceaux bleus.' },
  vid01: { full: 'video-01', img: 'videos/video-01-affiche', ph: { motif: 'beams', palette: 'uv' }, alt: 'Vidéo : silhouettes qui dansent sous des faisceaux bleus.' },
  vid02: { full: 'video-02', img: 'videos/video-02-affiche', ph: { motif: 'beams', palette: 'ritual' }, alt: 'Vidéo : une personne joue du piano dans la lumière d’un projecteur, devant un public assis.' },
  vid03: { full: 'video-03', img: 'videos/video-03-affiche', ph: { motif: 'beams', palette: 'ember' }, alt: 'Vidéo : corps en mouvement dans une pénombre ambrée.' },
  vid04: { full: 'video-04', img: 'videos/video-04-affiche', ph: { motif: 'beams', palette: 'ember' }, alt: 'Vidéo : une danse en solo dans la lumière d’un projecteur, devant un public assis.' },
  vid05: { full: 'video-05', img: 'videos/video-05-affiche', ph: { motif: 'beams', palette: 'uv' }, alt: 'Vidéo : la salle danse sous une lumière violette.' },
  vid06: { full: 'video-06', img: 'videos/video-06-affiche', ph: { motif: 'beams', palette: 'ember' }, alt: 'Vidéo : danse dans la pénombre rouge.' },
  /* Logo et visuel de la saison */
  emblem: { img: 'logo/logo-embleme', ph: { motif: 'membrane', palette: 'ink' }, alt: 'Emblème de Bend&Peel : un crâne de cerf orné d’une boule à facettes et d’un masque.' },
  season: { img: 'dates/date-saison-2026-2027', ph: { motif: 'membrane', palette: 'uv' }, alt: 'Visuel de la saison 2026-2027 de Bend&Peel.' },

  /* Emplacements des images à créer avec Grok (visuels provisoires en attendant) */
  gSalutations: { grok: 'bp-salutations-accueil', ph: { motif: 'beams', palette: 'skin' }, alt: 'Accueil chaleureux en lumière dorée, silhouettes floues.' },
  gBuffet: { grok: 'bp-salutations-buffet', ph: { motif: 'fabric', palette: 'skin' }, alt: 'Matières chaudes et lumière de fin de journée.' },
  gExpo: { grok: 'bp-salutations-expo', ph: { motif: 'membrane', palette: 'skin' }, alt: 'Murs et cadres vides éclairés, prêts à recevoir les œuvres exposées.' },
  gPartition: { grok: 'bp-partition-nuit', ph: { motif: 'beams', palette: 'magenta' }, alt: 'Brume colorée traversée de faisceaux, corps en flou de bougé.' },
  gRituel: { grok: 'bp-rituel-cloture', ph: { motif: 'membrane', palette: 'ritual' }, alt: 'Lumière qui redescend doucement, cercle de silhouettes au repos.' },
  gTissu: { grok: 'bp-texture-tissu', ph: { motif: 'fabric', palette: 'magenta' }, alt: 'Tissu qui ondule dans la lumière.' },
  gPeau: { grok: 'bp-texture-peau', ph: { motif: 'membrane', palette: 'dusk' }, alt: 'Peau de lumière irisée.' },
  gLiquide: { grok: 'bp-texture-liquide', ph: { motif: 'liquid', palette: 'magenta' }, alt: 'Matière liquide aux reflets magenta et braise.' },
  gLiquide2: { grok: 'bp-texture-liquide-uv', ph: { motif: 'liquid', palette: 'uv' }, alt: 'Matière liquide aux reflets bleus.' },
  gBrume: { grok: 'bp-texture-brume', ph: { motif: 'beams', palette: 'uv', crowd: false }, alt: 'Brume bleue traversée de faisceaux.' },
  gSound: { grok: 'bp-sound-onde', ph: { motif: 'score', palette: 'uv' }, alt: 'Onde sonore devenue matière.' },
  gSound2: { grok: 'bp-sound-platines', ph: { motif: 'beams', palette: 'ember', crowd: false }, alt: 'Lumière chaude sur un poste de mixage, en flou.' },
  gSoutienMains: { grok: 'bp-soutenir-mains', ph: { motif: 'fabric', palette: 'ember' }, alt: 'Mains qui se rejoignent dans la lumière, sans visage.' },
  gMontage: { grok: 'bp-soutenir-montage', ph: { motif: 'beams', palette: 'dusk', crowd: false }, alt: 'Câbles, projecteurs et tissus pendant un montage.' },
  gOeuvres: { grok: 'bp-soutenir-oeuvres', ph: { motif: 'membrane', palette: 'ember' }, alt: 'Cadres vides éclairés sur un mur sombre.' },
  gSalle: { grok: 'bp-accueillir-salle', ph: { motif: 'beams', palette: 'ink', crowd: false }, alt: 'Salle vide prête à accueillir, brume et projecteurs.' },
  gTech: { grok: 'bp-accueillir-technique', ph: { motif: 'score', palette: 'ember' }, alt: 'Matériel technique en lumière rasante.' },
  gContact: { grok: 'bp-contact-brume', ph: { motif: 'beams', palette: 'ritual', crowd: false }, alt: 'Brume violette et faisceau doux.' },
  gContact2: { grok: 'bp-contact-lettre', ph: { motif: 'membrane', palette: 'magenta' }, alt: 'Membrane lumineuse, comme un message qui arrive.' }
};

/* Images Grok reçues : ajouter leur clé ici (ex. 'bp-salutations-accueil': true) une fois le fichier déposé. */
export const GROK_READY = {
  'bp-ouverture-16x9': true,
  'bp-ouverture-9x16': true,
  'bp-salutations-accueil': true,
  'bp-salutations-expo': true,
  'bp-partition-nuit': true,
  'bp-rituel-cloture': true,
  'bp-lieu-lampisterie': true,
  'bp-lieu-bled': true,
  'bp-lieu-exosquelette': true,
  'bp-lieu-bajart': true,
  'bp-lieu-dodecadome': true,
  'bp-lieu-nidrouge': true,
  'bp-lieu-colombia': true,
  'bp-soutenir-mains': true,
  'bp-soutenir-montage': true,
  'bp-accueillir-salle': true,
  'bp-texture-peau': true
};

function srcsetOf(file) {
  const s = SIZES[file];
  if (!s) return null;
  const list = s.s.map(([suffix, w]) => `${IMG}${file}-${suffix}.webp ${w}w`);
  const mid = s.s.find(([sf]) => sf === 960) || s.s[s.s.length - 1];
  return { src: `${IMG}${file}-${mid[0]}.webp`, srcset: list.join(', '), w: s.w, h: s.h };
}
export function imageURL(file, prefer = 960) {
  const s = SIZES[file];
  if (!s) return null;
  const pick = s.s.find(([sf]) => sf >= prefer) || s.s[s.s.length - 1];
  return `${IMG}${file}-${pick[0]}.webp`;
}
export const videoURL = (name) => `${VID}${name}.mp4`;

function sources(item) {
  if (item.grok) return GROK_READY[item.grok] ? { src: `${IMG}grok/${item.grok}.webp`, srcset: '' } : null;
  if (item.img) return srcsetOf(item.img);
  return null;
}

/* Prépare un emplacement <figure class="m" data-media="clé"> (ou data-file pour un visuel de date). */
export function hydrate(fig) {
  if (fig.__m) return;
  fig.__m = true;
  const key = fig.dataset.media;
  let item = MEDIA[key];
  if (fig.dataset.file) item = { img: fig.dataset.file, ph: { motif: 'membrane', palette: fig.dataset.palette || 'ink' }, alt: fig.dataset.alt || '' };
  if (fig.dataset.grok) item = { grok: fig.dataset.grok, ph: { motif: 'membrane', palette: 'ink' }, alt: fig.dataset.alt || '' };
  let spec = item ? Object.assign({ seed: key || fig.dataset.file || fig.dataset.grok }, item.ph) : { motif: 'membrane', palette: 'ink', seed: key };
  if (fig.__dateSpec) spec = fig.__dateSpec;
  const cv = document.createElement('canvas');
  cv.className = 'm__ph';
  cv.setAttribute('aria-hidden', 'true');
  fig.prepend(cv);
  fig.__spec = spec;
  const pending = !item || (item.grok ? !GROK_READY[item.grok] : false);
  if (pending && fig.dataset.notag === undefined && !fig.querySelector('.m__tag')) {
    const tag = document.createElement('span');
    tag.className = 'm__tag';
    tag.textContent = fig.dataset.tag || (fig.__dateSpec ? `Visuel provisoire de la date · Grok : ${fig.dataset.grok || 'à créer'}` : `Visuel provisoire · Grok : ${item ? item.grok : 'à créer'}`);
    fig.appendChild(tag);
  }
  if (pending) {
    fig.setAttribute('role', 'img');
    fig.setAttribute('aria-label', fig.dataset.alt || (item && item.alt) || 'Visuel provisoire');
  }
  let painted = false;
  const doPaint = () => { if (!painted) { painted = true; paint(cv, spec); fig.dispatchEvent(new CustomEvent('media:painted')); } };
  onVisible(fig, (vis) => {
    if (!vis) return;
    if ('requestIdleCallback' in window) requestIdleCallback(doPaint, { timeout: 300 }); else setTimeout(doPaint, 20);
    if (!fig.__loaded && item && !pending) load(fig, item);
  }, { margin: '700px 0px' });
  fig.__item = item;
}

function load(fig, item) {
  fig.__loaded = true;
  const s = sources(item);
  if (item.loop && fig.dataset.play !== undefined) {
    const v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'metadata';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
    if (s) v.poster = s.src;
    v.src = videoURL(item.loop);
    fig.appendChild(v);
    fig.setAttribute('role', 'img');
    fig.setAttribute('aria-label', item.alt || '');
    const ready = () => fig.classList.add('is-loaded');
    v.addEventListener('loadeddata', ready, { once: true });
    if (BP.calm) { v.preload = 'metadata'; v.addEventListener('loadedmetadata', () => { v.currentTime = 1.5; }, { once: true }); }
    else onVisible(fig, (vis) => { if (vis) v.play().catch(() => {}); else v.pause(); }, { margin: '0px' });
    fig.__video = v;
    return;
  }
  if (!s) return;
  const img = new Image();
  img.decoding = 'async';
  img.alt = fig.dataset.alt || item.alt || '';
  if (s.srcset) { img.srcset = s.srcset; img.sizes = fig.dataset.sizes || '(max-width: 900px) 100vw, 60vw'; }
  img.src = s.src;
  if (s.w && s.h) { img.width = s.w; img.height = s.h; }
  const done = () => { fig.classList.add('is-loaded'); fig.dispatchEvent(new CustomEvent('media:loaded', { detail: img })); };
  if (img.complete && img.naturalWidth) done(); else img.addEventListener('load', done, { once: true });
  img.addEventListener('error', () => fig.classList.add('is-failed'), { once: true });
  fig.appendChild(img);
  fig.__img = img;
}

export function hydrateAll(scope = document) {
  scope.querySelectorAll('figure.m').forEach(hydrate);
}

export function dateFigure(ev, extraClass = '') {
  const fig = document.createElement('figure');
  fig.className = 'm ' + extraClass;
  if (ev.img) {
    fig.dataset.file = ev.img;
    fig.dataset.alt = 'Visuel de la soirée du ' + ev.date.split('-').reverse().join('/');
  } else {
    fig.__dateSpec = dateSpec(ev);
    fig.dataset.grok = 'bp-date-' + ev.id;
    fig.dataset.alt = 'Visuel de la date du ' + ev.date.split('-').reverse().join('/');
  }
  return fig;
}

/* Liquéfaction des images au survol (filtre SVG partagé). */
export function initLiquidHover() {
  if (BP.calm || !BP.fine) return;
  const turb = document.querySelector('#bp-liquid feTurbulence');
  const disp = document.querySelector('#bp-liquid feDisplacementMap');
  if (!turb || !disp) return;
  const gsap = window.gsap;
  const st = { s: 0, f: 0.008 };
  let active = null;
  const apply = () => { disp.setAttribute('scale', st.s.toFixed(2)); turb.setAttribute('baseFrequency', `${st.f.toFixed(4)} ${(st.f * 1.6).toFixed(4)}`); };
  document.addEventListener('pointerover', (e) => {
    const fig = e.target.closest('figure.m[data-liquid]');
    if (fig === active) return;
    if (active) active.classList.remove('is-fx');
    active = fig;
    if (!fig || !fig.classList.contains('is-loaded') || fig.__video) { active = null; return; }
    fig.classList.add('is-fx');
    gsap.killTweensOf(st);
    gsap.fromTo(st, { s: 0, f: 0.006 }, { s: 34, f: 0.014, duration: 0.5, ease: 'power2.out', onUpdate: apply });
    gsap.to(st, { s: 0, f: 0.006, duration: 1.4, delay: 0.5, ease: 'power3.out', onUpdate: apply, onComplete: () => { if (active === fig) { fig.classList.remove('is-fx'); active = null; } } });
  });
}
