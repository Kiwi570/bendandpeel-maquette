/* Visuels provisoires générés en code : chaque emplacement reçoit une image peinte,
   jamais un cadre vide. Ils seront remplacés par les vraies photos et les images Grok. */
import { rng } from './env.js';

export const PALETTES = {
  ember:   ['#160809', '#4a120c', '#b8360b', '#ff5a1f', '#ffb547', '#f7e0cc'],
  magenta: ['#12061a', '#3d0c3a', '#9b1d6e', '#e8399b', '#ff9ccf', '#f7e9df'],
  uv:      ['#06051a', '#16124f', '#3b2bb8', '#6a4dff', '#7ce7f2', '#e6f6ff'],
  skin:    ['#2a1216', '#7a2e2a', '#c9705a', '#e9a98a', '#f2c7ae', '#fff1e6'],
  dusk:    ['#120a14', '#3b1f3f', '#7d335f', '#d5576b', '#ff9a5a', '#ffd9b0'],
  winter:  ['#070a18', '#141c3d', '#2f3f7a', '#7b8fd6', '#c8d3ff', '#f2f4ff'],
  spring:  ['#0d0c16', '#2c2140', '#6b3d6e', '#e07b74', '#ffc38a', '#fff0d6'],
  summer:  ['#140a10', '#45162a', '#a33a3a', '#ff7a3d', '#ffc56b', '#fff2d2'],
  ritual:  ['#07040a', '#170c1f', '#33193f', '#6b3a6e', '#c58aa8', '#f2d9e4'],
  ink:     ['#120a14', '#1d1121', '#2a1730', '#5a3a5c', '#a07a96', '#f7e9df']
};

function makeNoise(r) {
  const P = new Uint8Array(512);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) P[i] = p[i & 255];
  const fade = (t) => t * t * (3 - 2 * t);
  const val = (x, y) => P[(P[x & 255] + y) & 511] / 255;
  function n2(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = fade(xf), v = fade(yf);
    const a = val(xi, yi), b = val(xi + 1, yi), c = val(xi, yi + 1), d = val(xi + 1, yi + 1);
    return (a + (b - a) * u) + ((c + (d - c) * u) - (a + (b - a) * u)) * v;
  }
  return function fbm(x, y, o = 4) {
    let s = 0, a = 0.5, f = 1;
    for (let i = 0; i < o; i++) { s += a * n2(x * f, y * f); f *= 2.03; a *= 0.5; }
    return s;
  };
}

