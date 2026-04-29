"use client";

import { useEffect, useState } from "react";

export default function Countdown({
  startsAt,
  onGo,
}: {
  startsAt: string;
  onGo: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    return Math.ceil((new Date(startsAt).getTime() - Date.now()) / 1000);
  });

  useEffect(() => {
    const tick = () => {
      const ms = new Date(startsAt).getTime() - Date.now();
      const s = Math.ceil(ms / 1000);
      setSecondsLeft(s);
      if (ms <= 0) onGo();
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [startsAt, onGo]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "sine";
    o.frequency.value = secondsLeft <= 0 ? 880 : 440;
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    o.start();
    o.stop(ctx.currentTime + 0.18);
    return () => {
      try { ctx.close(); } catch {}
    };
  }, [secondsLeft]);

  if (secondsLeft <= 0) {
    return (
      <div className="text-9xl sm:text-[12rem] font-extrabold neon-text animate-pulse">
        GO!
      </div>
    );
  }

  return (
    <div className="text-9xl sm:text-[12rem] font-extrabold neon-text">
      {secondsLeft}
    </div>
  );
}
