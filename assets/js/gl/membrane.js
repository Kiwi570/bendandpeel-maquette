/* Ouverture : un champ de lumière et de matière, une membrane irisée qui se tend sous le doigt.
   Rendu à résolution réduite (la matière est douce), qualité ajustée si l'image ralentit. */
import { Renderer, Program, Mesh, Triangle } from '../../vendor/ogl.mjs';
import { BP, lerp } from '../core/env.js';

const vertex = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragment = /* glsl */ `
precision highp float;
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uHeat;
uniform vec3 uAudio;
uniform float uReveal;
uniform float uCalm;
uniform vec4 uTrail[10];
uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; uniform vec3 uC4;
varying vec2 vUv;

vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
float fbm(vec3 p){
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){ s += a * snoise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; }
  return s;
}
float ripples(vec2 p){
  float r = 0.0;
  for (int i = 0; i < 10; i++){
    vec4 tr = uTrail[i];
    vec2 c = (tr.xy - 0.5 * uRes) / uRes.y;
    float d = length(p - c);
    r += tr.w * exp(-d * d * 22.0) * (0.55 + 0.45 * sin(d * 34.0 - tr.z * 6.0)) * exp(-tr.z * 1.2);
  }
  return r;
}
float field(vec2 p, float t, vec2 q){
  return fbm(vec3(p * 1.25 + 1.7 * q, t * 0.09 + uAudio.y * 0.15));
}
void main(){
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime * (0.55 + uHeat * 0.9);
  vec2 m = (uMouse - 0.5 * uRes) / uRes.y;
  vec2 toM = p - m;
  float dm = length(toM);
  vec2 pp = p - toM * 0.22 * exp(-dm * dm * 3.5);
  vec2 q = vec2(fbm(vec3(pp * 0.9, t * 0.05)), fbm(vec3(pp * 0.9 + vec2(5.2, 1.3), t * 0.05)));
  float e = 2.5 / uRes.y;
  float bulge = uAudio.x * 0.32 * exp(-dot(p, p) * 1.2) + 0.25 * exp(-dm * dm * 6.0);
  float rp = ripples(p);
  float h = field(pp, t, q) + rp * 0.55 + bulge;
  float hx = field(pp + vec2(e, 0.0), t, q) + rp * 0.55 + bulge;
  float hy = field(pp + vec2(0.0, e), t, q) + rp * 0.55 + bulge;
  vec3 n = normalize(vec3(-(hx - h) / e * 0.075, -(hy - h) / e * 0.075, 1.0));
  vec3 L = normalize(vec3(-0.45, 0.55, 0.75));
  float diff = clamp(dot(n, L), 0.0, 1.0);
  float fres = pow(1.0 - clamp(n.z, 0.0, 1.0), 1.6);
  float thick = h * 1.3 + fres * 1.4 + t * 0.025 + q.x * 0.6;
  vec3 irid = 0.5 + 0.5 * cos(6.28318 * (thick + vec3(0.0, 0.33, 0.67)));
  vec3 skin = mix(uC0, uC1, smoothstep(-0.1, 1.15, h) * 0.8);
  vec3 heatCol = mix(uC2, uC3, smoothstep(-0.4, 0.6, q.y + uHeat * 0.4));
  heatCol = mix(heatCol, uC4, smoothstep(0.55, 1.0, uHeat) * smoothstep(0.0, 0.7, q.x));
  vec3 col = skin * (0.28 + 0.72 * diff);
  col = mix(col, heatCol * (0.45 + 0.75 * diff), 0.38 + 0.32 * uHeat);
  col += irid * pow(fres, 1.1) * (0.85 + 0.5 * uHeat);
  col += uC2 * smoothstep(0.35, 0.95, h) * 0.35;
  vec3 R = reflect(-L, n);
  col += pow(clamp(R.z, 0.0, 1.0), 22.0) * 0.75 * vec3(1.0, 0.9, 0.82);
  col *= 0.32 + 0.68 * smoothstep(-0.8, 0.6, h);
  col *= 1.0 - 0.28 * exp(-pow(p.y * 2.6, 2.0));
  float vig = smoothstep(1.35, 0.15, length(p * vec2(0.78, 1.0)));
  col *= mix(0.32, 1.0, vig);
  float rv = smoothstep(uReveal * 1.9, uReveal * 1.9 - 0.45, length(p));
  col = mix(uC0 * 0.6, col, rv);
  float g = fract(sin(dot(gl_FragCoord.xy + uTime * 61.0, vec2(12.9898, 78.233))) * 43758.5453);
  col += (g - 0.5) * 0.04;
  gl_FragColor = vec4(col, 1.0);
}
`;

