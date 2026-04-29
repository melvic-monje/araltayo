"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function Confetti({ trigger }: { trigger: number }) {
  useEffect(() => {
    if (trigger <= 0) return;
    const duration = 2500;
    const end = Date.now() + duration;
    const colors = ["#22D3EE", "#F472B6", "#FBBF24", "#A78BFA", "#34D399"];
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();

    if (typeof window !== "undefined") {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = "triangle";
          o.frequency.value = freq;
          const start = ctx.currentTime + i * 0.12;
          g.gain.setValueAtTime(0.0001, start);
          g.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
          o.start(start);
          o.stop(start + 0.35);
        });
      }
    }
  }, [trigger]);

  return null;
}
