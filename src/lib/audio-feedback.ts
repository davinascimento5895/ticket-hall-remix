/**
 * Web Audio API feedback for check-in results.
 * No external audio files — tones are generated programmatically.
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = "sine") {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.value = 0.3;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

/** Bip agudo curto — check-in válido */
export function playSuccess() {
  playTone(1200, 0.15, "sine");
}

/** Dois bips médios — já utilizado */
export function playWarning() {
  playTone(600, 0.12, "triangle");
  setTimeout(() => playTone(600, 0.12, "triangle"), 180);
}

/** Bip grave — erro */
export function playError() {
  playTone(300, 0.3, "square");
}

/** Vibração curta — sucesso */
export function vibrateSuccess() {
  navigator.vibrate?.(200);
}

/** Vibração longa — erro */
export function vibrateError() {
  navigator.vibrate?.([200, 100, 200]);
}

/** Chave para persistir preferência de som */
const SOUND_KEY = "staff-checkin-sound";

export function isSoundEnabled(): boolean {
  return localStorage.getItem(SOUND_KEY) !== "off";
}

export function toggleSound(): boolean {
  const next = !isSoundEnabled();
  localStorage.setItem(SOUND_KEY, next ? "on" : "off");
  return next;
}
