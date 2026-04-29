"use client";

/**
 * Tiny audio helper. SFX go through Web Audio (overlapping playback,
 * tight latency); music uses a single HTMLAudioElement with .loop.
 *
 * Browsers block audio until the first user gesture; we silently
 * swallow those rejections — playMusic will retry on the next call
 * after the user interacts.
 */

const SFX: Record<string, string> = {
  throw: "/audio/throw.wav",
  harpoon: "/audio/harpoon.wav",
  click: "/audio/click.m4a",
};

const MUSIC: Record<string, string> = {
  menu: "/audio/menu.m4a",
  racing: "/audio/racing.m4a",
};

let audioCtx: AudioContext | null = null;
const sfxBuffers: Record<string, AudioBuffer> = {};

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    type WindowWithWebkit = Window & { webkitAudioContext?: typeof AudioContext };
    const Ctx = window.AudioContext || (window as WindowWithWebkit).webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

async function loadBuffer(url: string): Promise<AudioBuffer | null> {
  if (sfxBuffers[url]) return sfxBuffers[url];
  const ctx = getCtx();
  if (!ctx) return null;
  try {
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    const buf = await ctx.decodeAudioData(arr);
    sfxBuffers[url] = buf;
    return buf;
  } catch {
    return null;
  }
}

const MASTER_VOLUME = 0.5;

export async function playSfx(name: keyof typeof SFX, volume = 0.6) {
  const ctx = getCtx();
  if (!ctx) return;
  const buf = await loadBuffer(SFX[name]);
  if (!buf) return;
  try {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.value = volume * MASTER_VOLUME;
    src.connect(gain).connect(ctx.destination);
    src.start();
  } catch {
    /* ignore */
  }
}

let bgmAudio: HTMLAudioElement | null = null;
let currentMusic: string | null = null;

export function playMusic(name: keyof typeof MUSIC, volume = 0.35) {
  if (typeof window === "undefined") return;
  if (currentMusic === name && bgmAudio && !bgmAudio.paused) return;
  stopMusic();
  bgmAudio = new Audio(MUSIC[name]);
  bgmAudio.loop = true;
  bgmAudio.volume = volume * MASTER_VOLUME;
  currentMusic = name;
  bgmAudio.play().catch(() => {
    // Autoplay blocked. Hook a one-time gesture listener to retry.
    const retry = () => {
      bgmAudio?.play().catch(() => {});
      window.removeEventListener("pointerdown", retry);
      window.removeEventListener("keydown", retry);
    };
    window.addEventListener("pointerdown", retry, { once: true });
    window.addEventListener("keydown", retry, { once: true });
  });
}

export function stopMusic() {
  if (bgmAudio) {
    try {
      bgmAudio.pause();
    } catch {
      /* ignore */
    }
    bgmAudio = null;
  }
  currentMusic = null;
}
