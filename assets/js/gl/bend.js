/* Images qui se courbent : chaque image de la galerie devient une feuille en WebGL qui plie
   avec la vitesse du défilement, se creuse vers les bords comme sur un cylindre,
   ondule comme un liquide sous le pointeur et décolle légèrement son coin. */
import { Renderer, Program, Mesh, Plane, Texture } from '../../vendor/ogl.mjs';
import { BP, lerp, clamp } from '../core/env.js';

const vertex = /* glsl */ `
attribute vec3 position;
attribute vec2 uv;
uniform vec4 uRect;
uniform vec2 uView;
uniform float uVel;
uniform float uCyl;
uniform float uPeel;
varying vec2 vUv;
varying float vShade;
void main(){
  vUv = uv;
  vec2 px = vec2(uRect.x + uv.x * uRect.z, uRect.y + (1.0 - uv.y) * uRect.w);
  float cx = (px.x - uView.x * 0.5) / uView.x;
  float z = -cx * cx * uCyl;
  z += sin(uv.x * 3.14159) * uVel;
  float corner = max(0.0, (uv.x + (1.0 - uv.y)) - (2.0 - uPeel));
  z += corner * corner * 900.0;
  float persp = 1400.0;
  float f = persp / (persp - z);
  vec2 c = uView * 0.5;
  px = c + (px - c) * f;
  vShade = clamp(z / 500.0, -1.0, 1.0);
  gl_Position = vec4(px.x / uView.x * 2.0 - 1.0, 1.0 - px.y / uView.y * 2.0, 0.0, 1.0);
}
`;

