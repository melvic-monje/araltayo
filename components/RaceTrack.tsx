"use client";

import { avatarFor } from "@/lib/avatars";
import type { Player } from "@/lib/supabase";

export default function RaceTrack({
  players,
  selfId,
  topPresses,
}: {
  players: Player[];
  selfId: string | null;
  topPresses: number;
}) {
  const max = Math.max(topPresses, 50);
  return (
    <div className="space-y-3">
      {players.map((p) => {
        const avatar = avatarFor(p.id);
        const pct = Math.min(100, (p.press_count / max) * 100);
        const isSelf = p.id === selfId;
        return (
          <div
            key={p.id}
            className="relative h-14 rounded-2xl border overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.04)",
              borderColor: isSelf ? avatar.color : "rgba(255,255,255,0.1)",
              boxShadow: isSelf ? `0 0 24px ${avatar.color}55` : "none",
            }}
          >
            <div className="absolute inset-y-0 left-0 right-0 flex items-center px-4 pointer-events-none z-10">
              <span className="text-sm font-bold truncate" style={{ color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
                {p.name}{isSelf ? " (you)" : ""}
              </span>
              <span className="ml-auto font-mono font-bold" style={{ color: avatar.color, textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
                {p.press_count}
              </span>
            </div>
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${avatar.color}55, ${avatar.color}cc)`,
                transition: "width 200ms ease-out",
              }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 text-2xl"
              style={{
                left: `calc(${pct}% - 18px)`,
                transition: "left 200ms ease-out",
                filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))",
              }}
            >
              {avatar.emoji}
            </div>
          </div>
        );
      })}
    </div>
  );
}
