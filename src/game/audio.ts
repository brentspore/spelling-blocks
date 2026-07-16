let ctx: AudioContext | null = null;
let muted = true;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const W = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const AC = W.AudioContext || W.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export function setMuted(m: boolean) {
  muted = m;
}
export function isMuted() {
  return muted;
}

export function clack(pitch = 1) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(220 * pitch, t);
  osc.frequency.exponentialRampToValueAtTime(90 * pitch, t + 0.08);
  gain.gain.setValueAtTime(0.18, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.1);
}

export function winChord() {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const notes = [261.63, 329.63, 392.0, 523.25];
  notes.forEach((f, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = f;
    g.gain.setValueAtTime(0, t + i * 0.05);
    g.gain.linearRampToValueAtTime(0.12, t + i * 0.05 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 1.2);
    o.connect(g).connect(c.destination);
    o.start(t + i * 0.05);
    o.stop(t + i * 0.05 + 1.3);
  });
}
