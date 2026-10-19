/* Son : rien ne joue sans action du visiteur.
   EXTRAIT : chemin de l'extrait fourni par Bend&Peel (par exemple assets/audio/extrait.mp3).
   Tant qu'il est vide, le bouton lance une nappe provisoire générée par le navigateur,
   signalée comme telle, pour montrer comment les visuels réagissent à la musique.
   Les visuels lisent des niveaux lissés : aucune variation de lumière brusque. */
import { BP } from './env.js';

export const EXTRAIT = '';

let ctx = null, master = null, analyser = null, data = null, el = null, synth = null, running = false;
const listeners = new Set();
export const onAudio = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach((fn) => fn(BP.audio.on));

function band(lo, hi) {
  const ny = ctx.sampleRate / 2;
  const a = Math.floor((lo / ny) * data.length), b = Math.max(a + 1, Math.floor((hi / ny) * data.length));
  let s = 0;
  for (let i = a; i < b; i++) s += data[i];
  return s / ((b - a) * 255);
}

function loop() {
  if (!running) return;
  analyser.getByteFrequencyData(data);
  const A = BP.audio;
  const sm = (prev, v, up = 0.35, down = 0.08) => prev + (v - prev) * (v > prev ? up : down);
  A.bass = sm(A.bass, Math.min(1, band(30, 160) * 1.5));
  A.mid = sm(A.mid, Math.min(1, band(300, 2000) * 1.8));
  A.high = sm(A.high, Math.min(1, band(4000, 10000) * 2.4));
  BP.beat = A.bass;
  document.documentElement.style.setProperty('--beat', A.bass.toFixed(3));
  requestAnimationFrame(loop);
}

function makeSynth() {
  /* Nappe provisoire : accord tenu, filtre qui respire, pulsation douce à 96 battements par minute. */
  const out = ctx.createGain(); out.gain.value = 0.9; out.connect(master);
  const pad = ctx.createGain(); pad.gain.value = 0.08; pad.connect(out);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 6; lp.connect(pad);
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.06;
  const lfoG = ctx.createGain(); lfoG.gain.value = 520; lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();
  const notes = [110, 130.81, 164.81, 196, 246.94, 329.63];
  const oscs = notes.map((f, i) => {
    const o = ctx.createOscillator(); o.type = i % 2 ? 'sawtooth' : 'triangle'; o.frequency.value = f; o.detune.value = (i - 2.5) * 6;
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (p) { p.pan.value = (i / (notes.length - 1)) * 1.4 - 0.7; o.connect(p); p.connect(lp); } else o.connect(lp);
    o.start(); return o;
  });
  const sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = 55;
  const subG = ctx.createGain(); subG.gain.value = 0.0; sub.connect(subG); subG.connect(out); sub.start();
  const bpm = 96, beat = 60 / bpm;
  let next = ctx.currentTime + 0.1, n = 0, timer = null;
  function kick(t) {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.55, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.45);
    subG.gain.setTargetAtTime(0.12, t, 0.02); subG.gain.setTargetAtTime(0.02, t + 0.2, 0.15);
  }
  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  function hat(t, v) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
    const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + 0.08);
  }
  function schedule() {
    while (next < ctx.currentTime + 0.25) {
      if (n % 4 === 0 || n % 4 === 2) kick(next);
      if (n % 2 === 1) hat(next, 0.035);
      next += beat / 2; n++;
    }
  }
  timer = setInterval(schedule, 60);
  return { stop() { clearInterval(timer); oscs.forEach((o) => o.stop()); sub.stop(); lfo.stop(); } };
}

export async function toggleSound() {
  if (BP.audio.on) return stop();
  try {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0;
      analyser = ctx.createAnalyser(); analyser.fftSize = 512; analyser.smoothingTimeConstant = 0.82;
      data = new Uint8Array(analyser.frequencyBinCount);
      master.connect(analyser); analyser.connect(ctx.destination);
    }
    await ctx.resume();
    if (EXTRAIT) {
      if (!el) {
        el = new Audio(EXTRAIT); el.loop = true; el.crossOrigin = 'anonymous';
        ctx.createMediaElementSource(el).connect(master);
      }
      await el.play();
    } else {
      synth = makeSynth();
    }
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0.5, ctx.currentTime, 0.6);
    BP.audio.on = true; running = true; loop(); emit();
  } catch (e) {
    BP.audio.on = false; emit();
  }
}

export function stop() {
  if (!ctx) return;
  master.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
  setTimeout(() => {
    if (synth) { synth.stop(); synth = null; }
    if (el) el.pause();
    running = false;
    BP.audio.bass = BP.audio.mid = BP.audio.high = 0; BP.beat = 0;
    document.documentElement.style.setProperty('--beat', '0');
  }, 900);
  BP.audio.on = false; emit();
}

export const isProvisional = () => !EXTRAIT;