let grainPat = null;
function grain(ctx, w, h, alpha = 0.08) {
  if (!grainPat) {
    const g = document.createElement('canvas');
    g.width = g.height = 128;
    const gx = g.getContext('2d');
    const id = gx.createImageData(128, 128);
    for (let i = 0; i < id.data.length; i += 4) {
      const v = Math.random() * 255;
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255;
    }
    gx.putImageData(id, 0, 0);
    grainPat = g;
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(grainPat, 'repeat');
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function blob(ctx, x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, hexA(color, alpha));
  g.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/* La peau de lumière : nappes irisées et lignes fines comme un grain de peau. */
function membrane(ctx, w, h, r, pal) {
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, pal[0]); bg.addColorStop(1, pal[1]);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 7; i++) {
    blob(ctx, r() * w, r() * h, (0.25 + r() * 0.55) * Math.max(w, h), pal[2 + Math.floor(r() * 4)], 0.35 + r() * 0.35);
  }
  ctx.globalCompositeOperation = 'source-over';
  const fbm = makeNoise(r);
  const lines = Math.round(34 + r() * 30);
  const sc = 1.6 + r() * 1.8;
  for (let i = 0; i < lines; i++) {
    const y0 = (i / lines) * h * 1.3 - h * 0.15;
    ctx.beginPath();
    for (let x = -10; x <= w + 10; x += 8) {
      const n = fbm((x / w) * sc, (y0 / h) * sc * 0.7 + i * 0.013, 4);
      const y = y0 + (n - 0.5) * h * 0.55 + Math.sin(x / w * 6 + i * 0.3) * h * 0.02;
      if (x === -10) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    const c = pal[3 + (i % 3)];
    ctx.strokeStyle = hexA(c, 0.08 + 0.18 * Math.sin((i / lines) * Math.PI));
    ctx.lineWidth = 0.8 + r() * 1.4;
    ctx.stroke();
  }
  const sheen = ctx.createLinearGradient(0, h, w, 0);
  sheen.addColorStop(0, 'rgba(124,231,242,0)');
  sheen.addColorStop(0.45, 'rgba(124,231,242,0.16)');
  sheen.addColorStop(0.55, 'rgba(232,57,155,0.16)');
  sheen.addColorStop(1, 'rgba(232,57,155,0)');
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = sheen; ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
}

/* Brume colorée traversée de faisceaux, foule en contre-jour. */
function beams(ctx, w, h, r, pal, opts = {}) {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, pal[0]); bg.addColorStop(1, pal[1]);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 5; i++) blob(ctx, r() * w, h * (0.2 + r() * 0.6), (0.3 + r() * 0.4) * w, pal[2 + Math.floor(r() * 3)], 0.35);
  const n = 4 + Math.floor(r() * 4);
  for (let i = 0; i < n; i++) {
    const sx = w * (0.1 + r() * 0.8), sy = -h * 0.05;
    const ang = (r() - 0.5) * 1.1;
    const len = h * (1.1 + r() * 0.4);
    const spread = 0.06 + r() * 0.1;
    const ex1 = sx + Math.sin(ang - spread) * len, ey1 = sy + Math.cos(ang - spread) * len;
    const ex2 = sx + Math.sin(ang + spread) * len, ey2 = sy + Math.cos(ang + spread) * len;
    const g = ctx.createLinearGradient(sx, sy, (ex1 + ex2) / 2, (ey1 + ey2) / 2);
    const col = pal[3 + Math.floor(r() * 3)];
    g.addColorStop(0, hexA(col, 0.75)); g.addColorStop(0.5, hexA(col, 0.22)); g.addColorStop(1, hexA(col, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex1, ey1); ctx.lineTo(ex2, ey2); ctx.closePath(); ctx.fill();
    blob(ctx, sx, sy + h * 0.02, w * 0.06, '#ffffff', 0.5);
  }
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = `rgba(255,240,230,${r() * 0.35})`;
    const s = r() * 1.8;
    ctx.fillRect(r() * w, r() * h * 0.8, s, s);
  }
  ctx.globalCompositeOperation = 'source-over';
  if (opts.crowd !== false) crowd(ctx, w, h, r, pal);
}

/* Silhouettes en contre-jour, floues : jamais de visage.
   Dessinées en petit puis agrandies : le flou vient du lissage, sans filtre coûteux. */
function crowd(ctx, w, h, r, pal) {
  const k = 0.18;
  const sw = Math.max(40, Math.round(w * k)), sh = Math.max(30, Math.round(h * k));
  const off = document.createElement('canvas'); off.width = sw; off.height = sh;
  const o = off.getContext('2d');
  const base = sh * (0.78 + r() * 0.08);
  const count = Math.round(w / 34);
  for (let row = 0; row < 2; row++) {
    o.fillStyle = row ? hexA(pal[0], 0.98) : hexA(pal[1], 0.9);
    o.strokeStyle = o.fillStyle;
    for (let i = 0; i < count; i++) {
      const x = (i / count) * sw + (r() - 0.5) * 30 * k;
      const s = (0.7 + r() * 0.6) * (sh / 9) * (row ? 1.15 : 0.85);
      const y = base + row * sh * 0.08 + (r() - 0.5) * 10 * k;
      o.beginPath(); o.ellipse(x, y - s * 1.05, s * 0.32, s * 0.4, 0, 0, Math.PI * 2); o.fill();
      o.beginPath(); o.ellipse(x, y + s * 0.6, s * 0.7, s * 1.05, 0, 0, Math.PI * 2); o.fill();
      if (r() > 0.72) {
        o.lineWidth = s * 0.22; o.lineCap = 'round';
        const side = r() > 0.5 ? 1 : -1;
        o.beginPath(); o.moveTo(x + side * s * 0.4, y - s * 0.1);
        o.quadraticCurveTo(x + side * s * 0.9, y - s * 1.2, x + side * s * (0.5 + r() * 0.5), y - s * (1.9 + r() * 0.6));
        o.stroke();
      }
    }
  }
  ctx.save();
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(off, 0, 0, w, h);
  ctx.restore();
  ctx.fillStyle = hexA(pal[0], 1);
  ctx.fillRect(0, h * 0.97, w, h * 0.03);
}