const fragment = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uTexSize;
uniform vec2 uSize;
uniform vec3 uHover;
uniform float uTime;
uniform float uVel;
uniform float uRadius;
varying vec2 vUv;
varying float vShade;
vec2 cover(vec2 uv){
  float ra = uSize.x / uSize.y; float ta = uTexSize.x / uTexSize.y;
  vec2 s = ra > ta ? vec2(1.0, ta / ra) : vec2(ra / ta, 1.0);
  return (uv - 0.5) * s + 0.5;
}
void main(){
  vec2 uv = vUv;
  vec2 asp = vec2(uSize.x / uSize.y, 1.0);
  float d = distance(uv * asp, uHover.xy * asp);
  vec2 dir = normalize(uv - uHover.xy + 0.0001);
  uv += dir * sin(d * 38.0 - uTime * 5.0) * 0.014 * uHover.z * exp(-d * 3.5);
  float sh = clamp(uVel * 0.00012, -0.009, 0.009);
  vec2 cu = cover(uv);
  float r = texture2D(uTex, cover(uv + vec2(sh, 0.0))).r;
  float g = texture2D(uTex, cu).g;
  float b = texture2D(uTex, cover(uv - vec2(sh, 0.0))).b;
  vec3 col = vec3(r, g, b);
  col *= 1.0 + vShade * 0.35;
  vec2 q = abs(vUv - 0.5) * uSize;
  vec2 hs = uSize * 0.5 - uRadius;
  float dd = length(max(q - hs, 0.0)) - uRadius;
  float a = 1.0 - smoothstep(-1.0, 1.0, dd);
  gl_FragColor = vec4(col * a, a);
}
`;

export function createBend(host, figures, opts = {}) {
  const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio || 1, 1.75), alpha: true, premultipliedAlpha: true, antialias: true });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  gl.canvas.className = opts.className || 'acts__gl';
  gl.canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(gl.canvas);
  const geometry = new Plane(gl, { widthSegments: 32, heightSegments: 16 });
  const view = [1, 1];
  const items = figures.map((fig) => {
    const canvas = fig.querySelector('canvas.m__ph');
    const texture = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR });
    const uniforms = {
      uTex: { value: texture }, uTexSize: { value: [1, 1] }, uSize: { value: [1, 1] }, uRect: { value: [0, 0, 1, 1] },
      uView: { value: view }, uVel: { value: 0 }, uCyl: { value: opts.cyl ?? 260 }, uPeel: { value: 0 },
      uHover: { value: [0.5, 0.5, 0] }, uTime: { value: 0 }, uRadius: { value: 22 }
    };
    const program = new Program(gl, { vertex, fragment, uniforms, transparent: true, depthTest: false, cullFace: null });
    const mesh = new Mesh(gl, { geometry, program });
    const it = { fig, mesh, uniforms, texture, hover: { x: 0.5, y: 0.5, s: 0, ts: 0 }, peel: 0, src: null };
    function useSource(src, w, h) {
      if (!src || !w || !h) return;
      try {
        texture.image = src; texture.needsUpdate = true; uniforms.uTexSize.value = [w, h]; it.src = src;
      } catch (e) {}
    }
    const tryImg = () => { const img = fig.__img; if (img && img.complete && img.naturalWidth) useSource(img, img.naturalWidth, img.naturalHeight); };
    if (canvas && canvas.width > 2) useSource(canvas, canvas.width, canvas.height);
    tryImg();
    fig.addEventListener('media:loaded', tryImg);
    const repaint = setInterval(() => {
      if (it.src && it.src !== canvas) { clearInterval(repaint); return; }
      if (canvas && canvas.width > 2 && it.src !== canvas) useSource(canvas, canvas.width, canvas.height);
      else if (canvas && canvas.__painted && it.src === canvas) { texture.needsUpdate = true; clearInterval(repaint); }
    }, 300);
    fig.addEventListener('pointermove', (e) => {
      const r = fig.getBoundingClientRect();
      it.hover.x = (e.clientX - r.left) / r.width; it.hover.y = 1 - (e.clientY - r.top) / r.height; it.hover.ts = 1;
    });
    fig.addEventListener('pointerleave', () => { it.hover.ts = 0; });
    fig.addEventListener('pointerenter', () => { it.peel = 1; });
    fig.addEventListener('pointerleave', () => { it.peel = 0; });
    return it;
  });
  document.documentElement.classList.add('has-bend');

  function resize() {
    const r = host.getBoundingClientRect();
    renderer.setSize(r.width, r.height);
    view[0] = r.width; view[1] = r.height;
  }
  resize();
  window.addEventListener('resize', resize);
  let vel = 0, alive = true, visible = true;
  const t0 = performance.now();
  function frame(now) {
    if (!alive) return;
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const time = (now - t0) / 1000;
    const hr = host.getBoundingClientRect();
    const target = clamp((opts.velocity ? opts.velocity() : BP.scroll.v) * (opts.velScale ?? 9), -260, 260);
    vel = lerp(vel, target, 0.12);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    for (const it of items) {
      const r = it.fig.getBoundingClientRect();
      if (r.right < hr.left - 200 || r.left > hr.right + 200 || r.bottom < hr.top - 200 || r.top > hr.bottom + 200) continue;
      const u = it.uniforms;
      u.uRect.value = [r.left - hr.left, r.top - hr.top, r.width, r.height];
      u.uSize.value = [r.width, r.height];
      u.uVel.value = vel;
      u.uTime.value = time;
      it.hover.s = lerp(it.hover.s, it.hover.ts, 0.08);
      u.uHover.value = [it.hover.x, it.hover.y, it.hover.s];
      u.uPeel.value = lerp(u.uPeel.value, it.peel * 0.42, 0.08);
      it.mesh.draw({ camera: null });
    }
  }
  /* OGL demande une caméra pour draw() ; nos sommets sont déjà en coordonnées écran. */
  items.forEach((it) => { it.mesh.draw = function () { this.program.use(); this.geometry.draw({ mode: this.mode, program: this.program }); }; });
  requestAnimationFrame(frame);
  return {
    setVisible(v) { visible = v; },
    destroy() { alive = false; gl.canvas.remove(); document.documentElement.classList.remove('has-bend'); }
  };
}
