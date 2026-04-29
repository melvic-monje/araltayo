"use client";

import { useEffect, useState } from "react";
import { SKILL_COOLDOWN_MS, TRACK_LENGTH } from "@/lib/game";

export default function HUD({
  cooldowns,
  distance,
  place,
  totalPlayers,
  endsAt,
  onTouchForward,
  onTouchTurn,
  onTouchThrow,
  onTouchHarpoon,
}: {
  cooldowns: { throw: number; harpoon: number };
  distance: number;
  place: number;
  totalPlayers: number;
  endsAt: number;
  onTouchForward: (v: number) => void;
  onTouchTurn: (v: number) => void;
  onTouchThrow: () => void;
  onTouchHarpoon: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
  );
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    }, 250);
    return () => clearInterval(id);
  }, [endsAt]);

  const progress = Math.min(100, (distance / TRACK_LENGTH) * 100);

  return (
    <>
      {/* Top status bar */}
      <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-black/40 backdrop-blur rounded-xl px-3 py-2 text-white">
          <div className="text-xs text-slate-300 uppercase tracking-widest">Place</div>
          <div className="text-2xl font-extrabold font-mono">
            {place}<span className="text-slate-400 text-base">/{totalPlayers}</span>
          </div>
        </div>
        <div className="bg-black/40 backdrop-blur rounded-xl px-3 py-2 text-white text-center">
          <div className="text-xs text-slate-300 uppercase tracking-widest">Time</div>
          <div className="text-2xl font-extrabold font-mono" style={{ color: secondsLeft <= 5 ? "#F472B6" : "#22D3EE" }}>
            {secondsLeft}s
          </div>
        </div>
        <div className="bg-black/40 backdrop-blur rounded-xl px-3 py-2 text-white text-right">
          <div className="text-xs text-slate-300 uppercase tracking-widest">Progress</div>
          <div className="w-32 h-2 rounded-full bg-white/10 mt-1 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-150"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg, #22D3EE, #F472B6)" }} />
          </div>
        </div>
      </div>

      {/* Skills bar — bottom center on desktop, mid-right on touch */}
      <div className={`absolute z-10 pointer-events-none ${isTouch ? "bottom-32 right-4" : "bottom-6 left-1/2 -translate-x-1/2"}`}>
        <div className={`flex gap-3 ${isTouch ? "flex-col" : "flex-row"}`}>
          <SkillButton
            label="Throw"
            keyHint="U"
            cooldown={cooldowns.throw}
            color="#F472B6"
            onPress={onTouchThrow}
            touch={isTouch}
          />
          <SkillButton
            label="Harpoon"
            keyHint="I"
            cooldown={cooldowns.harpoon}
            color="#22D3EE"
            onPress={onTouchHarpoon}
            touch={isTouch}
          />
        </div>
      </div>

      {/* Mobile movement controls */}
      {isTouch && (
        <>
          <Joystick onChange={(fwd, turn) => { onTouchForward(fwd); onTouchTurn(turn); }} />
        </>
      )}

      {/* Keyboard hint */}
      {!isTouch && (
        <div className="absolute bottom-2 left-2 text-[11px] text-slate-400 pointer-events-none z-10 leading-tight">
          ↑↓ move · ←→ turn · U throw · I harpoon
        </div>
      )}
    </>
  );
}

function SkillButton({
  label,
  keyHint,
  cooldown,
  color,
  onPress,
  touch,
}: {
  label: string;
  keyHint: string;
  cooldown: number;
  color: string;
  onPress: () => void;
  touch: boolean;
}) {
  const ready = cooldown <= 0;
  const fillPct = ready ? 100 : Math.max(0, 100 - (cooldown / SKILL_COOLDOWN_MS) * 100);
  const seconds = ready ? "" : (cooldown / 1000).toFixed(1);
  return (
    <button
      onClick={onPress}
      onTouchStart={(e) => { e.preventDefault(); onPress(); }}
      className="pointer-events-auto rounded-2xl flex flex-col items-center justify-center font-bold relative overflow-hidden"
      style={{
        width: touch ? 76 : 96,
        height: touch ? 76 : 70,
        background: ready ? `${color}33` : "rgba(255,255,255,0.06)",
        border: `2px solid ${ready ? color : "rgba(255,255,255,0.12)"}`,
        color: ready ? color : "#94A3B8",
      }}
    >
      <div
        className="absolute inset-x-0 bottom-0 transition-all duration-100"
        style={{ height: `${fillPct}%`, background: `${color}22` }}
      />
      <span className="relative text-xs tracking-widest uppercase">{label}</span>
      <span className="relative text-lg font-mono">{ready ? keyHint : seconds + "s"}</span>
    </button>
  );
}

function Joystick({ onChange }: { onChange: (fwd: number, turn: number) => void }) {
  const radius = 48;
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);

  const onStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    handle(t.clientX - cx, t.clientY - cy);
  };
  const onMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    handle(t.clientX - cx, t.clientY - cy);
  };
  const onEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setDrag(null);
    onChange(0, 0);
  };
  const handle = (dx: number, dy: number) => {
    const dist = Math.hypot(dx, dy);
    const clamp = Math.min(dist, radius);
    const nx = (dx / (dist || 1)) * clamp;
    const ny = (dy / (dist || 1)) * clamp;
    setDrag({ dx: nx, dy: ny });
    const fwd = Math.max(-1, Math.min(1, -ny / radius));
    const turn = Math.max(-1, Math.min(1, nx / radius));
    onChange(fwd, turn);
  };

  return (
    <div
      onTouchStart={onStart}
      onTouchMove={onMove}
      onTouchEnd={onEnd}
      className="absolute bottom-6 left-6 pointer-events-auto z-10 select-none"
      style={{
        width: radius * 2 + 16,
        height: radius * 2 + 16,
        borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.2)",
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(8px)",
        touchAction: "none",
      }}
    >
      <div
        className="rounded-full"
        style={{
          width: radius,
          height: radius,
          background: "rgba(255,255,255,0.25)",
          border: "2px solid #22D3EE",
          position: "absolute",
          left: `calc(50% - ${radius / 2}px + ${drag?.dx ?? 0}px)`,
          top: `calc(50% - ${radius / 2}px + ${drag?.dy ?? 0}px)`,
          transition: drag ? "none" : "all 0.15s ease",
        }}
      />
    </div>
  );
}