/* Paysage au crépuscule : crêtes successives, une lumière chaude au loin. */
function landscape(ctx, w, h, r, pal, opts = {}) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, pal[0]); sky.addColorStop(0.45, pal[2]); sky.addColorStop(0.7, pal[4]); sky.addColorStop(1, pal[3]);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  const sunX = w * (0.25 + r() * 0.5), sunY = h * (0.48 + r() * 0.1);
  ctx.globalCompositeOperation = 'screen';
  blob(ctx, sunX, sunY, w * 0.5, pal[5], 0.45);
  blob(ctx, sunX, sunY, w * 0.12, '#ffffff', 0.5);
  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(255,255,255,${r() * 0.6})`;
    const s = r() * 1.6; ctx.fillRect(r() * w, r() * h * 0.38, s, s);
  }
  const fbm = makeNoise(r);
  const layers = 5;
  const lightLayer = 2 + Math.floor(r() * 2);
  for (let L = 0; L < layers; L++) {
    const t = L / (layers - 1);
    const baseY = h * (0.52 + t * 0.36);
    const amp = h * (0.22 - t * 0.12) * (opts.cliff && L === 1 ? 1.5 : 1);
    const freq = 1.4 + L * 0.9;
    ctx.beginPath(); ctx.moveTo(0, h);
    let litX = 0, litY = 0;
    for (let x = 0; x <= w; x += 4) {
      let n = fbm((x / w) * freq + L * 7.3, L * 3.1, 5);
      if (opts.cliff && L === 1) n = Math.min(0.72, n * 1.25);
      if (opts.mesa && L === 1) { const d = Math.abs(x / w - 0.62); n = d < 0.06 ? 0.86 : n * (d < 0.12 ? 1.25 : 1); }
      const y = baseY - n * amp * 1.8;
      ctx.lineTo(x, y);
      if (L === lightLayer && Math.abs(x - w * 0.58) < 3) { litX = x; litY = y; }
    }
    ctx.lineTo(w, h); ctx.closePath();
    const c1 = pal[Math.max(0, 1 - Math.floor(t))];
    const g = ctx.createLinearGradient(0, baseY - amp, 0, h);
    g.addColorStop(0, hexA(L < 2 ? pal[2] : pal[1], 0.92 - t * 0.1));
    g.addColorStop(1, hexA(c1 === pal[1] ? pal[0] : pal[0], 1));
    ctx.fillStyle = g; ctx.fill();
    ctx.fillStyle = hexA(pal[0], 0.25 + t * 0.5); ctx.fill();
    if (L === lightLayer && litX) {
      ctx.globalCompositeOperation = 'screen';
      blob(ctx, litX, litY + h * 0.02, w * 0.07, '#ffb547', 0.85);
      blob(ctx, litX, litY + h * 0.02, w * 0.012, '#fff3d6', 1);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (L === 2) {
      const mist = ctx.createLinearGradient(0, baseY - amp * 0.4, 0, baseY + h * 0.05);
      mist.addColorStop(0, hexA(pal[4], 0)); mist.addColorStop(0.6, hexA(pal[4], 0.18)); mist.addColorStop(1, hexA(pal[4], 0));
      ctx.fillStyle = mist; ctx.fillRect(0, baseY - amp, w, amp + h * 0.1);
    }
  }
  if (opts.city) {
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 260; i++) {
      const x = r() * w, y = h * (0.86 + r() * 0.12);
      ctx.fillStyle = hexA(r() > 0.5 ? '#ffb547' : '#ffd9b0', 0.3 + r() * 0.6);
      const s = 1 + r() * 2; ctx.fillRect(x, y, s, s);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}

/* Coupole géodésique éclairée de l'intérieur, la nuit. */
function dome(ctx, w, h, r, pal) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, pal[0]); sky.addColorStop(0.8, pal[1]); sky.addColorStop(1, pal[2]);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 220; i++) {
    ctx.fillStyle = `rgba(255,255,255,${r() * 0.7})`;
    const s = r() * 1.7; ctx.fillRect(r() * w, r() * h * 0.6, s, s);
  }
  const fbm = makeNoise(r);
  ctx.beginPath(); ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 4) ctx.lineTo(x, h * 0.62 - fbm(x / w * 2, 1.3) * h * 0.22);
  ctx.lineTo(w, h); ctx.fillStyle = hexA(pal[1], 1); ctx.fill();
  const cx = w * (0.4 + r() * 0.2), cy = h * 0.8, R = Math.min(w * 0.28, h * 0.42);
  ctx.globalCompositeOperation = 'screen';
  blob(ctx, cx, cy - R * 0.4, R * 2.2, pal[4], 0.35);
  ctx.globalCompositeOperation = 'source-over';
  ctx.save();
  ctx.beginPath(); ctx.ellipse(cx, cy, R, R, 0, Math.PI, 0); ctx.closePath(); ctx.clip();
  const inner = ctx.createRadialGradient(cx, cy - R * 0.2, R * 0.05, cx, cy, R * 1.1);
  inner.addColorStop(0, '#fff2d6'); inner.addColorStop(0.35, pal[4]); inner.addColorStop(0.8, pal[3]); inner.addColorStop(1, pal[2]);
  ctx.fillStyle = inner; ctx.fillRect(cx - R, cy - R, R * 2, R);
  ctx.restore();
  ctx.strokeStyle = hexA(pal[0], 0.75); ctx.lineWidth = Math.max(1.2, R / 70);
  const rows = 5;
  for (let i = 1; i <= rows; i++) {
    const phi = (i / rows) * (Math.PI / 2);
    const yy = cy - Math.sin(phi) * R, rr = Math.cos(phi) * R;
    ctx.beginPath(); ctx.ellipse(cx, yy, rr, rr * 0.18, 0, 0, Math.PI); ctx.stroke();
  }
  const seg = 10;
  for (let j = 0; j <= seg; j++) {
    const th = (j / seg) * Math.PI;
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) {
      const phi = (i / 20) * (Math.PI / 2);
      const x = cx - Math.cos(th) * Math.cos(phi) * R;
      const y = cy - Math.sin(phi) * R + Math.sin(th) * Math.cos(phi) * R * 0.18;
      if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.fillStyle = hexA(pal[0], 1); ctx.fillRect(0, cy, w, h - cy);
  ctx.globalCompositeOperation = 'screen';
  const refl = ctx.createLinearGradient(0, cy, 0, h);
  refl.addColorStop(0, hexA(pal[4], 0.35)); refl.addColorStop(1, hexA(pal[4], 0));
  ctx.fillStyle = refl; ctx.fillRect(cx - R * 1.4, cy, R * 2.8, h - cy);
  ctx.globalCompositeOperation = 'source-over';
}

/* Tissus qui ondulent. */
function fabric(ctx, w, h, r, pal) {
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, pal[1]); bg.addColorStop(1, pal[0]);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  const folds = 70;
  for (let i = 0; i < folds; i++) {
    const t = i / folds;
    ctx.beginPath();
    for (let x = -20; x <= w + 20; x += 6) {
      const y = h * (t * 1.2 - 0.1) + Math.sin(x / w * (3 + t * 2) + t * 9) * h * 0.08 + Math.sin(x / w * 11 + t * 4) * h * 0.015;
      if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.lineTo(w + 20, h + 20); ctx.lineTo(-20, h + 20); ctx.closePath();
    const g = ctx.createLinearGradient(0, h * t * 1.2 - h * 0.2, 0, h * t * 1.2 + h * 0.1);
    g.addColorStop(0, hexA(pal[3 + (i % 3)], 0.07));
    g.addColorStop(0.5, hexA(pal[5], 0.05));
    g.addColorStop(1, hexA(pal[0], 0.06));
    ctx.fillStyle = g; ctx.fill();
  }
  ctx.globalCompositeOperation = 'screen';
  blob(ctx, w * (0.2 + r() * 0.6), h * 0.4, w * 0.6, pal[3], 0.3);
  ctx.globalCompositeOperation = 'source-over';
}

/* Matière liquide : marbrure par déformation du domaine. */
function liquid(ctx, w, h, r, pal) {
  const sw = 220, sh = Math.max(40, Math.round(220 * h / w));
  const off = document.createElement('canvas'); off.width = sw; off.height = sh;
  const ox = off.getContext('2d');
  const id = ox.createImageData(sw, sh);
  const fbm = makeNoise(r);
  const cols = pal.map((c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; });
  const k = 1.8 + r() * 1.5;
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const u = x / sw * k, v = y / sh * k * (sh / sw);
      const qx = fbm(u, v, 4), qy = fbm(u + 5.2, v + 1.3, 4);
      const f = fbm(u + 4 * qx, v + 4 * qy, 4);
      const s = Math.min(0.999, Math.max(0, f * 1.35 - 0.1)) * (cols.length - 1);
      const i0 = Math.floor(s), tt = s - i0;
      const a = cols[i0], b = cols[Math.min(cols.length - 1, i0 + 1)];
      const p = (y * sw + x) * 4;
      id.data[p] = a[0] + (b[0] - a[0]) * tt;
      id.data[p + 1] = a[1] + (b[1] - a[1]) * tt;
      id.data[p + 2] = a[2] + (b[2] - a[2]) * tt;
      id.data[p + 3] = 255;
    }
  }
  ox.putImageData(id, 0, 0);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(off, 0, 0, w, h);
}

/* Partition graphique sur fond de nuit. */
function scorePaint(ctx, w, h, r, pal) {
  ctx.fillStyle = pal[0]; ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'screen';
  blob(ctx, w * 0.7, h * 0.3, w * 0.6, pal[3], 0.3);
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = hexA(pal[5], 0.5); ctx.lineWidth = 1.2;
  for (let s = 0; s < 3; s++) {
    const y0 = h * (0.2 + s * 0.28);
    for (let l = 0; l < 5; l++) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) {
        const y = y0 + l * 9 + Math.sin(x / w * 5 + s) * h * 0.04;
        if (!x) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 9; i++) {
      const x = r() * w, y = y0 + r() * 36;
      ctx.fillStyle = hexA(pal[4], 0.9); ctx.beginPath(); ctx.arc(x, y, 4 + r() * 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 30, y - 10, 30 + r() * 30, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    }
  }
}

const MOTIFS = { membrane, beams, landscape, dome, fabric, liquid, score: scorePaint, crowd: (ctx, w, h, r, pal) => beams(ctx, w, h, r, pal) };

/* Peint un visuel provisoire dans un canvas, à la taille affichée. */
export function paint(canvas, spec = {}) {
  const motif = spec.motif || 'membrane';
  const pal = PALETTES[spec.palette] || PALETTES.ember;
  const r = rng(spec.seed || motif + (spec.palette || ''));
  const rect = canvas.getBoundingClientRect();
  const cssW = Math.max(40, rect.width || canvas.parentElement?.clientWidth || 600);
  const cssH = Math.max(40, rect.height || canvas.parentElement?.clientHeight || 400);
  const scale = Math.min(1.25, window.devicePixelRatio || 1);
  const maxW = spec.maxW || 1400;
  const k = Math.min(scale, maxW / cssW);
  const w = Math.round(cssW * k), h = Math.round(cssH * k);
  if (canvas.width === w && canvas.height === h && canvas.__painted === JSON.stringify(spec)) return canvas;
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.save();
  (MOTIFS[motif] || membrane)(ctx, w, h, r, pal, spec);
  ctx.restore();
  grain(ctx, w, h, 0.07);
  canvas.__painted = JSON.stringify(spec);
  return canvas;
}

/* Visuel propre à chaque date : paysage, coupole ou ville selon le lieu, palette selon la saison. */
export function dateSpec(ev) {
  const m = parseInt(ev.date.slice(5, 7), 10);
  const season = m >= 11 || m <= 1 ? (m === 11 ? 'dusk' : 'winter') : m <= 3 ? 'spring' : m <= 5 ? 'spring' : 'summer';
  const byVenue = {
    dodecadome: { motif: 'dome', palette: m <= 2 || m >= 11 ? 'winter' : 'dusk' },
    bajart: { motif: 'landscape', city: true, palette: season === 'winter' ? 'uv' : 'magenta' },
    exosquelette: { motif: 'landscape', cliff: true, palette: season },
    lampisterie: { motif: 'landscape', mesa: true, palette: season },
    nidrouge: { motif: 'landscape', palette: 'ember' },
    bled: { motif: 'landscape', palette: 'dusk' },
    colombia: { motif: 'landscape', palette: 'summer' }
  };
  const base = byVenue[ev.venue] || { motif: 'membrane', palette: season };
  return Object.assign({ seed: ev.id }, base);
}
