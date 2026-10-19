/* Photo/Vidéo : mosaïque, visionneuse avec transition liquide, bande des visuels de dates. */
import { BP } from '../core/env.js';
import { MEDIA, imageURL, videoURL, hydrate } from '../core/media.js';
import { past } from '../core/dates.js';
import { pastCard } from '../components/cards.js';

const gsap = window.gsap;

export default function () {
  const strip = document.querySelector('[data-visuals]');
  if (strip) past().forEach((e) => strip.appendChild(pastCard(e)));

  const box = document.querySelector('.lightbox');
  const stage = box.querySelector('.lightbox__stage');
  const closeBtn = box.querySelector('.lightbox__close');
  let opener = null;
  function open(key, isVideo, from) {
    const item = MEDIA[key];
    if (!item) return;
    opener = from;
    stage.innerHTML = '';
    if (isVideo) {
      const v = document.createElement('video');
      v.controls = true; v.playsInline = true; v.preload = 'metadata';
      v.src = videoURL(item.full);
      v.poster = imageURL(item.img, 1280) || '';
      v.style.cssText = 'width:100%;max-height:78svh;border-radius:18px;background:#000';
      v.setAttribute('aria-label', item.alt);
      stage.appendChild(v);
      if (item.label) { const p = document.createElement('p'); p.className = 'small'; p.textContent = item.label; stage.appendChild(p); }
      setTimeout(() => v.play().catch(() => {}), 350);
    } else {
      const img = new Image();
      img.src = imageURL(item.img, 1600);
      img.alt = item.alt;
      img.style.cssText = 'width:100%;max-height:80svh;object-fit:contain;border-radius:18px';
      stage.appendChild(img);
      const p = document.createElement('p'); p.className = 'small'; p.textContent = item.alt; stage.appendChild(p);
    }
    box.hidden = false;
    BP.lenis && BP.lenis.stop();
    if (!BP.calm) {
      const r = from.getBoundingClientRect();
      gsap.fromTo(box, { clipPath: `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round 22px)` }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: 0.8, ease: 'power3.inOut' });
      gsap.from(stage, { scale: 0.92, opacity: 0, duration: 0.7, delay: 0.25, ease: 'power3.out' });
    }
    closeBtn.focus();
  }
  function close() {
    const v = stage.querySelector('video'); if (v) v.pause();
    const done = () => { box.hidden = true; stage.innerHTML = ''; BP.lenis && BP.lenis.start(); if (opener) opener.focus(); };
    if (BP.calm || !opener) return done();
    const r = opener.getBoundingClientRect();
    gsap.to(box, { clipPath: `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round 22px)`, duration: 0.6, ease: 'power3.inOut', onComplete: done });
  }
  document.querySelectorAll('[data-lightbox]').forEach((b) => b.addEventListener('click', () => open(b.dataset.lightbox, b.hasAttribute('data-video'), b)));
  closeBtn.addEventListener('click', close);
  box.addEventListener('click', (e) => { if (e.target === box) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !box.hidden) close(); });
}