const hex = (h) => { const n = parseInt(h.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };

export function createMembrane(host, opts = {}) {
  let scale = opts.scale || (BP.fine ? 0.62 : 0.5);
  const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio || 1, 2) * scale, alpha: false, antialias: false, powerPreference: 'high-performance' });
  const gl = renderer.gl;
  gl.canvas.className = opts.className || 'hero__gl';
  gl.canvas.setAttribute('aria-hidden', 'true');
  host.prepend(gl.canvas);
  const pal = opts.palette || ['#120a14', '#f2c7ae', '#ff5a1f', '#e8399b', '#6a4dff'];
  const trail = new Array(40).fill(0);
  const uniforms = {
    uTime: { value: 0 }, uRes: { value: [1, 1] }, uMouse: { value: [0, 0] }, uHeat: { value: opts.heat || 0 },
    uAudio: { value: [0, 0, 0] }, uReveal: { value: opts.reveal ?? 1 }, uCalm: { value: BP.calm ? 1 : 0 },
    uTrail: { value: trail },
    uC0: { value: hex(pal[0]) }, uC1: { value: hex(pal[1]) }, uC2: { value: hex(pal[2]) }, uC3: { value: hex(pal[3]) }, uC4: { value: hex(pal[4]) }
  };
  const program = new Program(gl, { vertex, fragment, uniforms });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
  let w = 1, h = 1;
  function resize() {
    const r = host.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    renderer.dpr = Math.min(window.devicePixelRatio || 1, 2) * scale;
    renderer.setSize(w, h);
    uniforms.uRes.value = [gl.canvas.width, gl.canvas.height];
  }
  resize();
  window.addEventListener('resize', resize);

  const mouse = { x: w * 0.5, y: h * 0.55 };
  const pts = [];
  let lastPush = 0;
  let visible = true, alive = true, frames = 0, acc = 0, lastT = performance.now(), t0 = performance.now();
  const state = { heat: opts.heat || 0 };

  function toLocal(px, py) {
    const r = host.getBoundingClientRect();
    return [(px - r.left) * (gl.canvas.width / w), (r.height - (py - r.top)) * (gl.canvas.height / h)];
  }
  function frame(now) {
    if (!alive) return;
    requestAnimationFrame(frame);
    if (!visible || document.hidden) { lastT = now; return; }
    const dt = Math.min(64, now - lastT); lastT = now;
    const time = (now - t0) / 1000;
    const p = BP.pointer;
    const [lx, ly] = toLocal(p.x, p.y);
    mouse.x = lerp(mouse.x, lx, 0.07); mouse.y = lerp(mouse.y, ly, 0.07);
    if (p.moved && now - lastPush > 70 && p.speed > 0.05) {
      pts.unshift({ x: lx, y: ly, born: time, s: Math.min(1, 0.25 + p.speed * 0.5) });
      if (pts.length > 10) pts.pop();
      lastPush = now;
    }
    for (let i = 0; i < 10; i++) {
      const q = pts[i];
      if (q) { trail[i * 4] = q.x; trail[i * 4 + 1] = q.y; trail[i * 4 + 2] = time - q.born; trail[i * 4 + 3] = q.s; }
      else { trail[i * 4 + 3] = 0; }
    }
    state.heat = lerp(state.heat, BP.heat, 0.05);
    uniforms.uTime.value = time;
    uniforms.uMouse.value = [mouse.x, mouse.y];
    uniforms.uHeat.value = state.heat;
    uniforms.uAudio.value = [BP.audio.bass, BP.audio.mid, BP.audio.high];
    renderer.render({ scene: mesh });

    /* Qualité adaptative : si l'image ralentit, on baisse la résolution, puis on passe à la version sans WebGL. */
    frames++; acc += dt;
    if (frames === 45) {
      const avg = acc / frames;
      if (avg > 21 && scale > 0.3) { scale = Math.max(0.3, scale * 0.78); resize(); }
      else if (avg > 30 && scale <= 0.3) { BP.lowPower = true; destroy(); host.dispatchEvent(new CustomEvent('gl:fallback', { bubbles: true })); }
      frames = 0; acc = 0;
    }
  }
  function renderStill() {
    uniforms.uTime.value = 12.0;
    uniforms.uMouse.value = [gl.canvas.width * 0.5, gl.canvas.height * 0.5];
    renderer.render({ scene: mesh });
  }
  function destroy() {
    alive = false;
    window.removeEventListener('resize', resize);
    const ext = gl.getExtension('WEBGL_lose_context');
    gl.canvas.remove();
    if (ext) ext.loseContext();
  }
  if (BP.calm) { renderStill(); window.addEventListener('resize', () => renderStill()); }
  else requestAnimationFrame(frame);

  return {
    canvas: gl.canvas,
    uniforms,
    setVisible(v) { visible = v; },
    destroy
  };
}
